'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  rush_order?: boolean;
  order_notes?: string | null;
  meals: Meal[];
}

interface WeatherData {
  temperature: number;
  city: string;
  country: string;
  humidity: number;
  description: string;
}

export default function KitchenMonitor() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const router = useRouter();
  const previousOrderIdsRef = useRef<Set<number>>(new Set());

  const playBingSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.6, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (err) {
      console.debug('Could not play sound:', err);
    }
  }, []);

  // Fetch orders from the API
  const fetchOrders = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders/kitchen`, {
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
        const newOrders = data.data as KitchenOrder[];
        const currentOrderIds = new Set(newOrders.map(order => order.order_id));
        const previousOrderIds = previousOrderIdsRef.current;

        const hasNewOrders = newOrders.some(order => !previousOrderIds.has(order.order_id));

        if (previousOrderIds.size > 0 && hasNewOrders) {
          playBingSound();
        }

        previousOrderIdsRef.current = currentOrderIds;
        setOrders(newOrders);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [router, playBingSound]);

  // Mark order as done
  const markOrderDone = async (orderId: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
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

  // Getting the weather data
  const fetchWeather = useCallback(async (city: string = 'College Station') => {
    try {
      setWeatherLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/weather/current?city=${encodeURIComponent(city)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.weather) {
          setWeather({
            temperature: data.weather.temperature,
            city: data.weather.city,
            country: data.weather.country,
            humidity: data.weather.humidity,
            description: data.weather.description,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Poll for new orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

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
      {/* Weather Dropdown - Top of Page */}
      <div className="mb-4 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setIsWeatherDropdownOpen(!isWeatherDropdownOpen)}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors duration-200"
            disabled={weatherLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span className="text-sm">Weather</span>
            <svg className={`w-4 h-4 transition-transform duration-200 ${isWeatherDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isWeatherDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsWeatherDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                <div className="p-3">
                  {weatherLoading ? (
                    <div className="text-sm text-gray-600 text-center py-2">Loading temperature...</div>
                  ) : weather ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{Math.round(weather.temperature)}°C</div>
                      <div className="text-sm font-medium text-gray-700 mt-1 capitalize">{weather.description}</div>
                      <div className="text-sm text-gray-600 mt-1">Humidity: {weather.humidity}%</div>
                      <div className="text-xs text-gray-500 mt-1">{weather.city}, {weather.country}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 text-center py-2">Weather data unavailable</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Dashboard
          </button>
        </Link>
        <Link href="/inventory-manager">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Inventory Manager
          </button>
        </Link>
      </div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-800">Kitchen Monitor</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {isCompactView ? 'Compact' : 'Expanded'} View
            </span>
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
            >
              {isCompactView ? 'Switch to Expanded' : 'Switch to Compact'}
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Active Orders: {orders.length}
        </p>
      </div>

      {/* Orders Grid */}
      <div className={`grid gap-4 ${isCompactView ? 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-2xl text-gray-500">No active orders</p>
            <p className="text-gray-400 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className={`bg-white rounded-lg shadow-md border-2 border-gray-300 flex flex-col h-full ${isCompactView ? 'text-xs' : ''}`}
            >
              {/* Order Header */}
              <div className={`text-white ${isCompactView ? 'p-2' : 'p-3'} rounded-t-lg ${order.rush_order ? 'bg-red-600' : 'bg-gray-800'}`}>
                <h2 className={`font-bold ${isCompactView ? 'text-sm' : 'text-lg'}`}>Order #{order.order_id}</h2>
                {order.rush_order && (
                  <p className={`${isCompactView ? 'text-sm' : 'text-lg'} font-bold text-yellow-300 ${isCompactView ? 'mb-0' : 'mb-1'}`}>RUSH ORDER</p>
                )}
                {!isCompactView && (
                  <>
                    <p className="text-sm text-gray-300">{order.customer_name}</p>
                    {order.staff_username && (
                      <p className="text-xs text-gray-400">by {order.staff_username}</p>
                    )}
                  </>
                )}
              </div>

              {/* Order Notes */}
              {order.order_notes && (
                <div className={`bg-yellow-50 border-l-4 border-yellow-400 ${isCompactView ? 'p-2 mx-2 mt-2' : 'p-3 mx-3 mt-3'} rounded`}>
                  <p className={`${isCompactView ? 'text-xs' : 'text-xs'} font-semibold text-yellow-800 ${isCompactView ? 'mb-0.5' : 'mb-1'}`}>ORDER NOTES:</p>
                  <p className={`${isCompactView ? 'text-xs' : 'text-sm'} text-yellow-900 whitespace-pre-wrap`}>{order.order_notes}</p>
                </div>
              )}

              {/* Order Items */}
              <div className={`flex-1 ${isCompactView ? 'p-2 space-y-1.5' : 'p-4 space-y-3'} overflow-y-auto`}>
                {order.meals.map((meal, mealIdx) => (
                  <div key={meal.meal_id} className={`border-b ${isCompactView ? 'pb-1' : 'pb-2'} last:border-b-0`}>
                    <p className={`font-semibold ${isCompactView ? 'text-xs' : 'text-sm'} text-gray-700 ${isCompactView ? 'mb-0.5' : 'mb-1'}`}>
                      {mealIdx + 1}. {meal.meal_type_name}
                    </p>
                    <ul className={`${isCompactView ? 'ml-2 space-y-0.5' : 'ml-3 space-y-1'}`}>
                      {meal.items.map((item, itemIdx) => (
                        <li key={itemIdx} className={`${isCompactView ? 'text-xs' : 'text-sm'} text-gray-600 flex items-start`}>
                          <span className="mr-2">•</span>
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Done Button */}
              <div className={isCompactView ? 'p-2' : 'p-3'}>
                {isCompactView ? (
                  <button
                    onClick={() => markOrderDone(order.order_id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-2 rounded transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                    title="Mark as done"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => markOrderDone(order.order_id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    DONE
                  </button>
                )}
              </div>

              {/* Staff/Time Footer */}
              {!isCompactView && (
                <div className="bg-gray-100 px-3 py-2 rounded-b-lg text-xs text-gray-600 text-center">
                  {new Date(order.datetime).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>


    </div>
  );
}
