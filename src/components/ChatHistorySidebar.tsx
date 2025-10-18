'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlusIcon, TrashIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SignOutButton from './SignOutButton';
import { User } from '@supabase/supabase-js';

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export default function ChatHistorySidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Could not fetch chat history.');
        console.error(error);
      } else {
        setSessions(data || []);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [supabase]);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const originalSessions = sessions;
    setSessions(sessions.filter(s => s.id !== sessionId)); // Optimistic update

    const { error } = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (error) {
      toast.error('Failed to delete session.');
      setSessions(originalSessions); // Revert on error
    } else {
      toast.success('Chat deleted.');
      // If the active chat is the one being deleted, redirect
      if (pathname.includes(sessionId)) {
        router.push('/dashboard/chat/new');
      }
    }
  };

  const handleNewChat = () => {
    router.push('/dashboard/chat/new');
  };

  return (
    <div className="bg-gray-50 border-r border-gray-200 h-full flex flex-col w-64">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-md hover:bg-gray-200 transition-colors"
          title="New Chat"
        >
          <PlusIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No past chats found.
          </div>
        ) : (
          <ul className="py-2">
            {sessions.map(session => (
              <li key={session.id}>
                <Link
                  href={`/dashboard/chat/${session.id}`}
                  className={`group flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    pathname.includes(session.id)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center overflow-hidden">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate" title={session.title}>
                      {session.title || 'Untitled Chat'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-1 rounded-md hover:bg-red-100 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Chat"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/profile" className="flex-1 flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 p-2 rounded-md hover:bg-gray-200">
              <UserIcon className="w-5 h-5" />
              <span className="truncate">{user.email}</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}