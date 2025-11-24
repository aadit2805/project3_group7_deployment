'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Separate component that uses client-side hooks
function RewardsLoginContent() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleAuth = async (isRegister: boolean) => {
    setError(null);
    if (!emailOrPhone || !password) {
      setError('Please enter both email/phone and password.');
      return;
    }

    try {
      const endpoint = isRegister ? '/api/customer/auth/register' : '/api/customer/auth/login';
      const body = isRegister ? { email: emailOrPhone, phone_number: emailOrPhone, password } : { emailOrPhone, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerId', data.customer.id);
      
      // Optionally store customer's email/phone if desired for display
      if (data.customer.email) localStorage.setItem('customerEmail', data.customer.email);
      if (data.customer.phone_number) localStorage.setItem('customerPhone', data.customer.phone_number);

      router.push('/customer-kiosk'); // Redirect to customer kiosk after login/register
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleGuestContinue = () => {
    // Clear any previous customer session data if any
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerPhone');
    router.push('/customer-kiosk'); // Redirect to customer kiosk as guest
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="z-10 max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Customer Rewards</h1>
        <h2 className="text-xl text-center mb-6">{isRegistering ? 'Register' : 'Sign In'}</h2>

        {error && (
          <div
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
            role="alert"
            aria-live="assertive"
          >
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700">
              Email or Phone Number
            </label>
            <input
              type="text"
              id="emailOrPhone"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleAuth(isRegistering)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
            <button
              onClick={handleGuestContinue}
              className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Continue as Guest
            </button>
          </div>
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
export default function RewardsLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
          <div className="text-center">Loading...</div>
        </main>
      }
    >
      <RewardsLoginContent />
    </Suspense>
  );
}