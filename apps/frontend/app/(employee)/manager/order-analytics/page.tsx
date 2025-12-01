'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Tooltip from '@/app/components/Tooltip';
import { useToast } from '@/app/hooks/useToast';

interface CompletionTimeStats {
  date: string;
  average_completion_time_minutes: number;
  order_count: number;
  min_completion_time_minutes: number;
  max_completion_time_minutes: number;
}
interface HourlyCompletionTimeStats {
  hour: number;
  average_completion_time_minutes: number;
  order_count: number;
}
interface CompletionTimeSummary {
  overall_average_minutes: number;
  total_completed_orders: number;
  fastest_order_minutes: number;
  slowest_order_minutes: number;
  median_minutes: number;
}
interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}
export default function OrderAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<CompletionTimeStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyCompletionTimeStats[]>([]);
  const [summary, setSummary] = useState<CompletionTimeSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { addToast } = useToast();
  const fetchAllStats = useCallback(async (start?: string, end?: string) => {
    setLoadingStats(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      // Fetch all stats in parallel
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const [dailyRes, hourlyRes, summaryRes] = await Promise.all([
        fetch(`${backendUrl}/api/analytics/completion-time${queryString}`, {
          credentials: 'include',
        }),
        fetch(`${backendUrl}/api/analytics/completion-time/hourly${queryString}`, {
          credentials: 'include',
        }),
        fetch(`${backendUrl}/api/analytics/completion-time/summary${queryString}`, {
          credentials: 'include',
        }),
      ]);
      if (dailyRes.ok) {
        const dailyData = await dailyRes.json();
        if (dailyData.success) {
          setDailyStats(dailyData.data);
        } else {
          console.error('Daily stats error:', dailyData.error || dailyData.message);
        }
      } else {
        const errorData = await dailyRes.json().catch(() => ({}));
        console.error('Failed to fetch daily stats:', dailyRes.status, errorData);
      }
      if (hourlyRes.ok) {
        const hourlyData = await hourlyRes.json();
        if (hourlyData.success) {
          setHourlyStats(hourlyData.data);
        } else {
          console.error('Hourly stats error:', hourlyData.error || hourlyData.message);
        }
      } else {
        const errorData = await hourlyRes.json().catch(() => ({}));
        console.error('Failed to fetch hourly stats:', hourlyRes.status, errorData);
      }
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSummary(summaryData.data);
        } else {
          console.error('Summary stats error:', summaryData.error || summaryData.message);
        }
      } else {
        const errorData = await summaryRes.json().catch(() => ({}));
        console.error('Failed to fetch summary stats:', summaryRes.status, errorData);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      addToast({
        message: 'Failed to load analytics data',
        type: 'error',
      });
    } finally {
      setLoadingStats(false);
    }
  }, [addToast]);
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
    fetchAllStats();
  }, [router, fetchAllStats]);
  const handleDateFilter = () => {
    if (startDate && endDate) {
      fetchAllStats(startDate, endDate);
    } else {
      fetchAllStats();
    }
  };
  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchAllStats();
  };
  const formatMinutes = (minutes: number): string => {
    if (isNaN(minutes) || minutes === 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
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
        <div className="text-center text-red-600 max-w-md">
          <p className="text-xl font-semibold mb-2">{error}</p>
          <p className="text-sm mt-2">Redirecting to login...</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50 p-8 animate-fade-in">
      <div className="mb-4 animate-slide-in-down">
        <Link href="/manager">
          <button 
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 inline-flex items-center button-press transition-all duration-200 hover:shadow-md"
            aria-label="Back to Manager Dashboard"
          >
            <Tooltip text="Back to Manager Dashboard" position="bottom">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
            </Tooltip>
            Back to Manager Dashboard
          </button>
        </Link>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-scale-in animate-stagger-1">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 animate-slide-in-down">Order Completion Time Analytics</h1>
              <p className="text-gray-600 mt-1 animate-fade-in animate-stagger-1">Identify bottlenecks and optimize order processing</p>
            </div>
            <button
              onClick={() => fetchAllStats()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200 hover:shadow-lg button-press"
            >
              Refresh
            </button>
          </div>
        </div>
        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-scale-in animate-stagger-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Date Range Filter</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDateFilter}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Apply Filter
              </button>
              <button
                onClick={clearFilter}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        {/* Summary Cards */}
        {summary && summary.total_completed_orders > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6 animate-scale-in animate-stagger-1">
            <div className="bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Average</h3>
              <p className="text-2xl font-bold text-gray-800">{formatMinutes(summary.overall_average_minutes)}</p>
              <p className="text-xs text-gray-500 mt-1">Per order</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Completed Orders</h3>
              <p className="text-2xl font-bold text-gray-800">{summary.total_completed_orders}</p>
              <p className="text-xs text-gray-500 mt-1">Total orders</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Fastest Order</h3>
              <p className="text-2xl font-bold text-green-600">{formatMinutes(summary.fastest_order_minutes)}</p>
              <p className="text-xs text-gray-500 mt-1">Best time</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Slowest Order</h3>
              <p className="text-2xl font-bold text-red-600">{formatMinutes(summary.slowest_order_minutes)}</p>
              <p className="text-xs text-gray-500 mt-1">Worst time</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Median Time</h3>
              <p className="text-2xl font-bold text-gray-800">{formatMinutes(summary.median_minutes)}</p>
              <p className="text-xs text-gray-500 mt-1">50th percentile</p>
            </div>
          </div>
        ) : summary && summary.total_completed_orders === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Completed Orders Found</h3>
            <p className="text-yellow-700 text-sm mb-2">
              There are no completed orders in the selected date range.
            </p>
            <p className="text-yellow-700 text-sm font-medium">To see analytics:</p>
            <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside text-left max-w-md">
              <li>Mark orders as &quot;DONE&quot; in the Kitchen Monitor</li>
              <li>Ensure orders have been completed (status = &apos;completed&apos;)</li>
              <li>Try selecting a different date range</li>
            </ul>
          </div>
        ) : null}
        {/* Hourly Breakdown */}
        {hourlyStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Average Completion Time by Hour</h2>
            <p className="text-sm text-gray-600 mb-4">
              Identify peak bottleneck hours when orders take longer to complete
            </p>
            {loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Completion Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hourlyStats.map((stat) => {
                      const avgTime = summary?.overall_average_minutes || 0;
                      const isSlow = stat.average_completion_time_minutes > avgTime * 1.2;
                      const isFast = stat.average_completion_time_minutes < avgTime * 0.8;
                      return (
                        <tr key={stat.hour} className={isSlow ? 'bg-red-50' : isFast ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatHour(stat.hour)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMinutes(stat.average_completion_time_minutes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.order_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isSlow ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Bottleneck
                              </span>
                            ) : isFast ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Fast
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Daily Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Completion Time Breakdown</h2>
          {loadingStats ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          ) : dailyStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500 animate-fade-in">
              <p className="text-lg font-semibold mb-2">No completion time data found</p>
              <p className="text-sm">No completed orders found for the selected date range.</p>
              <p className="text-sm mt-2">To see analytics:</p>
              <ul className="text-sm mt-2 list-disc list-inside text-left max-w-md mx-auto">
                <li>Mark orders as &quot;DONE&quot; in the Kitchen Monitor</li>
                <li>Ensure orders have been completed (status = &apos;completed&apos;)</li>
                <li>Try selecting a different date range</li>
              </ul>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Completion Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fastest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slowest
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyStats.map((stat) => {
                    const avgTime = summary?.overall_average_minutes || 0;
                    const isSlow = stat.average_completion_time_minutes > avgTime * 1.2;
                    return (
                      <tr key={stat.date} className={isSlow ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(stat.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMinutes(stat.average_completion_time_minutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.order_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatMinutes(stat.min_completion_time_minutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatMinutes(stat.max_completion_time_minutes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
