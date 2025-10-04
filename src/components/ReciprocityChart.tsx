import React from 'react';
import { ReciprocityAnalysis } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ReciprocityChartProps {
  reciprocity: ReciprocityAnalysis;
}

export default function ReciprocityChart({ reciprocity }: ReciprocityChartProps) {
  const questionData = [
    { name: 'You', value: reciprocity.questionsAskedByUser, fill: '#f43f5e' },
    { name: 'Match', value: reciprocity.questionsAskedByMatch, fill: '#22c55e' },
  ];

  const infoData = [
    { name: 'You', value: reciprocity.personalInfoSharedByUser, fill: '#f43f5e' },
    { name: 'Match', value: reciprocity.personalInfoSharedByMatch, fill: '#22c55e' },
  ];

  const messageLengthData = [
    { 
      category: 'Average Message Length',
      You: reciprocity.averageMessageLengthUser,
      Match: reciprocity.averageMessageLengthMatch,
    },
  ];

  const getBalanceInterpretation = (score: number): { text: string; color: string } => {
    if (score >= 80) return { text: 'Well Balanced', color: 'text-green-600' };
    if (score >= 60) return { text: 'Mostly Balanced', color: 'text-teal-600' };
    if (score >= 40) return { text: 'Somewhat Unbalanced', color: 'text-yellow-600' };
    return { text: 'Very Unbalanced', color: 'text-red-600' };
  };

  const balance = getBalanceInterpretation(reciprocity.balanceScore);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversation Balance Analysis</h3>
      
      {/* Overall Balance Score */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 relative">
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">{reciprocity.balanceScore}%</div>
              <div className={`text-sm font-medium ${balance.color}`}>{balance.text}</div>
            </div>
          </div>
          <svg className="absolute inset-0 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="#22c55e"
              strokeWidth="12"
              strokeDasharray={`${(reciprocity.balanceScore / 100) * 364.42} 364.42`}
              className="transition-all duration-1000"
            />
          </svg>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Questions Asked */}
        <div className="text-center">
          <h4 className="font-medium text-gray-700 mb-3">Questions Asked</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={questionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {questionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-primary-600">You: {reciprocity.questionsAskedByUser}</span>
            {' / '}
            <span className="text-green-600">Match: {reciprocity.questionsAskedByMatch}</span>
          </div>
        </div>

        {/* Personal Info Shared */}
        <div className="text-center">
          <h4 className="font-medium text-gray-700 mb-3">Personal Info Shared</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={infoData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {infoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-primary-600">You: {reciprocity.personalInfoSharedByUser}</span>
            {' / '}
            <span className="text-green-600">Match: {reciprocity.personalInfoSharedByMatch}</span>
          </div>
        </div>

        {/* Message Length */}
        <div className="text-center">
          <h4 className="font-medium text-gray-700 mb-3">Message Length</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={messageLengthData}>
              <XAxis dataKey="category" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="You" fill="#f43f5e" />
              <Bar dataKey="Match" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-primary-600">You: {Math.round(reciprocity.averageMessageLengthUser)} chars</span>
            {' / '}
            <span className="text-green-600">Match: {Math.round(reciprocity.averageMessageLengthMatch)} chars</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Balance Insights</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          {reciprocity.questionsAskedByUser > reciprocity.questionsAskedByMatch * 2 && (
            <li>• You're asking significantly more questions - they might not be as engaged</li>
          )}
          {reciprocity.questionsAskedByMatch > reciprocity.questionsAskedByUser * 2 && (
            <li>• They're asking many questions - a positive sign of interest!</li>
          )}
          {reciprocity.averageMessageLengthUser > reciprocity.averageMessageLengthMatch * 2 && (
            <li>• Your messages are much longer - consider matching their communication style</li>
          )}
          {reciprocity.averageMessageLengthMatch > reciprocity.averageMessageLengthUser * 2 && (
            <li>• They're writing longer messages - they seem invested in the conversation</li>
          )}
          {reciprocity.balanceScore >= 80 && (
            <li>• Great balance! The conversation flows naturally between both parties</li>
          )}
        </ul>
      </div>
    </div>
  );
}