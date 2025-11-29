'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, UserIcon, SparklesIcon, ChartBarIcon, ShieldCheckIcon, ArrowRightIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { detectWhatsAppFormat } from '@/lib/parsers/whatsapp-parser';
import { AnalysisResult } from '@/types';

// --- SenderSelectionModal (Original, Unchanged) ---
const SenderSelectionModal = ({ senders, onSelect, onClose }: { senders: string[], onSelect: (sender: string) => void, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full border border-gray-200"
        >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Who are you in this chat?</h3>
            <p className="text-sm text-gray-600 mb-6">Select your name so I can accurately analyze the other person's behavior.</p>
            <div className="space-y-3">
                {senders.map(sender => (
                    <button
                        key={sender}
                        onClick={() => onSelect(sender)}
                        className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span className="font-medium text-gray-800">{sender}</span>
                    </button>
                ))}
            </div>
            <button
                onClick={onClose}
                className="w-full mt-6 text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
            >
                Cancel
            </button>
        </motion.div>
    </div>
);

// --- Type Definitions and Helper Functions (Original, Unchanged) ---
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

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  const sortedReferences = [...flagReferences].sort((a, b) => {
    const aIndex = content.indexOf(a.text);
    const bIndex = content.indexOf(b.text);
    return aIndex - bIndex;
  });

  sortedReferences.forEach((ref, index) => {
    const flagIndex = content.indexOf(ref.text, lastIndex);
    if (flagIndex !== -1) {
      if (flagIndex > lastIndex) {
        elements.push(content.substring(lastIndex, flagIndex));
      }
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

  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex));
  }

  return <p className="whitespace-pre-wrap">{elements}</p>;
}

