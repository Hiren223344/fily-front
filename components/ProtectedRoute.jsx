'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !userId) {
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/signin?redirect_url=${returnUrl}`);
    }
  }, [isLoaded, userId, router, pathname]);

  if (!isLoaded) {
    return (
      <div style={{ background: '#f5f1e4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0dbce', borderTopColor: '#8ed462', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ fontSize: '14px', color: '#80827f' }}>Authenticating session...</div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
