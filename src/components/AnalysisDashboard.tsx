"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  ExclamationCircleIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreIndicator from './ScoreIndicator';
import ConsistencyReport from './ConsistencyReport';
import toast from 'react-hot-toast';

interface AnalysisDashboardProps {
  user: User | null;
  result: AnalysisResult;
  onClose: () => void;
  focusedFlagId: string | null;
}

export default function AnalysisDashboard(props: AnalysisDashboardProps) {
  const { user, result, onClose, focusedFlagId } = props;
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'advice'>('overview');
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(() => {
    // Automatically expand the focused flag if one is provided
    return focusedFlagId ? new Set([focusedFlagId]) : new Set();
  });

  useEffect(() => {
    // If a focusedFlagId is provided, switch to the details tab
    if (focusedFlagId) {
      setActiveTab('details');
    }
  }, [focusedFlagId]);

  // Categorize and sort flags
  const { redFlags, greenFlags, criticalFlags } = useMemo(() => {
    const red = result.flags.filter(f => f.type === 'red');
    const green = result.flags.filter(f => f.type === 'green');
    const critical = red.filter(f => f.severity === 'critical' || f.safetyLevel === 'immediate_danger');
    
    // Sort by severity
    red.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
    
    return { redFlags: red, greenFlags: green, criticalFlags: critical };
  }, [result.flags]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleFlagExpansion = (flagId: string) => {
    setExpandedFlags(prev => {
      const next = new Set(prev);
      if (next.has(flagId)) {
        next.delete(flagId);
      } else {
        next.add(flagId);
      }
      return next;
    });
  };

  const getSeverityColor = (severity: string, type: 'red' | 'green') => {
    if (type === 'green') return 'bg-green-100 text-green-800 border-green-200';
    
    switch (severity) {
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSafetyLevelBadge = (level?: string) => {
    switch (level) {
      case 'immediate_danger':
        return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">⚠️ IMMEDIATE DANGER</span>;
      case 'high_caution':
        return <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold">High Caution</span>;
      case 'moderate_caution':
        return <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-bold">Moderate Caution</span>;
      case 'positive_sign':
        return <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">Positive Sign</span>;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'details', label: 'Detailed Flags', icon: ClipboardDocumentCheckIcon },
    { id: 'advice', label: 'Safety Advice', icon: ShieldCheckIcon },
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
          className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Conversation Analysis Results</h2>
              {user && <p className="text-sm text-gray-500">Generated for {user.email}</p>}
              {criticalFlags.length > 0 && (
                <p className="text-sm text-red-600 font-semibold mt-1">
                  ⚠️ {criticalFlags.length} critical safety concern{criticalFlags.length > 1 ? 's' : ''} detected
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close analysis"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-200 flex-shrink-0">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  className="space-y-6"
                >
                  {/* Critical Alerts */}
                  {criticalFlags.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-bold text-red-900">Critical Safety Alerts</h3>
                      </div>
                      <div className="space-y-2">
                        {criticalFlags.map(flag => (
                          <div key={flag.id} className="text-sm text-red-800">
                            <strong>• {flag.message}</strong>
                            {flag.manipulationTactic && (
                              <span className="ml-2 text-xs bg-red-200 px-2 py-1 rounded">
                                Tactic: {flag.manipulationTactic}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScoreIndicator 
                      label="Risk Score" 
                      score={result.riskScore} 
                      description="Overall safety risk assessment" 
                      type="risk" 
                    />
                    <ScoreIndicator 
                      label="Trust Score" 
                      score={result.trustScore} 
                      description="Positive relationship indicators" 
                      type="trust" 
                    />
                    <ScoreIndicator 
                      label="Escalation Index" 
                      score={result.escalationIndex} 
                      description="Speed of emotional/request progression" 
                      type="escalation" 
                    />
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Flags Summary */}
                    <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                      <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                        <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                        Red Flags ({redFlags.length})
                      </h3>
                      {redFlags.length > 0 ? (
                        <div className="space-y-3">
                          {redFlags.slice(0, 3).map((flag) => (
                            <div key={flag.id} className="text-sm text-red-800">
                              <div className="flex items-start justify-between">
                                <p className="flex-1">{flag.message}</p>
                                {getSafetyLevelBadge(flag.safetyLevel)}
                              </div>
                              {flag.psychologicalInsight && (
                                <p className="text-xs text-red-600 mt-1 italic">
                                  Insight: {flag.psychologicalInsight}
                                </p>
                              )}
                            </div>
                          ))}
                          {redFlags.length > 3 && (
                            <button 
                              onClick={() => setActiveTab('details')} 
                              className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                            >
                              + {redFlags.length - 3} more concerns...
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-700">No red flags detected. This is encouraging!</p>
                      )}
                    </div>

                    {/* Green Flags Summary */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        <CheckCircleIcon className="w-6 h-6 mr-2" />
                        Green Flags ({greenFlags.length})
                      </h3>
                      {greenFlags.length > 0 ? (
                        <div className="space-y-3">
                          {greenFlags.slice(0, 3).map((flag) => (
                            <div key={flag.id} className="text-sm text-green-800">
                              <p>{flag.message}</p>
                              {flag.meaning && (
                                <p className="text-xs text-green-600 mt-1 italic">
                                  Why it matters: {flag.meaning}
                                </p>
                              )}
                            </div>
                          ))}
                          {greenFlags.length > 3 && (
                            <button 
                              onClick={() => setActiveTab('details')} 
                              className="text-sm text-green-600 hover:text-green-800 font-medium underline"
                            >
                              + {greenFlags.length - 3} more positive signs...
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-green-700">No specific green flags identified yet.</p>
                      )}
                    </div>
                  </div>

                  {/* OCR Metadata if available */}
                  {result.ocrMetadata && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Screenshot Analysis Info</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        {result.ocrMetadata.platform && (
                          <p>Platform detected: <strong>{result.ocrMetadata.platform}</strong></p>
                        )}
                        <p>Extraction confidence: <strong>{result.ocrMetadata.confidence}</strong></p>
                        <p>Messages analyzed: <strong>{result.ocrMetadata.messageCount}</strong></p>
                        {result.ocrMetadata.extractionNotes && (
                          <p className="text-xs italic">{result.ocrMetadata.extractionNotes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <motion.div 
                  key="details" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  className="space-y-6"
                >
                  {result.consistencyAnalysis && <ConsistencyReport consistency={result.consistencyAnalysis} />}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Detected Patterns</h3>
                    {result.flags.length > 0 ? (
                      <div className="space-y-4">
                        {result.flags.map((flag) => {
                          const isExpanded = expandedFlags.has(flag.id);
                          const associatedMessage = result.chatContent.find(msg => msg.id === flag.messageId);
                          
                          return (
                            <motion.div 
                              key={flag.id}
                              layout
                              className={`rounded-lg border-2 transition-all ${
                                flag.type === 'red' 
                                  ? getSeverityColor(flag.severity, 'red') 
                                  : 'bg-green-50 border-green-200'
                              }`}
                            >
                              {/* Flag Header */}
                              <div 
                                className="p-4 cursor-pointer"
                                onClick={() => toggleFlagExpansion(flag.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    {flag.type === 'red' ? (
                                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <p className={`font-semibold ${
                                        flag.type === 'red' ? 'text-red-900' : 'text-green-900'
                                      }`}>
                                        {flag.message}
                                      </p>
                                      <div className="flex items-center flex-wrap gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                          flag.type === 'red' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                                        }`}>
                                          {flag.category.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                          flag.severity === 'critical' ? 'bg-red-600 text-white' :
                                          flag.severity === 'high' ? 'bg-orange-600 text-white' :
                                          flag.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                          'bg-gray-600 text-white'
                                        }`}>
                                          {flag.severity} severity
                                        </span>
                                        {getSafetyLevelBadge(flag.safetyLevel)}
                                        {flag.manipulationTactic && (
                                          <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                                            {flag.manipulationTactic}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ArrowRightCircleIcon className="w-5 h-5 text-gray-500 transform rotate-90" />
                                  </motion.div>
                                </div>
                              </div>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-dashed overflow-hidden"
                                  >
                                    <div className="p-4 space-y-4">
                                      {/* Triggering Message */}
                                      {associatedMessage && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-2">
                                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            Triggering Message
                                          </h4>
                                          <div className="bg-white border rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-500 mb-1">
                                              From: {associatedMessage.sender === 'match' ? 'Match' : 'You'}
                                            </p>
                                            <p className="text-sm text-gray-800 italic">&quot;{associatedMessage.content}&quot;</p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Pattern Description */}
                                      {flag.meaning && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1">
                                            <InformationCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            What This Pattern Means
                                          </h4>
                                          <p className="text-sm text-gray-700">{flag.meaning}</p>
                                        </div>
                                      )}

                                      {/* Psychological Insight */}
                                      {flag.psychologicalInsight && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1">
                                            <LightBulbIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            Psychological Insight
                                          </h4>
                                          <p className="text-sm text-gray-700">{flag.psychologicalInsight}</p>
                                        </div>
                                      )}

                                      {/* What to Do */}
                                      {flag.whatToDo && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1">
                                            <ShieldCheckIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            Recommended Action
                                          </h4>
                                          <p className="text-sm text-gray-700">{flag.whatToDo}</p>
                                        </div>
                                      )}

                                      {/* Boundary Setting */}
                                      {flag.boundaryingSuggestion && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-1">
                                            <ExclamationCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            How to Set Boundaries
                                          </h4>
                                          <p className="text-sm text-gray-700">{flag.boundaryingSuggestion}</p>
                                        </div>
                                      )}

                                      {/* AI Suggested Reply */}
                                      {flag.aiSuggestedReply && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-2">
                                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            Suggested Safe Response
                                          </h4>
                                          <div className="bg-white rounded-md p-3 border">
                                            <p className="text-sm italic text-gray-700 mb-2">
                                              &quot;{flag.aiSuggestedReply.content}&quot;
                                            </p>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-4 text-xs">
                                                <span className="font-medium text-gray-500">
                                                  Tone: <span className="text-gray-700">{flag.aiSuggestedReply.tone}</span>
                                                </span>
                                                {flag.aiSuggestedReply.purpose && (
                                                  <span className="text-gray-500">
                                                    Purpose: {flag.aiSuggestedReply.purpose}
                                                  </span>
                                                )}
                                              </div>
                                              <button 
                                                onClick={() => copyToClipboard(flag.aiSuggestedReply!.content)} 
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                              >
                                                COPY
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Additional Questions */}
                                      {flag.additionalQuestions && flag.additionalQuestions.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-2">
                                            <QuestionMarkCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                            Questions to Test Authenticity
                                          </h4>
                                          <ul className="space-y-1">
                                            {flag.additionalQuestions.map((question, idx) => (
                                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                <span className="text-gray-400 mr-2">•</span>
                                                {question}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Exit Strategy */}
                                      {flag.exitStrategy && (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                          <h4 className="text-sm font-semibold text-red-800 flex items-center mb-1">
                                            <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
                                            Safe Exit Strategy
                                          </h4>
                                          <p className="text-sm text-red-700">{flag.exitStrategy}</p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <p>No specific patterns were detected in this conversation.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Advice Tab */}
              {activeTab === 'advice' && (
                <motion.div 
                  key="advice" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  className="space-y-6"
                >
                  {/* Safety Summary */}
                  <div className={`rounded-lg p-6 border-2 ${
                    result.riskScore > 70 ? 'bg-red-50 border-red-200' :
                    result.riskScore > 40 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <h3 className="text-lg font-semibold mb-3">Overall Safety Assessment</h3>
                    <p className="text-gray-800 mb-4">
                      {result.riskScore > 70 ? 
                        "This conversation shows serious safety concerns. Your wellbeing is the priority - please consider ending contact." :
                      result.riskScore > 40 ?
                        "There are some concerning patterns in this conversation. Proceed with caution and maintain strong boundaries." :
                        "This conversation appears relatively safe, but always stay alert and trust your instincts."
                      }
                    </p>
                    {/* MODIFICATION START: Safely access summary with optional chaining */}
                    {result.consistencyAnalysis?.summary && (
                      <p className="text-sm text-gray-700 italic">
                        {result.consistencyAnalysis.summary}
                      </p>
                    )}
                    {/* MODIFICATION END */}
                  </div>

                  {/* Suggested Replies */}
                  {/* MODIFICATION START: Safely access suggestedReplies with optional chaining */}
                  {result.suggestedReplies?.length > 0 && (
                  // MODIFICATION END
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Suggested Safe Responses</h3>
                      <div className="space-y-3">
                        {result.suggestedReplies.map((reply) => (
                          <div key={reply.id} className="bg-white rounded-lg p-4 border">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {reply.tone} • {reply.safetyLevel}
                                </span>
                                <p className="text-sm text-gray-700 mt-1">{reply.context}</p>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-md p-3 mb-2">
                              <p className="text-sm italic">{reply.content}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">Purpose: {reply.purpose}</p>
                              <button 
                                onClick={() => copyToClipboard(reply.content)} 
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                COPY
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Safety Tips */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dating Safety Reminders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Before Meeting</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Video chat first to verify identity</li>
                          <li>• Google their name and reverse image search photos</li>
                          <li>• Tell a friend your plans and check in</li>
                          <li>• Meet in a public place</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-2">Red Lines Never to Cross</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                          <li>• Never send money or financial info</li>
                          <li>• Don&apos;t share intimate photos early</li>
                          <li>• Avoid giving your home address initially</li>
                          <li>• Don&apos;t ignore your gut feelings</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={() => window.print()} 
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Print Report
                    </button>
                    {user && result.riskScore < 70 && (
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Save Analysis
                      </button>
                    )}
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