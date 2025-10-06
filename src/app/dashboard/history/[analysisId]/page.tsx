// src/app/dashboard/history/[analysisId]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AnalysisDetailClient from '@/components/AnalysisDetailClient';

export default async function AnalysisDetailPage({ params }: { params: { analysisId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: dbResult } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('id', params.analysisId)
    .eq('user_id', user.id)
    .single();

  if (!dbResult) {
    notFound();
  }
  
  // --- START: NEW CODE ---
  // Transform the database data to match the component's expected props
  const formattedResult = {
    id: dbResult.id,
    createdAt: dbResult.created_at,
    chatContent: dbResult.chat_content, // Map snake_case to camelCase
    riskScore: dbResult.risk_score,
    trustScore: dbResult.trust_score,
    escalationIndex: dbResult.escalation_index,
    flags: dbResult.flags,
    timeline: dbResult.timeline,
    reciprocityScore: dbResult.reciprocity_score,
    consistencyAnalysis: dbResult.consistency_analysis,
    suggestedReplies: dbResult.suggested_replies,
    evidence: dbResult.evidence,
  };
  // --- END: NEW CODE ---
  
  // Pass the newly formatted object to the client component
  return <AnalysisDetailClient result={formattedResult} user={user} />;
}