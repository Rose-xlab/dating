//src\app\dashboard\history\page.tsx

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BarChart2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: analyses } = await supabase
    .from('analysis_results')
    .select('id, created_at, risk_score, trust_score')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Past Analyses</h1>
      {analyses && analyses.length > 0 ? (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Link 
              key={analysis.id}
              href={`/dashboard/history/${analysis.id}`}
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(analysis.created_at!), 'MMMM d, yyyy - h:mm a')}
                  </p>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="text-sm">
                      <span className="font-medium text-red-600">Risk:</span> {analysis.risk_score}%
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-green-600">Trust:</span> {analysis.trust_score}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-blue-600">
                  <span>View Report</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses yet</h3>
          <p className="mt-1 text-sm text-gray-500">Perform an analysis on the main dashboard to see your history here.</p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}