//src\app\dashboard\chat\[sessionId]\page.tsx

import { createClient } from '../../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import DashboardClientPage from './client-page';
import { AnalysisResult } from '../../../../types';

// Define the Message type to match the client-side type
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
  analysisResult?: AnalysisResult;
  analysisResultId?: string; // This property is in the saved data
  flagReferences?: any[];
}

// This Server Component is responsible for fetching all necessary data for a chat session.
export default async function ChatSessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const { sessionId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Fetch the session to get its list of analysis IDs
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, analysis_ids')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  // Fetch the raw chat messages for this session
  const { data: history } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('session_id', sessionId)
    .single();
    
  let analysisResultsMap = new Map<string, AnalysisResult>();

  // If there are analysis IDs, fetch ALL associated analysis results
  if (session.analysis_ids && session.analysis_ids.length > 0) {
    const { data: analyses } = await supabase
      .from('analysis_results')
      .select('*')
      .in('id', session.analysis_ids);
    
    // Store the results in a Map for quick lookups
    if (analyses) {
      for (const analysis of analyses) {
        // Manually map snake_case from DB to camelCase for the component
        const formattedAnalysis: AnalysisResult = {
          id: analysis.id,
          createdAt: analysis.created_at,
          riskScore: analysis.risk_score,
          trustScore: analysis.trust_score,
          escalationIndex: analysis.escalation_index,
          chatContent: analysis.chat_content,
          flags: analysis.flags,
          timeline: analysis.timeline,
          reciprocityScore: analysis.reciprocity_score,
          consistencyAnalysis: analysis.consistency_analysis,
          suggestedReplies: analysis.suggested_replies,
          evidence: analysis.evidence,
          ocrMetadata: analysis.metadata
        };
        analysisResultsMap.set(analysis.id, formattedAnalysis);
      }
    }
  }

  // Now, build the complete initialMessages array
  const initialMessages: Message[] = history?.messages 
    ? (history.messages as any[]).map((msg): Message => {
        const message: Message = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };

        // If the message is an analysis card, find and attach the full analysis object
        if (message.type === 'analysis' && message.analysisResultId) {
          const fullAnalysis = analysisResultsMap.get(message.analysisResultId);
          if (fullAnalysis) {
            message.analysisResult = fullAnalysis;
          }
        }
        
        return message;
      }) 
    : [{ // Default message for a new chat
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your Dating Safety AI. Type a question or upload a screenshot to get started.",
        timestamp: new Date(),
        type: 'text'
      }];

  // Pass the fully constructed data to the client component.
  // Note: We no longer need to pass initialAnalysisResult separately.
  return (
    <DashboardClientPage 
        sessionId={sessionId} 
        initialMessages={initialMessages}
        initialAnalysisResult={null} // This is now handled by initialMessages
    />
  );
}