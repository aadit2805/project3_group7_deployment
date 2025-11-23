'use client';

import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';

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

export interface OrderItem {
  mealType: MealType;
  entrees: MenuItem[];
  sides: MenuItem[];
  drink?: MenuItem;
}

interface OrderContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  totalPrice: number;
  addToOrder: (item: OrderItem) => void;
  removeFromOrder: (index: number) => void;
  clearOrder: () => void;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const previousOrderLength = useRef(0);

  useEffect(() => {
    const savedOrder = localStorage.getItem('order');
    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      setOrder(parsedOrder);
      previousOrderLength.current = parsedOrder.length;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(order));
    const total = order.reduce((acc, orderItem) => {
      const mealPrice = orderItem.mealType.meal_type_price;
      const entreesUpcharge = orderItem.entrees.reduce(
        (upchargeAcc, entree) => upchargeAcc + entree.upcharge,
        0
      );
      const sidesUpcharge = orderItem.sides.reduce(
        (upchargeAcc, side) => upchargeAcc + side.upcharge,
        0
      );
      const drinkUpcharge = orderItem.drink ? orderItem.drink.upcharge : 0;
      return acc + mealPrice + entreesUpcharge + sidesUpcharge + drinkUpcharge;
    }, 0);
    setTotalPrice(total);

    // Announce order changes to screen readers
    if (order.length > previousOrderLength.current) {
      const newItem = order[order.length - 1];
      setAnnouncement(
        `Added ${newItem.mealType.meal_type_name} to cart. Cart now has ${order.length} item${order.length !== 1 ? 's' : ''}. Total is $${total.toFixed(2)}`
      );
    } else if (order.length < previousOrderLength.current) {
      setAnnouncement(
        `Item removed from cart. Cart now has ${order.length} item${order.length !== 1 ? 's' : ''}. Total is $${total.toFixed(2)}`
      );
    } else if (order.length === 0 && previousOrderLength.current > 0) {
      setAnnouncement('Cart cleared. Cart is now empty.');
    }

    previousOrderLength.current = order.length;
  }, [order]);

  const addToOrder = (item: OrderItem) => {
    setOrder((prevOrder) => [...prevOrder, item]);
  };

  const removeFromOrder = (index: number) => {
    setOrder((prevOrder) => prevOrder.filter((_, i) => i !== index));
  };

  const clearOrder = () => {
    setOrder([]);
  };

  return (
    <OrderContext.Provider 
      value={{ 
        order, 
        setOrder, 
        totalPrice, 
        addToOrder, 
        removeFromOrder, 
        clearOrder 
      }}
    >
      {children}
      {/* Screen reader announcement region for order updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </OrderContext.Provider>
  );
};
