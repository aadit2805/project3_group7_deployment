'use client';

import { useState } from 'react';

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
}

interface AddMenuItemFormProps {
  onSuccess?: () => void;
}

export default function AddMenuItemForm({ onSuccess }: AddMenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    upcharge: '0',
    is_available: true,
    item_type: 'entree',
    menu_item_id: '',
    stock: '0',
    reorder: false,
    storage: 'pantry',
    availability_start_time: '',
    availability_end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const payload: any = {
        name: formData.name.trim(),
        upcharge: parseFloat(formData.upcharge) || 0,
        is_available: formData.is_available,
        item_type: formData.item_type,
        stock: parseInt(formData.stock),
        reorder: formData.reorder,
        storage: formData.storage,
      };

      // Only include menu_item_id if provided
      if (formData.menu_item_id.trim()) {
        payload.menu_item_id = parseInt(formData.menu_item_id);
      }

      // Include time-based availability if provided
      if (formData.availability_start_time.trim()) {
        payload.availability_start_time = formData.availability_start_time;
      }
      if (formData.availability_end_time.trim()) {
        payload.availability_end_time = formData.availability_end_time;
      }

      const response = await fetch(`${backendUrl}/api/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create menu item');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        upcharge: '0',
        is_available: true,
        item_type: 'entree',
        menu_item_id: '',
        stock: '0',
        reorder: false,
        storage: 'pantry',
        availability_start_time: '',
        availability_end_time: '',
      });

      // Call onSuccess callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Menu Item</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Menu item created successfully! Redirecting to list...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Orange Chicken"
          />
        </div>

        <div>
          <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 mb-2">
            Item Type <span className="text-red-500">*</span>
          </label>
          <select
            id="item_type"
            required
            value={formData.item_type}
            onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="entree">Entree</option>
            <option value="side">Side</option>
            <option value="drink">Drink</option>
          </select>
        </div>

        <div>
          <label htmlFor="upcharge" className="block text-sm font-medium text-gray-700 mb-2">
            Upcharge ($)
          </label>
          <input
            type="number"
            id="upcharge"
            step="0.01"
            min="0"
            value={formData.upcharge}
            onChange={(e) => setFormData({ ...formData, upcharge: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          <p className="mt-1 text-sm text-gray-500">
            Additional cost for this item (leave as 0 if no upcharge)
          </p>
        </div>

        <div>
          <label htmlFor="menu_item_id" className="block text-sm font-medium text-gray-700 mb-2">
            Menu Item ID (Optional)
          </label>
          <input
            type="number"
            id="menu_item_id"
            value={formData.menu_item_id}
            onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Auto-generated if left empty"
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to auto-generate the next available ID
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
            Available for ordering
          </label>
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="stock"
            required
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 100"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="reorder"
            checked={formData.reorder}
            onChange={(e) => setFormData({ ...formData, reorder: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="reorder" className="ml-2 block text-sm text-gray-700">
            Reorder when low stock
          </label>
        </div>

        <div>
          <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-2">
            Storage Location <span className="text-red-500">*</span>
          </label>
          <select
            id="storage"
            required
            value={formData.storage}
            onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pantry">Pantry</option>
            <option value="fridge">Fridge</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Time-Based Availability</h3>
          <p className="text-sm text-gray-600 mb-4">
            Set specific times when this item should be available. Leave empty to always show when
            available.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="availability_start_time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Time
              </label>
              <input
                type="time"
                id="availability_start_time"
                value={formData.availability_start_time}
                onChange={(e) =>
                  setFormData({ ...formData, availability_start_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">When this item becomes available</p>
            </div>

            <div>
              <label
                htmlFor="availability_end_time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Time
              </label>
              <input
                type="time"
                id="availability_end_time"
                value={formData.availability_end_time}
                onChange={(e) =>
                  setFormData({ ...formData, availability_end_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">When this item stops being available</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 italic">
            Note: Both start and end times must be set together for time-based availability to work.
            Items will only appear when the current time is within the specified window.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Add Menu Item'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                upcharge: '0',
                is_available: true,
                item_type: 'entree',
                menu_item_id: '',
                stock: '0',
                reorder: false,
                storage: 'pantry',
                availability_start_time: '',
                availability_end_time: '',
              });
              setError(null);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

