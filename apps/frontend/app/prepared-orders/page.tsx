'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useToast } from '@/app/hooks/useToast';

interface PreparedOrder {
  order_id: number;
  customer_name: string;
  datetime: string;
  completed_at: string | null;
  order_status: string;
}

export default function PreparedOrdersPage() {
  const router = useRouter();
  const [preparedOrders, setPreparedOrders] = useState<PreparedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch prepared orders
  const fetchPreparedOrders = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders/prepared`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch prepared orders');
      }

      const data = await response.json();
      if (data.success) {
        setPreparedOrders(data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching prepared orders:', err);
      setError('Failed to load prepared orders');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Mark order as addressed
  const markOrderAddressed = async (orderId: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as addressed');
      }

      // Remove the order from the list
      setPreparedOrders((prev) => prev.filter((order) => order.order_id !== orderId));
    } catch (err) {
      console.error('Error marking order as addressed:', err);
      addToast({
        message: 'Failed to mark order as addressed',
        type: 'error',
      });
    }
   };
  
  // Fetch prepared orders on mount and poll for updates
  useEffect(() => {
    fetchPreparedOrders();
    // Poll for new prepared orders every 5 seconds
    const interval = setInterval(fetchPreparedOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchPreparedOrders]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prepared orders...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 mb-4">
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Prepared Orders</h1>
          <p className="text-gray-600">
            Orders marked as done in the Kitchen Monitor will appear here.
          </p>
        </div>

        {preparedOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-xl text-gray-500 mb-2">No prepared orders at this time.</p>
            <p className="text-sm text-gray-400">
              Orders marked as done in the Kitchen Monitor will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
            <div className="divide-y divide-gray-200">
              {preparedOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-lg text-gray-800">
                          Order #{order.order_id}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Customer: {order.customer_name}
                        </p>
                        {order.completed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {new Date(order.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => markOrderAddressed(order.order_id)}
                    className="ml-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    Mark as Addressed
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

