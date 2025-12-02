'use client';

import React, { useState, useEffect, useContext, Suspense } from 'react';
import apiClient from '@/app/utils/apiClient';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';
import VoiceSearchInput from '@/app/components/VoiceSearchInput';

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

interface OrderItemForRecommendation {
  mealType: MealType;
  entrees: MenuItem[];
  sides: MenuItem[];
  drink?: MenuItem;
}

interface Order {
  order_id: number;
  total_price: number;
  order_date: string;
  order_items: OrderItemForRecommendation[];
  points_used?: number;
  points_earned: number;
}

const CustomerKioskContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);
  const { translateBatch, currentLanguage } = useTranslation();

  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchPastOrders = async () => {
      const customerId = localStorage.getItem('customerId');
      if (!customerId) {
        setPastOrders([]); // No authenticated customer
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const ordersRes = await apiClient(`${backendUrl}/api/orders/customer/${customerId}`);

        if (!ordersRes.ok) {
          // The apiClient should handle 401, but for other errors, we can still log them.
          const errorBody = await ordersRes.text();
          throw new Error(
            `Failed to fetch past orders. Status: ${ordersRes.status}. Body: ${errorBody}`
          );
        }

        const responseData: { success: boolean; data: Order[] } = await ordersRes.json();
        setPastOrders(responseData.data);
      } catch (err) {
        // apiClient will throw 'Unauthorized' for 401s, which will be caught here.
        // We can choose to log it or handle it, but redirection is already handled.
        if ((err as Error).message !== 'Unauthorized') {
          console.error('Error fetching past orders:', err);
        }
        setPastOrders([]);
      }
    };
    fetchPastOrders();
  }, []);

  useEffect(() => {
    if (pastOrders.length > 0) {
      const allEntrees = pastOrders.flatMap(order => order.order_items.flatMap(item => item.entrees));
      const entreeCounts = allEntrees.reduce((acc, entree) => {
        acc[entree.menu_item_id] = (acc[entree.menu_item_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const sortedEntrees = Object.keys(entreeCounts)
        .sort((a, b) => entreeCounts[parseInt(b)] - entreeCounts[parseInt(a)])
        .slice(0, 3)
        .map(id => allEntrees.find(e => e.menu_item_id === parseInt(id)))
        .filter((e): e is MenuItem => e !== undefined);

      setRecommendedItems(sortedEntrees);
    }
  }, [pastOrders]);

  const textLabels = [
    'Back to Meal Type Selection',
    'Customize Your',
    'Shopping Cart',
    'Select Entrees',
    'Select Sides',
    'Select Drink',
    'Upcharge',
    'Update Item',
    'Add to Order',
    'Search menu items',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToSelection: translatedTexts[0] || 'Back to Meal Type Selection',
    customizeYour: translatedTexts[1] || 'Customize Your',
    shoppingCart: translatedTexts[2] || 'Shopping Cart',
    selectEntrees: translatedTexts[3] || 'Select Entrees',
    selectSides: translatedTexts[4] || 'Select Sides',
    selectDrink: translatedTexts[5] || 'Select Drink',
    upcharge: translatedTexts[6] || 'Upcharge',
    updateItem: translatedTexts[7] || 'Update Item',
    addToOrder: translatedTexts[8] || 'Add to Order',
    searchMenuItems: translatedTexts[9] || 'Search menu items',
  };

  if (!context) {
    throw new Error('CustomerKiosk must be used within an OrderProvider');
  }

  const { order, setOrder } = context;

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [translatedMenuItems, setTranslatedMenuItems] = useState<Record<number, string>>({});
  const [translatedMealTypeName, setTranslatedMealTypeName] = useState<string>('');
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          
          const mealTypeRes = await apiClient(`${backendUrl}/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          const menuItemsRes = await apiClient(`${backendUrl}/api/menu-items?is_available=true`);
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

  // Translate menu items and meal type name when data or language changes
  useEffect(() => {
    const translateContent = async () => {
      if (menuItems.length > 0) {
        const menuItemNames = menuItems.map((item) => item.name);
        const translated = await translateBatch(menuItemNames);

        const translatedMap: Record<number, string> = {};
        menuItems.forEach((item, index) => {
          translatedMap[item.menu_item_id] = translated[index];
        });
        setTranslatedMenuItems(translatedMap);
      }

      if (selectedMealType) {
        const [translatedName] = await translateBatch([selectedMealType.meal_type_name]);
        setTranslatedMealTypeName(translatedName);
      }
    };

    translateContent();
  }, [menuItems, selectedMealType, currentLanguage, translateBatch]);

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
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 inline-flex items-center"
            aria-label={t.backToSelection}
          >
            <Tooltip text={t.backToSelection} position="bottom">
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
            {t.backToSelection}
          </button>
        </Link>
      </div>
      {selectedMealType && (
        <>
          <div className="flex flex-wrap justify-center sm:justify-between items-center mb-8 gap-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center sm:text-left">
              {t.customizeYour} {translatedMealTypeName || selectedMealType.meal_type_name}
            </h1>
            <Link
              href="/shopping-cart"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center"
              aria-label={t.shoppingCart}
            >
              <Tooltip text={t.shoppingCart} position="bottom">
                <svg
                  className="w-5 h-5 mr-2"
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </Tooltip>
              {t.shoppingCart}
              {itemCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
          


          {recommendedItems.length > 0 && (
            <section className="mb-10 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">Recommended for you</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedItems.map((item, index) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-gray-200 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {translatedMenuItems[item.menu_item_id] || item.name}
                    </h3>
                    <p className="text-gray-700">
                      {t.upcharge}: ${item.upcharge.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleSelectItem(item, 'entree')}
                      className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      Add to selection
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10 animate-fade-in">
            <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
              {t.selectEntrees} ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="mb-4 animate-fade-in animate-stagger-1">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="entree-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => {
                  if (item.item_type !== 'entree') return false;
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (
                    translatedMenuItems[item.menu_item_id] || item.name
                  ).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'entree')}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {translatedMenuItems[item.menu_item_id] || item.name}
                    </h3>
                    <p className="text-gray-700">
                      {t.upcharge}: ${item.upcharge.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          <section className="mb-10 animate-fade-in">
            <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
              {t.selectSides} ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="mb-4 animate-fade-in animate-stagger-1">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="side-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => {
                  if (item.item_type !== 'side') return false;
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (
                    translatedMenuItems[item.menu_item_id] || item.name
                  ).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${selectedSides.some((s) => s.menu_item_id === item.menu_item_id) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'side')}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {translatedMenuItems[item.menu_item_id] || item.name}
                    </h3>
                    <p className="text-gray-700">
                      {t.upcharge}: ${item.upcharge.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          {selectedMealType.drink_size !== 'none' && (
            <section className="mb-10 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
                {t.selectDrink} (1)
              </h2>
              <div className="mb-4 animate-fade-in animate-stagger-1">
                <VoiceSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t.searchMenuItems}
                  label={t.searchMenuItems}
                  id="drink-search"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems
                  .filter((item) => {
                    if (item.item_type !== 'drink') return false;
                    if (!searchQuery.trim()) return true;
                    const searchLower = searchQuery.toLowerCase();
                    const itemName = (
                      translatedMenuItems[item.menu_item_id] || item.name
                    ).toLowerCase();
                    return itemName.includes(searchLower);
                  })
                  .map((item, index) => (
                    <div
                      key={item.menu_item_id}
                      className={`bg-white rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${selectedDrink?.menu_item_id === item.menu_item_id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                      onClick={() => handleSelectItem(item, 'drink')}
                    >
                      <h3 className="text-xl font-bold mb-2">
                        {translatedMenuItems[item.menu_item_id] || item.name}
                      </h3>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <div className="text-center mb-8 animate-fade-in animate-stagger-2">
            <button
              onClick={handleAddOrUpdateOrder}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg sm:text-xl hover:shadow-lg button-press transition-all duration-200 animate-bounce-in"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count ||
                  (selectedMealType.drink_size !== 'none' && !selectedDrink))
              }
            >
              {editIndex !== null ? t.updateItem : t.addToOrder}
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
