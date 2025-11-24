'use client';

import React, { useState, useEffect, useContext, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';

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

const CashierInterfaceContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);
  const { translateBatch, currentLanguage } = useTranslation();

  // Translation labels
  const textLabels = [
    'Back to Dashboard',
    'Cashier Interface - Select Meal Type',
    'Price',
    'Entrees',
    'Sides',
    'Drink',
    'Submit Order',
    'Back to Meal Types',
    'Cashier Interface - Customize',
    'Select Entrees',
    'Select Sides',
    'Upcharge',
    'Unavailable',
    'Update Item',
    'Add to Order',
    'Loading meal type...',
    'Loading...',
    'Order submitted successfully!',
    'Failed to submit order.',
    'An error occurred while submitting the order.',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToDashboard: translatedTexts[0] || 'Back to Dashboard',
    selectMealType: translatedTexts[1] || 'Cashier Interface - Select Meal Type',
    price: translatedTexts[2] || 'Price',
    entrees: translatedTexts[3] || 'Entrees',
    sides: translatedTexts[4] || 'Sides',
    drink: translatedTexts[5] || 'Drink',
    submitOrder: translatedTexts[6] || 'Submit Order',
    backToMealTypes: translatedTexts[7] || 'Back to Meal Types',
    customize: translatedTexts[8] || 'Cashier Interface - Customize',
    selectEntrees: translatedTexts[9] || 'Select Entrees',
    selectSides: translatedTexts[10] || 'Select Sides',
    upcharge: translatedTexts[11] || 'Upcharge',
    unavailable: translatedTexts[12] || 'Unavailable',
    updateItem: translatedTexts[13] || 'Update Item',
    addToOrder: translatedTexts[14] || 'Add to Order',
    loadingMealType: translatedTexts[15] || 'Loading meal type...',
    loading: translatedTexts[16] || 'Loading...',
    successMessage: translatedTexts[17] || 'Order submitted successfully!',
    failMessage: translatedTexts[18] || 'Failed to submit order.',
    errorMessage: translatedTexts[19] || 'An error occurred while submitting the order.',
  };

  if (!context) {
    throw new Error('CashierInterface must be used within an OrderProvider');
  }

  const { order, setOrder } = context;

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [translatedMealTypes, setTranslatedMealTypes] = useState<Record<number, string>>({});
  const [translatedMenuItems, setTranslatedMenuItems] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/api/meal-types`);
        const data = await res.json();
        setMealTypes(data);
      } catch (error) {
        console.error('Error fetching meal types:', error);
      }
    };

    fetchMealTypes();
  }, []);

  // Translate meal types when data or language changes
  useEffect(() => {
    const translateMealTypes = async () => {
      if (mealTypes.length > 0) {
        const mealTypeNames = mealTypes.map((mt) => mt.meal_type_name);
        const translated = await translateBatch(mealTypeNames);
        
        const translatedMap: Record<number, string> = {};
        mealTypes.forEach((mt, index) => {
          translatedMap[mt.meal_type_id] = translated[index];
        });
        setTranslatedMealTypes(translatedMap);
      }
    };

    translateMealTypes();
  }, [mealTypes, currentLanguage, translateBatch]);

  // Translate menu items when data or language changes
  useEffect(() => {
    const translateMenuItems = async () => {
      if (menuItems.length > 0) {
        const menuItemNames = menuItems.map((item) => item.name);
        const translated = await translateBatch(menuItemNames);
        
        const translatedMap: Record<number, string> = {};
        menuItems.forEach((item, index) => {
          translatedMap[item.menu_item_id] = translated[index];
        });
        setTranslatedMenuItems(translatedMap);
      }
    };

    translateMenuItems();
  }, [menuItems, currentLanguage, translateBatch]);

  useEffect(() => {
    if (mealTypeId) {
      const fetchMealTypeAndMenuItems = async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          const mealTypeRes = await fetch(`${backendUrl}/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          const menuItemsRes = await fetch(`${backendUrl}/api/menu-items`);
          const menuItemsData: MenuItem[] = await menuItemsRes.json();
          setMenuItems(menuItemsData);

          if (editIndex !== null) {
            const index = parseInt(editIndex, 10);
            if (order[index] && order[index].mealType.meal_type_id === parseInt(mealTypeId, 10)) {
              setSelectedEntrees(order[index].entrees);
              setSelectedSides(order[index].sides);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId, editIndex, order]);

  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side') => {
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
    }
  };

  const handleAddOrUpdateOrder = () => {
    if (selectedMealType) {
      const newOrderItem: OrderItem = {
        mealType: selectedMealType,
        entrees: selectedEntrees,
        sides: selectedSides,
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
      setSelectedMealType(null);
      router.push('/cashier-interface');
    }
  };

  const handleSubmitOrder = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_items: order }),
      });

      if (response.ok) {
        alert(t.successMessage);
        setOrder([]);
        localStorage.removeItem('order');
        router.push('/cashier-interface');
      } else {
        alert(t.failMessage);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(t.errorMessage);
    }
  };

  const handleSelectMealType = (mealType: MealType) => {
    setSelectedMealType(mealType);
    router.push(`/cashier-interface?mealTypeId=${mealType.meal_type_id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!mealTypeId ? (
        <>
          <div className="mb-4 animate-slide-in-down">
            <Link href="/dashboard">
              <button 
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 inline-flex items-center button-press transition-all duration-200 hover:shadow-md"
                aria-label={t.backToDashboard}
              >
                <Tooltip text={t.backToDashboard} position="bottom">
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
                {t.backToDashboard}
              </button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-center mb-8 animate-slide-in-down">{t.selectMealType}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mealTypes.map((mealType, index) => (
              <div
                key={mealType.meal_type_id}
                onClick={() => handleSelectMealType(mealType)}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}
              >
                <h2 className="text-2xl font-bold mb-2">
                  {translatedMealTypes[mealType.meal_type_id] || mealType.meal_type_name}
                </h2>
                <p className="text-gray-700">{t.price}: ${mealType.meal_type_price.toFixed(2)}</p>
                <p className="text-gray-700">{t.entrees}: {mealType.entree_count}</p>
                <p className="text-gray-700">{t.sides}: {mealType.side_count}</p>
                {mealType.drink_size && <p className="text-gray-700">{t.drink}: {mealType.drink_size}</p>}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={handleSubmitOrder}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
              disabled={order.length === 0}
            >
              {t.submitOrder}
            </button>
          </div>
        </>
      ) : selectedMealType ? (
        <>
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedMealType(null);
                setSelectedEntrees([]);
                setSelectedSides([]);
                router.push('/cashier-interface');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              ← {t.backToMealTypes}
            </button>
          </div>
          <h1 className="text-4xl font-bold text-center mb-8">
            {t.customize} {translatedMealTypes[selectedMealType.meal_type_id] || selectedMealType.meal_type_name}
          </h1>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              {t.selectEntrees} ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'entree')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${
                      selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id)
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    } ${!item.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => item.is_available && handleSelectItem(item, 'entree')}
                  >
                    <h3 className="text-xl font-bold mb-2">{translatedMenuItems[item.menu_item_id] || item.name}</h3>
                    <p className="text-gray-700">{t.upcharge}: ${item.upcharge.toFixed(2)}</p>
                    {!item.is_available && (
                      <p className="text-red-500 font-semibold mt-2">{t.unavailable}</p>
                    )}
                  </div>
                ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              {t.selectSides} ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'side')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${
                      selectedSides.some((s) => s.menu_item_id === item.menu_item_id)
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    } ${!item.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => item.is_available && handleSelectItem(item, 'side')}
                  >
                    <h3 className="text-xl font-bold mb-2">{translatedMenuItems[item.menu_item_id] || item.name}</h3>
                    <p className="text-gray-700">{t.upcharge}: ${item.upcharge.toFixed(2)}</p>
                    {!item.is_available && (
                      <p className="text-red-500 font-semibold mt-2">{t.unavailable}</p>
                    )}
                  </div>
                ))}
            </div>
          </section>

          <div className="text-center mb-8">
            <button
              onClick={handleAddOrUpdateOrder}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xl"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count)
              }
            >
              {editIndex !== null ? t.updateItem : t.addToOrder}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold">{t.loadingMealType}</h1>
        </div>
      )}
    </div>
  );
};

const CashierInterface = () => {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <CashierInterfaceContent />
    </Suspense>
  );
};

export default CashierInterface;
