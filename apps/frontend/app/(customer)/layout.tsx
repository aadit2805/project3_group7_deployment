'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // Import useRouter and usePathname
import LanguageSelector from '@/app/components/LanguageSelector';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { translatedTexts } = useTranslatedTexts(['Home', 'Customer Kiosk']);
  const homeText = translatedTexts[0] || 'Home';
  const kioskText = translatedTexts[1] || 'Customer Kiosk';

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if customerToken exists in localStorage
    const customerToken = localStorage.getItem('customerToken');

    // If no token and not already on the rewards-login page, and not on a guest-accessible page, redirect to rewards-login
    if (!customerToken && pathname !== '/rewards-login' && pathname !== '/customer-kiosk') {
      router.push('/rewards-login');
    }
  }, [pathname, router]); // Re-run effect if pathname or router changes

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {homeText}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{kioskText}</h1>
        </div>
        <LanguageSelector showLabel={false} />
      </div>
      {children}
    </div>
  );
}
