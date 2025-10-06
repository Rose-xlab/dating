// src/app/api/ocr/openai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeConversationWithContext } from '@/lib/analyze-enhanced';
import OpenAI from 'openai';
import { ChatMessage } from '@/types';
import { Json } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';
export const maxDuration = 60; // Increased duration for AI calls

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const ocrPrompt = `Extract the conversation from this screenshot into a JSON object with a "messages" array. Each object must have "sender" ('user' or 'match') and "content". The user's messages are typically on the right. Ignore UI elements.`;

    const ocrResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: [{ type: 'text', text: ocrPrompt }, { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64Image}` } }] }],
      response_format: { type: 'json_object' },
    });
    
    // --- THIS IS THE DEBUGGING LINE ---
    // It will log the raw text response from OpenAI to your terminal
    console.log("Raw OpenAI Response:", ocrResponse.choices[0].message.content);
    // ------------------------------------
    
    const ocrContent = JSON.parse(ocrResponse.choices[0].message.content || '{}');
    const extractedMessages: ChatMessage[] = ocrContent.messages || [];

    if (extractedMessages.length < 2) {
      return NextResponse.json({ error: "Couldn't find enough messages for analysis." }, { status: 400 });
    }
    
    const formattedMessages: ChatMessage[] = extractedMessages.map((msg, index) => ({
      ...msg,
      id: `msg-${Date.now()}-${index}`,
      timestamp: new Date(Date.now() - (extractedMessages.length - index) * 60000),
    }));

    const analysisResult = await analyzeConversationWithContext(formattedMessages);

    await supabase.from('analysis_results').insert({
      user_id: user.id,
      risk_score: analysisResult.riskScore,
      trust_score: analysisResult.trustScore,
      escalation_index: analysisResult.escalationIndex,
      chat_content: JSON.parse(JSON.stringify(analysisResult.chatContent)),
      flags: JSON.parse(JSON.stringify(analysisResult.flags)),
      timeline: JSON.parse(JSON.stringify(analysisResult.timeline)),
      reciprocity_score: JSON.parse(JSON.stringify(analysisResult.reciprocityScore)),
      consistency_analysis: JSON.parse(JSON.stringify(analysisResult.consistencyAnalysis)),
      suggested_replies: JSON.parse(JSON.stringify(analysisResult.suggestedReplies)),
      evidence: JSON.parse(JSON.stringify(analysisResult.evidence)),
      metadata: { analysis_type: 'image' } as Json,
    });
    
    await supabase.rpc('increment_analysis_count', { user_uuid: user.id });

    return NextResponse.json({ result: analysisResult });

  } catch (error) {
    console.error('Full image analysis pipeline error:', error);
    return NextResponse.json({ error: 'Failed to complete the analysis pipeline.' }, { status: 500 });
  }
}