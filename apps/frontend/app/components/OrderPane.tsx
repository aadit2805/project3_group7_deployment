'use client';

import React, { useContext, useState } from 'react';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { EmployeeContext } from '@/app/context/EmployeeContext'; // Import EmployeeContext
import { useRouter } from 'next/navigation';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';
import { useToast } from '@/app/hooks/useToast';

const OrderPane = ({ onOrderSubmitSuccess }: { onOrderSubmitSuccess?: () => void }) => {
  const context = useContext(OrderContext);
  const employeeContext = useContext(EmployeeContext); // Access EmployeeContext
  const router = useRouter();
  const [isRushOrder, setIsRushOrder] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountName, setDiscountName] = useState<string>('');
  const [validatingDiscount, setValidatingDiscount] = useState<boolean>(false);
  const { addToast } = useToast();

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
    'Order Notes',
    'Mark as Rush Order',
    'Discount Code',
    'Apply Discount',
    'Remove Discount',
    'Validating...',
    'Discount Applied',
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
    orderNotes: translatedTexts[13] || 'Order Notes',
    markAsRushOrder: translatedTexts[14] || 'Mark as Rush Order',
    discountCode: translatedTexts[15] || 'Discount Code',
    applyDiscount: translatedTexts[16] || 'Apply Discount',
    removeDiscount: translatedTexts[17] || 'Remove Discount',
    validating: translatedTexts[18] || 'Validating...',
    discountApplied: translatedTexts[19] || 'Discount Applied',
  };

  if (!context || !employeeContext) {
    throw new Error('OrderPane must be used within an OrderProvider and EmployeeProvider');
  }

  const { user } = employeeContext; // Get user from EmployeeContext
  const { order, setOrder, totalPrice } = context;

  // Calculate final price with discount
  const finalPrice = Math.max(0, totalPrice - discountAmount);

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

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      addToast({ message: 'Please enter a discount code', type: 'error' });
      return;
    }

    setValidatingDiscount(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/discounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode.trim().toUpperCase(),
          order_total: totalPrice,
        }),
      });

      const data = await response.json();

      if (data.valid && data.discount) {
        setDiscountAmount(data.discount_amount);
        setDiscountName(data.discount.name);
        addToast({ message: `${t.discountApplied}: ${data.discount.name}`, type: 'success' });
      } else {
        setDiscountAmount(0);
        setDiscountName('');
        addToast({ message: data.error || 'Invalid discount code', type: 'error' });
      }
    } catch (error) {
      console.error('Error validating discount:', error);
      addToast({ message: 'Error validating discount code', type: 'error' });
      setDiscountAmount(0);
      setDiscountName('');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountName('');
  };

  const handleSubmitOrder = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_items: order,
          rush_order: isRushOrder,
          order_notes: orderNotes,
          staff_id: user?.id,
          discount_code: discountCode.trim() || undefined,
        }),
      });

              if (response.ok) {

                addToast({ message: t.successMessage, type: 'success' });

                setOrder([]);
                setIsRushOrder(false);
                setOrderNotes('');
                setDiscountCode('');
                setDiscountAmount(0);
                setDiscountName('');

                localStorage.removeItem('order');

                if (onOrderSubmitSuccess) {

                  onOrderSubmitSuccess();

                } else {

                  router.push('/meal-type-selection');

                }

              } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Order submission failed:', errorData);
        addToast({ message: `${t.failMessage} ${errorData.error ? `
Error: ${errorData.error}` : ''}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      addToast({ message: t.errorMessage, type: 'error' });
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
            <p className="text-2xl font-bold mb-2" role="status" aria-live="polite">
              {t.total}: <span aria-label={`Subtotal ${totalPrice.toFixed(2)} dollars`}>${totalPrice.toFixed(2)}</span>
            </p>

            {/* Discount Code Section */}
            <div className="mb-4">
              {!discountAmount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleValidateDiscount();
                      }
                    }}
                    placeholder="Enter discount code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Discount code input"
                  />
                  <button
                    onClick={handleValidateDiscount}
                    disabled={validatingDiscount || !discountCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed button-press"
                  >
                    {validatingDiscount ? t.validating : t.applyDiscount}
                  </button>
                </div>
              ) : (
                <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">{discountName}</p>
                      <p className="text-lg font-bold text-green-700">
                        Discount: -${discountAmount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-red-600 hover:text-red-800 button-press"
                      aria-label="Remove discount"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {discountAmount > 0 && (
              <p className="text-2xl font-bold mb-4 text-green-700" role="status" aria-live="polite">
                Final Total: <span aria-label={`Final total ${finalPrice.toFixed(2)} dollars`}>${finalPrice.toFixed(2)}</span>
              </p>
            )}
            <div className="mb-4">
              <label htmlFor="order-notes" className="block text-lg font-semibold text-gray-700 mb-2">
                {t.orderNotes}:
              </label>
              <textarea
                id="order-notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Enter any special instructions or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                aria-label="Order notes input field"
              />
            </div>
            <div className="flex items-center justify-end gap-3 mb-4">
              <input
                type="checkbox"
                id="rush-order"
                checked={isRushOrder}
                onChange={(e) => setIsRushOrder(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                aria-label="Mark order as rush order"
              />
              <label htmlFor="rush-order" className="text-lg font-semibold text-gray-700 cursor-pointer">
                {t.markAsRushOrder}
              </label>
            </div>
            <button
              onClick={handleSubmitOrder}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-xl mt-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTranslating || order.length === 0}
              aria-label={`Submit order with ${order.length} item${order.length !== 1 ? 's' : ''}, total ${finalPrice.toFixed(2)} dollars`}
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
