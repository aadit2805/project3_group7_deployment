'use client';

import { useEmployee } from '@/app/context/EmployeeContext';
import Link from 'next/link';

const DashboardCard = ({ href, title, description, index }: { href: string, title: string, description: string, index: number }) => (
  <Link 
    href={href} 
    className={`block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}
  >
    <h2 className="mb-2 text-xl font-semibold text-gray-800">
      {title}
    </h2>
    <p className="text-gray-600">
      {description}
    </p>
  </Link>
);

export default function DashboardPage() {
  const { user } = useEmployee();

  // Collect all cards to render with proper indexing for stagger animations
  const allCards: Array<{ href: string, title: string, description: string }> = [];
  
  if (user?.role === 'MANAGER' || user?.role === 'CASHIER') {
    allCards.push(
      { href: "/cashier-interface", title: "Cashier Interface", description: "Process customer orders." },
      { href: "/kitchen-monitor", title: "Kitchen Monitor", description: "View and manage incoming orders." }
    );
  }
  
  if (user?.role === 'MANAGER') {
    allCards.push(
      { href: "/manager", title: "Manager Dashboard", description: "Manage menu items and orders." },
      { href: "/manager/employees", title: "Employee Management", description: "Manage employee roles and access." },
      { href: "/inventory-manager", title: "Inventory Manager", description: "Manage food and non-food inventory." },
      { href: "/restock-report", title: "Restock Report", description: "Generate a list of items to restock." },
      { href: "/manager/revenue-reports", title: "Revenue Reports", description: "View daily revenue and performance." },
      { href: "/manager/order-analytics", title: "Order Analytics", description: "Analyze order completion times." },
      { href: "/manager/best-selling", title: "Best-Selling Items", description: "See which items sell best." }
    );
  }

  // Prepared Orders is available to all employees
  allCards.push(
    { href: "/prepared-orders", title: "Prepared Orders", description: "View and mark prepared orders as addressed." }
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8 animate-slide-in-down">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || user?.email}</h1>
        <p className="text-gray-600 mt-1 animate-fade-in animate-stagger-1">
          Select an action to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allCards.map((card, index) => (
          <DashboardCard 
            key={card.href}
            href={card.href} 
            title={card.title} 
            description={card.description}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
