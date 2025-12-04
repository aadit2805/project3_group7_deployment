'use client';

import { useState, useEffect } from 'react';
import { useEmployee } from '@/app/context/EmployeeContext';
import { Plus, Edit, Trash2, Calendar, Tag, DollarSign, Percent, X } from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';

interface PromotionalDiscount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  created_by_staff: {
    staff_id: number;
    username: string;
    role: string;
  } | null;
}

export default function PromotionsPage() {
  const { user } = useEmployee();
  const { addToast } = useToast();
  const [discounts, setDiscounts] = useState<PromotionalDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<PromotionalDiscount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discount_value: 0,
    min_order_amount: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    is_active: true,
    usage_limit: '',
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discounts');
      if (!response.ok) throw new Error('Failed to fetch discounts');
      const data = await response.json();
      setDiscounts(data.data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      addToast({ message: 'Failed to load discounts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'MANAGER') {
      fetchDiscounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleOpenModal = (discount?: PromotionalDiscount) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        name: discount.name,
        description: discount.description || '',
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        min_order_amount: discount.min_order_amount?.toString() || '',
        max_discount_amount: discount.max_discount_amount?.toString() || '',
        start_date: discount.start_date.split('T')[0],
        end_date: discount.end_date.split('T')[0],
        is_active: discount.is_active,
        usage_limit: discount.usage_limit?.toString() || '',
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        min_order_amount: '',
        max_discount_amount: '',
        start_date: '',
        end_date: '',
        is_active: true,
        usage_limit: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
      };

      if (formData.min_order_amount) {
        payload.min_order_amount = Number(formData.min_order_amount);
      }
      if (formData.max_discount_amount) {
        payload.max_discount_amount = Number(formData.max_discount_amount);
      }
      if (formData.usage_limit) {
        payload.usage_limit = Number(formData.usage_limit);
      }

      const url = editingDiscount ? `/api/discounts/${editingDiscount.id}` : '/api/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save discount');
      }

      addToast({
        message: editingDiscount ? 'Discount updated successfully' : 'Discount created successfully',
        type: 'success',
      });
      handleCloseModal();
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to save discount',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const response = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete discount');

      addToast({ message: 'Discount deleted successfully', type: 'success' });
      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      addToast({ message: 'Failed to delete discount', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDiscountValue = (discount: PromotionalDiscount) => {
    if (discount.discount_type === 'PERCENTAGE') {
      return `${discount.discount_value}%`;
    }
    return `$${discount.discount_value.toFixed(2)}`;
  };

  const getStatusBadge = (discount: PromotionalDiscount) => {
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = new Date(discount.end_date);

    if (!discount.is_active) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactive</span>;
    }

    if (now < startDate) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Upcoming</span>;
    }

    if (now > endDate) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Expired</span>;
    }

    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Limit Reached</span>;
    }

    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
  };

  // Access control - check after all hooks
  if (user?.role !== 'MANAGER') {
    return (
      <div className="text-center text-red-600 max-w-md mx-auto mt-10">
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p>You must be a manager to manage promotional discounts.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 animate-slide-in-down">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Tag className="h-8 w-8" />
              Promotional Discounts
            </h1>
            <p className="text-gray-600 mt-1">Manage promotional campaigns and discount codes.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 button-press transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Discount
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : discounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold text-gray-600">No discounts created yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first promotional discount to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-scale-in animate-stagger-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-blue-600">{discount.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{discount.name}</div>
                        {discount.description && (
                          <div className="text-sm text-gray-500">{discount.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {discount.discount_type === 'PERCENTAGE' ? (
                          <Percent className="h-4 w-4 text-green-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-semibold">{formatDiscountValue(discount)}</span>
                      </div>
                      {discount.min_order_amount && (
                        <div className="text-xs text-gray-500">Min: ${discount.min_order_amount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div>{formatDate(discount.start_date)}</div>
                          <div className="text-xs">to {formatDate(discount.end_date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {discount.usage_limit ? (
                        <span>
                          {discount.usage_count} / {discount.usage_limit}
                        </span>
                      ) : (
                        <span>{discount.usage_count} (unlimited)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(discount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(discount)}
                          className="text-blue-600 hover:text-blue-800 button-press"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
                          className="text-red-600 hover:text-red-800 button-press"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingDiscount ? 'Edit Discount' : 'Create Discount'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 button-press"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SUMMER20"
                    pattern="[A-Z0-9-]{3,50}"
                    title="3-50 alphanumeric characters and hyphens only"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Summer Sale"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description of the promotion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    required
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.discount_type === 'PERCENTAGE' ? 100 : undefined}
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.discount_type === 'PERCENTAGE' ? '20' : '5.00'}
                  />
                  <span className="text-xs text-gray-500">
                    {formData.discount_type === 'PERCENTAGE' ? 'Percentage (0-100)' : 'Amount in dollars'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {formData.discount_type === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Discount Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                  />
                  <span className="text-xs text-gray-500">Leave empty for unlimited</span>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 button-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 button-press"
                >
                  {editingDiscount ? 'Update' : 'Create'} Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

