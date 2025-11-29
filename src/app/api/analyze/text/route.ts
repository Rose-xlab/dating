// src/app/api/analyze/text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationWithContext } from '@/lib/analyze-enhanced'; 
import { redactPersonalInfo } from '@/lib/ocr';
import { createClient } from '@/lib/supabase/server';
import { ChatMessage } from '@/types';
import { Json } from '@/types/supabase';
import { 
  parseWhatsAppExport, 
  detectWhatsAppFormat, 
  extractSenderNames 
} from '@/lib/parsers/whatsapp-parser';
import { ratelimit } from '@/lib/rate-limit';

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

    // 2. Rate limit per user
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 3. Get text and platform info from request
    const { text, platform, userIdentifier } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text input' }, { status: 400 });
    }

    let messages: ChatMessage[];
    let analysisMetadata: any = {};

    // 4. Detect if this is WhatsApp format
    const isWhatsApp = platform === 'whatsapp' || detectWhatsAppFormat(text);

    if (isWhatsApp) {
      // Check if we need user identification
      if (!userIdentifier) {
        const senders = extractSenderNames(text);
        
        // If we can't auto-detect who the user is, ask them
        if (senders.length >= 2) {
          return NextResponse.json({ 
            error: 'User identification required',
            requiresUserIdentifier: true,
            detectedSenders: senders,
            message: 'Please identify who you are in this conversation'
          }, { status: 400 });
        } else if (senders.length === 0) {
          return NextResponse.json({ 
            error: 'No valid WhatsApp messages found in the text' 
          }, { status: 400 });
        }
      }
      
      // Parse WhatsApp format
      const parseResult = parseWhatsAppExport(text, userIdentifier);
      messages = parseResult.messages;
      analysisMetadata = {
        ...parseResult.metadata,
        platform: 'whatsapp'
      };

      // Log harassment indicators for debugging
      console.log('WhatsApp harassment indicators:', parseResult.metadata.harassmentIndicators);
      
    } else {
      // Use standard parser for generic text
      const redactedText = redactPersonalInfo(text);
      messages = parseTextToMessages(redactedText);
      analysisMetadata = { platform: 'generic' };
    }

    if (messages.length === 0) {
      return NextResponse.json({ 
        error: 'No valid messages found in the text' 
      }, { status: 400 });
    }

    // 5. Run the analysis with metadata
    const analysisResult = await analyzeConversationWithContext(messages, analysisMetadata);

    // 6. Enhance analysis with WhatsApp-specific concerns
    if (isWhatsApp && analysisMetadata.harassmentIndicators) {
      const { excessiveCalls, callCount, thirdPartyContact } = analysisMetadata.harassmentIndicators;
      
      // Add critical flags for severe harassment
      if (callCount >= 50) {
        analysisResult.flags.unshift({
          id: 'whatsapp-stalking',
          type: 'red',
          category: 'suspicious_behavior',
          severity: 'critical',
          message: `Extreme stalking behavior: ${callCount} unanswered call attempts`,
          evidence: `${callCount} call attempts detected in conversation`,
          messageId: '',
          confidence: 1.0,
          safetyLevel: 'immediate_danger',
          whatToDo: 'This is dangerous stalking behavior. Block immediately and consider legal action.',
          exitStrategy: 'Block on all platforms. Save evidence. Contact authorities if you feel unsafe.'
        });
        
        // Force high risk score for extreme cases
        analysisResult.riskScore = Math.max(analysisResult.riskScore, 95);
      }
      
      if (thirdPartyContact) {
        analysisResult.flags.unshift({
          id: 'whatsapp-boundary-violation',
          type: 'red',
          category: 'boundary_violation',
          severity: 'critical',
          message: 'Contacted your family/friends without permission',
          evidence: 'Messages indicate contact with your personal contacts',
          messageId: '',
          confidence: 1.0,
          safetyLevel: 'immediate_danger',
          whatToDo: 'Serious boundary violation. Warn your contacts and consider legal protection.',
          exitStrategy: 'Document everything. Consider restraining order.'
        });
      }
    }

    // 7. Save to database with enhanced metadata
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
        metadata: {
          ...analysisMetadata,
          message_count: messages.length,
          analysis_type: 'text',
          platform: isWhatsApp ? 'whatsapp' : 'generic'
        } as Json,
      });

    // 8. Return enhanced result
    return NextResponse.json({ 
      result: analysisResult,
      metadata: analysisMetadata 
    });
    
  } catch (error) {
    console.error('Text analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze conversation' 
    }, { status: 500 });
  }
}