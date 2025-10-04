import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversation } from '@/lib/ai-analysis';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Json } from '@/types/supabase';
import { ChatMessage } from '@/types';
import { toSupabaseJson } from '@/lib/supabase-json-utils';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Validate message structure
    const validMessages = messages.every(msg => 
      msg.content && 
      msg.sender && 
      ['user', 'match'].includes(msg.sender)
    );

    if (!validMessages) {
      return NextResponse.json(
        { error: 'Invalid message structure' },
        { status: 400 }
      );
    }

    // Add required fields to messages
    const formattedMessages: ChatMessage[] = messages.map((msg, index) => ({
      id: msg.id || `msg-${Date.now()}-${index}`,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    // Analyze the conversation
    const analysisResult = await analyzeConversation(formattedMessages);

    // Save to database if user is logged in
    if (userId) {
      const supabase = createServerSupabaseClient();
      
      // Convert complex objects to plain JSON objects to satisfy Supabase's Json type
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('analysis_results')
        .insert({
          user_id: userId,
          risk_score: analysisResult.riskScore,
          trust_score: analysisResult.trustScore,
          escalation_index: analysisResult.escalationIndex,
          // Use the utility function for cleaner conversions
          chat_content: toSupabaseJson(analysisResult.chatContent),
          flags: toSupabaseJson(analysisResult.flags),
          timeline: toSupabaseJson(analysisResult.timeline),
          reciprocity_score: toSupabaseJson(analysisResult.reciprocityScore),
          consistency_analysis: toSupabaseJson(analysisResult.consistencyAnalysis),
          suggested_replies: toSupabaseJson(analysisResult.suggestedReplies),
          evidence: toSupabaseJson(analysisResult.evidence),
          metadata: toSupabaseJson({
            message_count: formattedMessages.length,
            analysis_type: 'text',
          }),
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving analysis:', saveError);
      } else if (savedAnalysis) {
        analysisResult.id = savedAnalysis.id;
      }

      // Update user's analysis count
      await supabase.rpc('increment_analysis_count', { user_uuid: userId });

      // Track usage
      await supabase.from('usage_tracking').insert({
        user_id: userId,
        action_type: 'text_analysis',
        metadata: {
          message_count: formattedMessages.length,
        } as Json,
      });
    }

    return NextResponse.json({ result: analysisResult });
  } catch (error) {
    console.error('Text analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;