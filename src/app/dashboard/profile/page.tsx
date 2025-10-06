'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, username: username, updated_at: new Date() })
      .eq('id', user!.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <p className="text-lg text-gray-500 mt-1">{user?.email}</p>
          </div>

          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={profile?.full_name || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={profile?.username || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Subscription</label>
            <p className="text-lg text-gray-800 mt-1 capitalize">{profile?.subscription}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Analyses Performed</label>
            <p className="text-lg text-gray-800 mt-1">{profile?.analysis_count}</p>
          </div>

          <div className="pt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}