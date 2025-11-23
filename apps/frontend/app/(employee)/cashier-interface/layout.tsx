'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OrderPane from '@/app/components/OrderPane';
import LanguageSelector from '@/app/components/LanguageSelector';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleCashierOrderSubmitSuccess = () => {
    router.push('/cashier-interface');
  };
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Cashier Interface</h1>
        <LanguageSelector showLabel={false} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 overflow-y-auto">{children}</div>
        <OrderPane onOrderSubmitSuccess={handleCashierOrderSubmitSuccess} />
      </div>
    </div>
  );
}

