'use client';

import { useEmployee } from '@/app/context/EmployeeContext';
import Link from 'next/link';

const DashboardCard = ({ href, title, description }: { href: string, title: string, description: string }) => (
  <Link href={href} className="block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || user?.email}</h1>
        <p className="text-gray-600 mt-1">
          Select an action to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cashier & Manager Links */}
        {(user?.role === 'MANAGER' || user?.role === 'CASHIER') && (
          <>
            <DashboardCard href="/cashier-interface" title="Cashier Interface" description="Process customer orders." />
            <DashboardCard href="/kitchen-monitor" title="Kitchen Monitor" description="View and manage incoming orders." />
          </>
        )}

        {/* Manager Only Links */}
        {user?.role === 'MANAGER' && (
          <>
            <DashboardCard href="/manager" title="Manager Dashboard" description="Manage menu items and orders." />
            <DashboardCard href="/manager/employees" title="Employee Management" description="Manage employee roles and access." />
            <DashboardCard href="/inventory-manager" title="Inventory Manager" description="Manage food and non-food inventory." />
            <DashboardCard href="/restock-report" title="Restock Report" description="Generate a list of items to restock." />
            <DashboardCard href="/manager/revenue-reports" title="Revenue Reports" description="View daily revenue and performance." />
            <DashboardCard href="/manager/order-analytics" title="Order Analytics" description="Analyze order completion times." />
            <DashboardCard href="/manager/best-selling" title="Best-Selling Items" description="See which items sell best." />
          </>
        )}
      </div>
    </div>
  );
}
