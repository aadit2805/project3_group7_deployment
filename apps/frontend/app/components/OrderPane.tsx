'use client';

import React, { useContext } from 'react';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useRouter } from 'next/navigation';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';

const OrderPane = ({ onOrderSubmitSuccess }: { onOrderSubmitSuccess?: () => void }) => {
  const context = useContext(OrderContext);
  const router = useRouter();

  // Define all text labels that need translation
  const textLabels = [
    'Your Current Order',
    'Your order is empty.',
    'Edit',
    'Remove',
    'Base Price',
    'Entrees',
    'Sides',
    'Drink',
    'Total',
    'Submit Order',
    'Order submitted successfully!',
    'Failed to submit order.',
    'An error occurred while submitting the order.',
  ];

  const { translatedTexts, isTranslating } = useTranslatedTexts(textLabels);

  // Create a mapping for easy access
  const t = {
    title: translatedTexts[0] || 'Your Current Order',
    empty: translatedTexts[1] || 'Your order is empty.',
    edit: translatedTexts[2] || 'Edit',
    remove: translatedTexts[3] || 'Remove',
    basePrice: translatedTexts[4] || 'Base Price',
    entrees: translatedTexts[5] || 'Entrees',
    sides: translatedTexts[6] || 'Sides',
    drink: translatedTexts[7] || 'Drink',
    total: translatedTexts[8] || 'Total',
    submitOrder: translatedTexts[9] || 'Submit Order',
    successMessage: translatedTexts[10] || 'Order submitted successfully!',
    failMessage: translatedTexts[11] || 'Failed to submit order.',
    errorMessage: translatedTexts[12] || 'An error occurred while submitting the order.',
  };

  if (!context) {
    return null;
  }

  const { order, setOrder, totalPrice } = context;

  const handleEditItem = (index: number) => {
    const itemToEdit = order[index];
    router.push(
      `/cashier-interface?mealTypeId=${itemToEdit.mealType.meal_type_id}&editIndex=${index}`
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

                if (onOrderSubmitSuccess) {

                  onOrderSubmitSuccess();

                } else {

                  router.push('/meal-type-selection');

                }

              } else {
        alert(t.failMessage);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(t.errorMessage);
    }
  };

  return (
    <aside 
      className="w-1/3 bg-gray-100 p-6" 
      role="complementary" 
      aria-label="Order summary"
    >
      <h2 className="text-3xl font-semibold mb-4">{t.title}</h2>
      {order.length === 0 ? (
        <p role="status" aria-live="polite">{t.empty}</p>
      ) : (
        <>
          <ul role="list" aria-label="Order items">
            {order.map((orderItem, index) => {
              const isDrinkOnly =
                orderItem.entrees.length === 0 && orderItem.sides.length === 0 && orderItem.drink;
              const itemTotalPrice =
                orderItem.mealType.meal_type_price +
                orderItem.entrees.reduce((sum, item) => sum + item.upcharge, 0) +
                orderItem.sides.reduce((sum, item) => sum + item.upcharge, 0) +
                (orderItem.drink ? orderItem.drink.upcharge : 0);

              return (
                <li key={index} className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">{orderItem.mealType.meal_type_name}</h3>
                    <div role="group" aria-label={`Actions for ${orderItem.mealType.meal_type_name}`}>
                      <button
                        onClick={() => handleEditItem(index)}
                        className="text-blue-500 hover:text-blue-700 font-bold mr-2 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Edit ${orderItem.mealType.meal_type_name} item`}
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => handleRemoveFromOrder(index)}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Remove ${orderItem.mealType.meal_type_name} from order`}
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                {isDrinkOnly ? (
                  <>
                    <p>{t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                    {orderItem.drink && (
                      <p>
                        {t.drink}: {orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>{t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                    <h4 className="text-xl font-semibold mt-4">{t.entrees}:</h4>
                    <ul role="list" aria-label="Selected entrees">
                      {orderItem.entrees.map((item) => (
                        <li key={item.menu_item_id}>
                          {item.name} (+${item.upcharge.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                    <h4 className="text-xl font-semibold mt-4">{t.sides}:</h4>
                    <ul role="list" aria-label="Selected sides">
                      {orderItem.sides.map((item) => (
                        <li key={item.menu_item_id}>
                          {item.name} (+${item.upcharge.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                    {orderItem.drink && (
                      <p className="text-xl font-semibold mt-4">
                        {t.drink}: {orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                      </p>
                    )}
                  </>
                )}
                </li>
              );
            })}
          </ul>
          <div className="text-right mt-6 pt-4 border-t-2 border-gray-300">
            <p className="text-2xl font-bold mb-4" role="status" aria-live="polite">
              {t.total}: <span aria-label={`Total price ${totalPrice.toFixed(2)} dollars`}>${totalPrice.toFixed(2)}</span>
            </p>
            <button
              onClick={handleSubmitOrder}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-xl mt-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTranslating || order.length === 0}
              aria-label={`Submit order with ${order.length} item${order.length !== 1 ? 's' : ''}, total ${totalPrice.toFixed(2)} dollars`}
            >
              {t.submitOrder}
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

export default OrderPane;
