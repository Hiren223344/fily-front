'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ApiKeyModal } from './ApiKeyModal';

export function Nav({ variant = 'auto' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [session, setSession] = useState({ isAuthenticated: false, user: null });

  useEffect(() => {
    return auth.subscribe((s) => {
      setSession(s);
    });
  }, []);

  const isDashboardPage =
    variant === 'dashboard' ||
    (variant === 'auto' &&
      (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/endpoints') ||
        pathname.startsWith('/billing') ||
        pathname.startsWith('/playground')));

  const initials = session.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'JD';

  return (
    <>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '50px',
            padding: '10px 10px 10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: 'none',
                textDecoration: 'none',
              }}
            >
              <img
                src="/uploads/logoipsum-392.png"
                alt="FilyBase logo"
                style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'block' }}
              />
              <span style={{ fontSize: '17px', fontWeight: 500, color: '#2c2e2a' }}>FilyBase</span>
            </Link>
          </div>

          {/* DASHBOARD NAV LINKS */}
          {isDashboardPage ? (
            <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 500, alignItems: 'center' }}>
              <Link
                href="/dashboard"
                style={{
                  color: pathname === '/dashboard' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Overview
              </Link>
              <Link
                href="/models"
                style={{
                  color: pathname === '/models' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Models
              </Link>
              <Link
                href="/endpoints"
                style={{
                  color: pathname === '/endpoints' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Endpoints
              </Link>
              <Link
                href="/playground"
                style={{
                  color: pathname === '/playground' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Playground
              </Link>
              <Link
                href="/billing"
                style={{
                  color: pathname === '/billing' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Billing
              </Link>
            </div>
          ) : (
            /* MARKETING NAV LINKS */
            <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: 500, alignItems: 'center' }}>
              <Link
                href="/models"
                style={{
                  color: pathname === '/models' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Models
              </Link>
              <Link
                href="/playground"
                style={{
                  color: pathname === '/playground' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Playground
              </Link>
              <Link
                href="/#pricing"
                style={{
                  color: '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                style={{
                  color: pathname === '/docs' ? '#2c2e2a' : '#80827f',
                  borderBottom: 'none',
                  textDecoration: 'none',
                }}
              >
                Docs
              </Link>
            </div>
          )}

          {/* RIGHT ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {/* Popover Menu Trigger for marketing pages */}
            {!isDashboardPage && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="menu-trigger"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#8ed462',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="menu"
                >
                  <div style={{ width: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ height: '2px', background: '#2c2e2a', borderRadius: '2px' }}></div>
                    <div style={{ height: '2px', background: '#2c2e2a', borderRadius: '2px' }}></div>
                  </div>
                </button>

                {/* Popover Dropdown Panel */}
                <div
                  className="menu-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 16px)',
                    right: 0,
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '8px',
                    minWidth: '540px',
                    border: '1px solid #e0dbce',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    zIndex: 150,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
                    pointerEvents: menuOpen ? 'auto' : 'none',
                    transition: 'opacity 260ms cubic-bezier(0.16,1,0.3,1), transform 260ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <Link
                    href="/docs#rate-limits"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Rate limits
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Terms
                  </Link>
                  <Link
                    href="/cookies"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Cookies
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/playground"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '16px', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Console
                  </Link>
                </div>
              </div>
            )}

            {/* Get API Key / Sign In button or Avatar */}
            {isDashboardPage ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#2ba0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 500,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title={session.user?.email || 'Jordan Diaz'}
                >
                  {initials}
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '8px',
                      minWidth: '220px',
                      border: '1px solid #e0dbce',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      zIndex: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e0dbce' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#2c2e2a' }}>
                        {session.user?.name || 'Jordan Diaz'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#80827f' }} className="mono">
                        {session.user?.email || 'jordan@filybase.ai'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setApiKeyModalOpen(true);
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: '14px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        color: '#2c2e2a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      Create API Key
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8ed462' }}></span>
                    </button>
                    <Link
                      href="/endpoints"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '12px', color: '#2c2e2a', textDecoration: 'none' }}
                    >
                      Manage Endpoints
                    </Link>
                    <Link
                      href="/billing"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '12px', color: '#2c2e2a', textDecoration: 'none' }}
                    >
                      Billing & Invoices
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        auth.logout();
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: '14px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        color: '#ff705d',
                        borderTop: '1px solid #f5f1e4',
                        marginTop: '4px',
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(true)}
                  style={{
                    background: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '11px 20px',
                    fontSize: '15px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    color: '#2c2e2a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    textDecoration: 'none',
                  }}
                >
                  Get API key
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ba0ff', display: 'inline-block' }}></span>
                </button>
                <Link
                  href="/signin"
                  style={{
                    background: '#2c2e2a',
                    color: '#f5f1e4',
                    borderRadius: '50px',
                    padding: '11px 20px',
                    fontSize: '15px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </>
  );
}

export default Nav;
