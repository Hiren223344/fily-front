'use client';

import React from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <div style={{ background: '#ffffff', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: 'none', textDecoration: 'none' }}>
            <img src="/uploads/logoipsum-392.png" alt="FilyBase logo" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'block' }} />
            <span style={{ fontSize: '17px', fontWeight: 500, color: '#2c2e2a' }}>FilyBase</span>
          </Link>
          <div style={{ fontSize: '15px', color: '#80827f' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: '#2c2e2a', borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* CLERK SIGN UP */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'center', animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards' }}>
          <SignUp routing="path" path="/signup" signInUrl="/signin" fallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
