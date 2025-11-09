'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';

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
  const context = useContext(OrderContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuItemsRes = await fetch('http://localhost:3001/api/menu-items');
        const menuItemsData = await menuItemsRes.json();
        setMenuItems(menuItemsData);

        const mealTypesRes = await fetch('http://localhost:3001/api/meal-types');
        const mealTypesData = await mealTypesRes.json();
        setMealTypes(mealTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  if (!context) {
    return <div>Loading...</div>; // Or some other error/loading state
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
        <h1 className="text-4xl font-bold">A La Carte</h1>
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
      <div className="mb-4">
        <Link
          href="/meal-type-selection"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Meal Type Selection
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="col-span-1">
          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">Entrees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entrees.map((item) => (
                <div key={item.menu_item_id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <div className="flex space-x-2 mt-4">
                    {entreeSizes.map((size) => (
                      <button
                        key={size.meal_type_id}
                        onClick={() => handleAddItem(item, size.meal_type_id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Add {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Sides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sides.map((item) => (
                <div key={item.menu_item_id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <div className="flex space-x-2 mt-4">
                    {sideSizes.map((size) => (
                      <button
                        key={size.meal_type_id}
                        onClick={() => handleAddItem(item, size.meal_type_id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Add {size.name}
                      </button>
                    ))}
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
