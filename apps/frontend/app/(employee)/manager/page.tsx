'use client';

import { useState } from 'react';
import { useEmployee } from '@/app/context/EmployeeContext';
import AddMenuItemForm from './components/AddMenuItemForm';
import FilterableMenuItems from './components/FilterableMenuItems';
import ActiveOrdersList from './components/ActiveOrdersList';

export default function ManagerPage() {
  const { user } = useEmployee();
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'orders'>('orders');

  // Note: Access control is now handled by the EmployeeLayout,
  // but we can add a fallback for extra security or specific UI.
  if (user?.role !== 'MANAGER') {
    return (
      <div className="text-center text-red-600 max-w-md mx-auto mt-10">
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p>You must be a manager to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manager Controls</h1>
        <p className="text-gray-600 mt-1">Manage menu items and active orders.</p>
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
          <FilterableMenuItems />
        )}
      </div>
    </div>
  );
}
