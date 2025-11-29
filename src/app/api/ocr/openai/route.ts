// src/app/api/ocr/openai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeConversationWithContext } from '@/lib/analyze-enhanced';
import OpenAI from 'openai';
import { ChatMessage } from '@/types';
import { Json } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';
import { ratelimit } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    
    // Enhanced OCR prompt for better conversation extraction
    const ocrPrompt = `You are an expert at extracting dating app conversations from screenshots with perfect accuracy.

CRITICAL INSTRUCTIONS:
1. Extract EVERY message visible in the screenshot, maintaining exact order
2. Identify the sender of each message based on visual position and chat bubble style:
   - Messages on the RIGHT side are typically from the USER (the person taking the screenshot)
   - Messages on the LEFT side are typically from the MATCH (the other person)
   - Look for visual cues like different colored chat bubbles, profile pictures, or names
3. Pay attention to timestamps if visible
4. Include ALL text, even partial messages at screen edges
5. Look for any system messages or notifications in the conversation

VISUAL ANALYSIS TIPS:
- Blue/colored bubbles on right = usually USER messages
- Gray/white bubbles on left = usually MATCH messages
- Check for "Read" or "Delivered" indicators to confirm message direction
- Profile pictures or initials can help identify senders
- Some apps show the match's name at the top

Return a JSON object with a "messages" array where each message has:
{
  "sender": "user" or "match",
  "content": "exact message text",
  "visual_position": "left" or "right" (where it appears on screen),
  "bubble_color": "color of the message bubble if identifiable",
  "timestamp": "if visible in the screenshot"
}

Also include:
- "platform_detected": "Tinder/Bumble/Hinge/etc if identifiable"
- "visual_cues": "description of how you identified senders"
- "confidence": "high/medium/low"
- "extraction_notes": "any ambiguities or issues"

Extract EVERYTHING - even profile names, ages, or bio snippets if visible. We need the complete context.`;

    console.log("Starting OCR extraction...");
    
    const ocrResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ 
        role: 'user', 
        content: [
          { type: 'text', text: ocrPrompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: `data:${file.type};base64,${base64Image}` 
            } 
          }
        ] 
      }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for accurate extraction
    });
    
    console.log("Raw OCR Response:", ocrResponse.choices[0].message.content);
    
    const ocrContent = JSON.parse(ocrResponse.choices[0].message.content || '{}');
    
    // Validate and enhance extracted messages
    let extractedMessages: any[] = ocrContent.messages || [];
    
    // If visual position conflicts with sender identification, use a second pass
    if (ocrContent.confidence !== 'high' || extractedMessages.some((msg: any) => 
      (msg.sender === 'user' && msg.visual_position === 'left') ||
      (msg.sender === 'match' && msg.visual_position === 'right')
    )) {
      console.log("Confidence not high or position mismatch detected. Running verification...");
      
      const verificationPrompt = `The following messages were extracted from a dating app screenshot, but there may be sender confusion.
      
Extracted data:
${JSON.stringify(ocrContent, null, 2)}

Based on the visual positions and platform ${ocrContent.platform_detected || 'unknown'}, please verify and correct the senders.
Remember:
- On most dating apps, the current user's messages appear on the RIGHT
- The match's messages appear on the LEFT
- The person who took the screenshot is the "user"

Return a corrected JSON with just the "messages" array with accurate sender assignments.`;

      const verificationResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: verificationPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      });
      
      const verified = JSON.parse(verificationResponse.choices[0].message.content || '{}');
      extractedMessages = verified.messages || extractedMessages;
    }
    
    // Filter out empty messages and format properly
    extractedMessages = extractedMessages.filter((msg: any) => 
      msg.content && msg.content.trim().length > 0
    );

    if (extractedMessages.length < 2) {
      return NextResponse.json({ 
        error: "Couldn't extract enough messages for meaningful analysis. Please ensure the screenshot shows a conversation with multiple messages." 
      }, { status: 400 });
    }
    
    // Convert to proper ChatMessage format with generated IDs and timestamps
    const formattedMessages: ChatMessage[] = extractedMessages.map((msg: any, index: number) => ({
      id: `msg-${Date.now()}-${index}`,
      sender: msg.sender === 'user' ? 'user' : 'match',
      content: msg.content.trim(),
      timestamp: msg.timestamp || new Date(Date.now() - (extractedMessages.length - index) * 60000),
    }));

    console.log(`Extracted ${formattedMessages.length} messages. Starting analysis...`);

    // Perform the contextual analysis
    const analysisResult = await analyzeConversationWithContext(formattedMessages, {
      platform: ocrContent.platform_detected,
    });

    // Add OCR metadata to the analysis
    const enrichedResult = {
      ...analysisResult,
      ocrMetadata: {
        platform: ocrContent.platform_detected,
        confidence: ocrContent.confidence,
        extractionNotes: ocrContent.extraction_notes,
        visualCues: ocrContent.visual_cues,
        messageCount: formattedMessages.length,
      }
    };

    // Save to database
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
      metadata: { 
        analysis_type: 'image',
        ocr_metadata: enrichedResult.ocrMetadata 
      } as Json,
    });
    
    // Increment user's analysis count
    await supabase.rpc('increment_analysis_count', { user_uuid: user.id });

    console.log(`Analysis complete. Risk: ${analysisResult.riskScore}%, Trust: ${analysisResult.trustScore}%`);
    console.log(`Found ${analysisResult.flags.filter(f => f.type === 'red').length} red flags and ${analysisResult.flags.filter(f => f.type === 'green').length} green flags`);

    return NextResponse.json({ result: enrichedResult });

  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Service is currently busy. Please try again in a moment.' 
        }, { status: 429 });
      }
      if (error.message.includes('invalid image')) {
        return NextResponse.json({ 
          error: 'The image could not be processed. Please ensure it\'s a clear screenshot of a conversation.' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to analyze the conversation. Please try again.' 
    }, { status: 500 });
  }
}