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

const DrinksPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [drinkMealType, setDrinkMealType] = useState<MealType | null>(null);
  const context = useContext(OrderContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuItemsRes = await fetch('http://localhost:3001/api/menu-items');
        const menuItemsData = await menuItemsRes.json();
        setMenuItems(menuItemsData);

        // Fetch the generic 'Drink' meal type
        const mealTypeRes = await fetch('http://localhost:3001/api/meal-types/9');
        const mealTypeData = await mealTypeRes.json();
        setDrinkMealType(mealTypeData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { order, setOrder } = context;

  const handleAddDrink = (item: MenuItem) => {
    if (!drinkMealType) {
      console.error('Drink meal type not loaded yet.');
      return;
    }

    // A drink is treated as a 'side' in this context for simplicity
    const newOrderItem: OrderItem = {
      mealType: drinkMealType,
      entrees: [],
      sides: [item],
    };

    setOrder([...order, newOrderItem]);
  };

  const drinks = menuItems.filter((item) => item.item_type === 'drink');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Drinks</h1>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drinks.map((item) => (
                <div key={item.menu_item_id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <p className="text-gray-700">Price: ${item.upcharge.toFixed(2)}</p>
                  <button onClick={() => handleAddDrink(item)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm mt-4">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-1 bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Current Order</h2>
          <div className="flex flex-col space-y-4">
            {order.map((orderItem, index) => (
              <div key={index} className="bg-white p-3 rounded shadow">
                <p className="font-bold">{orderItem.mealType.meal_type_name}</p>
                {[...orderItem.entrees, ...orderItem.sides].map(item => (
                  <p key={item.menu_item_id} className="pl-2">- {item.name}</p>
                ))}
              </div>
            ))}
          </div>
          <Link href="/meal-type-selection" className="block text-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-6">
            Done
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DrinksPage;
