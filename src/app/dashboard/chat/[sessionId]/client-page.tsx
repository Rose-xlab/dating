// src/app/dashboard/chat/[sessionId]/client-page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from '@/components/ChatInterface';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import SenderConfigModal from '@/components/SenderConfigModal';
import { AnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ChatSession {
    id: string;
    title: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
  analysisResult?: AnalysisResult;
  flagReferences?: {
    flagId: string;
    text: string;
    type: 'red' | 'green';
  }[];
}

export default function DashboardClientPage({ 
    sessionId, 
    initialMessages
}: { 
    sessionId: string; 
    initialMessages: Message[];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages); // State is now managed here
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionData, setSessionData] = useState<ChatSession | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [focusedFlagId, setFocusedFlagId] = useState<string | null>(null);
  const [showSenderConfig, setShowSenderConfig] = useState(false);
  const [userPosition, setUserPosition] = useState<'left' | 'right'>('right');
  const supabase = createClient();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchUserAndSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: session, error } = await supabase
          .from('chat_sessions')
          .select('id, title')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session data:', error);
        } else {
          setSessionData(session);
        }
      }
    };
    fetchUserAndSession();
  }, [supabase.auth, sessionId]);

  // Debounced effect to save chat history whenever messages change
  useEffect(() => {
      // We don't want to save the initial messages on the first render,
      // as this could cause a race condition or unnecessary write.
      if (isInitialMount.current) {
          isInitialMount.current = false;
          return;
      }

      // Set a timer to save the chat history after 1.5 seconds of inactivity.
      const handler = setTimeout(() => {
          saveChatHistory(messages);
      }, 1500);

      // Cleanup function to cancel the timer if messages change again quickly.
      return () => clearTimeout(handler);
  }, [messages, sessionId, sessionData]); // Rerun this effect if messages or sessionId change

  // When the session ID changes, reset messages to the new initial messages
  useEffect(() => {
    setMessages(initialMessages);
    // AND, find the most recent analysis in the loaded history and set it as active.
    const lastAnalysisResult = [...initialMessages]
        .reverse()
        .find(msg => msg.type === 'analysis' && msg.analysisResult)?.analysisResult;

    if (lastAnalysisResult) {
        setActiveAnalysis(lastAnalysisResult);
        console.log("Active analysis context restored from history.");
    } else {
        setActiveAnalysis(null);
    }
  }, [initialMessages, sessionId]);

  const saveChatHistory = async (currentMessages: Message[]) => {
      // Don't save if there's no session or the message list is empty/default.
      if (!sessionId || !user || currentMessages.length === 0 || (currentMessages.length === 1 && currentMessages[0].id === '1')) return;

      try {
          // Prepare messages for storage, converting Date objects to ISO strings
          // and linking analysis results by ID instead of embedding the whole object.
          const messagesToStore = currentMessages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
              // If there's an analysisResult, only store its ID.
              analysisResult: undefined, 
              analysisResultId: msg.analysisResult?.id,
          }));
          
          // Upsert the entire message history for the session.
          // 'onConflict' ensures that if a record for this session_id already exists, it gets updated.
          const { error } = await supabase.from('chat_history').upsert({
              session_id: sessionId,
              user_id: user.id,
              messages: messagesToStore,
          }, { onConflict: 'session_id' });

          if (error) throw error;

          console.log("Chat history saved successfully.");

          // After saving, check if we need to generate a title
          if (!sessionData?.title && currentMessages.length > 2) {
            generateAndSaveTitle(currentMessages);
          }

      } catch (error) {
          console.error("Error saving chat history:", error);
          toast.error("Could not save chat history.");
      }
  };

  const generateAndSaveTitle = async (currentMessages: Message[]) => {
    try {
      const response = await fetch('/api/chat/sessions/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages.slice(0, 5) }), // Send first 5 messages
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const { title } = await response.json();

      if (title) {
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ title: title })
          .eq('id', sessionId);

        if (updateError) throw updateError;
        
        // Update local state to prevent re-generation
        setSessionData(prev => prev ? { ...prev, title } : { id: sessionId, title });
        toast.success("Chat title generated!");
      }
    } catch (error) {
      console.error("Error generating title:", error);
      // We don't show a toast here to avoid bothering the user for a background task.
    }
  };

  const saveAnalysisResult = async (result: AnalysisResult, session_id: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const { 
        chatContent, consistencyAnalysis, escalationIndex, reciprocityScore,
        riskScore, trustScore, suggestedReplies, ocrMetadata, createdAt, id,
        ...restOfResult 
      } = result;

      const { data: newAnalysis, error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          ...restOfResult, user_id: user.id, chat_content: chatContent,
          consistency_analysis: consistencyAnalysis, escalation_index: escalationIndex,
          reciprocity_score: reciprocityScore, risk_score: riskScore,
          trust_score: trustScore, suggested_replies: suggestedReplies,
          metadata: ocrMetadata,
        })
        .select('id').single();

      if (insertError) throw insertError;

      const { data: sessionData, error: fetchError } = await supabase
        .from('chat_sessions').select('analysis_ids').eq('id', session_id).single();
      
      if (fetchError) throw fetchError;
      
      const updated_ids = [...(sessionData.analysis_ids || []), newAnalysis.id];
      
      const { error: updateError } = await supabase
        .from('chat_sessions').update({ analysis_ids: updated_ids }).eq('id', session_id);
      
      if (updateError) throw updateError;
      
      return newAnalysis.id; // Return the new ID

    } catch (error) {
        console.error("Error saving analysis result:", error);
        toast.error("Could not save analysis result. This may be due to a profile synchronization issue.");
        return null;
    }
  };
  
  const handleApiResponse = async (data: any): Promise<void> => {
    const analysisId = await saveAnalysisResult(data.result, sessionId);
    if (!analysisId) return;

    const savedResult = { ...data.result, id: analysisId };
    setActiveAnalysis(savedResult);

    const analysisMessage: Message = {
      id: `analysis-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      type: 'analysis',
      analysisResult: savedResult
    };
    setMessages(prev => [...prev, analysisMessage]);
    toast.success('Analysis complete! View summary in chat.');
  };

  const handleTextSubmit = async (text: string): Promise<void> => {
    if (!user) {
        toast.error("You must be logged in.");
        return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userPosition }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get analysis.');

      await handleApiResponse(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleImageSubmit = async (file: File): Promise<void> => {
    if (!user) {
        toast.error("You must be logged in.");
        return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/ocr/openai', { method: 'POST', body: formData });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to process screenshot.');

      const data = await response.json();
      await handleApiResponse(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewFullAnalysis = (result: AnalysisResult, focusFlagId?: string): void => {
    setActiveAnalysis(result);
    setFocusedFlagId(focusFlagId || null);
    setShowFullAnalysis(true);
  };

  return (
    <div className="h-full">
        <div className="h-full">
            <ChatInterface
              sessionId={sessionId}
              messages={messages} // Pass the state down
              setMessages={setMessages} // Pass the setter function down
              onAnalyzeScreenshot={handleImageSubmit}
              onAnalyzeText={handleTextSubmit}
              isProcessing={isProcessing}
              onViewFullAnalysis={handleViewFullAnalysis}
              activeAnalysis={activeAnalysis}
              setActiveAnalysis={setActiveAnalysis}
            />
        </div>
        
        {showSenderConfig && (
            <SenderConfigModal
                userPosition={userPosition}
                onPositionChange={setUserPosition}
                onClose={() => setShowSenderConfig(false)}
            />
        )}

        {showFullAnalysis && activeAnalysis && user && (
            <AnalysisDashboard
                user={user}
                result={activeAnalysis}
                onClose={() => {
                    setShowFullAnalysis(false);
                    setFocusedFlagId(null);
                }}
                focusedFlagId={focusedFlagId}
            />
        )}
    </div>
  );
}