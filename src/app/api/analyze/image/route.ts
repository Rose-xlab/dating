import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationWithContext } from '@/lib/analyze-enhanced';
import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/supabase';
import { ChatMessage } from '@/types';
import { analysisRatelimit } from '@/lib/rate-limit'; // IMPORT SPECIFIC LIMITER

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- RATE LIMIT CHECK ---
    const { success } = await analysisRatelimit.limit(user.id);
    if (!success) {
       return NextResponse.json({ error: 'Analysis limit reached. Please wait a minute.' }, { status: 429 });
    }
    // ------------------------

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const formattedMessages: ChatMessage[] = messages.map((msg: any, index: number) => ({
      id: msg.id || `msg-${Date.now()}-${index}`,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    const analysisResult = await analyzeConversationWithContext(formattedMessages);
    
    const { error: saveError } = await supabase
      .from('analysis_results')
      .insert({
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
        metadata: { message_count: formattedMessages.length, analysis_type: 'image_ocr' } as Json,
      });

    if (saveError) {
      console.error('Error saving analysis:', saveError);
    }

    return NextResponse.json({ result: analysisResult });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze conversation' }, { status: 500 });
  }
}