'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Link from 'next/link';

interface OrderItem {
  mealType: {
    meal_type_name: string;
  };
  entrees: { name: string }[];
  sides: { name: string }[];
  drink?: { name: string };
}

interface Order {
  order_id: number;
  total_price: number;
  order_date: string;
  order_items: OrderItem[];
  points_used?: number;
  points_earned: number;
}

const MyProfile = () => {
  const router = useRouter();
  const { translateBatch } = useTranslation();
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [cashDiscountValue, setCashDiscountValue] = useState<number | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const POINTS_PER_DOLLAR = 25; // Define conversion rate

  const textLabels = [
    'My Profile',
    'Current Points',
    'Cash Discount Value',
    'Past Orders',
    'Order ID',
    'Date',
    'Total Price',
    'Points Used',
    'Points Earned',
    'No past orders found.',
    'Loading...',
    'Error fetching profile data.',
    'Meals',
    'Entrees',
    'Sides',
    'Drink',
    'Back to Home',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    myProfile: translatedTexts[0] || 'My Profile',
    currentPoints: translatedTexts[1] || 'Current Points',
    cashDiscountValue: translatedTexts[2] || 'Cash Discount Value',
    pastOrders: translatedTexts[3] || 'Past Orders',
    orderID: translatedTexts[4] || 'Order ID',
    date: translatedTexts[5] || 'Date',
    totalPrice: translatedTexts[6] || 'Total Price',
    pointsUsed: translatedTexts[7] || 'Points Used',
    pointsEarned: translatedTexts[8] || 'Points Earned',
    noPastOrders: translatedTexts[9] || 'No past orders found.',
    loading: translatedTexts[10] || 'Loading...',
    errorFetching: translatedTexts[11] || 'Error fetching profile data.',
    meals: translatedTexts[12] || 'Meals',
    entrees: translatedTexts[13] || 'Entrees',
    sides: translatedTexts[14] || 'Sides',
    drink: translatedTexts[15] || 'Drink',
    backToHome: translatedTexts[16] || 'Back to Home',
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      const customerToken = localStorage.getItem('customerToken');
      const customerId = localStorage.getItem('customerId');

      if (!customerToken || !customerId) {
        router.push('/rewards-login'); // Redirect to login if not authenticated
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        // Fetch customer data (for points)
        const customerRes = await fetch(`${backendUrl}/api/customer/auth/me`, {
          headers: {
            'Authorization': `Bearer ${customerToken}`,
          },
        });
        if (!customerRes.ok) {
          throw new Error('Failed to fetch customer data.');
        }
        const customerData = await customerRes.json();
        setCustomerPoints(customerData.customer.rewards_points);
        setCashDiscountValue(customerData.customer.rewards_points / POINTS_PER_DOLLAR);

        // Fetch past orders
        const ordersRes = await fetch(`${backendUrl}/api/orders/customer/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${customerToken}`,
          },
        });
        if (!ordersRes.ok) {
          throw new Error('Failed to fetch past orders.');
        }
        const responseData: { success: boolean; data: Order[] } = await ordersRes.json();
        const ordersData: Order[] = responseData.data;

        // Translate order item names
        const allNamesToTranslate: string[] = [];
        ordersData.forEach(order => {
          order.order_items.forEach(item => {
            allNamesToTranslate.push(item.mealType.meal_type_name);
            item.entrees.forEach(e => allNamesToTranslate.push(e.name));
            item.sides.forEach(s => allNamesToTranslate.push(s.name));
            if (item.drink) allNamesToTranslate.push(item.drink.name);
          });
        });

        const translatedNamesArray = await translateBatch(allNamesToTranslate);
        let translatedIndex = 0;
        const translatedOrdersData = ordersData.map(order => {
            return {
                ...order,
                order_items: order.order_items.map(item => {
                    const translatedMealType = { ...item.mealType, meal_type_name: translatedNamesArray[translatedIndex++] };
                    const translatedEntrees = item.entrees.map(e => ({ ...e, name: translatedNamesArray[translatedIndex++] }));
                    const translatedSides = item.sides.map(s => ({ ...s, name: translatedNamesArray[translatedIndex++] }));
                    const translatedDrink = item.drink ? { ...item.drink, name: translatedNamesArray[translatedIndex++] } : undefined;
                    return { ...item, mealType: translatedMealType, entrees: translatedEntrees, sides: translatedSides, drink: translatedDrink };
                })
            };
        });
        setPastOrders(translatedOrdersData);

      } catch (err: any) {
        setError(t.errorFetching + ' ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router, translateBatch, t.errorFetching]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <p className="text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/meal-type-selection" className="inline-block bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 mb-6">
        ← {t.backToHome}
      </Link>
      <h1 className="text-4xl font-bold mb-8">{t.myProfile}</h1>

      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t.currentPoints}</h2>
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {customerPoints !== null ? customerPoints : 'N/A'}
        </p>
        <p className="text-lg text-gray-700">
          ({t.cashDiscountValue}: ${cashDiscountValue !== null ? cashDiscountValue.toFixed(2) : 'N/A'})
        </p>
      </section>

      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">{t.pastOrders}</h2>
        {pastOrders.length === 0 ? (
          <p className="text-lg text-gray-700">{t.noPastOrders}</p>
        ) : (
          <div className="space-y-6">
            {pastOrders.map((order) => (
              <div key={order.order_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">{t.orderID}: {order.order_id}</h3>
                  <p className="text-gray-600">{t.date}: {new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                <p className="text-lg mb-2">{t.totalPrice}: ${order.total_price.toFixed(2)}</p>
                {order.points_used && order.points_used > 0 && (
                  <p className="text-lg mb-2 text-green-700">{t.pointsUsed}: {order.points_used}</p>
                )}
                <p className="text-lg mb-4 text-blue-700">{t.pointsEarned}: {order.points_earned}</p>

                <h4 className="text-lg font-semibold mb-2">{t.meals}:</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {order.order_items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <strong>{item.mealType.meal_type_name}</strong>
                      {item.entrees.length > 0 && (
                        <p className="ml-4 text-gray-700">{t.entrees}: {item.entrees.map(e => e.name).join(', ')}</p>
                      )}
                      {item.sides.length > 0 && (
                        <p className="ml-4 text-gray-700">{t.sides}: {item.sides.map(s => s.name).join(', ')}</p>
                      )}
                      {item.drink && (
                        <p className="ml-4 text-gray-700">{t.drink}: {item.drink.name}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyProfile;
