// src/app/dashboard/chat/new/page.tsx
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewChatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Create a new chat session
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, title: 'New Conversation' })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating new chat session:', error);
    // Redirect to a safe page if creation fails
    return redirect('/dashboard'); 
  }

  // Redirect to the new chat page
  redirect(`/dashboard/chat/${data.id}`);
}   
