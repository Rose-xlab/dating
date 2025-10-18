// src/components/AnalysisDetailClient.tsx

'use client';

import AnalysisDashboard from '@/components/AnalysisDashboard';
import { AnalysisResult } from '@/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface AnalysisDetailClientProps {
  analysis: AnalysisResult;
}

export default function AnalysisDetailClient({ analysis }: AnalysisDetailClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  
  if (!user) {
    // You can return a loader here as well if you'd like
    return null; 
  }

  return (
    <AnalysisDashboard
      result={analysis}
      user={user}
      onClose={() => router.push('/dashboard/history')}
    />
  );
}