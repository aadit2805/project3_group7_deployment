'use client';

import Link from 'next/dist/client/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Tooltip from '@/app/components/Tooltip';

// Separate component that uses useSearchParams
function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    try {
      // Use relative path - Next.js will rewrite to backend URL
      window.location.href = '/auth/google';
    } catch (error) {
      console.error('Error redirecting to OAuth:', error);
      setError(
        'Failed to connect to authentication server. Please make sure the backend is running.'
      );
    }
  };

  const handleStaffLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming the backend returns a redirect URL or a token
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        } else {
          // Handle successful login, maybe redirect to a default staff dashboard
          router.push('/dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Staff login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Error during staff login:', err);
      setError('An unexpected error occurred during staff login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
        {error && (
          <div 
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" 
            role="alert"
            aria-live="assertive"
          >
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        <form onSubmit={handleStaffLogin} className="space-y-4 mb-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Staff Login'}
          </button>
        </form>

        <div className="relative flex justify-center text-sm mb-6">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Sign in with Google OAuth"
          >
            <Tooltip text="Sign in with Google" position="bottom">
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Tooltip>
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600">
            Click the button above to authenticate with Google OAuth
          </p>
        </div>
        <nav className="mt-6 text-center" aria-label="Back navigation">
          <Link 
            href="/" 
            className="text-blue-500 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Return to home page"
          >
            ← Back to Home
          </Link>
        </nav>
      </div>
    </main>
  );
}

// Main export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
          <div className="text-center">Loading...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}