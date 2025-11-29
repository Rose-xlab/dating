import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; // Adjust path if needed
import DashboardClientPage from "./client-page";
import { AnalysisResult } from "@/types"; // Adjust path if needed

// Define the Message type to match the client-side type
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
  analysisResult?: AnalysisResult;
  analysisResultId?: string;
  flagReferences?: any[];
}

export default async function ChatSessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const { sessionId } = params;

  // 1. AUTH CHECK (The Lucia Way)
  const sessionCookie = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionCookie) redirect("/login");
  const { user } = await lucia.validateSession(sessionCookie);
  if (!user) redirect("/login");

  // 2. FETCH SESSION
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, analysis_ids')
    .eq('id', sessionId)
    .eq('user_id', user.id) // Validates user ownership
    .single();

  if (sessionError || !session) {
    console.error("Session not found or error:", sessionError);
    notFound();
  }

  // 3. FETCH MESSAGES
  const { data: history } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('session_id', sessionId)
    .single();
    
  let analysisResultsMap = new Map<string, AnalysisResult>();

  // 4. FETCH ANALYSIS RESULTS (If any)
  if (session.analysis_ids && session.analysis_ids.length > 0) {
    const { data: analyses } = await supabase
      .from('analysis_results')
      .select('*')
      .in('id', session.analysis_ids);
    
    if (analyses) {
      for (const analysis of analyses) {
        // Map snake_case DB fields to camelCase TS interface
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

  // 5. FORMAT MESSAGES
  const initialMessages: Message[] = history?.messages 
    ? (history.messages as any[]).map((msg): Message => {
        const message: Message = {
          ...msg,
          // Handle timestamp conversion safely
          timestamp: new Date(msg.timestamp),
        };

        // Re-attach full analysis object if it exists
        if (message.type === 'analysis' && message.analysisResultId) {
          const fullAnalysis = analysisResultsMap.get(message.analysisResultId);
          if (fullAnalysis) {
            message.analysisResult = fullAnalysis;
          }
        }
        return message;
      }) 
    : [{ // Default welcome message
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your Dating Safety AI. Type a question or upload a screenshot to get started.",
        timestamp: new Date(),
        type: 'text'
      }];

  // 6. RENDER CLIENT PAGE
  return (
    <DashboardClientPage 
        sessionId={sessionId} 
        initialMessages={initialMessages}
    />
  );
}