function AnalysisSummaryCard({ result, onViewFull }: { result: AnalysisResult; onViewFull: () => void }) {
  if (!result) return null;
  const criticalFlags = result.flags?.filter(f => f.severity === 'critical' || f.safetyLevel === 'immediate_danger') || [];
  const redFlags = result.flags?.filter(f => f.type === 'red') || [];
  const greenFlags = result.flags?.filter(f => f.type === 'green') || [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
          Conversation Analysis Complete
        </h3>
        <span className="text-xs text-gray-500">{formatTime(new Date(result.createdAt || Date.now()))}</span>
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
          <div className="text-2xl font-bold text-red-600">{result.riskScore ?? '%'}%</div>
          <div className="text-xs text-gray-600">Risk Score</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-green-600">{result.trustScore ?? '%'}%</div>
          <div className="text-xs text-gray-600">Trust Score</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-purple-600">{result.escalationIndex ?? '%'}%</div>
          <div className="text-xs text-gray-600">Escalation</div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <span className="text-red-600">🚩 Red Flags: {redFlags.length}</span>
        <span className="text-green-600">✅ Green Flags: {greenFlags.length}</span>
      </div>
      
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

// *** CORE FIX IS HERE: PROPS ARE MODIFIED ***
interface ChatInterfaceProps {
  sessionId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onAnalyzeScreenshot: (file: File) => Promise<void>;
  onAnalyzeText: (text: string) => Promise<void>;
  isProcessing: boolean;
  onViewFullAnalysis: (result: AnalysisResult, focusFlagId?: string) => void;
  activeAnalysis: AnalysisResult | null;
  setActiveAnalysis: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
}

export default function ChatInterface({ 
  sessionId,
  messages,
  setMessages,
  onAnalyzeScreenshot, 
  onAnalyzeText, 
  isProcessing,
  onViewFullAnalysis,
  activeAnalysis,
  setActiveAnalysis
}: ChatInterfaceProps) {
  // *** CORE FIX: INTERNAL STATE REMOVED ***
  // This component is now "controlled" by its parent, `client-page.tsx`.
  // It no longer has its own `messages` or `currentAnalysisResult` state.
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [detectedSenders, setDetectedSenders] = useState<string[]>([]);
  const [pendingText, setPendingText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  
  // This useEffect for scrolling is correct and remains.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // *** CORE FIX: REMOVED CONFLICTING USEEFFECT HOOKS ***
  // The original `useEffect` hooks that reset `messages` and `currentAnalysisResult`
  // have been removed, as this state is now controlled by the parent.

  const handleFlagClick = (flagId: string) => {
    if (activeAnalysis) {
      onViewFullAnalysis(activeAnalysis, flagId);
    }
  };

  const handleWhatsAppAnalysis = async (text: string) => {
    // This now just calls the parent function
    await onAnalyzeText(text);
  };
  
  const handleTextSubmit = async (text: string) => {
    if (!text || text.trim().length < 20) {
      toast.error('Please provide a longer conversation for meaningful analysis.');
      return;
    }
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'user',
      content: '📋 Analyzing conversation...',
      timestamp: new Date(), type: 'text'
    }]);

    if (detectWhatsAppFormat(text)) {
      await handleWhatsAppAnalysis(text);
    } else {
      await onAnalyzeText(text);
    }
  };

  const handleSenderSelection = async (selectedSender: string) => {
    setShowSenderModal(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'assistant',
      content: `Got it! I'll analyze the conversation with you as "${selectedSender}" and examine the other person's behavior.`,
      timestamp: new Date(), type: 'text'
    }]);
    await handleWhatsAppAnalysis(pendingText); // This can be enhanced to pass the sender info
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date(), type: 'text' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const contextMessages = activeAnalysis ? [
        { role: 'system', content: `Current analysis context: Risk Score: ${activeAnalysis.riskScore}%, Trust Score: ${activeAnalysis.trustScore}%, Red Flags: ${JSON.stringify(activeAnalysis.flags.filter(f => f.type === 'red').map(f => ({ id: f.id, message: f.message, category: f.category, severity: f.severity })))}, Green Flags: ${JSON.stringify(activeAnalysis.flags.filter(f => f.type === 'green').map(f => ({ id: f.id, message: f.message, category: f.category })))}\n\nIMPORTANT: When referencing specific flags, format them as [[FLAG_ID::FLAG_TEXT::FLAG_TYPE]] so they can be made clickable.` },
        ...messages.filter(m => m.type === 'text').slice(-5).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: currentInput }
      ] : [{ role: 'user', content: currentInput }];

      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, hasAnalysisContext: !!activeAnalysis }),
      });
      
      if (!response.ok) throw new Error('Failed to get response from AI assistant.');

      const data = await response.json();
      
      const flagReferences: FlagReference[] = [];
      let processedContent = data.content || '';
      const flagRegex = /\[\[([^:]+)::([^:]+)::([^:\]]+)\]\]/g;
      let match;
      while ((match = flagRegex.exec(processedContent)) !== null) {
        flagReferences.push({ flagId: match[1], text: match[2], type: match[3] as 'red' | 'green' });
      }
      processedContent = processedContent.replace(flagRegex, '$2');
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), role: 'assistant', 
        content: processedContent, timestamp: new Date(), type: 'text',
        flagReferences: flagReferences.length > 0 ? flagReferences : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
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
      id: Date.now().toString(), role: 'user', 
      content: `📸 Analyzing screenshot: ${file.name}`, 
      timestamp: new Date(), type: 'text'
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
            id: Date.now().toString(), role: 'user', 
            content: `📋 Pasted a screenshot for analysis.`, 
            timestamp: new Date(), type: 'text'
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
          id: Date.now().toString(), role: 'user', 
          content: `📱 Pasted a WhatsApp conversation for analysis.`, 
          timestamp: new Date(), type: 'text'
        }]);
        await handleWhatsAppAnalysis(pastedText);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), role: 'user', 
          content: `📋 Pasted a conversation for analysis.`, 
          timestamp: new Date(), type: 'text'
        }]);
        await handleTextSubmit(pastedText);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Swipe Safe AI Assistant</h3>
                <p className="text-sm opacity-90">
                  {activeAnalysis ? 'Analysis loaded - Ask me anything!' : 'WhatsApp & Dating App Analysis'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {activeAnalysis && (
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="max-w-4xl mx-auto w-full">
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
                        onViewFull={() => onViewFullAnalysis(message.analysisResult!)}
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
                      <div className="text-gray-800">
                        {message.role === 'assistant' && message.flagReferences ? (
                          <MessageWithFlagLinks 
                            content={message.content}
                            flagReferences={message.flagReferences}
                            onFlagClick={handleFlagClick}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-base">{message.content}</p>
                        )}
                        <p className="text-xs mt-1 text-gray-500">
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
        </div>

        <div className="border-t p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="mb-2 text-sm text-gray-500 flex justify-between">
              <span>💡 Tip: {activeAnalysis ? 'Click on flag names to view details' : 'Paste conversations or upload screenshots'}</span>
              {activeAnalysis && (
                <button 
                  onClick={() => {
                    setActiveAnalysis(null);
                    toast.success('Analysis context cleared');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Context
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
                placeholder={activeAnalysis ? "Ask about the analysis..." : "Ask a question, paste a conversation..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
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