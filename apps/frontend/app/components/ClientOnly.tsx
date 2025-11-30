'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: () => ReactNode; // Expect a function that returns ReactNode
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children()}</>; // Call children as a function
};

export default ClientOnly;
