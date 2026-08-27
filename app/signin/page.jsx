'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('jordan@filybase.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await auth.login(email, password);
      router.push(from);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <div style={{ background: '#ffffff', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: 'none', textDecoration: 'none' }}>
            <img src="/uploads/logoipsum-392.png" alt="FilyBase logo" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'block' }} />
            <span style={{ fontSize: '17px', fontWeight: 500, color: '#2c2e2a' }}>FilyBase</span>
          </Link>
          <div style={{ fontSize: '15px', color: '#80827f' }}>
            New here?{' '}
            <Link href="/signup" style={{ color: '#2c2e2a', borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#ffffff',
            borderRadius: '50px',
            padding: '44px 40px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px', textAlign: 'center' }}>WELCOME BACK</div>
          <h1 style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.15, margin: '0 0 32px', textAlign: 'center' }}>
            Sign in to FilyBase
          </h1>

          {error && (
            <div style={{ background: '#ffebe8', color: '#ff705d', padding: '12px 16px', borderRadius: '14px', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Email</div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%',
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '10px',
                  padding: '13px 16px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Password</div>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to demo inbox.'); }} style={{ fontSize: '13px', color: '#80827f', borderBottom: 'none' }}>
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '10px',
                  padding: '13px 16px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2c2e2a',
                color: '#f5f1e4',
                borderRadius: '50px',
                padding: '15px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                border: 'none',
                textAlign: 'center',
                display: 'block',
                width: '100%',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e0dbce' }}></div>
            <div style={{ fontSize: '13px', color: '#80827f' }}>or</div>
            <div style={{ flex: 1, height: '1px', background: '#e0dbce' }}></div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: '#f5f1e4',
              border: 'none',
              borderRadius: '50px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            Continue with GitHub
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ba0ff', display: 'inline-block' }}></span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ background: '#f5f1e4', minHeight: '100vh' }}></div>}>
      <SignInForm />
    </Suspense>
  );
}
