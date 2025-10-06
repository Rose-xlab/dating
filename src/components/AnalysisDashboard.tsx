//src\components\AnalysisDashboard.tsx

"use client";

import React, { useState } from 'react';
import { AnalysisResult, Flag, FlagCategory } from '@/types';
import type { User } from '@supabase/supabase-js';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreIndicator from './ScoreIndicator';
import ConsistencyReport from './ConsistencyReport';
import toast from 'react-hot-toast';

interface AnalysisDashboardProps {
  user: User | null;
  result: AnalysisResult;
  onClose: () => void;
}

export default function AnalysisDashboard({ user, result, onClose }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  const redFlags = result.flags.filter(f => f.type === 'red');
  const greenFlags = result.flags.filter(f => f.type === 'green');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'details', label: 'Detailed Report', icon: ClipboardDocumentCheckIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              {user && <p className="text-sm text-gray-500">Generated for {user.email}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close analysis"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="px-6 pt-4 border-b border-gray-200 flex-shrink-0">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScoreIndicator label="Risk Score" score={result.riskScore} description="Higher scores indicate more red flags" type="risk" />
                    <ScoreIndicator label="Trust Score" score={result.trustScore} description="Higher scores indicate more positive signals" type="trust" />
                    <ScoreIndicator label="Escalation Index" score={result.escalationIndex} description="How quickly the conversation is progressing" type="escalation" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
                      <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center"><ExclamationTriangleIcon className="w-6 h-6 mr-2" />Red Flags ({redFlags.length})</h3>
                      {redFlags.length > 0 ? (<ul className="space-y-3">{redFlags.slice(0, 5).map((flag) => (<li key={flag.id} className="text-sm text-red-800">{flag.message}</li>))}{redFlags.length > 5 && (<li><button onClick={() => setActiveTab('details')} className="text-sm text-red-600 hover:text-red-800 font-medium underline">+ {redFlags.length - 5} more...</button></li>)}</ul>) : (<p className="text-sm text-red-700">No red flags detected. This is a great sign!</p>)}
                    </div>
                    <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2" />Green Flags ({greenFlags.length})</h3>
                      {greenFlags.length > 0 ? (<ul className="space-y-3">{greenFlags.slice(0, 5).map((flag) => (<li key={flag.id} className="text-sm text-green-800">{flag.message}</li>))}{greenFlags.length > 5 && (<li><button onClick={() => setActiveTab('details')} className="text-sm text-green-600 hover:text-green-800 font-medium underline">+ {greenFlags.length - 5} more...</button></li>)}</ul>) : (<p className="text-sm text-green-700">No specific green flags detected yet.</p>)}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <ConsistencyReport consistency={result.consistencyAnalysis} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><InformationCircleIcon className="w-6 h-6 mr-2" />All Detected Patterns</h3>
                    {result.flags.length > 0 ? (<div className="space-y-4">{result.flags.map((flag) => {
                      const associatedMessage = result.chatContent.find(msg => msg.id === flag.messageId);
                      return (
                        <div key={flag.id} className={`rounded-lg p-4 border ${flag.type === 'red' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">{flag.type === 'red' ? <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" /> : <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />}<div className="flex-1"><p className={`font-semibold ${flag.type === 'red' ? 'text-red-900' : 'text-green-900'}`}>{flag.message}</p><p className={`text-sm mt-1 capitalize ${flag.type === 'red' ? 'text-red-700' : 'text-green-700'}`}>Category: {flag.category.replace(/_/g, ' ')}</p></div></div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${flag.severity === 'high' ? 'bg-red-200 text-red-800' : flag.severity === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{flag.severity}</span>
                          </div>
                          {associatedMessage && (<div className="mt-4 pt-4 border-t border-dashed"><h4 className="text-sm font-semibold text-gray-800 flex items-center mb-2"><ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-gray-500"/>Triggering Message</h4><div className="bg-white border rounded-lg p-3"><p className="text-xs font-medium text-gray-500 mb-1">From: Match</p><p className="text-sm text-gray-800 italic">"{associatedMessage.content}"</p></div></div>)}
                          {(flag.meaning || flag.whatToDo || flag.aiSuggestedReply) && (<div className="mt-4 pt-4 border-t border-dashed space-y-4">
                            {flag.meaning && (<div><h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1"><InformationCircleIcon className="w-5 h-5 mr-2 text-gray-500"/>What it Means</h4><p className="text-sm text-gray-600">{flag.meaning}</p></div>)}
                            {flag.whatToDo && (<div><h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1"><ShieldCheckIcon className="w-5 h-5 mr-2 text-gray-500"/>What You Should Do</h4><p className="text-sm text-gray-600">{flag.whatToDo}</p></div>)}
                            {flag.aiSuggestedReply && (<div><h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1"><ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-gray-500"/>Suggested Reply</h4><div className="bg-white rounded-md p-3 border"><p className="text-sm italic text-gray-700 mb-2">"{flag.aiSuggestedReply.content}"</p><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Tone: {flag.aiSuggestedReply.tone}</span><button onClick={() => copyToClipboard(flag.aiSuggestedReply!.content)} className="text-xs font-semibold text-primary-600 hover:text-primary-700">COPY</button></div></div></div>)}
                          </div>)}
                        </div>
                      );
                    })}</div>) : (<div className="text-center py-8 text-gray-600"><p>No specific patterns were detected in this conversation.</p></div>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}