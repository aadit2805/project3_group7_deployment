// apps/frontend/app/components/ToastContainer.tsx
"use client";
import React, { useState, createContext, useCallback, ReactNode } from 'react';
import Toast, { ToastProps } from '../components/Toast'; // Keep Toast for rendering

interface ToastWithId extends ToastProps {
  id: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'onClose'>) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const removeToast = useCallback((toastId: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  }, []);

  const addToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const newId = Date.now() + Math.random();
    const newToast: ToastWithId = { ...toast, id: newId, onClose: () => removeToast(newId) };
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
