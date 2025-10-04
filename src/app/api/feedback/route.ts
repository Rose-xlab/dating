import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { analysisId, flagId, feedbackType, comment, userId } = await request.json();

    if (!analysisId || !flagId || !feedbackType) {
      return NextResponse.json(
        { error: 'Analysis ID, flag ID, and feedback type are required' },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validFeedbackTypes = ['false_positive', 'false_negative', 'helpful', 'not_helpful'] as const;
    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Save feedback
    const { data: feedback, error: saveError } = await supabase
      .from('feedback')
      .insert({
        analysis_id: analysisId,
        user_id: userId || null,
        flag_id: flagId,
        feedback_type: feedbackType,
        comment: comment || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving feedback:', saveError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      feedback,
      message: 'Thank you for your feedback! It helps us improve our analysis.' 
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get feedback for the analysis
    const { data: feedbackData, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Aggregate feedback by flag
    const feedbackByFlag = feedbackData.reduce((acc: any, fb: any) => {
      if (!acc[fb.flag_id]) {
        acc[fb.flag_id] = {
          false_positive: 0,
          false_negative: 0,
          helpful: 0,
          not_helpful: 0,
          comments: [],
        };
      }
      acc[fb.flag_id][fb.feedback_type]++;
      if (fb.comment) {
        acc[fb.flag_id].comments.push(fb.comment);
      }
      return acc;
    }, {});

    return NextResponse.json({ 
      feedback: feedbackData,
      aggregated: feedbackByFlag,
    });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}