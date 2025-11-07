'use client';

import React, { Suspense } from 'react';

export default function CustomerKioskLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
