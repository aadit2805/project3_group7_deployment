'use client';

import React, { useContext } from 'react';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useRouter } from 'next/navigation';

const OrderPane = () => {
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
    <div className="w-1/3 bg-gray-100 p-6">
      <h2 className="text-3xl font-semibold mb-4">Your Current Order</h2>
      {order.length === 0 ? (
        <p>Your order is empty.</p>
      ) : (
        <>
          {order.map((orderItem, index) => (
            <div key={index} className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{orderItem.mealType.meal_type_name}</h3>
                <div>
                  <button
                    onClick={() => handleEditItem(index)}
                    className="text-blue-500 hover:text-blue-700 font-bold mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveFromOrder(index)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p>Base Price: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
              <h4 className="text-xl font-semibold mt-4">Entrees:</h4>
              <ul>
                {orderItem.entrees.map((item) => (
                  <li key={item.menu_item_id}>
                    {item.name} (+${item.upcharge.toFixed(2)})
                  </li>
                ))}
              </ul>
              <h4 className="text-xl font-semibold mt-4">Sides:</h4>
              <ul>
                {orderItem.sides.map((item) => (
                  <li key={item.menu_item_id}>
                    {item.name} (+${item.upcharge.toFixed(2)})
                  </li>
                ))}
              </ul>
              {orderItem.mealType.drink_size && (
                <p className="text-xl font-semibold mt-4">Drink: {orderItem.mealType.drink_size}</p>
              )}
            </div>
          ))}
          <div className="text-right">
            <h3 className="text-2xl font-bold">Total: ${totalPrice.toFixed(2)}</h3>
            <button
              onClick={handleSubmitOrder}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-xl mt-4"
            >
              Submit Order
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderPane;
