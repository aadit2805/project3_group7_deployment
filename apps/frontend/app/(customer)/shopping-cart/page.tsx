'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';

const ShoppingCart = () => {
  const context = useContext(OrderContext);
  const router = useRouter();

  if (!context) {
    return null;
  }

  const { order, setOrder, totalPrice } = context;

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
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_items: order }),
      });

      if (response.ok) {
        alert('Order submitted successfully!');
        setOrder([]);
        localStorage.removeItem('order');
        router.push('/meal-type-selection');
      } else {
        alert('Failed to submit order.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('An error occurred while submitting the order.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
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
          Back to Ordering
        </Link>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">Your Shopping Cart</h2>
        {order.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl mb-4">Your cart is empty.</p>
            <Link
              href="/meal-type-selection"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <>
            {order.map((orderItem, index) => {
              const isDrinkOnly =
                orderItem.entrees.length === 0 && orderItem.sides.length === 0 && orderItem.drink;
              const itemTotalPrice =
                orderItem.mealType.meal_type_price +
                orderItem.entrees.reduce((sum, item) => sum + item.upcharge, 0) +
                orderItem.sides.reduce((sum, item) => sum + item.upcharge, 0) +
                (orderItem.drink ? orderItem.drink.upcharge : 0);

              return (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 bg-white p-4 rounded">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">{orderItem.mealType.meal_type_name}</h3>
                    <div>
                      <button
                        onClick={() => handleEditItem(index)}
                        className="text-blue-500 hover:text-blue-700 font-bold mr-2 px-3 py-1 border border-blue-500 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveFromOrder(index)}
                        className="text-red-500 hover:text-red-700 font-bold px-3 py-1 border border-red-500 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {isDrinkOnly ? (
                    <>
                      <p className="text-lg mt-2">Base Price: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                      {orderItem.drink && (
                        <p className="text-lg">
                          Drink: {orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg mt-2">Base Price: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                      {orderItem.entrees.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mt-4">Entrees:</h4>
                          <ul className="list-disc list-inside ml-4">
                            {orderItem.entrees.map((item) => (
                              <li key={item.menu_item_id} className="text-lg">
                                {item.name} (+${item.upcharge.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {orderItem.sides.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mt-4">Sides:</h4>
                          <ul className="list-disc list-inside ml-4">
                            {orderItem.sides.map((item) => (
                              <li key={item.menu_item_id} className="text-lg">
                                {item.name} (+${item.upcharge.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {orderItem.drink && (
                        <p className="text-xl font-semibold mt-4">
                          Drink: {orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                        </p>
                      )}
                    </>
                  )}
                  <div className="mt-2 text-right">
                    <p className="text-xl font-semibold">Item Total: ${itemTotalPrice.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Total: ${totalPrice.toFixed(2)}</h3>
                <button
                  onClick={handleSubmitOrder}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
                >
                  Submit Order
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;

