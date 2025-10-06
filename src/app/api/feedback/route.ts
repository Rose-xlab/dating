import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use the new server client

export async function POST(request: NextRequest) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 'userId' is no longer needed from the body
    const { analysisId, flagId, feedbackType, comment } = await request.json();

    if (!analysisId || !flagId || !feedbackType) {
      return NextResponse.json({ error: 'Analysis ID, flag ID, and feedback type are required' }, { status: 400 });
    }

    const { data: feedback, error: saveError } = await supabase
      .from('feedback')
      .insert({
        analysis_id: analysisId,
        user_id: user.id, // Use the secure user ID
        flag_id: flagId,
        feedback_type: feedbackType,
        comment: comment || null,
      })
      .select().single();

    if (saveError) throw saveError;

    return NextResponse.json({ 
      success: true, 
      feedback,
      message: 'Thank you for your feedback!' 
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

// The GET function for feedback is fine, as it doesn't rely on user identity
// for this specific implementation, but could be secured if needed.