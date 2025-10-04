import React from 'react';
import { motion } from 'framer-motion';

interface ScoreIndicatorProps {
  label: string;
  score: number;
  type: 'risk' | 'trust' | 'escalation';
  description: string;
}

export default function ScoreIndicator({ label, score, type, description }: ScoreIndicatorProps) {
  const getColorClasses = () => {
    switch (type) {
      case 'risk':
        if (score >= 70) return 'text-red-600 bg-red-100 border-red-200';
        if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'trust':
        if (score >= 70) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 40) return 'text-teal-600 bg-teal-100 border-teal-200';
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'escalation':
        if (score >= 70) return 'text-purple-600 bg-purple-100 border-purple-200';
        if (score >= 40) return 'text-indigo-600 bg-indigo-100 border-indigo-200';
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'risk':
        if (score >= 70) return 'bg-red-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-yellow-500';
      case 'trust':
        if (score >= 70) return 'bg-green-500';
        if (score >= 40) return 'bg-teal-500';
        return 'bg-gray-400';
      case 'escalation':
        if (score >= 70) return 'bg-purple-500';
        if (score >= 40) return 'bg-indigo-500';
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const colorClasses = getColorClasses();
  const progressColor = getProgressColor();

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses}`}>
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <div className="mb-4">
        <div className="text-3xl font-bold">{score}%</div>
        <p className="text-sm opacity-75 mt-1">{description}</p>
      </div>
      <div className="relative h-3 bg-white rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute top-0 left-0 h-full ${progressColor}`}
        />
      </div>
      <div className="mt-3 text-sm">
        {type === 'risk' && (
          <>
            {score >= 70 && <span className="font-medium">⚠️ High Risk - Exercise extreme caution</span>}
            {score >= 40 && score < 70 && <span className="font-medium">⚠️ Moderate Risk - Be cautious</span>}
            {score < 40 && <span className="font-medium">✓ Low Risk - Normal caution advised</span>}
          </>
        )}
        {type === 'trust' && (
          <>
            {score >= 70 && <span className="font-medium">✨ High Trust - Many positive signals</span>}
            {score >= 40 && score < 70 && <span className="font-medium">✓ Moderate Trust - Some positive signs</span>}
            {score < 40 && <span className="font-medium">🤔 Low Trust - Few positive signals</span>}
          </>
        )}
        {type === 'escalation' && (
          <>
            {score >= 70 && <span className="font-medium">🚀 Very Fast - Unusually rapid progression</span>}
            {score >= 40 && score < 70 && <span className="font-medium">⏩ Fast - Quick progression</span>}
            {score < 40 && <span className="font-medium">🐌 Normal - Healthy pace</span>}
          </>
        )}
      </div>
    </div>
  );
}