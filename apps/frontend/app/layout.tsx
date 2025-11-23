import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OrderProvider } from './context/OrderContext';
import { TranslationProvider } from './context/TranslationContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import AccessibilityMenu from './components/AccessibilityMenu';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project 3 - Group 7',
  description: 'Next.js 15 + TypeScript Frontend - Restaurant Ordering System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AccessibilityProvider>
          <TranslationProvider>
            <OrderProvider>
              <main id="main-content">{children}</main>
              <AccessibilityMenu />
            </OrderProvider>
          </TranslationProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
