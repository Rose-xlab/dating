import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use the new server client

export async function POST(request: NextRequest) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId, title, notes } = await request.json();
    if (!analysisId || !title) {
      return NextResponse.json({ error: 'Analysis ID and title are required' }, { status: 400 });
    }

    // Check if user has premium subscription (using 'profiles' table)
    const { data: profile } = await supabase.from('profiles').select('subscription').eq('id', user.id).single();
    if (profile?.subscription !== 'premium') {
      return NextResponse.json({ error: 'Premium subscription required to save analyses' }, { status: 403 });
    }

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('saved_analyses')
      .insert({ user_id: user.id, analysis_id: analysisId, title, notes: notes || null })
      .select().single();

    if (saveError) throw saveError;
    return NextResponse.json({ savedAnalysis });
  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedAnalyses, error: fetchError } = await supabase
      .from('saved_analyses')
      .select(`*, analysis_results (id, created_at, risk_score, trust_score, chat_content)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    return NextResponse.json({ savedAnalyses });
  } catch (error) {
    console.error('Fetch saved analyses error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved analyses' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    const supabase = createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
        }

        const { error: deleteError } = await supabase
            .from('saved_analyses')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // RLS also enforces this, but it's good practice

        if (deleteError) throw deleteError;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete saved analysis error:', error);
        return NextResponse.json({ error: 'Failed to delete saved analysis' }, { status: 500 });
    }
}