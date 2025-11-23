'use client';

interface FormErrorProps {
  id: string;
  error?: string;
  className?: string;
}

/**
 * Accessible form error message component
 * Displays validation errors with proper ARIA attributes
 */
export default function FormError({ id, error, className = '' }: FormErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`mt-1 text-sm text-red-600 ${className}`}
    >
      <span className="font-semibold">Error: </span>
      {error}
    </div>
  );
}

