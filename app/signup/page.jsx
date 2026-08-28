'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

const inputStyle = {
  width: '100%',
  background: '#f5f1e4',
  border: '1px solid #e0dbce',
  borderRadius: '10px',
  padding: '13px 16px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#2c2e2a',
};

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialKey, setInitialKey] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await auth.signup(name, email, password);
      if (data.initial_api_key) {
        setInitialKey(data.initial_api_key);
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Unable to create account');
      setLoading(false);
    }
  }

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <div style={{ background: '#ffffff', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        {initialKey ? (
          <div style={{ width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '40px', border: '1px solid #e0dbce', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>Account created</h1>
            <p style={{ fontSize: '14px', color: '#ff705d', margin: 0, fontWeight: 500 }}>
              Save this API key now — you will not be able to view it again.
            </p>
            <div className="mono" style={{ background: '#f5f1e4', border: '1px solid #e0dbce', borderRadius: '14px', padding: '14px', fontSize: '13px', wordBreak: 'break-all', userSelect: 'all' }}>
              {initialKey}
            </div>
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              style={{ background: '#2c2e2a', color: '#f5f1e4', border: 'none', borderRadius: '50px', padding: '14px', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Continue to dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#ffffff',
              borderRadius: '40px',
              border: '1px solid #e0dbce',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          >
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 500, margin: 0 }}>Create your account</h1>
              <p style={{ fontSize: '14px', color: '#80827f', margin: '6px 0 0' }}>Start deploying inference in minutes.</p>
            </div>

            {error && (
              <div style={{ background: '#ffebe8', color: '#ff705d', padding: '10px 14px', borderRadius: '12px', fontSize: '13px' }}>{error}</div>
            )}

            <label style={{ fontSize: '14px', fontWeight: 500 }}>
              Name
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
            </label>

            <label style={{ fontSize: '14px', fontWeight: 500 }}>
              Email
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
            </label>

            <label style={{ fontSize: '14px', fontWeight: 500 }}>
              Password
              <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
              <span style={{ fontSize: '12px', color: '#80827f', fontWeight: 400 }}>At least 8 characters.</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2c2e2a',
                color: '#f5f1e4',
                border: 'none',
                borderRadius: '50px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
