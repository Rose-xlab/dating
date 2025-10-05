import React, { useState, useEffect } from 'react';
import { AnalysisResult, Flag, SuggestedReply } from '@/types';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  LightBulbIcon,
  XMarkIcon,
  InformationCircleIcon
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

  // Debug logging
  useEffect(() => {
    console.log('Analysis Result:', result);
    console.log('Timeline events:', result.timeline);
    console.log('Active tab:', activeTab);
  }, [result, activeTab]);

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

  // Extract recommendations from evidence if available
  const recommendations = result.evidence?.find(e => e.id === 'analysis-metadata')?.explanation?.match(/(\d+) recommendations/)?.[1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close analysis"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log(`Tab clicked: ${tab.id}`);
                    setActiveTab(tab.id as any);
                  }}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm 
                    transition-all duration-200 
                    flex items-center space-x-2 
                    cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-overview"
                >
                  {/* Score Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScoreIndicator
                      label="Risk Score"
                      score={result.riskScore}
                      description="Higher scores indicate more red flags"
                      type="risk"
                    />
                    <ScoreIndicator
                      label="Trust Score"
                      score={result.trustScore}
                      description="Higher scores indicate more positive signals"
                      type="trust"
                    />
                    <ScoreIndicator
                      label="Escalation Index"
                      score={result.escalationIndex}
                      description="How quickly the conversation is progressing"
                      type="escalation"
                    />
                  </div>

                  {/* Flags Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Flags */}
                    <div className="bg-red-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                        <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                        Red Flags ({redFlags.length})
                      </h3>
                      {redFlags.length > 0 ? (
                        <ul className="space-y-2">
                          {redFlags.slice(0, 5).map((flag) => (
                            <li key={flag.id} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <div>
                                <span className="text-sm text-red-800">{flag.message}</span>
                                {flag.evidence && (
                                  <p className="text-xs text-red-600 mt-1 italic">
                                    "{flag.evidence.substring(0, 50)}..."
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                          {redFlags.length > 5 && (
                            <li className="text-sm text-red-600 italic">
                              + {redFlags.length - 5} more...
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">No red flags detected</p>
                      )}
                    </div>

                    {/* Green Flags */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        <CheckCircleIcon className="w-6 h-6 mr-2" />
                        Green Flags ({greenFlags.length})
                      </h3>
                      {greenFlags.length > 0 ? (
                        <ul className="space-y-2">
                          {greenFlags.slice(0, 5).map((flag) => (
                            <li key={flag.id} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <div>
                                <span className="text-sm text-green-800">{flag.message}</span>
                                {flag.evidence && (
                                  <p className="text-xs text-green-600 mt-1 italic">
                                    "{flag.evidence.substring(0, 50)}..."
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                          {greenFlags.length > 5 && (
                            <li className="text-sm text-green-600 italic">
                              + {greenFlags.length - 5} more...
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700">No green flags detected yet</p>
                      )}
                    </div>
                  </div>

                  {/* Suggested Replies */}
                  {result.suggestedReplies && result.suggestedReplies.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <LightBulbIcon className="w-6 h-6 mr-2" />
                        Suggested Replies
                      </h3>
                      <div className="space-y-3">
                        {result.suggestedReplies.map((reply) => (
                          <div key={reply.id} className="bg-white rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                reply.tone === 'friendly' ? 'bg-green-100 text-green-700' :
                                reply.tone === 'neutral' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {reply.tone}
                              </span>
                              <button
                                onClick={() => copyReply(reply)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Copy
                              </button>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                            <p className="text-xs text-gray-500 mt-2">{reply.context}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Chat Analysis Tab */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  role="tabpanel"
                  id="tabpanel-chat"
                >
                  {result.chatContent && result.chatContent.length > 0 ? (
                    <ChatDisplay 
                      messages={result.chatContent}
                      flags={result.flags}
                      evidence={result.evidence}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No chat messages to display</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-timeline"
                >
                  {result.timeline && result.timeline.length > 0 ? (
                    <>
                      <Timeline events={result.timeline} messages={result.chatContent} />
                      <ReciprocityChart reciprocity={result.reciprocityScore} />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No timeline events detected</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Timeline shows emotional shifts and relationship progression
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Detailed Report Tab */}
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-details"
                >
                  {/* Consistency Report */}
                  <ConsistencyReport consistency={result.consistencyAnalysis} />
                  
                  {/* All Flags */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <InformationCircleIcon className="w-6 h-6 mr-2" />
                      All Detected Patterns
                    </h3>
                    {result.flags.length > 0 ? (
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
                                {flag.evidence && (
                                  <p className={`text-sm mt-2 italic ${
                                    flag.type === 'red' ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    "{flag.evidence}"
                                  </p>
                                )}
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
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <p>No patterns detected in this conversation</p>
                      </div>
                    )}
                  </div>

                  {/* Analysis Metadata */}
                  {result.evidence && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
                      <div className="space-y-2 text-sm">
                        {result.evidence
                          .filter(e => e.id === 'analysis-metadata' || e.id === 'platform-insights')
                          .map(e => (
                            <div key={e.id} className="text-gray-700">
                              <span className="font-medium">{e.text}:</span> {e.explanation}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}