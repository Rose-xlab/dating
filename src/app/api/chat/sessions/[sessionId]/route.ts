//src\app\api\chat\sessions\[sessionId]\route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createClient();
  const { sessionId } = params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // We need to delete from three tables in the correct order to respect foreign key constraints.
  try {
    // 1. Delete from chat_history
    const { error: historyError } = await supabase
      .from('chat_history')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (historyError) throw historyError;
    
    // 2. We are assuming analysis_results are not deleted when a chat is deleted for now.
    // If you wanted to delete them, you would fetch the session's analysis_ids
    // and then issue a delete command on analysis_results.

    // 3. Delete the chat_session itself
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);
      
    if (sessionError) throw sessionError;

    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({ error: 'Failed to delete session', details: error.message }, { status: 500 });
  }
}
