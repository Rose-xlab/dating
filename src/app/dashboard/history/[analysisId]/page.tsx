// src/app/dashboard/history/[analysisId]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AnalysisDetailClient from '@/components/AnalysisDetailClient';

export default async function AnalysisDetailPage({ params }: { params: { analysisId: string } }) {
  const supabase = createClient();
  const { analysisId } = params;

  const { data: analysis, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error || !analysis) {
    notFound();
  }
  
  // Manually map snake_case from DB to camelCase for the component
  const formattedAnalysis = {
    id: analysis.id,
    createdAt: analysis.created_at,
    riskScore: analysis.risk_score,
    trustScore: analysis.trust_score,
    escalationIndex: analysis.escalation_index,
    chatContent: analysis.chat_content,
    flags: analysis.flags,
    timeline: analysis.timeline,
    reciprocityScore: analysis.reciprocity_score,
    consistencyAnalysis: analysis.consistency_analysis,
    suggestedReplies: analysis.suggested_replies,
    evidence: analysis.evidence,
    ocrMetadata: analysis.metadata
  };

  return <AnalysisDetailClient analysis={formattedAnalysis} />;
}