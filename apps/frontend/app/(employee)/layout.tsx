'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Monitor, LayoutDashboard, UserCog, BarChart2, LogOut } from 'lucide-react';
import { EmployeeContext } from '@/app/context/EmployeeContext';
import { ToastProvider } from '@/app/components/ToastContainer';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

const EmployeeLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Not authenticated');
        const userData = await res.json();
        if (!['CASHIER', 'MANAGER'].includes(userData.role)) {
          throw new Error('Access denied');
        }
        setUser(userData);
        console.log('Logged in employee data:', userData); // Add this line for debugging
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const cashierLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cashier-interface', label: 'Cashier', icon: ClipboardList },
    { href: '/kitchen-monitor', label: 'Kitchen', icon: Monitor },
  ];

  const managerLinks = [
    { href: '/manager', label: 'Manager', icon: UserCog },
    { href: '/manager/employees', label: 'Employees', icon: UserCog },
    { href: '/manager/revenue-reports', label: 'Revenue', icon: BarChart2 },
  ];

  const navLinks = user?.role === 'MANAGER' ? [...cashierLinks, ...managerLinks] : cashierLinks;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <EmployeeContext.Provider value={{ user }}>
      <ToastProvider>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white animate-slide-in-down">
          <div className="h-16 flex items-center justify-center font-bold text-xl border-b border-gray-700 animate-fade-in">
            Panda Express POS System
          </div>
          <nav className="flex-1 px-2 py-4 space-y-2">
            {navLinks.map(({ href, label, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 hover-scale button-press animate-slide-in-up animate-stagger-${Math.min((index % 4) + 1, 4)} ${pathname.startsWith(href) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-gray-700 animate-fade-in animate-stagger-2">
            <div className="text-sm text-gray-400 mb-2">
              Signed in as <span className="font-semibold">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-left rounded-md text-gray-300 hover:bg-red-600 hover:text-white button-press transition-all duration-200"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="md:hidden flex justify-between items-center h-16 bg-white border-b px-4">
            <h1 className="text-xl font-bold">Panda Express POS System</h1>
            <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </header>

          {/* Mobile Nav */}
          {isMobileNavOpen && (
            <nav className="md:hidden bg-white border-b animate-slide-in-down">
              {navLinks.map(({ href, label, icon: Icon }, index) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center px-4 py-3 transition-all duration-200 hover-scale button-press animate-fade-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${pathname.startsWith(href) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </Link>
              ))}
              <div className="px-4 py-3 border-t">
                <div className="text-sm text-gray-500 mb-2">
                  Signed in as <span className="font-semibold">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </nav>
          )}

          <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in">{children}</main>
        </div>
      </div>
      </ToastProvider>
    </EmployeeContext.Provider>
  );
};

export default EmployeeLayout;
