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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Consistency Analysis</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStabilityColor(consistency.stabilityIndex)}`}>
          {consistency.stabilityIndex}% - {getStabilityLabel(consistency.stabilityIndex)}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-medium text-gray-700 mb-4">Factual Claims Detected</h4>
        <div className="space-y-3">
          {consistency.claims && consistency.claims.length > 0 ? (
            consistency.claims.map((claim) => (
              <div key={claim.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{getCategoryIcon(claim.category)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{claim.claim}</p>
                  {/* FIXED: Added a check to ensure claim.category exists */}
                  {claim.category && (
                    <p className="text-xs text-gray-500 mt-1">
                      {claim.category.charAt(0).toUpperCase() + claim.category.slice(1)}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No specific factual claims were detected by the AI.</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-4">
          {consistency.inconsistencies && consistency.inconsistencies.length > 0 ? '⚠️ Inconsistencies Found' : '✅ No Inconsistencies Detected'}
        </h4>
        {consistency.inconsistencies && consistency.inconsistencies.length > 0 ? (
          <div className="space-y-4">
            {consistency.inconsistencies.map((inconsistency) => (
              <div key={inconsistency.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start space-x-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-2">{inconsistency.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-medium text-red-700">Claim 1:</span>
                        <p className="text-sm text-red-800">{inconsistency.claim1.claim}</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-medium text-red-700">Claim 2:</span>
                        <p className="text-sm text-red-800">{inconsistency.claim2.claim}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              The AI found no contradictions in the factual claims made.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Means</h4>
        <p className="text-sm text-blue-800">
          {consistency.summary || "The AI could not generate a summary for this section."}
        </p>
      </div>
    </div>
  );
}