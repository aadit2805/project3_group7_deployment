
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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

const CustomerKiosk = () => {
  const searchParams = useSearchParams();
  const mealTypeId = searchParams.get('mealTypeId');

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (mealTypeId) {
      const fetchMealTypeAndMenuItems = async () => {
        try {
          // Fetch meal type details
          const mealTypeRes = await fetch(`http://localhost:3001/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          // Fetch all menu items
          const menuItemsRes = await fetch(`http://localhost:3001/api/menu-items`);
          const menuItemsData: MenuItem[] = await menuItemsRes.json();
          setMenuItems(menuItemsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId]);

  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side') => {
    if (type === 'entree') {
      if (selectedEntrees.some(e => e.menu_item_id === item.menu_item_id)) {
        setSelectedEntrees(selectedEntrees.filter(e => e.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedEntrees.length < selectedMealType.entree_count) {
        setSelectedEntrees([...selectedEntrees, item]);
      }
    } else if (type === 'side') {
      if (selectedSides.some(s => s.menu_item_id === item.menu_item_id)) {
        setSelectedSides(selectedSides.filter(s => s.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedSides.length < selectedMealType.side_count) {
        setSelectedSides([...selectedSides, item]);
      }
    }
  };

  if (!mealTypeId || !selectedMealType) {
    return (
      <div className="container mx-auto px-4 text-center py-10">
        <h1 className="text-3xl font-bold">Please select a meal type first.</h1>
        <p className="text-lg mt-4"><a href="/meal-type-selection" className="text-blue-500 hover:underline">Go to Meal Type Selection</a></p>
      </div>
    );
  }

  const entrees = menuItems.filter(item => item.item_type === 'entree');
  const sides = menuItems.filter(item => item.item_type === 'side');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Customize Your {selectedMealType.meal_type_name}</h1>

      {/* Entree Selection */}
      <section className="mb-10">
        <h2 className="text-3xl font-semibold mb-4">Select Entrees ({selectedEntrees.length}/{selectedMealType.entree_count})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entrees.map((item) => (
            <div
              key={item.menu_item_id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedEntrees.some(e => e.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
              onClick={() => handleSelectItem(item, 'entree')}
            >
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Side Selection */}
      <section className="mb-10">
        <h2 className="text-3xl font-semibold mb-4">Select Sides ({selectedSides.length}/{selectedMealType.side_count})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sides.map((item) => (
            <div
              key={item.menu_item_id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedSides.some(s => s.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
              onClick={() => handleSelectItem(item, 'side')}
            >
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Order Summary */}
      <section>
        <h2 className="text-3xl font-semibold mb-4">Your Order Summary</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold mb-2">{selectedMealType.meal_type_name}</h3>
          <p>Base Price: ${selectedMealType.meal_type_price.toFixed(2)}</p>
          <h4 className="text-xl font-semibold mt-4">Entrees:</h4>
          {selectedEntrees.length > 0 ? (
            <ul>
              {selectedEntrees.map(item => (
                <li key={item.menu_item_id}>{item.name} (+${item.upcharge.toFixed(2)})</li>
              ))}
            </ul>
          ) : (
            <p>No entrees selected.</p>
          )}
          <h4 className="text-xl font-semibold mt-4">Sides:</h4>
          {selectedSides.length > 0 ? (
            <ul>
              {selectedSides.map(item => (
                <li key={item.menu_item_id}>{item.name} (+${item.upcharge.toFixed(2)})</li>
              ))}
            </ul>
          ) : (
            <p>No sides selected.</p>
          )}
          {selectedMealType.drink_size && (
            <p className="text-xl font-semibold mt-4">Drink: {selectedMealType.drink_size}</p>
          )}
          {/* Total calculation can be added here */}
        </div>
      </section>
    </div>
  );
};

export default CustomerKiosk;
