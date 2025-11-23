'use client';

import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

interface EmployeeContextType {
  user: User | null;
}

export const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
