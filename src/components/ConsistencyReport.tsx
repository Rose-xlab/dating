import React from 'react';
import { ConsistencyAnalysis } from '@/types';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConsistencyReportProps {
  consistency: ConsistencyAnalysis;
}

export default function ConsistencyReport({ consistency }: ConsistencyReportProps) {
  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      location: '📍',
      job: '💼',
      personal: '👤',
      timeline: '⏰',
      identity: '🎭',
      lifestyle: '🏠',
      other: '📝',
    };
    return icons[category || 'other'] || '📝';
  };

  const getStabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStabilityLabel = (score: number) => {
    if (score >= 90) return 'Highly Consistent';
    if (score >= 70) return 'Mostly Consistent';
    return 'Inconsistent';
  };

  // Ensure consistency has default values
  const stabilityIndex = consistency?.stabilityIndex ?? 100;
  const claims = consistency?.claims || [];
  const inconsistencies = consistency?.inconsistencies || [];
  const suspiciousPatterns = consistency?.suspiciousPatterns || [];
  const summary = consistency?.summary || "";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Consistency Analysis</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStabilityColor(stabilityIndex)}`}>
          {stabilityIndex}% - {getStabilityLabel(stabilityIndex)}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-medium text-gray-700 mb-4">Factual Claims Detected</h4>
        <div className="space-y-3">
          {claims.length > 0 ? (
            claims.map((claim, index) => (
              <div key={claim?.id || `claim-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{getCategoryIcon(claim?.category)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{claim?.claim || 'No claim text available'}</p>
                  {claim?.category && (
                    <p className="text-xs text-gray-500 mt-1">
                      {claim.category.charAt(0).toUpperCase() + claim.category.slice(1).replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No specific factual claims were detected in this conversation.</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-4">
          {inconsistencies.length > 0 ? '⚠️ Inconsistencies Found' : '✅ No Inconsistencies Detected'}
        </h4>
        {inconsistencies.length > 0 ? (
          <div className="space-y-4">
            {inconsistencies.map((inconsistency, index) => {
              // Handle different possible data structures from the AI
              const description = inconsistency?.description || 'Inconsistency detected';
              
              // Extract claim text properly
              const getClaim1Text = () => {
                if (typeof inconsistency?.claim1 === 'string') {
                  return inconsistency.claim1;
                } else if (inconsistency?.claim1?.claim) {
                  return inconsistency.claim1.claim;
                }
                return 'First claim not available';
              };
              
              const getClaim2Text = () => {
                if (typeof inconsistency?.claim2 === 'string') {
                  return inconsistency.claim2;
                } else if (inconsistency?.claim2?.claim) {
                  return inconsistency.claim2.claim;
                }
                return 'Second claim not available';
              };
              
              const claim1Text = getClaim1Text();
              const claim2Text = getClaim2Text();
              
              return (
                <div key={inconsistency?.id || `inconsistency-${index}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start space-x-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 mb-2">{description}</p>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-xs font-medium text-red-700">Claim 1:</span>
                          <p className="text-sm text-red-800">{claim1Text}</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-xs font-medium text-red-700">Claim 2:</span>
                          <p className="text-sm text-red-800">{claim2Text}</p>
                        </div>
                      </div>
                      {inconsistency?.severity && (
                        <p className="text-xs text-red-600 mt-2">
                          Severity: {inconsistency.severity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              The conversation appears consistent with no contradictions detected.
            </p>
          </div>
        )}
      </div>

      {/* Suspicious Patterns Section */}
      {suspiciousPatterns.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">🔍 Suspicious Patterns</h4>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <ul className="space-y-2">
              {suspiciousPatterns.map((pattern, index) => (
                <li key={`pattern-${index}`} className="text-sm text-yellow-800 flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Evasions Section (if available) */}
      {consistency?.evasions && consistency.evasions.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">🚫 Questions Avoided</h4>
          <div className="space-y-2">
            {consistency.evasions.map((evasion, index) => (
              <div key={evasion?.id || `evasion-${index}`} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Q:</strong> {evasion?.question || 'Question not available'}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Response type: {evasion?.responseType || 'unknown'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Means</h4>
        <p className="text-sm text-blue-800">
          {summary || 
           (stabilityIndex >= 90 
             ? "The conversation shows high consistency. The person's statements align well throughout the conversation."
             : stabilityIndex >= 70
             ? "The conversation is mostly consistent with minor discrepancies that could be normal in casual conversation."
             : "There are concerning inconsistencies in this conversation. Be cautious and ask clarifying questions."
           )}
        </p>
      </div>
    </div>
  );
}