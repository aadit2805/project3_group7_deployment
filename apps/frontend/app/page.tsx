import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <h1 className="mb-6 text-center text-4xl font-bold text-gray-800 dark:text-white">
          Panda Express POS System
        </h1>
        <p className="mb-10 text-center text-lg text-gray-600 dark:text-gray-300">
          Select an interface to continue
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Public Access Section */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Public Access
            </h2>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              For customers to place their orders.
            </p>
            <Link
              href="/customer-kiosk"
              className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Customer Kiosk
            </Link>
          </div>

          {/* Employee Access Section */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Employee Access
            </h2>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Login required for employee roles.
            </p>
            <Link
              href="/dashboard"
              className="block w-full rounded-md bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Go to Employee Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
