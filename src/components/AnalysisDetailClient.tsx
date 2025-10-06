// src/components/AnalysisDetailClient.tsx

"use client";

import { useRouter } from 'next/navigation';
import AnalysisDashboard from '@/components/AnalysisDashboard';

// Define types for the props for better code quality
interface AnalysisDetailClientProps {
  result: any; // Ideally, replace 'any' with a more specific type for your analysis result
  user: any;   // Replace 'any' with your User type
}

export default function AnalysisDetailClient({ result, user }: AnalysisDetailClientProps) {
  const router = useRouter();
  
  // The onClose function now correctly uses the router instance
  return <AnalysisDashboard result={result} user={user} onClose={() => router.back()} />;
}