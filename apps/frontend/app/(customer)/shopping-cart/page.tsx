'use client';

import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';

const ShoppingCart = () => {
  const context = useContext(OrderContext);
  const router = useRouter();
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedNames, setTranslatedNames] = useState<Record<string, string>>({});

  const textLabels = [
    'Back to Ordering',
    'Your Shopping Cart',
    'Your cart is empty.',
    'Start Ordering',
    'Edit',
    'Remove',
    'Base Price',
    'Drink',
    'Entrees',
    'Sides',
    'Item Total',
    'Total',
    'Submit Order',
    'Order submitted successfully!',
    'Failed to submit order.',
    'An error occurred while submitting the order.',
    'Your Points', // New
    'Apply Points', // New
    'Points Discount', // New
    'Total After Discount', // New
    'You have no points to apply.', // New
    'Error fetching points.', // New
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToOrdering: translatedTexts[0] || 'Back to Ordering',
    title: translatedTexts[1] || 'Your Shopping Cart',
    cartEmpty: translatedTexts[2] || 'Your cart is empty.',
    startOrdering: translatedTexts[3] || 'Start Ordering',
    edit: translatedTexts[4] || 'Edit',
    remove: translatedTexts[5] || 'Remove',
    basePrice: translatedTexts[6] || 'Base Price',
    drink: translatedTexts[7] || 'Drink',
    entrees: translatedTexts[8] || 'Entrees',
    sides: translatedTexts[9] || 'Sides',
    itemTotal: translatedTexts[10] || 'Item Total',
    total: translatedTexts[11] || 'Total',
    submitOrder: translatedTexts[12] || 'Submit Order',
    successMessage: translatedTexts[13] || 'Order submitted successfully!',
    failMessage: translatedTexts[14] || 'Failed to submit order.',
    errorMessage: translatedTexts[15] || 'An error occurred while submitting the order.',
    yourPoints: translatedTexts[16] || 'Your Points',
    applyPoints: translatedTexts[17] || 'Apply Points',
    pointsDiscount: translatedTexts[18] || 'Points Discount',
    totalAfterDiscount: translatedTexts[19] || 'Total After Discount',
    noPoints: translatedTexts[20] || 'You have no points to apply.',
    errorFetchingPoints: translatedTexts[21] || 'Error fetching points.',
  };

  const order = context?.order || [];
  const setOrder = context?.setOrder || (() => {});
  const baseTotalPrice = context?.totalPrice || 0; // Renamed to baseTotalPrice

  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsApplied, setPointsApplied] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [fetchingPoints, setFetchingPoints] = useState(true);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const POINTS_PER_DOLLAR = 25; // Define conversion rate

  // Calculate total price including discount
  const totalPrice = baseTotalPrice - discountAmount;

  // Effect to fetch customer points
  useEffect(() => {
    const fetchPoints = async () => {
      setFetchingPoints(true);
      setPointsError(null);
      const customerToken = localStorage.getItem('customerToken');
      const customerId = localStorage.getItem('customerId');

      if (!customerToken || !customerId) {
        setCustomerPoints(null); // Not logged in
        setFetchingPoints(false);
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/customer/auth/me`, {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customer points.');
        }

        const data = await response.json();
        setCustomerPoints(data.customer.rewards_points);
      } catch (err: any) {
        console.error(t.errorFetchingPoints, err);
        setPointsError(err.message || 'Error fetching points.');
        setCustomerPoints(null);
      } finally {
        setFetchingPoints(false);
      }
    };

    fetchPoints();
  }, [baseTotalPrice, t.errorFetchingPoints]); // Re-fetch if baseTotalPrice changes

  // Effect to calculate discount when points, usage, or total price changes
  useEffect(() => {
    if (usePoints && customerPoints !== null && customerPoints > 0 && baseTotalPrice > 0) {
      const availableDiscountValue = customerPoints / POINTS_PER_DOLLAR;
      const actualDiscount = Math.min(availableDiscountValue, baseTotalPrice);
      setDiscountAmount(actualDiscount);
      setPointsApplied(Math.floor(actualDiscount * POINTS_PER_DOLLAR));
    } else {
      setDiscountAmount(0);
      setPointsApplied(0);
    }
  }, [usePoints, customerPoints, baseTotalPrice, POINTS_PER_DOLLAR]);

  // Translate all names in the order
  useEffect(() => {
    const translateOrderNames = async () => {
      if (order.length > 0) {
        const namesToTranslate: string[] = [];
        const nameKeys: string[] = [];

        order.forEach((orderItem) => {
          // Meal type name
          const mealTypeKey = `meal_${orderItem.mealType.meal_type_id}`;
          if (!translatedNames[mealTypeKey]) {
            namesToTranslate.push(orderItem.mealType.meal_type_name);
            nameKeys.push(mealTypeKey);
          }

          // Menu item names
          [...orderItem.entrees, ...orderItem.sides].forEach((item) => {
            const itemKey = `item_${item.menu_item_id}`;
            if (!translatedNames[itemKey]) {
              namesToTranslate.push(item.name);
              nameKeys.push(itemKey);
            }
          });

          if (orderItem.drink) {
            const drinkKey = `item_${orderItem.drink.menu_item_id}`;
            if (!translatedNames[drinkKey]) {
              namesToTranslate.push(orderItem.drink.name);
              nameKeys.push(drinkKey);
            }
          }
        });

        if (namesToTranslate.length > 0) {
          const translated = await translateBatch(namesToTranslate);
          const newTranslations: Record<string, string> = { ...translatedNames };
          nameKeys.forEach((key, index) => {
            newTranslations[key] = translated[index];
          });
          setTranslatedNames(newTranslations);
        }
      }
    };

    translateOrderNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, currentLanguage, translateBatch]);

  if (!context) {
    return null;
  }

  const handleEditItem = (index: number) => {
    const itemToEdit = order[index];
    router.push(
      `/customer-kiosk?mealTypeId=${itemToEdit.mealType.meal_type_id}&editIndex=${index}`
    );
  };

  const handleRemoveFromOrder = (index: number) => {
    const newOrder = [...order];
    newOrder.splice(index, 1);
    setOrder(newOrder);
  };

  const handleSubmitOrder = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const customerId = localStorage.getItem('customerId'); // Retrieve customerId

      const requestBody: { order_items: OrderItem[]; customerId?: string; pointsApplied?: number } =
        {
          order_items: order,
        };

      if (customerId) {
        requestBody.customerId = customerId;
        if (usePoints && pointsApplied > 0) {
          requestBody.pointsApplied = pointsApplied;
        }
      }

      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Use the modified requestBody
      });

      if (response.ok) {
        alert(t.successMessage);
        setOrder([]);
        localStorage.removeItem('order');
        router.push('/meal-type-selection');
      } else {
        alert(t.failMessage);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(t.errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          href="/meal-type-selection"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Back to meal type selection"
        >
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
          {t.backToOrdering}
        </Link>
      </nav>

      <section className="bg-gray-100 p-4 sm:p-6 rounded-lg" aria-labelledby="cart-heading">
        <h1 id="cart-heading" className="text-2xl sm:text-3xl font-semibold mb-4 text-center sm:text-left">
          {t.title}
        </h1>
        {order.length === 0 ? (
          <div className="text-center py-8" role="status">
            <p className="text-xl mb-4">{t.cartEmpty}</p>
            <Link
              href="/meal-type-selection"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Start ordering meals"
            >
              {t.startOrdering}
            </Link>
          </div>
        ) : (
          <>
            <ul role="list" aria-label="Cart items">
              {order.map((orderItem, index) => {
                const isDrinkOnly =
                  orderItem.entrees.length === 0 && orderItem.sides.length === 0 && orderItem.drink;
                const itemTotalPrice =
                  orderItem.mealType.meal_type_price +
                  orderItem.entrees.reduce((sum, item) => sum + item.upcharge, 0) +
                  orderItem.sides.reduce((sum, item) => sum + item.upcharge, 0) +
                  (orderItem.drink ? orderItem.drink.upcharge : 0);

                const mealName =
                  translatedNames[`meal_${orderItem.mealType.meal_type_id}`] ||
                  orderItem.mealType.meal_type_name;

                return (
                  <li
                    key={index}
                    className={`mb-4 pb-4 border-b border-gray-200 bg-white p-4 rounded hover-scale transition-all duration-200 animate-fade-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}
                  >
                    <div className="flex flex-wrap justify-center sm:justify-between items-center gap-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold">{mealName}</h2>
                      <div role="group" aria-label={`Actions for ${mealName}`}>
                        <button
                          onClick={() => handleEditItem(index)}
                          className="text-blue-500 hover:text-blue-700 font-bold mr-2 px-3 py-1 border border-blue-500 rounded button-press transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label={`Edit ${mealName} item`}
                        >
                          {t.edit}
                        </button>
                        <button
                          onClick={() => handleRemoveFromOrder(index)}
                          className="text-red-500 hover:text-red-700 font-bold px-3 py-1 border border-red-500 rounded button-press transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Remove ${mealName} from cart`}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                    {isDrinkOnly ? (
                      <>
                        <p className="text-lg mt-2">
                          {t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}
                        </p>
                        {orderItem.drink && (
                          <p className="text-lg">
                            {t.drink}:{' '}
                            {translatedNames[`item_${orderItem.drink.menu_item_id}`] ||
                              orderItem.drink.name}{' '}
                            (+${orderItem.drink.upcharge.toFixed(2)})
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-lg mt-2">
                          {t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}
                        </p>
                        {orderItem.entrees.length > 0 && (
                          <>
                            <h3 className="text-xl font-semibold mt-4">{t.entrees}:</h3>
                            <ul
                              className="list-disc list-inside ml-4"
                              role="list"
                              aria-label="Selected entrees"
                            >
                              {orderItem.entrees.map((item) => (
                                <li key={item.menu_item_id} className="text-lg">
                                  {translatedNames[`item_${item.menu_item_id}`] || item.name} (+$
                                  {item.upcharge.toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {orderItem.sides.length > 0 && (
                          <>
                            <h3 className="text-xl font-semibold mt-4">{t.sides}:</h3>
                            <ul
                              className="list-disc list-inside ml-4"
                              role="list"
                              aria-label="Selected sides"
                            >
                              {orderItem.sides.map((item) => (
                                <li key={item.menu_item_id} className="text-lg">
                                  {translatedNames[`item_${item.menu_item_id}`] || item.name} (+$
                                  {item.upcharge.toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {orderItem.drink && (
                          <p className="text-xl font-semibold mt-4">
                            {t.drink}:{' '}
                            {translatedNames[`item_${orderItem.drink.menu_item_id}`] ||
                              orderItem.drink.name}{' '}
                            (+${orderItem.drink.upcharge.toFixed(2)})
                          </p>
                        )}
                      </>
                    )}
                    <div className="mt-2 text-right">
                      <p className="text-xl font-semibold">
                        {t.itemTotal}:{' '}
                        <span aria-label={`Item total ${itemTotalPrice.toFixed(2)} dollars`}>
                          ${itemTotalPrice.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              {/* Rewards Points Section */}
              {localStorage.getItem('customerToken') && !fetchingPoints && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xl font-semibold mb-2">
                    {t.yourPoints}:{' '}
                    <span className="text-yellow-700">
                      {customerPoints !== null ? customerPoints : 'N/A'}
                    </span>
                  </p>
                  {customerPoints !== null && customerPoints > 0 && baseTotalPrice > 0 ? (
                    <label className="flex items-center text-lg cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={usePoints}
                        onChange={() => setUsePoints(!usePoints)}
                      />
                      <span className="ml-2">{t.applyPoints}</span>
                    </label>
                  ) : (
                    <p className="text-gray-600 text-sm">{t.noPoints}</p>
                  )}
                  {pointsError && <p className="text-red-500 text-sm mt-2">{pointsError}</p>}
                </div>
              )}

              <div className="flex flex-wrap justify-center sm:justify-between items-center mb-2 gap-y-2">
                <p className="text-lg sm:text-xl font-bold">
                  {t.total}:{' '}
                  <span aria-label={`Base total price ${baseTotalPrice.toFixed(2)} dollars`}>
                    ${baseTotalPrice.toFixed(2)}
                  </span>
                </p>
              </div>

              {usePoints && discountAmount > 0 && (
                <>
                  <div className="flex flex-wrap justify-center sm:justify-between items-center mb-2 text-green-700 gap-y-2">
                    <p className="text-lg sm:text-xl font-bold">
                      {t.pointsDiscount}:{' '}
                      <span aria-label={`Discount amount ${discountAmount.toFixed(2)} dollars`}>
                        -${discountAmount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-between items-center mb-4 border-t pt-2 border-gray-300 gap-y-2">
                    <p className="text-xl sm:text-2xl font-bold" role="status" aria-live="polite">
                      {t.totalAfterDiscount}:{' '}
                      <span aria-label={`Final total price ${totalPrice.toFixed(2)} dollars`}>
                        ${totalPrice.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </>
              )}

              {!usePoints || discountAmount === 0 ? (
                <div className="flex flex-wrap justify-center sm:justify-between items-center mb-4 gap-y-2">
                  <p className="text-xl sm:text-2xl font-bold" role="status" aria-live="polite">
                    {t.total}:{' '}
                    <span aria-label={`Total price ${totalPrice.toFixed(2)} dollars`}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </p>
                </div>
              ) : null}

              <button
                onClick={handleSubmitOrder}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg sm:text-xl hover:shadow-lg button-press transition-all duration-200 animate-bounce-in focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label={`Submit order with ${order.length} item${order.length !== 1 ? 's' : ''}, total ${totalPrice.toFixed(2)} dollars`}
              >
                {t.submitOrder}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ShoppingCart;
