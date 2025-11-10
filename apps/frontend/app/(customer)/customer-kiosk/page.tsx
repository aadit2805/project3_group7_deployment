'use client';

import React, { useState, useEffect, useContext, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
}

interface MealType {
  meal_type_id: number;
  meal_type_name: string;
  meal_type_price: number;
  entree_count: number;
  side_count: number;
  drink_size: string;
}

const CustomerKioskContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);

  if (!context) {
    throw new Error('CustomerKiosk must be used within an OrderProvider');
  }

  const { order, setOrder } = context;

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | undefined>(undefined);

  useEffect(() => {
    if (!mealTypeId) {
      router.push('/meal-type-selection');
    }
  }, [mealTypeId, router]);

  useEffect(() => {
    if (mealTypeId) {
      const fetchMealTypeAndMenuItems = async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          const mealTypeRes = await fetch(`${backendUrl}/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          const menuItemsRes = await fetch(`${backendUrl}/api/menu-items?is_available=true`);
          const menuItemsData: MenuItem[] = await menuItemsRes.json();
          setMenuItems(menuItemsData);

          if (editIndex !== null) {
            const index = parseInt(editIndex, 10);
            if (order[index] && order[index].mealType.meal_type_id === parseInt(mealTypeId, 10)) {
              setSelectedEntrees(order[index].entrees);
              setSelectedSides(order[index].sides);
              setSelectedDrink(order[index].drink);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId, editIndex, order]);

  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side' | 'drink') => {
    if (type === 'entree') {
      if (selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id)) {
        setSelectedEntrees(selectedEntrees.filter((e) => e.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedEntrees.length < selectedMealType.entree_count) {
        setSelectedEntrees([...selectedEntrees, item]);
      }
    } else if (type === 'side') {
      if (selectedSides.some((s) => s.menu_item_id === item.menu_item_id)) {
        setSelectedSides(selectedSides.filter((s) => s.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedSides.length < selectedMealType.side_count) {
        setSelectedSides([...selectedSides, item]);
      }
    } else if (type === 'drink') {
      setSelectedDrink(item);
    }
  };

  const handleAddOrUpdateOrder = () => {
    if (selectedMealType) {
      const newOrderItem: OrderItem = {
        mealType: selectedMealType,
        entrees: selectedEntrees,
        sides: selectedSides,
        drink: selectedDrink,
      };

      const newOrder = [...order];
      if (editIndex !== null) {
        const index = parseInt(editIndex, 10);
        newOrder[index] = newOrderItem;
      } else {
        newOrder.push(newOrderItem);
      }
      setOrder(newOrder);
      setSelectedEntrees([]);
      setSelectedSides([]);
      setSelectedDrink(undefined);
      router.push('/meal-type-selection');
    }
  };

  const itemCount = order.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/meal-type-selection">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Meal Type Selection
          </button>
        </Link>
      </div>
      {selectedMealType && (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">
              Customize Your {selectedMealType.meal_type_name}
            </h1>
            <Link
              href="/shopping-cart"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Shopping Cart
              {itemCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              Select Entrees ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'entree')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'entree')}
                  >
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              Select Sides ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'side')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedSides.some((s) => s.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'side')}
                  >
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </section>

          {selectedMealType.drink_size !== 'none' && (
            <section className="mb-10">
              <h2 className="text-3xl font-semibold mb-4">Select Drink (1)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems
                  .filter((item) => item.item_type === 'drink')
                  .map((item) => (
                    <div
                      key={item.menu_item_id}
                      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedDrink?.menu_item_id === item.menu_item_id ? 'border-blue-500' : 'border-gray-200'}`}
                      onClick={() => handleSelectItem(item, 'drink')}
                    >
                      <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <div className="text-center mb-8">
            <button
              onClick={handleAddOrUpdateOrder}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xl"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count ||
                  (selectedMealType.drink_size !== 'none' && !selectedDrink))
              }
            >
              {editIndex !== null ? 'Update Item' : 'Add to Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const CustomerKiosk = () => {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <CustomerKioskContent />
    </Suspense>
  );
};

export default CustomerKiosk;
