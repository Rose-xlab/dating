"use client";
import { useRouter } from 'next/navigation';

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    if (response.ok) {
      router.push('/login');
    } else {
      // Handle error
      console.error('Failed to sign out');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;