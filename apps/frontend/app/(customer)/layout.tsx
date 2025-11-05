'use client';

import React from 'react';
import OrderPane from '@/app/components/OrderPane';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="w-2/3">{children}</div>
      <OrderPane />
    </div>
  );
}
