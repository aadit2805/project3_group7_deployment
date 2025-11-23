'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const InventoryManager = () => {
  const [foodInventory, setFoodInventory] = useState([]);
  const [nonFoodInventory, setNonFoodInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isFood, setIsFood] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'food' | 'non-food'>('food');

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortColumn(column);

    const sortedFood = [...foodInventory].sort((a, b) => {
      if (a[column] < b[column]) return isAsc ? -1 : 1;
      if (a[column] > b[column]) return isAsc ? 1 : -1;
      return 0;
    });
    setFoodInventory(sortedFood);

    const sortedNonFood = [...nonFoodInventory].sort((a, b) => {
      if (a[column] < b[column]) return isAsc ? -1 : 1;
      if (a[column] > b[column]) return isAsc ? 1 : -1;
      return 0;
    });
    setNonFoodInventory(sortedNonFood);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const inventoryRes = await fetch('/api/inventory');
      const inventoryData = await inventoryRes.json();
      setFoodInventory(inventoryData.food);
      setNonFoodInventory(inventoryData.non_food);

                  const menuItemsRes = await fetch('/api/inventory/menu-items');
      const menuItemsData = await menuItemsRes.json();
      setMenuItems(menuItemsData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
    setLoading(false);
  };

  const openModal = (item: any, isFoodItem: boolean, isEditMode: boolean) => {
    console.log('Item passed to openModal:', item);
    setIsFood(isFoodItem);
    setIsEdit(isEditMode);
    setCurrentItem(item);
    console.log('currentItem after setting:', item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    let url = '';
    let method = isEdit ? 'PUT' : 'POST';
    let body: any = {};

    if (isFood) {
        url = isEdit
          ? `/api/inventory/${data.inventory_id}`
          : '/api/inventory'; // This case should not happen as food items are not added from here
        body = {
          is_food: true,
          stock: Number(data.stock),
          reorder: data.reorder === 'on',
          storage: data.storage,
        };
    } else {
      url = isEdit
        ? `/api/inventory/${data.supply_id}`
        : '/api/inventory';
      body = {
        is_food: false,
        stock: Number(data.stock),
        reorder: data.reorder === 'on',
      };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const errorData = await res.json();
        console.error('Failed to save item:', errorData.error || res.statusText);
        alert(`Failed to save item: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save item', error);
    }
  };



  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Manager</h1>
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Dashboard
          </button>
        </Link>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === 'food' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('food')}
        >
          Food Inventory
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === 'non-food' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('non-food')}
        >
          Non-Food Inventory
        </button>
      </div>

      {activeTab === 'food' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Food Inventory</h2>
            <div className="flex space-x-2">
              <Link href="/restock-report">
                <button className="bg-green-500 text-white px-4 py-2 rounded">
                  Generate Restock Report
                </button>
              </Link>
            </div>
          </div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('stock')}>Stock {sortColumn === 'stock' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="py-2">Storage</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {foodInventory.map((item: any) => (
                <tr key={item.inventory_id} className={item.stock < 20 ? 'bg-red-200' : ''}>
                  <td className="border px-4 py-2">{item.menu_items?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">{item.stock}</td>
                  <td className="border px-4 py-2">{item.storage}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => openModal(item, true, true)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'non-food' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Non-Food Inventory</h2>
            <button
              onClick={() => openModal(null, false, false)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Non-Food Item
            </button>
          </div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('stock')}>Stock {sortColumn === 'stock' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nonFoodInventory.map((item: any) => (
                <tr key={item.supply_id} className={item.stock < 20 ? 'bg-red-200' : ''}>
                  <td className="border px-4 py-2">{item.name}</td>
                  <td className="border px-4 py-2">{item.stock}</td>

                  <td className="border px-4 py-2">
                    <button
                      onClick={() => openModal(item, false, true)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                    <h3 className="text-lg font-bold mb-4">
                                      {isEdit ? (isFood ? 'Edit Food Stock' : 'Edit Non-Food Stock') : 'Add Non-Food Item'}
                                    </h3>
                                    <form onSubmit={handleFormSubmit}>
                                      {isEdit && isFood && (
                                        <input type="hidden" name="inventory_id" value={currentItem?.inventory_id} />
                                      )}
                                      {isEdit && !isFood && (
                                        <input type="hidden" name="supply_id" value={currentItem?.supply_id} />
                                      )}
                                      <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Stock</label>
                                        <input
                                          type="number"
                                          name="stock"
                                          defaultValue={currentItem?.stock}
                                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                      </div>
                        
                                      {isFood && (
                                        <div className="mb-4">
                                          <label className="block text-gray-700 text-sm font-bold mb-2">Storage</label>
                                          <select
                                            name="storage"
                                            defaultValue={currentItem?.storage}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                          >
                                            <option value="fridge">Fridge</option>
                                            <option value="pantry">Pantry</option>
                                          </select>
                                        </div>
                                      )}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
