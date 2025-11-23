'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';
import VoiceSearchInput from '@/app/components/VoiceSearchInput';

// Interfaces to match the data structure
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

const ALaCartePage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [translatedMenuItems, setTranslatedMenuItems] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const context = useContext(OrderContext);
  const { translateBatch, currentLanguage } = useTranslation();

  const textLabels = [
    'A La Carte',
    'Shopping Cart',
    'Back to Meal Type Selection',
    'Entrees',
    'Sides',
    'Small',
    'Medium',
    'Large',
    'Add',
    'Loading...',
    'Search menu items',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'A La Carte',
    shoppingCart: translatedTexts[1] || 'Shopping Cart',
    backToSelection: translatedTexts[2] || 'Back to Meal Type Selection',
    entrees: translatedTexts[3] || 'Entrees',
    sides: translatedTexts[4] || 'Sides',
    small: translatedTexts[5] || 'Small',
    medium: translatedTexts[6] || 'Medium',
    large: translatedTexts[7] || 'Large',
    add: translatedTexts[8] || 'Add',
    loading: translatedTexts[9] || 'Loading...',
    searchMenuItems: translatedTexts[10] || 'Search menu items',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const menuItemsRes = await fetch(`${backendUrl}/api/menu-items`);
        const menuItemsData = await menuItemsRes.json();
        setMenuItems(menuItemsData);

        const mealTypesRes = await fetch(`${backendUrl}/api/meal-types`);
        const mealTypesData = await mealTypesRes.json();
        setMealTypes(mealTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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

  if (!context) {
    return <div>{t.loading}</div>;
  }

  const { order, setOrder } = context;
  const itemCount = order.length;

  const handleAddItem = (item: MenuItem, sizeMealTypeId: number) => {
    const mealType = mealTypes.find((mt) => mt.meal_type_id === sizeMealTypeId);
    if (!mealType) {
      console.error('Corresponding meal type not found for ID:', sizeMealTypeId);
      return;
    }

    const newOrderItem: OrderItem = {
      mealType: mealType,
      entrees: item.item_type === 'entree' ? [item] : [],
      sides: item.item_type === 'side' ? [item] : [],
    };

    setOrder([...order, newOrderItem]);
  };

  const entrees = menuItems.filter((item) => item.item_type === 'entree');
  const sides = menuItems.filter((item) => item.item_type === 'side');

  const entreeSizes = [
    { name: 'Small', meal_type_id: 4 },
    { name: 'Medium', meal_type_id: 5 },
    { name: 'Large', meal_type_id: 6 },
  ];

  const sideSizes = [
    { name: 'Small', meal_type_id: 7 },
    { name: 'Medium', meal_type_id: 8 },
    { name: 'Large', meal_type_id: 9 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{t.title}</h1>
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
      <div className="mb-4">
        <Link
          href="/meal-type-selection"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
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
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="col-span-1">
          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">{t.entrees}</h2>
            <div className="mb-4">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="entree-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entrees
                .filter((item) => {
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (translatedMenuItems[item.menu_item_id] || item.name).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => (
                  <div key={item.menu_item_id} className={`bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}>
                    <h3 className="text-xl font-bold mb-2">{translatedMenuItems[item.menu_item_id] || item.name}</h3>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleAddItem(item, 4)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.small}
                      </button>
                      <button
                        onClick={() => handleAddItem(item, 5)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.medium}
                      </button>
                      <button
                        onClick={() => handleAddItem(item, 6)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.large}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">{t.sides}</h2>
            <div className="mb-4">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="side-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sides
                .filter((item) => {
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (translatedMenuItems[item.menu_item_id] || item.name).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => (
                  <div key={item.menu_item_id} className={`bg-white rounded-lg shadow-md p-6 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}>
                    <h3 className="text-xl font-bold mb-2">{translatedMenuItems[item.menu_item_id] || item.name}</h3>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleAddItem(item, 7)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.small}
                      </button>
                      <button
                        onClick={() => handleAddItem(item, 8)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.medium}
                      </button>
                      <button
                        onClick={() => handleAddItem(item, 9)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm button-press transition-all duration-200 hover:shadow-md"
                      >
                        {t.add} {t.large}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ALaCartePage;
