'use client';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Redirect to the dashboard after successful sign-in
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign In to Swipe Safe</h2>
        {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>
        )}
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors">
            Sign In
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Do not have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}