'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Route guard component that runs before any dashboard component mounts.
 * If unauthenticated, immediately redirects to /signin.
 */
export function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isAuth = auth.isAuthenticated();
    if (!isAuth) {
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/signin?from=${returnUrl}`);
    } else {
      setChecked(true);
    }
  }, [router, pathname]);

  if (!checked) {
    return (
      <div style={{ background: '#f5f1e4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0dbce', borderTopColor: '#8ed462', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ fontSize: '14px', color: '#80827f' }}>Verifying session...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
