'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
}

interface MenuItemsListProps {
  filter: string | null;
}

export default function MenuItemsList({ filter }: MenuItemsListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/menu-items`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = (item: MenuItem) => {
    setEditingId(item.menu_item_id);
    // Convert time from HH:mm:ss to HH:mm format for time input
    const formatTimeForInput = (time: string | null | undefined) => {
      if (!time) return '';
      // If time is in HH:mm:ss format, convert to HH:mm
      return time.substring(0, 5);
    };
    setEditForm({
      name: item.name,
      upcharge: item.upcharge,
      is_available: item.is_available,
      item_type: item.item_type,
      availability_start_time: formatTimeForInput(item.availability_start_time),
      availability_end_time: formatTimeForInput(item.availability_end_time),
    });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/menu-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to update menu item');
      }

      setEditingId(null);
      setEditForm({});
      fetchMenuItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update menu item');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Helper function to format time for display
  const formatTime = (time: string | null | undefined) => {
    if (!time) return '';
    return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/menu-items/${item.menu_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_available: !item.is_available }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      fetchMenuItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update availability');
    }
  };

  const filteredMenuItems = filter
    ? menuItems.filter((item) => item.item_type === filter)
    : menuItems;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Menu Items</h2>
        <button
          onClick={fetchMenuItems}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No menu items found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upcharge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMenuItems.map((item) => (
                <tr key={item.menu_item_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.menu_item_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <select
                        value={editForm.item_type || ''}
                        onChange={(e) => setEditForm({ ...editForm, item_type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="entree">Entree</option>
                        <option value="side">Side</option>
                        <option value="drink">Drink</option>
                      </select>
                    ) : (
                      <span className="capitalize">{item.item_type}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.upcharge || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, upcharge: parseFloat(e.target.value) })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      `$${item.upcharge.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_available ?? false}
                        onChange={(e) =>
                          setEditForm({ ...editForm, is_available: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                    ) : (
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start:</label>
                          <input
                            type="time"
                            value={editForm.availability_start_time || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, availability_start_time: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End:</label>
                          <input
                            type="time"
                            value={editForm.availability_end_time || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, availability_end_time: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <button
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              availability_start_time: '',
                              availability_end_time: '',
                            })
                          }
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs">
                        {item.availability_start_time && item.availability_end_time ? (
                          <span>
                            {item.availability_start_time.substring(0, 5)} -{' '}
                            {item.availability_end_time.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No time restriction</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === item.menu_item_id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.menu_item_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

