export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Project 3 - Group 7
        </h1>
        <p className="text-center text-lg mb-4">
          Next.js 15 + TypeScript Frontend
        </p>
        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Next.js 15 with App Router</li>
            <li>TypeScript for type safety</li>
            <li>Tailwind CSS for styling</li>
            <li>ESLint for code quality</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

