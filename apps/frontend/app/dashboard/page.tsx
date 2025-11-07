'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/dist/client/link';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/user`, {
          credentials: 'include', // Important: include cookies for session
        });

        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
        // If error, redirect to login after a delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        alert('Failed to logout');
      }
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Error logging out');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/status`, {
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Auth Status:', data);
      alert(
        `Authenticated: ${data.authenticated}\nUser: ${data.user ? JSON.stringify(data.user, null, 2) : 'None'}`
      );
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <p className="text-sm mt-2">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>
        
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
          <p className="font-semibold">✓ Successfully Authenticated!</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">ID:</span> {user?.id}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user?.email || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Name:</span> {user?.name || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Role:</span> {user?.role || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          {user?.role === 'MANAGER' && (
            <a
              href="/manager"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Manager Dashboard
            </a>
          )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Check Auth Status
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-500 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

