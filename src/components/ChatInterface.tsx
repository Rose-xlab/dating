// src/components/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, UserIcon, SparklesIcon, ChartBarIcon, ShieldCheckIcon, ArrowRightIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import SenderSelectionModal from './SenderSelectionModal';
import { detectWhatsAppFormat, extractSenderNames } from '@/lib/parsers/whatsapp-parser';
import { AnalysisResult, Flag } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
  analysisResult?: AnalysisResult;
  flagReferences?: FlagReference[];
}

interface FlagReference {
  flagId: string;
  text: string;
  type: 'red' | 'green';
}

interface ChatInterfaceProps {
  onAnalyzeScreenshot: (file: File) => Promise<void>;
  onAnalyzeText: (text: string) => Promise<void>;
  isProcessing: boolean;
  analysisResult?: AnalysisResult | null;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onViewFullAnalysis?: (result: AnalysisResult, focusFlagId?: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Component to render message with clickable flag references
function MessageWithFlagLinks({ 
  content, 
  flagReferences, 
  onFlagClick 
}: { 
  content: string; 
  flagReferences?: FlagReference[];
  onFlagClick: (flagId: string) => void;
}) {
  if (!flagReferences || flagReferences.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  // Parse the content and replace flag references with clickable links
  let processedContent = content;
  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  // Sort references by their position in the content (if they appear)
  const sortedReferences = [...flagReferences].sort((a, b) => {
    const aIndex = content.indexOf(a.text);
    const bIndex = content.indexOf(b.text);
    return aIndex - bIndex;
  });

  sortedReferences.forEach((ref, index) => {
    const flagIndex = processedContent.indexOf(ref.text, lastIndex);
    if (flagIndex !== -1) {
      // Add text before the flag reference
      if (flagIndex > lastIndex) {
        elements.push(processedContent.substring(lastIndex, flagIndex));
      }
      
      // Add the clickable flag reference
      elements.push(
        <button
          key={`flag-ref-${index}`}
          onClick={() => onFlagClick(ref.flagId)}
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md transition-colors ${
            ref.type === 'red' 
              ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300' 
              : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
          }`}
        >
          {ref.type === 'red' ? (
            <ExclamationTriangleIcon className="w-3 h-3" />
          ) : (
            <CheckCircleIcon className="w-3 h-3" />
          )}
          <span className="text-xs font-medium">{ref.text}</span>
        </button>
      );
      
      lastIndex = flagIndex + ref.text.length;
    }
  });

  // Add any remaining text
  if (lastIndex < processedContent.length) {
    elements.push(processedContent.substring(lastIndex));
  }

  return <p className="whitespace-pre-wrap">{elements}</p>;
}

// Mini component to display analysis summary in chat with "View Full Analysis" button
function AnalysisSummaryCard({ result, onViewFull }: { result: AnalysisResult; onViewFull: () => void }) {
  const criticalFlags = result.flags.filter(f => f.severity === 'critical' || f.safetyLevel === 'immediate_danger');
  const redFlags = result.flags.filter(f => f.type === 'red');
  const greenFlags = result.flags.filter(f => f.type === 'green');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
          Conversation Analysis Complete
        </h3>
        <span className="text-xs text-gray-500">{formatTime(new Date())}</span>
      </div>
      
      {criticalFlags.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800">
            ⚠️ Critical Safety Alerts: {criticalFlags.length}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Immediate safety concerns detected. Please review the full analysis.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-red-600">{result.riskScore}%</div>
          <div className="text-xs text-gray-600">Risk Score</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-green-600">{result.trustScore}%</div>
          <div className="text-xs text-gray-600">Trust Score</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-purple-600">{result.escalationIndex}%</div>
          <div className="text-xs text-gray-600">Escalation</div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <span className="text-red-600">🚩 Red Flags: {redFlags.length}</span>
        <span className="text-green-600">✅ Green Flags: {greenFlags.length}</span>
      </div>
      
      {/* View Full Analysis Button */}
      <button
        onClick={onViewFull}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <span>View Full Analysis</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Ask me about specific flags - I'll show clickable links to view them in detail
        </p>
      </div>
    </div>
  );
}

export default function ChatInterface({ 
  onAnalyzeScreenshot, 
  onAnalyzeText, 
  isProcessing,
  analysisResult,
  onAnalysisComplete,
  onViewFullAnalysis 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Dating Safety AI. I can analyze conversations from dating apps or WhatsApp. Type a question, paste a conversation, or upload a screenshot to get started.",
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [detectedSenders, setDetectedSenders] = useState<string[]>([]);
  const [pendingText, setPendingText] = useState('');
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<AnalysisResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Update current analysis when prop changes
  useEffect(() => {
    if (analysisResult && analysisResult !== currentAnalysisResult) {
      setCurrentAnalysisResult(analysisResult);
      
      // Add analysis result as a message in the chat
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'analysis',
        analysisResult: analysisResult
      };
      
      setMessages(prev => [...prev, analysisMessage]);
      
      // Save updated chat history
      saveConversationHistory();
    }
  }, [analysisResult]);

  // Save conversation history including analysis results
  const saveConversationHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Convert messages to a format that can be stored
      const messagesToStore = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
        // Store analysis result ID if present
        analysisResultId: msg.analysisResult?.id,
        // Store flag references if present
        flagReferences: msg.flagReferences
      }));

      await supabase
        .from('chat_history')
        .upsert({
          user_id: user.id,
          messages: messagesToStore
        });
    }
  };

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: history } = await supabase
          .from('chat_history')
          .select('messages')
          .eq('user_id', user.id)
          .single();
        
        if (history && Array.isArray(history.messages) && history.messages.length > 0) {
          const formattedHistory = history.messages.map((msg: any, index: number) => ({
            ...msg,
            id: msg.id || `hist-${index}`,
            timestamp: new Date(msg.timestamp || Date.now()),
            type: msg.type || 'text'
          }));
          setMessages(formattedHistory);
        }
      }
    };
    fetchHistory().catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleViewFullAnalysis = (result: AnalysisResult, focusFlagId?: string) => {
    if (onViewFullAnalysis) {
      onViewFullAnalysis(result, focusFlagId);
    }
  };

  const handleFlagClick = (flagId: string) => {
    if (currentAnalysisResult) {
      handleViewFullAnalysis(currentAnalysisResult, flagId);
    }
  };

  const handleWhatsAppAnalysis = async (text: string, userIdentifier?: string) => {
    try {
      const response = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          platform: 'whatsapp',
          userIdentifier,
          userPosition: 'right'
        }),
      });

      const data = await response.json();

      if (response.status === 400 && data.requiresUserIdentifier) {
        setDetectedSenders(data.detectedSenders);
        setPendingText(text);
        setShowSenderModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze conversation');
      }

      // Store the analysis result
      setCurrentAnalysisResult(data.result);
      
      // Add analysis result to chat
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'analysis',
        analysisResult: data.result
      };
      
      setMessages(prev => [...prev, analysisMessage]);
      
      // Add follow-up message
      if (data.result.riskScore >= 90) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ **CRITICAL**: This conversation shows extremely dangerous behavior. Please review the full analysis for your safety. Would you like me to explain the specific concerns?',
          timestamp: new Date(),
          type: 'text'
        }]);
      } else if (data.result.riskScore >= 70) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '🚨 This analysis shows significant red flags. Click "View Full Analysis" above for detailed insights, or ask me to explain specific concerns.',
          timestamp: new Date(),
          type: 'text'
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Analysis complete! View the full report above or ask me questions about specific flags, safe responses, or the conversation patterns I detected.',
          timestamp: new Date(),
          type: 'text'
        }]);
      }
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(data.result);
      }
      
      // Save conversation history
      await saveConversationHistory();
      
      toast.success('WhatsApp conversation analyzed!');
      
    } catch (error) {
      console.error('WhatsApp analysis error:', error);
      toast.error((error as Error).message);
    }
  };

  const handleTextSubmit = async (text: string) => {
    if (!text || text.trim().length < 20) {
      toast.error('Please provide a longer conversation for meaningful analysis.');
      return;
    }

    // Check if this is a WhatsApp export
    if (detectWhatsAppFormat(text)) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: '📱 Analyzing WhatsApp conversation...',
        timestamp: new Date(),
        type: 'text'
      }]);
      
      await handleWhatsAppAnalysis(text);
    } else {
      // Regular text analysis
      await onAnalyzeText(text);
    }
  };

  const handleSenderSelection = async (selectedSender: string) => {
    setShowSenderModal(false);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Got it! I'll analyze the conversation with you as "${selectedSender}" and examine the other person's behavior.`,
      timestamp: new Date(),
      type: 'text'
    }]);
    
    await handleWhatsAppAnalysis(pendingText, selectedSender);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isTyping) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input, 
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Include context about current analysis if available
      const contextMessages = currentAnalysisResult ? [
        {
          role: 'system',
          content: `Current analysis context: 
          Risk Score: ${currentAnalysisResult.riskScore}%
          Trust Score: ${currentAnalysisResult.trustScore}%
          Red Flags: ${JSON.stringify(currentAnalysisResult.flags.filter(f => f.type === 'red').map(f => ({
            id: f.id,
            message: f.message,
            category: f.category,
            severity: f.severity
          })))}
          Green Flags: ${JSON.stringify(currentAnalysisResult.flags.filter(f => f.type === 'green').map(f => ({
            id: f.id,
            message: f.message,
            category: f.category
          })))}
          
          IMPORTANT: When referencing specific flags, format them as [[FLAG_ID::FLAG_TEXT::FLAG_TYPE]] so they can be made clickable.
          For example: [[flag-123::Love bombing behavior::red]] or [[flag-456::Respects boundaries::green]]
          
          The user may ask questions about this analysis. Be specific and reference actual flags by their IDs.`
        },
        ...messages.filter(m => m.type === 'text').slice(-5).map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: userMessage.content }
      ] : [{ role: 'user', content: userMessage.content }];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: contextMessages,
          hasAnalysisContext: !!currentAnalysisResult 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response from AI assistant.');

      const data = await response.json();
      
      // Parse the response for flag references
      const flagReferences: FlagReference[] = [];
      let processedContent = data.content || '';
      
      // Extract flag references in format [[FLAG_ID::FLAG_TEXT::FLAG_TYPE]]
      const flagRegex = /\[\[([^:]+)::([^:]+)::([^:\]]+)\]\]/g;
      let match;
      
      while ((match = flagRegex.exec(processedContent)) !== null) {
        flagReferences.push({
          flagId: match[1],
          text: match[2],
          type: match[3] as 'red' | 'green'
        });
      }
      
      // Remove the flag reference markers from the content
      processedContent = processedContent.replace(flagRegex, '$2');
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: processedContent, 
        timestamp: new Date(),
        type: 'text',
        flagReferences: flagReferences.length > 0 ? flagReferences : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save conversation periodically
      await saveConversationHistory();
      
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'user', 
      content: `📸 Analyzing screenshot: ${file.name}`, 
      timestamp: new Date(),
      type: 'text'
    }]);
    onAnalyzeScreenshot(file);
    e.target.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `📋 Pasted a screenshot for analysis.`, 
            timestamp: new Date(),
            type: 'text'
          }]);
          onAnalyzeScreenshot(file);
          return;
        }
      }
    }

    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n') && pastedText.length > 100) {
      e.preventDefault();
      
      if (detectWhatsAppFormat(pastedText)) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'user', 
          content: `📱 Pasted a WhatsApp conversation for analysis.`, 
          timestamp: new Date(),
          type: 'text'
        }]);
        await handleWhatsAppAnalysis(pastedText);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'user', 
          content: `📋 Pasted a conversation for analysis.`, 
          timestamp: new Date(),
          type: 'text'
        }]);
        await handleTextSubmit(pastedText);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-[70vh] max-h-[800px] min-h-[500px] bg-white rounded-2xl shadow-xl">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Swipe Safe AI Assistant</h3>
                <p className="text-sm opacity-90">
                  {currentAnalysisResult ? 'Analysis loaded - Ask me anything!' : 'WhatsApp & Dating App Analysis'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentAnalysisResult && (
                <div className="flex items-center space-x-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Analysis Active</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center space-x-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div 
                key={message.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'analysis' && message.analysisResult ? (
                  <div className="w-full max-w-lg">
                    <AnalysisSummaryCard 
                      result={message.analysisResult} 
                      onViewFull={() => handleViewFullAnalysis(message.analysisResult!)}
                    />
                  </div>
                ) : (
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-blue-500' : 'bg-indigo-500'
                    }`}>
                      {message.role === 'user' ? 
                        <UserIcon className="w-5 h-5 text-white" /> : 
                        <SparklesIcon className="w-5 h-5 text-white" />
                      }
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.role === 'assistant' && message.flagReferences ? (
                        <MessageWithFlagLinks 
                          content={message.content}
                          flagReferences={message.flagReferences}
                          onFlagClick={handleFlagClick}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="mb-2 text-xs text-gray-500 flex justify-between">
            <span>💡 Tip: {currentAnalysisResult ? 'Click on flag names to view details' : 'Paste conversations or upload screenshots'}</span>
            {currentAnalysisResult && (
              <button 
                onClick={() => {
                  setCurrentAnalysisResult(null);
                  toast.success('Started new analysis session');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                New Analysis
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isProcessing} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" 
              title="Upload screenshot"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onPaste={handlePaste}
              placeholder={currentAnalysisResult ? "Ask about the analysis..." : "Ask a question, paste a conversation, or upload a screenshot..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isTyping || isProcessing}
              rows={1}
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping || isProcessing} 
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSenderModal && (
          <SenderSelectionModal
            senders={detectedSenders}
            onSelect={handleSenderSelection}
            onClose={() => {
              setShowSenderModal(false);
              setPendingText('');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}