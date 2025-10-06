import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationWithContext } from '@/lib/analyze-enhanced'; 
import { redactPersonalInfo } from '@/lib/ocr';
import { createClient } from '@/lib/supabase/server';
import { ChatMessage } from '@/types';
import { Json } from '@/types/supabase';

function parseTextToMessages(text: string): ChatMessage[] {
  const lines = text.split('\n').filter(line => line.trim());
  const messages: ChatMessage[] = [];
  let currentSender: 'user' | 'match' = 'match';
  
  lines.forEach((line, index) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < 20) {
      const sender = line.substring(0, colonIndex).trim().toLowerCase();
      const content = line.substring(colonIndex + 1).trim();
      currentSender = (sender.includes('me') || sender.includes('i') || sender === 'you') ? 'user' : 'match';
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

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get text from the request body
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text input' }, { status: 400 });
    }

    const redactedText = redactPersonalInfo(text);
    const messages = parseTextToMessages(redactedText);

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid messages found in the text' }, { status: 400 });
    }

    // 3. Call the analysis function with the correct arguments
    const analysisResult = await analyzeConversationWithContext(messages); // <-- This is the corrected line

    // 4. Save to the database using the secure user.id
    await supabase
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
      });

    return NextResponse.json({ result: analysisResult });
  } catch (error) {
    console.error('Text analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze conversation' }, { status: 500 });
  }
}