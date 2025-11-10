'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  name: string;
  role: string;
}

interface Meal {
  meal_id: number;
  meal_type_name: string;
  items: OrderItem[];
}

interface KitchenOrder {
  order_id: number;
  customer_name: string;
  datetime: string;
  order_status: string;
  staff_username: string | null;
  meals: Meal[];
}

export default function KitchenMonitor() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch orders from the API
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders/kitchen', {
        credentials: 'include',
      });

      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Mark order as done
  const markOrderDone = async (orderId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders after marking as done
      fetchOrders();
    } catch (err) {
      console.error('Error marking order as done:', err);
      alert('Failed to mark order as done');
    }
  };

  // Poll for new orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Dashboard
          </button>
        </Link>
      </div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Kitchen Monitor</h1>
        <p className="text-gray-600">
          Active Orders: {orders.length}
        </p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-2xl text-gray-500">No active orders</p>
            <p className="text-gray-400 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className="bg-white rounded-lg shadow-md border-2 border-gray-300 flex flex-col h-full"
            >
              {/* Order Header */}
              <div className="bg-gray-800 text-white p-3 rounded-t-lg">
                <h2 className="font-bold text-lg">Order #{order.order_id}</h2>
                <p className="text-sm text-gray-300">{order.customer_name}</p>
                {order.staff_username && (
                  <p className="text-xs text-gray-400">by {order.staff_username}</p>
                )}
              </div>

              {/* Order Items */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {order.meals.map((meal, mealIdx) => (
                  <div key={meal.meal_id} className="border-b pb-2 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-700 mb-1">
                      {mealIdx + 1}. {meal.meal_type_name}
                    </p>
                    <ul className="ml-3 space-y-1">
                      {meal.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Done Button */}
              <div className="p-3">
                <button
                  onClick={() => markOrderDone(order.order_id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  DONE
                </button>
              </div>

              {/* Staff/Time Footer */}
              <div className="bg-gray-100 px-3 py-2 rounded-b-lg text-xs text-gray-600 text-center">
                {new Date(order.datetime).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>


    </div>
  );
}
