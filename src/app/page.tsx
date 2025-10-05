'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { HeartIcon, ShieldCheckIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import UploadComponent from '@/components/UploadComponent';
import ChatInterface from '@/components/ChatInterface';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { AnalysisResult, ChatMessage } from '@/types';
import { processImage, redactPersonalInfo } from '@/lib/ocr';
import { analyzeConversationEnhanced } from '@/lib/analyze-enhanced';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeView, setActiveView] = useState<'upload' | 'chat'>('chat');

  const handleTextSubmit = async (text: string) => {
    setIsProcessing(true);
    const loadingToast = toast.loading('Analyzing conversation...');

    try {
      // Redact personal information
      const redactedText = redactPersonalInfo(text);
      
      // Parse text into messages (simple parser for demo)
      const messages = parseTextToMessages(redactedText);
      
      if (messages.length === 0) {
        throw new Error('No valid messages found in the text');
      }

      // Analyze the conversation with enhanced analysis
      const result = await analyzeConversationEnhanced(messages, {
        platform: 'text_input',
        extractionQuality: 'high'
      });
      
      setAnalysisResult(result);
      toast.success('Analysis complete!', { id: loadingToast });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze conversation. Please try again.', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async (file: File) => {
    setIsProcessing(true);
    const loadingToast = toast.loading('Processing image...');

    try {
      // Convert file to data URL for OCR
      const dataUrl = await fileToDataUrl(file);
      
      // Process image with enhanced OCR
      const ocrResult = await processImage(dataUrl);
      
      console.log(`OCR completed: ${ocrResult.messages.length} messages extracted`);
      
      if (ocrResult.messages.length === 0) {
        toast.error('No text found in the image. Please ensure the screenshot is clear and contains chat messages.', { id: loadingToast });
        return;
      }

      // Redact personal information from messages
      const redactedMessages = ocrResult.messages.map(msg => ({
        ...msg,
        content: redactPersonalInfo(msg.content),
      }));

      // Analyze with enhanced analyzer including metadata
      const result = await analyzeConversationEnhanced(redactedMessages, {
        platform: ocrResult.metadata?.platform,
        extractionQuality: ocrResult.metadata?.extractionQuality,
      });
      
      setAnalysisResult(result);
      
      // Provide feedback based on extraction quality
      if (ocrResult.confidence < 60) {
        toast.success('Analysis complete! Note: Image quality was low, some messages may be missed.', { id: loadingToast });
      } else {
        toast.success('Analysis complete!', { id: loadingToast });
      }
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image. Please try again with a clearer screenshot.', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseTextToMessages = (text: string): ChatMessage[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const messages: ChatMessage[] = [];
    let currentSender: 'user' | 'match' = 'match';
    
    lines.forEach((line, index) => {
      // Simple parsing - look for patterns like "Name: message"
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && colonIndex < 20) {
        const sender = line.substring(0, colonIndex).trim().toLowerCase();
        const content = line.substring(colonIndex + 1).trim();
        
        // Determine if it's user or match (simplified)
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
            timestamp: new Date(Date.now() - (lines.length - index) * 60000), // Fake timestamps
          });
        }
      } else if (line.trim()) {
        // If no clear sender, continue with previous sender
        messages.push({
          id: `msg-${index}`,
          sender: currentSender,
          content: line.trim(),
          timestamp: new Date(Date.now() - (lines.length - index) * 60000),
        });
      }
    });
    
    return messages;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <HeartIcon className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dating Safety & Trust AI</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Date Safer, Love Smarter
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chat with our AI for dating advice or analyze conversations to detect red flags and celebrate green flags.
            </p>
          </motion.div>

          {/* Toggle between Chat and Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white rounded-full shadow-md p-1 flex">
              <button
                onClick={() => setActiveView('chat')}
                className={`px-6 py-2 rounded-full flex items-center space-x-2 transition-all ${
                  activeView === 'chat' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Chat with AI</span>
              </button>
              <button
                onClick={() => setActiveView('upload')}
                className={`px-6 py-2 rounded-full flex items-center space-x-2 transition-all ${
                  activeView === 'upload' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Analyze Text</span>
              </button>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            {activeView === 'chat' ? (
              <div className="max-w-4xl mx-auto">
                <ChatInterface
                  onAnalyzeScreenshot={handleImageSubmit}
                  isProcessing={isProcessing}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <UploadComponent
                  onTextSubmit={handleTextSubmit}
                  onImageSubmit={handleImageSubmit}
                  isProcessing={isProcessing}
                />
              </div>
            )}
          </motion.div>

          {/* Features Grid */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Red Flag Detection</h3>
              <p className="text-gray-600">
                Identifies scams, manipulation tactics, love bombing, and other warning signs to keep you safe.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Green Flag Recognition</h3>
              <p className="text-gray-600">
                Highlights positive behaviors like respect, patience, and genuine interest in getting to know you.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Dating Coach</h3>
              <p className="text-gray-600">
                Chat with our AI for personalized dating advice, safety tips, and help understanding relationship dynamics.
              </p>
            </motion.div>
          </div>

          {/* Privacy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            id="privacy"
            className="bg-gray-900 text-white rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold mb-4">🔒 Your Privacy is Our Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Auto-Redaction</h4>
                <p className="text-gray-300">Personal info like names, numbers, and emails are automatically removed before processing.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">No Storage</h4>
                <p className="text-gray-300">Your conversations are analyzed in real-time and never stored on our servers.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Secure Processing</h4>
                <p className="text-gray-300">All analysis happens with enterprise-grade encryption and security measures.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analysis Results Modal */}
      {analysisResult && (
        <AnalysisDashboard
          result={analysisResult}
          onClose={() => setAnalysisResult(null)}
        />
      )}
    </div>
  );
}