import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversation } from '@/lib/ai-analysis';
import { redactPersonalInfo } from '@/lib/ocr';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ChatMessage } from '@/types';
import { Json } from '@/types/supabase';

// Helper function to convert any value to Json type
function toJson<T>(value: T): Json {
  return JSON.parse(JSON.stringify(value)) as unknown as Json;
}

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text input' },
        { status: 400 }
      );
    }

    // Redact personal information
    const redactedText = redactPersonalInfo(text);

    // Parse text into messages
    const messages = parseTextToMessages(redactedText);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages found in the text' },
        { status: 400 }
      );
    }

    // Analyze the conversation
    const analysisResult = await analyzeConversation(messages);

    // Save to database if user is logged in
    if (userId) {
      const supabase = createServerSupabaseClient();
      
      // Save analysis result - Using helper function for cleaner code
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('analysis_results')
        .insert({
          user_id: userId,
          risk_score: analysisResult.riskScore,
          trust_score: analysisResult.trustScore,
          escalation_index: analysisResult.escalationIndex,
          chat_content: toJson(analysisResult.chatContent),
          flags: toJson(analysisResult.flags),
          timeline: toJson(analysisResult.timeline),
          reciprocity_score: toJson(analysisResult.reciprocityScore),
          consistency_analysis: toJson(analysisResult.consistencyAnalysis),
          suggested_replies: toJson(analysisResult.suggestedReplies),
          evidence: toJson(analysisResult.evidence),
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
        action_type: 'text_analysis' as const,
        metadata: toJson({ message_count: messages.length }),
      });
    }

    return NextResponse.json({ result: analysisResult });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
}

function parseTextToMessages(text: string): ChatMessage[] {
  const lines = text.split('\n').filter(line => line.trim());
  const messages: ChatMessage[] = [];
  let currentSender: 'user' | 'match' = 'match';
  
  lines.forEach((line, index) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < 20) {
      const sender = line.substring(0, colonIndex).trim().toLowerCase();
      const content = line.substring(colonIndex + 1).trim();
      
      if (sender.includes('me') || sender.includes('i') || sender === 'you') {
        currentSender = 'user';
      } else {
        currentSender = 'match';
      }
      
      if (content) {
        messages.push({
          id: `msg-${index}`,
          sender: currentSender,
          content,
          timestamp: new Date(Date.now() - (lines.length - index) * 60000),
        });
      }
    } else if (line.trim()) {
      messages.push({
        id: `msg-${index}`,
        sender: currentSender,
        content: line.trim(),
        timestamp: new Date(Date.now() - (lines.length - index) * 60000),
      });
    }
  });
  
  return messages;
}