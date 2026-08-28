'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

export function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    let active = true;
    auth.fetchMe().then((user) => {
      if (!active) return;
      if (user) {
        setStatus('ok');
      } else {
        setStatus('denied');
        const returnUrl = encodeURIComponent(pathname || '/dashboard');
        router.replace(`/signin?redirect_url=${returnUrl}`);
      }
    });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (status === 'loading') {
    return (
      <div style={{ background: '#f5f1e4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0dbce', borderTopColor: '#8ed462', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ fontSize: '14px', color: '#80827f' }}>Authenticating session...</div>
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;

  return <>{children}</>;
}

export default ProtectedRoute;
