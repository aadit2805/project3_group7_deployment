
'use client';

import React, { useState, useEffect } from 'react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

const CustomerKiosk = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/menu-items');
        const data = await res.json();
        console.log(data);
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold text-center my-8">Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
            <p className="text-gray-700">{typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'Price not available'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerKiosk;
