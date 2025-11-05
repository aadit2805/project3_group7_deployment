'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

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
}

interface OrderContextType {
  order: OrderItem[];
  setOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  totalPrice: number;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const savedOrder = localStorage.getItem('order');
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(order));
    const calculateTotalPrice = () => {
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
        return acc + mealPrice + entreesUpcharge + sidesUpcharge;
      }, 0);
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [order]);

  return (
    <OrderContext.Provider value={{ order, setOrder, totalPrice }}>
      {children}
    </OrderContext.Provider>
  );
};
