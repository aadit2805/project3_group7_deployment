'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OrderPane from '@/app/components/OrderPane';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleCashierOrderSubmitSuccess = () => {
    router.push('/cashier-interface');
  };
  return (
    <div className="flex">
      <div className="w-2/3">{children}</div>
      <OrderPane onOrderSubmitSuccess={handleCashierOrderSubmitSuccess} />
    </div>
  );
}

