import React, { useState } from 'react';
import { AnalysisResult, Flag, SuggestedReply } from '@/types';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreIndicator from './ScoreIndicator';
import Timeline from './Timeline';
import ReciprocityChart from './ReciprocityChart';
import ConsistencyReport from './ConsistencyReport';
import ChatDisplay from './ChatDisplay';
import toast from 'react-hot-toast';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onClose: () => void;
}

export default function AnalysisDashboard({ result, onClose }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'timeline' | 'details'>('overview');
  const [selectedReplyTone, setSelectedReplyTone] = useState<'friendly' | 'neutral' | 'assertive'>('neutral');

  const redFlags = result.flags.filter(f => f.type === 'red');
  const greenFlags = result.flags.filter(f => f.type === 'green');

  const copyReply = (reply: SuggestedReply) => {
    navigator.clipboard.writeText(reply.content);
    toast.success('Reply copied to clipboard!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'chat', label: 'Chat Analysis', icon: ChatBubbleLeftRightIcon },
    { id: 'timeline', label: 'Timeline', icon: ClockIcon },
    { id: 'details', label: 'Detailed Report', icon: ClipboardDocumentCheckIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 py-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-200">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Score Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScoreIndicator
                      label="Risk Score"
                      score={result.riskScore}
                      type="risk"
                      description="Higher scores indicate more red flags"
                    />
                    <ScoreIndicator
                      label="Trust Score"
                      score={result.trustScore}
                      type="trust"
                      description="Higher scores indicate more positive signals"
                    />
                    <ScoreIndicator
                      label="Escalation Index"
                      score={result.escalationIndex}
                      type="escalation"
                      description="How quickly the conversation is progressing"
                    />
                  </div>

                  {/* Flags Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Flags */}
                    <div className="bg-red-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Red Flags ({redFlags.length})
                      </h3>
                      <div className="space-y-3">
                        {redFlags.slice(0, 3).map((flag) => (
                          <div key={flag.id} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                flag.severity === 'high' ? 'bg-red-600' :
                                flag.severity === 'medium' ? 'bg-red-500' : 'bg-red-400'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">{flag.message}</p>
                                <p className="text-xs text-red-700 mt-1">"{flag.evidence}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {redFlags.length > 3 && (
                          <p className="text-sm text-red-700 text-center">
                            +{redFlags.length - 3} more red flags
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Green Flags */}
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Green Flags ({greenFlags.length})
                      </h3>
                      <div className="space-y-3">
                        {greenFlags.slice(0, 3).map((flag) => (
                          <div key={flag.id} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                flag.severity === 'high' ? 'bg-green-600' :
                                flag.severity === 'medium' ? 'bg-green-500' : 'bg-green-400'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">{flag.message}</p>
                                <p className="text-xs text-green-700 mt-1">"{flag.evidence}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {greenFlags.length > 3 && (
                          <p className="text-sm text-green-700 text-center">
                            +{greenFlags.length - 3} more positive signals
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Replies */}
                  {result.suggestedReplies.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <LightBulbIcon className="w-5 h-5 mr-2" />
                        Suggested Safe Replies
                      </h3>
                      <div className="space-y-4">
                        <div className="flex space-x-2 mb-4">
                          {(['friendly', 'neutral', 'assertive'] as const).map((tone) => (
                            <button
                              key={tone}
                              onClick={() => setSelectedReplyTone(tone)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedReplyTone === tone
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </button>
                          ))}
                        </div>
                        {result.suggestedReplies
                          .filter((reply) => reply.tone === selectedReplyTone)
                          .map((reply) => (
                            <div key={reply.id} className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-sm text-gray-800 mb-2">"{reply.content}"</p>
                              <p className="text-xs text-gray-600 mb-3">{reply.context}</p>
                              <button
                                onClick={() => copyReply(reply)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Copy to clipboard
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ChatDisplay 
                    messages={result.chatContent}
                    flags={result.flags}
                    evidence={result.evidence}
                  />
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Timeline events={result.timeline} messages={result.chatContent} />
                  <ReciprocityChart reciprocity={result.reciprocityScore} />
                </motion.div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <ConsistencyReport consistency={result.consistencyAnalysis} />
                  
                  {/* All Flags */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Detected Patterns</h3>
                    <div className="space-y-3">
                      {result.flags.map((flag) => (
                        <div
                          key={flag.id}
                          className={`rounded-lg p-4 ${
                            flag.type === 'red' ? 'bg-red-50' : 'bg-green-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {flag.type === 'red' ? (
                              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${
                                flag.type === 'red' ? 'text-red-900' : 'text-green-900'
                              }`}>
                                {flag.message}
                              </p>
                              <p className={`text-sm mt-1 ${
                                flag.type === 'red' ? 'text-red-700' : 'text-green-700'
                              }`}>
                                Category: {flag.category.replace(/_/g, ' ')}
                              </p>
                              <p className={`text-sm mt-2 italic ${
                                flag.type === 'red' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                "{flag.evidence}"
                              </p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              flag.severity === 'high' 
                                ? flag.type === 'red' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                                : flag.severity === 'medium'
                                ? flag.type === 'red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                : flag.type === 'red' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {flag.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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