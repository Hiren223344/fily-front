'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [cookieChoice, setCookieChoice] = useState('accepted');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('filybase-cookie-choice');
      setCookieChoice(saved);
    }
  }, []);

  function handleChoice(val) {
    setCookieChoice(val);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('filybase-cookie-choice', val);
      } catch (_) {}
    }
  }

  if (cookieChoice) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '24px',
        right: '24px',
        bottom: '24px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '32px',
          padding: '20px 24px',
          maxWidth: '640px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e0dbce',
        }}
      >
        <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#2c2e2a', margin: 0, flex: 1, minWidth: '220px' }}>
          We use cookies to keep you signed in and understand how FilyBase is used. See our{' '}
          <Link href="/cookies" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a', textDecoration: 'none' }}>
            cookie policy
          </Link>
          .
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleChoice('declined')}
            style={{
              background: '#f5f1e4',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: '#2c2e2a',
            }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            style={{
              background: '#8ed462',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: '#2c2e2a',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
