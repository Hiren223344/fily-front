'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.subscribe(({ user: u }) => setUser(u));
    if (!auth.isResolved()) auth.fetchMe();
    return unsub;
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isDashboardPage =
    variant === 'dashboard' ||
    (variant === 'auto' &&
      (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/endpoints') ||
        pathname.startsWith('/billing') ||
        pathname.startsWith('/api-keys') ||
        pathname.startsWith('/playground')));

  const signedIn = Boolean(user);

  const navLinks = isDashboardPage ? (
    <>
      <Link href="/dashboard" style={linkStyle(pathname === '/dashboard')} onClick={() => setMobileOpen(false)}>Overview</Link>
      <Link href="/models" style={linkStyle(pathname === '/models')} onClick={() => setMobileOpen(false)}>Models</Link>
      <Link href="/endpoints" style={linkStyle(pathname === '/endpoints')} onClick={() => setMobileOpen(false)}>Endpoints</Link>
      <Link href="/api-keys" style={linkStyle(pathname === '/api-keys')} onClick={() => setMobileOpen(false)}>API Keys</Link>
      <Link href="/playground" style={linkStyle(pathname === '/playground')} onClick={() => setMobileOpen(false)}>Playground</Link>
      <Link href="/billing" style={linkStyle(pathname === '/billing')} onClick={() => setMobileOpen(false)}>Billing</Link>
    </>
  ) : (
    <>
      <Link href="/models" style={linkStyle(pathname === '/models')} onClick={() => setMobileOpen(false)}>Models</Link>
      <Link href="/playground" style={linkStyle(pathname === '/playground')} onClick={() => setMobileOpen(false)}>Playground</Link>
      <Link href="/#pricing" style={linkStyle(false)} onClick={() => setMobileOpen(false)}>Pricing</Link>
      <Link href="/docs" style={linkStyle(pathname === '/docs')} onClick={() => setMobileOpen(false)}>Docs</Link>
      <Link href="/startups" style={linkStyle(pathname === '/startups')} onClick={() => setMobileOpen(false)}>Startups</Link>
    </>
  );

  const authActions = signedIn ? (
    <>
      <Link
        href="/api-keys"
        onClick={() => setMobileOpen(false)}
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
        onClick={() => {
          setMobileOpen(false);
          auth.logout();
        }}
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
        onClick={() => setMobileOpen(false)}
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
        onClick={() => setMobileOpen(false)}
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
  );

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

          <div className="nav-links" style={{ gap: '20px', fontSize: '15px', fontWeight: 500, alignItems: 'center' }}>
            {navLinks}
          </div>

          <div className="nav-actions" style={{ alignItems: 'center', gap: '10px', position: 'relative' }}>
            {authActions}
          </div>

          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              background: '#f5f1e4',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              color: '#2c2e2a',
              flexShrink: 0,
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div
          className={`nav-mobile-panel${mobileOpen ? ' is-open' : ''}`}
          style={{
            flexDirection: 'column',
            gap: '16px',
            background: '#ffffff',
            borderRadius: '28px',
            padding: '20px',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '16px', fontWeight: 500 }}>
            {navLinks}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e0dbce' }}>
            {authActions}
          </div>
        </div>
      </div>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
}

export default Nav;
