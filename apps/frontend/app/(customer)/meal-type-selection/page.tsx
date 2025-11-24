'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { OrderContext } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';

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
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedMealTypeNames, setTranslatedMealTypeNames] = useState<string[]>([]);
  const navRouter = useRouter();

  const textLabels = [
    'Select Your Meal Type',
    'Shopping Cart',
    'Price',
    'Entrees',
    'Sides',
    'Drink',
    'A La Carte',
    'Create your own meal',
    'Drinks',
    'Select a beverage',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'Select Your Meal Type',
    shoppingCart: translatedTexts[1] || 'Shopping Cart',
    price: translatedTexts[2] || 'Price',
    entrees: translatedTexts[3] || 'Entrees',
    sides: translatedTexts[4] || 'Sides',
    drink: translatedTexts[5] || 'Drink',
    aLaCarte: translatedTexts[6] || 'A La Carte',
    createYourOwn: translatedTexts[7] || 'Create your own meal',
    drinks: translatedTexts[8] || 'Drinks',
    selectBeverage: translatedTexts[9] || 'Select a beverage',
  };

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

  // Translate meal type names when mealTypes or language changes
  useEffect(() => {
    const translateMealTypeNames = async () => {
      if (mealTypes.length > 0) {
        const filtered = mealTypes.filter(
          (mt) =>
            (mt.meal_type_id >= 1 && mt.meal_type_id <= 3) ||
            (mt.meal_type_id >= 10 && mt.meal_type_id <= 12)
        );
        const names = filtered.map((mt) => mt.meal_type_name);
        const translated = await translateBatch(names);
        setTranslatedMealTypeNames(translated);
      }
    };

    translateMealTypeNames();
  }, [mealTypes, currentLanguage, translateBatch]);

  if (!context) {
    return null;
  }

      const { order } = context;

      const itemCount = order.length; // Use a different name for the router instance
  
    return (
      <div className="container mx-auto px-4">
        <header className="flex justify-between items-center my-8">
          <h1 className="text-4xl font-bold">{t.title}</h1>
          <Link
            href="/shopping-cart"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`View shopping cart${itemCount > 0 ? ` with ${itemCount} item${itemCount !== 1 ? 's' : ''}` : ', currently empty'}`}
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
            <span>{t.shoppingCart}</span>
            {itemCount > 0 && (
              <span
                className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm"
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount}
              </span>
            )}
          </Link>
        </header>
        <nav aria-label="Meal options">        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
          {mealTypes
            .filter(
              (mt) =>
                (mt.meal_type_id >= 1 && mt.meal_type_id <= 3) ||
                (mt.meal_type_id >= 10 && mt.meal_type_id <= 12)
            )
            .map((mealType, index) => {
              const mealName = translatedMealTypeNames[index] || mealType.meal_type_name;
              const staggerDelay = index % 6; // Cycle through stagger delays
              return (
                <li key={mealType.meal_type_id} className={`animate-scale-in animate-stagger-${Math.min(staggerDelay + 1, 4)}`}>
                  <Link
                    href={`/customer-kiosk?mealTypeId=${mealType.meal_type_id}`}
                    className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover-scale transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`Select ${mealName}, priced at ${mealType.meal_type_price.toFixed(2)} dollars, includes ${mealType.entree_count} entree${mealType.entree_count !== 1 ? 's' : ''}, ${mealType.side_count} side${mealType.side_count !== 1 ? 's' : ''}${mealType.drink_size ? `, and a ${mealType.drink_size} drink` : ''}`}
                  >
                    <article>
                      <h2 className="text-2xl font-bold mb-2">
                        {mealName}
                      </h2>
                      <dl className="text-gray-700 space-y-1">
                        <div>
                          <dt className="inline">{t.price}: </dt>
                          <dd className="inline">${mealType.meal_type_price.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt className="inline">{t.entrees}: </dt>
                          <dd className="inline">{mealType.entree_count}</dd>
                        </div>
                        <div>
                          <dt className="inline">{t.sides}: </dt>
                          <dd className="inline">{mealType.side_count}</dd>
                        </div>
                        {mealType.drink_size && (
                          <div>
                            <dt className="inline">{t.drink}: </dt>
                            <dd className="inline">{mealType.drink_size}</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  </Link>
                </li>
              );
            })}
          <li>
            <Link
              href="/a-la-carte"
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Select a la carte option to create your own custom meal"
            >
              <article>
                <h2 className="text-2xl font-bold mb-2">{t.aLaCarte}</h2>
                <p className="text-gray-700">{t.createYourOwn}</p>
              </article>
            </Link>
          </li>
          <li>
            <Link
              href="/drinks"
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Select drinks option to choose a beverage"
            >
              <article>
                <h2 className="text-2xl font-bold mb-2">{t.drinks}</h2>
                <p className="text-gray-700">{t.selectBeverage}</p>
              </article>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MealTypeSelection;
