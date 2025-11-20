
'use client';

import { useState } from 'react';
import MenuItemsList from './MenuItemsList';

const ITEM_TYPES = ['entree', 'side', 'drink'];

export default function FilterableMenuItems() {
  const [filter, setFilter] = useState<string | null>(null);

  return (
    <div>
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-colors`}
        >
          All
        </button>
        {ITEM_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            {type}
          </button>
        ))}
      </div>
      <MenuItemsList filter={filter} />
    </div>
  );
}
