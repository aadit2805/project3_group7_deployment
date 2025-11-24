import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-lg animate-fade-in">
        <h1 className="mb-6 text-center text-4xl font-bold text-gray-800 animate-slide-in-down">
          Panda Express POS System
        </h1>
        <p className="mb-10 text-center text-lg text-gray-600 animate-fade-in animate-stagger-1">
          Select an interface to continue
        </p>

        <nav aria-label="Main navigation">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Public Access Section */}
            <section className="rounded-lg border border-gray-200 p-6 animate-scale-in animate-stagger-2 hover-scale" aria-labelledby="public-access-heading">
              <h2 id="public-access-heading" className="mb-4 text-2xl font-semibold text-gray-700">
                Public Access
              </h2>
              <p className="mb-6 text-gray-500">
                For customers to place their orders.
              </p>
              <Link
                href="/customer-kiosk"
                className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg button-press focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Navigate to customer ordering kiosk"
              >
                Go to Customer Kiosk
              </Link>
            </section>

            {/* Employee Access Section */}
            <section className="rounded-lg border border-gray-200 p-6 animate-scale-in animate-stagger-3 hover-scale" aria-labelledby="employee-access-heading">
              <h2 id="employee-access-heading" className="mb-4 text-2xl font-semibold text-gray-700">
                Employee Access
              </h2>
              <p className="mb-6 text-gray-500">
                Login required for employee roles.
              </p>
              <Link
                href="/dashboard"
                className="block w-full rounded-md bg-green-600 px-4 py-3 text-center font-semibold text-white transition-all duration-200 hover:bg-green-700 hover:shadow-lg button-press focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Navigate to employee dashboard (requires login)"
              >
                Go to Employee Dashboard
              </Link>
            </section>
          </div>
        </nav>

        <footer className="mt-8 text-center">
          <Link
            href="/accessibility"
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            View Accessibility Statement
          </Link>
        </footer>
      </div>
    </main>
  );
}
