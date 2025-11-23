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
        localStorage.removeItem('authToken');
        router.push('/login');
      } else {
        alert('Failed to logout');
      }
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Error logging out');
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
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Employee Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {user?.name || user?.email || 'Employee'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Cashier Interface */}
          {(user?.role === 'MANAGER' || user?.role === 'CASHIER') && (
            <Link href="/cashier-interface" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-1">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Cashier Interface
              </h2>
              <p className="text-gray-500">
                Process customer orders.
              </p>
            </Link>
          )}

          {/* Manager Dashboard */}
          {user?.role === 'MANAGER' && (
            <Link href="/manager" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-2">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Manager Dashboard
              </h2>
              <p className="text-gray-500">
                Manage menu items and view active orders.
              </p>
            </Link>
          )}

          {/* Kitchen Monitor */}
          {(user?.role === 'MANAGER' || user?.role === 'KITCHEN') && (
            <Link href="/kitchen-monitor" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-3">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Kitchen Monitor
              </h2>
              <p className="text-gray-500">
                View and manage incoming orders for the kitchen.
              </p>
            </Link>
          )}

          {/* Inventory Manager */}
          {user?.role === 'MANAGER' && (
            <Link href="/inventory-manager" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-4">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Inventory Manager
              </h2>
              <p className="text-gray-500">
                Manage food and non-food inventory.
              </p>
            </Link>
          )}

          {/* Restock Report */}
          {user?.role === 'MANAGER' && (
            <Link href="/restock-report" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-1">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Restock Report
              </h2>
              <p className="text-gray-500">
                Generate a report of items that need to be restocked.
              </p>
            </Link>
          )}

          {/* Revenue Reports */}
          {user?.role === 'MANAGER' && (
            <Link href="/manager/revenue-reports" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Revenue Reports
              </h2>
              <p className="text-gray-500">
                View daily revenue reports and track performance metrics.
              </p>
            </Link>
          )}

          {/* Order Analytics */}
          {user?.role === 'MANAGER' && (
            <Link href="/manager/order-analytics" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Order Analytics
              </h2>
              <p className="text-gray-500">
                View average order completion times and identify bottlenecks.
              </p>
            </Link>
          )}

          {/* Best-Selling Items */}
          {user?.role === 'MANAGER' && (
            <Link href="/manager/best-selling" className="block rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                Best-Selling Items
              </h2>
              <p className="text-gray-500">
                See which items sell best and plan promotions.
              </p>
            </Link>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-500 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
