'use client';

import { useState, useEffect } from 'react';
import { useEmployee } from '@/app/context/EmployeeContext';
import { FileText, Filter, Calendar, User, Tag, Search } from 'lucide-react';

interface AuditLog {
  id: number;
  staff_id: number | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  staff: {
    staff_id: number;
    username: string;
    role: string;
  } | null;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AuditLogsPage() {
  const { user } = useEmployee();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  // Filter states
  const [filters, setFilters] = useState({
    staff_id: '',
    entity_type: '',
    action_type: '',
    start_date: '',
    end_date: '',
  });

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // Only append non-empty filter values
      if (filters.staff_id && filters.staff_id.trim() !== '') {
        params.append('staff_id', filters.staff_id.trim());
      }
      if (filters.entity_type && filters.entity_type.trim() !== '') {
        params.append('entity_type', filters.entity_type.trim());
      }
      if (filters.action_type && filters.action_type.trim() !== '') {
        params.append('action_type', filters.action_type.trim());
      }
      if (filters.start_date && filters.start_date.trim() !== '') {
        params.append('start_date', filters.start_date.trim());
      }
      if (filters.end_date && filters.end_date.trim() !== '') {
        params.append('end_date', filters.end_date.trim());
      }
      params.append('limit', String(pagination.limit));
      params.append('offset', String(pagination.offset));

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to fetch audit logs');
      }

      const data: AuditLogsResponse = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'MANAGER') {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.offset, user?.role]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      staff_id: '',
      entity_type: '',
      action_type: '',
      start_date: '',
      end_date: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionTypeColor = (actionType: string) => {
    const colors: { [key: string]: string } = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      DEACTIVATE: 'bg-yellow-100 text-yellow-800',
      UPDATE_PASSWORD: 'bg-purple-100 text-purple-800',
      UPDATE_ROLE: 'bg-indigo-100 text-indigo-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const getEntityTypeColor = (entityType: string) => {
    const colors: { [key: string]: string } = {
      menu_item: 'bg-blue-50 text-blue-700',
      staff: 'bg-purple-50 text-purple-700',
      inventory: 'bg-green-50 text-green-700',
      non_food_inventory: 'bg-orange-50 text-orange-700',
      order: 'bg-yellow-50 text-yellow-700',
      user: 'bg-pink-50 text-pink-700',
    };
    return colors[entityType] || 'bg-gray-50 text-gray-700';
  };

  // Access control - check after all hooks
  if (user?.role !== 'MANAGER') {
    return (
      <div className="text-center text-red-600 max-w-md mx-auto mt-10">
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p>You must be a manager to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 animate-slide-in-down">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Audit Logs
        </h1>
        <p className="text-gray-600 mt-1">Track all staff actions and system changes.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-scale-in animate-stagger-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 button-press"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff ID
            </label>
            <input
              type="number"
              value={filters.staff_id}
              onChange={(e) => handleFilterChange('staff_id', e.target.value)}
              placeholder="Filter by staff ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="menu_item">Menu Item</option>
              <option value="staff">Staff</option>
              <option value="inventory">Inventory</option>
              <option value="non_food_inventory">Non-Food Inventory</option>
              <option value="order">Order</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="DEACTIVATE">Deactivate</option>
              <option value="UPDATE_PASSWORD">Update Password</option>
              <option value="UPDATE_ROLE">Update Role</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-scale-in animate-stagger-2">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p className="font-semibold">Error loading audit logs</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchAuditLogs}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 button-press"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold">No audit logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.staff ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{log.staff.username}</span>
                            <span className="text-gray-500">({log.staff.role})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(
                            log.action_type
                          )}`}
                        >
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityTypeColor(
                              log.entity_type
                            )}`}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {log.entity_type}
                          </span>
                          {log.entity_id && (
                            <span className="text-xs text-gray-500">ID: {log.entity_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        {log.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                  {pagination.total} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed button-press"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed button-press"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

