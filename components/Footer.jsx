'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiKeyModal } from './ApiKeyModal';

export function Footer() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  return (
    <>
      <div
        data-reveal
        style={{
          background: '#f5e211',
          marginTop: '136px',
          padding: '80px 24px 60px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(48px, 6vw, 81px)',
              fontWeight: 500,
              letterSpacing: '-3px',
              lineHeight: 1.1,
              margin: '0 0 32px',
              maxWidth: '700px',
            }}
          >
            Ship inference in an afternoon.
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => setApiKeyModalOpen(true)}
              style={{
                background: '#2c2e2a',
                color: '#f5e211',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Get your API key
            </button>
            <div style={{ display: 'flex', gap: '24px', fontSize: '15px' }}>
              <Link href="/docs" style={{ color: '#2c2e2a', textDecoration: 'none', borderBottom: '1px solid #2c2e2a' }}>
                Docs
              </Link>
              <Link href="/privacy" style={{ color: '#2c2e2a', textDecoration: 'none', borderBottom: '1px solid #2c2e2a' }}>
                Privacy
              </Link>
              <Link href="/terms" style={{ color: '#2c2e2a', textDecoration: 'none', borderBottom: '1px solid #2c2e2a' }}>
                Terms
              </Link>
            </div>
          </div>
          <div style={{ marginTop: '48px', fontSize: '15px', color: '#2c2e2a' }}>
            © 2026 FilyBase, Inc.
          </div>
        </div>
      </div>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
}

export default Footer;
