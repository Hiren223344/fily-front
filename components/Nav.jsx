'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ApiKeyModal } from './ApiKeyModal';

const linkStyle = (active) => ({
  color: active ? '#2c2e2a' : '#80827f',
  borderBottom: 'none',
  textDecoration: 'none',
});

export function Nav({ variant = 'auto' }) {
  const pathname = usePathname();
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.subscribe(({ user: u }) => setUser(u));
    if (!auth.isResolved()) auth.fetchMe();
    return unsub;
  }, []);

  const isDashboardPage =
    variant === 'dashboard' ||
    (variant === 'auto' &&
      (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/endpoints') ||
        pathname.startsWith('/billing') ||
        pathname.startsWith('/api-keys') ||
        pathname.startsWith('/playground')));

  const signedIn = Boolean(user);

  return (
    <>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '50px',
            padding: '10px 14px 10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: 'none', textDecoration: 'none' }}>
              <img src="/uploads/logoipsum-392.png" alt="FilyBase logo" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'block' }} />
              <span style={{ fontSize: '17px', fontWeight: 500, color: '#2c2e2a' }}>FilyBase</span>
            </Link>
          </div>

          {isDashboardPage ? (
            <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 500, alignItems: 'center' }}>
              <Link href="/dashboard" style={linkStyle(pathname === '/dashboard')}>Overview</Link>
              <Link href="/models" style={linkStyle(pathname === '/models')}>Models</Link>
              <Link href="/endpoints" style={linkStyle(pathname === '/endpoints')}>Endpoints</Link>
              <Link href="/api-keys" style={linkStyle(pathname === '/api-keys')}>API Keys</Link>
              <Link href="/playground" style={linkStyle(pathname === '/playground')}>Playground</Link>
              <Link href="/billing" style={linkStyle(pathname === '/billing')}>Billing</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 500, alignItems: 'center' }}>
              <Link href="/models" style={linkStyle(pathname === '/models')}>Models</Link>
              <Link href="/playground" style={linkStyle(pathname === '/playground')}>Playground</Link>
              <Link href="/#pricing" style={linkStyle(false)}>Pricing</Link>
              <Link href="/docs" style={linkStyle(pathname === '/docs')}>Docs</Link>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {signedIn ? (
              <>
                <Link
                  href="/api-keys"
                  style={{
                    background: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#2c2e2a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  API Keys
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8ed462', display: 'inline-block' }}></span>
                </Link>
                <button
                  type="button"
                  onClick={() => auth.logout()}
                  title={user?.email || 'Sign out'}
                  style={{
                    background: '#2c2e2a',
                    color: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  style={{
                    background: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '11px 20px',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#2c2e2a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  Get API key
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ba0ff', display: 'inline-block' }}></span>
                </Link>
                <Link
                  href="/signin"
                  style={{
                    background: '#2c2e2a',
                    color: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '11px 20px',
                    fontSize: '15px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
}

export default Nav;
