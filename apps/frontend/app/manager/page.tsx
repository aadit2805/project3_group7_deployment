'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddMenuItemForm from './components/AddMenuItemForm';
import MenuItemsList from './components/MenuItemsList';
import ActiveOrdersList from './components/ActiveOrdersList';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'orders'>('orders');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/user`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        
        // Check if user is a manager
        if (userData.role !== 'MANAGER') {
          setError('Access denied. Manager role required.');
          return;
        }

        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

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
        <div className="text-center text-red-600 max-w-md">
          <p className="text-xl font-semibold mb-2">{error}</p>
          <p className="text-sm mt-2">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Dashboard
          </button>
        </Link>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.name || user?.email || 'Manager'}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <a
                href="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                User Dashboard
              </a>
              <a
                href="/kitchen-monitor"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold"
              >
                Kitchen Monitor
              </a>
              <button
                onClick={async () => {
                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                  await fetch(`${backendUrl}/api/logout`, {
                    method: 'POST',
                    credentials: 'include',
                  });
                  router.push('/login');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                Active Orders
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                Add Menu Item
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                Manage Menu Items
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'orders' ? (
            <ActiveOrdersList />
          ) : activeTab === 'add' ? (
            <AddMenuItemForm onSuccess={() => setActiveTab('list')} />
          ) : (
            <MenuItemsList />
          )}
        </div>
      </div>
    </main>
  );
}
