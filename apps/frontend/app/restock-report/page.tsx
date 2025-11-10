'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const RestockReport = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [nonFoodItems, setNonFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestockReport = async () => {
      try {
        const res = await fetch('/api/inventory/restock-report');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setFoodItems(data.food);
        setNonFoodItems(data.non_food);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestockReport();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading restock report...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            ← Back to Dashboard
          </button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Restock Report</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Food Items Below 20 Stock</h2>
        {foodItems.length === 0 ? (
          <p>No food items currently require restocking.</p>
        ) : (
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Current Stock</th>
                <th className="text-left p-3 font-semibold">Storage</th>
              </tr>
            </thead>
            <tbody>
              {foodItems.map((item: any) => (
                <tr key={item.inventory_id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.menu_items.name}</td>
                  <td className="p-3">{item.stock}</td>
                  <td className="p-3">{item.storage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Non-Food Items Below 80 Stock</h2>
        {nonFoodItems.length === 0 ? (
          <p>No non-food items currently require restocking.</p>
        ) : (
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {nonFoodItems.map((item: any) => (
                <tr key={item.supply_id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RestockReport;
