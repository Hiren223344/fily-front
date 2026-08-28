'use client';

import React from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function CookiePolicyPage() {
  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '100px' }}>
      <Nav variant="marketing" />

      <div style={{ maxWidth: '760px', margin: '56px auto 0', padding: '0 24px', opacity: 0, animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>LEGAL</div>
        <h1 style={{ fontSize: 'clamp(34px, 9vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: '0 0 12px' }}>
          Cookie Policy
        </h1>
        <p style={{ fontSize: '15px', color: '#80827f', margin: '0 0 40px' }}>Last updated August 27, 2026</p>

        <div style={{ background: '#ffffff', borderRadius: '40px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
              This Cookie Policy explains how FilyBase uses cookies and similar technologies on filybase.ai and our dashboard.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>1. What are cookies</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Cookies are small text files stored on your device that let a site remember information about your visit, such as your preferences and login state.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>2. Cookies we use</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: '0 0 12px' }}>
              <strong>Essential —</strong> required to keep you signed in and secure your session. These cannot be disabled.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: '0 0 12px' }}>
              <strong>Preferences —</strong> remember settings like your dashboard time range or dismissed banners.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              <strong>Analytics —</strong> help us understand aggregate usage of our site so we can improve it. These are only set if you accept them.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>3. Managing cookies</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              You can accept or decline non-essential cookies from the banner shown on your first visit, or change your choice anytime by clearing your browser&apos;s site data for filybase.ai. Most browsers also let you block cookies globally in settings.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>4. Changes to this policy</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We may update this Cookie Policy from time to time; changes will be posted here with a revised date.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>5. Contact us</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Questions can be sent to <a href="mailto:privacy@filybase.ai" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a' }}>privacy@filybase.ai</a>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '20px', fontSize: '14px', color: '#80827f' }}>
          <Link href="/privacy" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
