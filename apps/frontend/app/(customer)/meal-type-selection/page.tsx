'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { OrderContext } from '@/app/context/OrderContext';

interface MealType {
  meal_type_id: number;
  meal_type_name: string;
  meal_type_price: number;
  entree_count: number;
  side_count: number;
  drink_size: string;
}

const MealTypeSelection = () => {
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const context = useContext(OrderContext);

  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/meal-types');
        const data = await res.json();
        setMealTypes(data);
      } catch (error) {
        console.error('Error fetching meal types:', error);
      }
    };

    fetchMealTypes();
  }, []);

  if (!context) {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold text-center my-8">Select Your Meal Type</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mealTypes
          .filter(
            (mt) =>
              (mt.meal_type_id >= 1 && mt.meal_type_id <= 3) ||
              (mt.meal_type_id >= 10 && mt.meal_type_id <= 12)
          )
          .map((mealType) => (
            <Link
              key={mealType.meal_type_id}
              href={`/customer-kiosk?mealTypeId=${mealType.meal_type_id}`}
            >
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-2xl font-bold mb-2">{mealType.meal_type_name}</h2>
                <p className="text-gray-700">Price: ${mealType.meal_type_price.toFixed(2)}</p>
                <p className="text-gray-700">Entrees: {mealType.entree_count}</p>
                <p className="text-gray-700">Sides: {mealType.side_count}</p>
                {mealType.drink_size && (
                  <p className="text-gray-700">Drink: {mealType.drink_size}</p>
                )}
              </div>
            </Link>
          ))}
        <Link href="/a-la-carte">
          <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold mb-2">A La Carte</h2>
            <p className="text-gray-700">Create your own meal</p>
          </div>
        </Link>
        <Link href="/drinks">
          <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold mb-2">Drinks</h2>
            <p className="text-gray-700">Select a beverage</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MealTypeSelection;
