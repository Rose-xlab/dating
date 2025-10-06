'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ChatInterface from '@/components/ChatInterface';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import SenderConfigModal from '@/components/SenderConfigModal';
import SignOutButton from '@/components/SignOutButton';
import { AnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showSenderConfig, setShowSenderConfig] = useState(false);
  const [userPosition, setUserPosition] = useState<'left' | 'right'>('right');
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleTextSubmit = async (text: string) => {
    if (!user) {
        toast.error("You must be logged in to perform an analysis.");
        return;
    }
    setIsProcessing(true);
    try {
      if (!text || text.trim().length < 20) {
        throw new Error('Please provide a longer conversation for a meaningful analysis.');
      }
      
      const response = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userPosition }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get analysis from server.');
      }

      const { result } = await response.json();
      setAnalysisResult(result);
      toast.success('Analysis complete!');

    } catch (error) {
      console.error('Text analysis error:', error);
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async (file: File) => {
    if (!user) {
        toast.error("You must be logged in to perform an analysis.");
        return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/ocr/openai', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to process screenshot.');
      }

      const { result } = await response.json();
      setAnalysisResult(result);
      toast.success('Analysis complete!');

    } catch (error) {
      console.error('Image processing error:', error);
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Swipe Safe</h1>
            </Link>
            <div className="flex items-center space-x-4 sm:space-x-6">
                {user ? (
                    <>
                        <Link href="/dashboard/history" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">My Analyses</Link>
                        <Link href="/dashboard/profile" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Profile</Link>
                        <SignOutButton />
                    </>
                ) : (
                    <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                )}
                 <button onClick={() => setShowSenderConfig(true)} className="text-gray-600 hover:text-gray-900" title="Settings">
                    <InformationCircleIcon className="w-6 h-6" />
                 </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Get Instant Clarity
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Upload a screenshot, paste a conversation, or ask the AI a question to get started.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[70vh] max-h-[800px] min-h-[500px] bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h3 className="text-2xl font-bold text-gray-800">Analyzing Your Conversation...</h3>
                    <p className="text-gray-500 mt-2">Our AI is checking the vibe. This may take a moment.</p>
                  </motion.div>
                ) : (
                  <motion.div key="chat-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ChatInterface
                      onAnalyzeScreenshot={handleImageSubmit}
                      onAnalyzeText={handleTextSubmit}
                      isProcessing={isProcessing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {showSenderConfig && (
        <SenderConfigModal
          userPosition={userPosition}
          onPositionChange={setUserPosition}
          onClose={() => setShowSenderConfig(false)}
        />
      )}

      {analysisResult && (
        <AnalysisDashboard
          user={user}
          result={analysisResult}
          onClose={() => setAnalysisResult(null)}
        />
      )}
    </div>
  );
}