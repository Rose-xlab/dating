import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { analysisId, title, notes } = await request.json();

    if (!analysisId || !title) {
      return NextResponse.json(
        { error: 'Analysis ID and title are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has premium subscription
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription')
      .eq('id', user.id)
      .single();

    if (userError || userData?.subscription !== 'premium') {
      return NextResponse.json(
        { error: 'Premium subscription required to save analyses' },
        { status: 403 }
      );
    }

    // Save the analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('saved_analyses')
      .insert({
        user_id: user.id,
        analysis_id: analysisId,
        title,
        notes: notes || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedAnalysis });
  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's saved analyses
    const { data: savedAnalyses, error: fetchError } = await supabase
      .from('saved_analyses')
      .select(`
        *,
        analysis_results (
          id,
          created_at,
          risk_score,
          trust_score,
          escalation_index,
          chat_content
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching saved analyses:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch saved analyses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedAnalyses });
  } catch (error) {
    console.error('Fetch saved analyses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved analyses' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the saved analysis
    const { error: deleteError } = await supabase
      .from('saved_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting saved analysis:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete saved analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved analysis' },
      { status: 500 }
    );
  }
}