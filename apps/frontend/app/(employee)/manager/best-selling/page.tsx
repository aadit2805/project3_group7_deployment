'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BestSellingItem {
  menu_item_id: number;
  name: string;
  item_type: string;
  total_quantity_sold: number;
  total_revenue: number;
  average_price: number;
  upcharge: number;
  role: string;
}

interface SalesByCategory {
  category: string;
  total_quantity_sold: number;
  total_revenue: number;
  item_count: number;
}

interface SalesSummary {
  total_items_sold: number;
  total_quantity_sold: number;
  total_revenue: number;
  average_item_price: number;
}

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

export default function BestSellingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestSellingItems, setBestSellingItems] = useState<BestSellingItem[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('');

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
  }, [router]);

  const fetchAllStats = async (start?: string, end?: string, itemType?: string) => {
    setLoadingStats(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      if (itemType) params.append('item_type', itemType);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const [bestSellingRes, categoryRes, summaryRes] = await Promise.all([
        fetch(`${backendUrl}/api/analytics/best-selling${queryString}`, {
          credentials: 'include',
        }),
        fetch(`${backendUrl}/api/analytics/sales-by-category${queryString}`, {
          credentials: 'include',
        }),
        fetch(`${backendUrl}/api/analytics/sales-summary${queryString}`, {
          credentials: 'include',
        }),
      ]);

      if (bestSellingRes.ok) {
        const data = await bestSellingRes.json();
        if (data.success) {
          setBestSellingItems(data.data);
        }
      }

      if (categoryRes.ok) {
        const data = await categoryRes.json();
        if (data.success) {
          setSalesByCategory(data.data);
        }
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        if (data.success) {
          setSummary(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      alert('Failed to load sales analytics');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDateFilter = () => {
    fetchAllStats(startDate, endDate, itemTypeFilter || undefined);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setItemTypeFilter('');
    fetchAllStats();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-4">
        <Link href="/manager">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Manager Dashboard
          </button>
        </Link>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Best-Selling Items</h1>
              <p className="text-gray-600 mt-1">Identify top performers and plan promotions</p>
            </div>
            <button
              onClick={() => fetchAllStats()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
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
            <div className="flex-1">
              <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 mb-2">
                Item Type (Optional)
              </label>
              <select
                id="item_type"
                value={itemTypeFilter}
                onChange={(e) => setItemTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="entree">Entree</option>
                <option value="side">Side</option>
                <option value="drink">Drink</option>
              </select>
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
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Items Sold</h3>
              <p className="text-2xl font-bold text-gray-800">{summary.total_quantity_sold}</p>
              <p className="text-xs text-gray-500 mt-1">Individual items</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Unique Items</h3>
              <p className="text-2xl font-bold text-gray-800">{summary.total_items_sold}</p>
              <p className="text-xs text-gray-500 mt-1">Different items</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total_revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">From item sales</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Item Price</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.average_item_price)}</p>
              <p className="text-xs text-gray-500 mt-1">Per item</p>
            </div>
          </div>
        )}

        {/* Sales by Category */}
        {salesByCategory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesByCategory.map((category) => (
                <div
                  key={category.category}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {capitalize(category.category)}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-1">
                    {category.total_quantity_sold}
                  </p>
                  <p className="text-sm text-gray-600">items sold</p>
                  <p className="text-lg font-semibold text-gray-700 mt-2">
                    {formatCurrency(category.total_revenue)}
                  </p>
                  <p className="text-xs text-gray-500">revenue</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {category.item_count} different items
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best-Selling Items Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Best-Selling Items</h2>
          {loadingStats ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sales data...</p>
            </div>
          ) : bestSellingItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No sales data found for the selected date range.</p>
              <p className="text-sm mt-2">Complete some orders to see analytics.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bestSellingItems.map((item, index) => {
                    const avgQuantity =
                      bestSellingItems.reduce((sum, i) => sum + i.total_quantity_sold, 0) /
                      bestSellingItems.length;
                    const isTopPerformer = item.total_quantity_sold > avgQuantity * 1.5;
                    const isLowPerformer = item.total_quantity_sold < avgQuantity * 0.5;
                    return (
                      <tr
                        key={item.menu_item_id}
                        className={
                          isTopPerformer
                            ? 'bg-green-50 hover:bg-green-100'
                            : isLowPerformer
                              ? 'bg-yellow-50 hover:bg-yellow-100'
                              : 'hover:bg-gray-50'
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              index < 3
                                ? 'bg-yellow-400 text-yellow-900 font-bold'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{item.item_type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {item.total_quantity_sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.average_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isTopPerformer ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Top Seller
                            </span>
                          ) : isLowPerformer ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              Low Sales
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
      </div>
    </main>
  );
}
