'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';

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
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);

  if (!context) {
    throw new Error('CustomerKiosk must be used within an OrderProvider');
  }

  const { order, setOrder } = context;

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!mealTypeId) {
      router.push('/meal-type-selection');
    }
  }, [mealTypeId, router]);

  useEffect(() => {
    if (mealTypeId) {
      const fetchMealTypeAndMenuItems = async () => {
        try {
          const mealTypeRes = await fetch(`http://localhost:3001/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          const menuItemsRes = await fetch(`http://localhost:3001/api/menu-items`);
          const menuItemsData: MenuItem[] = await menuItemsRes.json();
          setMenuItems(menuItemsData);

          if (editIndex !== null) {
            const index = parseInt(editIndex, 10);
            if (order[index] && order[index].mealType.meal_type_id === parseInt(mealTypeId, 10)) {
              setSelectedEntrees(order[index].entrees);
              setSelectedSides(order[index].sides);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId, editIndex, order]);

  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side') => {
    if (type === 'entree') {
      if (selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id)) {
        setSelectedEntrees(selectedEntrees.filter((e) => e.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedEntrees.length < selectedMealType.entree_count) {
        setSelectedEntrees([...selectedEntrees, item]);
      }
    } else if (type === 'side') {
      if (selectedSides.some((s) => s.menu_item_id === item.menu_item_id)) {
        setSelectedSides(selectedSides.filter((s) => s.menu_item_id !== item.menu_item_id));
      } else if (selectedMealType && selectedSides.length < selectedMealType.side_count) {
        setSelectedSides([...selectedSides, item]);
      }
    }
  };

  const handleAddOrUpdateOrder = () => {
    if (selectedMealType) {
      const newOrderItem: OrderItem = {
        mealType: selectedMealType,
        entrees: selectedEntrees,
        sides: selectedSides,
      };

      const newOrder = [...order];
      if (editIndex !== null) {
        const index = parseInt(editIndex, 10);
        newOrder[index] = newOrderItem;
      } else {
        newOrder.push(newOrderItem);
      }
      setOrder(newOrder);
      setSelectedEntrees([]);
      setSelectedSides([]);
      router.push('/meal-type-selection');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedMealType && (
        <>
          <h1 className="text-4xl font-bold text-center mb-8">
            Customize Your {selectedMealType.meal_type_name}
          </h1>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              Select Entrees ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'entree')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'entree')}
                  >
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">
              Select Sides ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => item.item_type === 'side')
                .map((item) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 ${selectedSides.some((s) => s.menu_item_id === item.menu_item_id) ? 'border-blue-500' : 'border-gray-200'}`}
                    onClick={() => handleSelectItem(item, 'side')}
                  >
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-700">Upcharge: ${item.upcharge.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </section>

          <div className="text-center mb-8">
            <button
              onClick={handleAddOrUpdateOrder}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xl"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count)
              }
            >
              {editIndex !== null ? 'Update Item' : 'Add to Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerKiosk;
