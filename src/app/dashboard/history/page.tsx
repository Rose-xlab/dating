'use client';
import { createClient } from '@/lib/supabase/client';
import { AnalysisResult } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalyses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load analysis history.');
      } else {
        const formattedData = data.map(item => ({
          ...item,
          riskScore: item.risk_score,
          trustScore: item.trust_score,
          escalationIndex: item.escalation_index,
          createdAt: item.created_at,
        })) as AnalysisResult[];
        setAnalyses(formattedData);
      }
      setLoading(false);
    };

    fetchAnalyses();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Analysis History</h1>
      {analyses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <h3 className="text-xl font-medium text-gray-800">No analyses yet!</h3>
          <p className="text-gray-500 mt-2">
            Start a new chat and analyze a conversation to see your history here.
          </p>
          <Link href="/dashboard/chat/new" className="mt-4 inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
            Start New Chat
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border">
          <ul className="divide-y divide-gray-200">
            {analyses.map(analysis => (
              <li key={analysis.id}>
                <Link href={`/dashboard/history/${analysis.id}`} className="block hover:bg-gray-50 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate">
                        Analysis ID: {analysis.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(analysis.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-red-600">Risk</p>
                        <p className="text-lg font-bold text-red-600">{analysis.riskScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-600">Trust</p>
                        <p className="text-lg font-bold text-green-600">{analysis.trustScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-purple-600">Escalation</p>
                        <p className="text-lg font-bold text-purple-600">{analysis.escalationIndex}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}