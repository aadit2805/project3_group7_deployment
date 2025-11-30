// apps/frontend/app/components/Toast.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Importing icons

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number; // Duration in milliseconds
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColorClass = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const textColorClass = type === 'success' ? 'text-green-800' : 'text-red-800';
  const iconColorClass = type === 'success' ? 'text-green-500' : 'text-red-500';

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow ${bgColorClass} ${textColorClass}`}
      role="alert"
    >
      {type === 'success' ? (
        <CheckCircleIcon className={`w-6 h-6 ${iconColorClass}`} />
      ) : (
        <ExclamationCircleIcon className={`w-6 h-6 ${iconColorClass}`} />
      )}
      <div className="ml-3 text-sm font-normal flex-grow">{message}</div>
      <button
        type="button"
        className={`ml-auto -mx-1.5 -my-1.5 ${textColorClass} rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8`}
        data-dismiss-target="#toast-success"
        aria-label="Close"
        onClick={() => {
          setIsVisible(false);
          onClose();
        }}
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
