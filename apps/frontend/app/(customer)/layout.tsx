'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import LanguageSelector from '@/app/components/LanguageSelector';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';
import ClientOnly from '@/app/components/ClientOnly';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { translatedTexts } = useTranslatedTexts(['Home', 'Customer Kiosk', 'My Profile']);
  const homeText = translatedTexts[0] || 'Home';
  const kioskText = translatedTexts[1] || 'Customer Kiosk';
  const myProfileText = translatedTexts[2] || 'My Profile';

  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerId');
    // Optionally remove other customer-related data if stored
    router.push('/rewards-login'); // Redirect to login page
  };

  useEffect(() => {
    // Check if customerToken exists in localStorage
    const customerToken = localStorage.getItem('customerToken');

    // If no token and not already on the rewards-login page, and not on a guest-accessible page, redirect to rewards-login
    if (!customerToken && pathname !== '/rewards-login' && pathname !== '/customer-kiosk' && pathname !== '/meal-type-selection' && pathname !== '/shopping-cart' && pathname !== '/a-la-carte' && pathname !== '/drinks') {
      router.push('/rewards-login');
    }
  }, [pathname, router]); // Re-run effect if pathname or router changes

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 sm:px-6 sm:py-3 flex flex-wrap justify-center sm:justify-between items-center gap-y-2">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            aria-label={homeText}
          >
            <Tooltip text={homeText} position="bottom">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Tooltip>
            {homeText}
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{kioskText}</h1>
        </div>
        <div className="flex items-center gap-4">
          <ClientOnly>
            {() => {
              const customerToken = localStorage.getItem('customerToken');
              return customerToken ? (
                <>
                  <Link
                    href="/my-profile"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm inline-flex items-center"
                  >
                    {myProfileText}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm inline-flex items-center"
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
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      ></path>
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/rewards-login"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm inline-flex items-center"
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
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Login
                </Link>
              );
            }}
          </ClientOnly>
          <LanguageSelector showLabel={false} />
        </div>
      </div>
      {children}
    </div>
  );
}
