//src\components\ChatInterface.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onAnalyzeScreenshot: (file: File) => Promise<void>;
  onAnalyzeText: (text: string) => Promise<void>; // Added new prop
  isProcessing: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatInterface({ onAnalyzeScreenshot, onAnalyzeText, isProcessing }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Dating Safety AI. Type a question, paste a conversation, or upload a screenshot to get started.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!response.ok) throw new Error('Failed to get response from AI assistant.');

      const data = await response.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content, timestamp: new Date() };
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
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `📸 Analyzing screenshot: ${file.name}`, timestamp: new Date() }]);
    onAnalyzeScreenshot(file);
    // Clear the file input value so the same file can be uploaded again
    e.target.value = '';
  };

  // NEW: Smart paste handler
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // 1. Check for images in clipboard
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `📋 Pasted a screenshot for analysis.`, timestamp: new Date() }]);
          onAnalyzeScreenshot(file);
          return;
        }
      }
    }

    // 2. If no image, check for multi-line text
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n') && pastedText.length > 20) {
      e.preventDefault();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `📋 Pasted a conversation for analysis.`, timestamp: new Date() }]);
      onAnalyzeText(pastedText);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] min-h-[500px] bg-white rounded-2xl shadow-xl">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-t-2xl">
        <div className="flex items-center space-x-3"><SparklesIcon className="w-8 h-8" /><div><h3 className="text-lg font-semibold">Dating Safety AI Assistant</h3><p className="text-sm opacity-90">Your personal guide to safer dating</p></div></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>{message.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <SparklesIcon className="w-5 h-5 text-white" />}</div>
                <div className={`rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start"><div className="bg-gray-100 rounded-lg px-4 py-2"><div className="flex space-x-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div></div></div></motion.div>)}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" title="Upload screenshot"><PhotoIcon className="w-6 h-6" /></button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            onPaste={handlePaste} // ADDED: Smart paste handler
            placeholder="Type a question, paste a conversation, or upload..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isTyping || isProcessing}
          />
          <button onClick={handleSend} disabled={!input.trim() || isTyping || isProcessing} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"><PaperAirplaneIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}