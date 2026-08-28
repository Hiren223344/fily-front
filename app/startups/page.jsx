'use client';

import React, { useState } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

const CONTACT_EMAIL = 'hiren@frenix.sh';

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

const BENEFITS = [
  {
    dot: '#8ed462',
    title: 'Free inference credits',
    body: 'Qualifying early-stage startups get credits toward their first months of usage — no card required to get started.',
  },
  {
    dot: '#2ba0ff',
    title: 'Direct founder support',
    body: 'Skip the ticket queue. You get a direct line to the team for integration help, rate limits, and model requests.',
  },
  {
    dot: '#ff705d',
    title: 'Flexible, usage-based billing',
    body: 'Pay for tokens, not idle GPUs. We work with you on billing terms as you scale from prototype to production.',
  },
];

export default function StartupsPage() {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    const subject = `Startup program application — ${company.trim() || 'New startup'}`;
    const body = [
      `Company: ${company.trim()}`,
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      '',
      'What are you building:',
      message.trim(),
    ].join('\n');

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh' }}>
      <Nav variant="marketing" />

      {/* HERO */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '20px' }}>FOR STARTUPS</div>
        <h1
          style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 500,
            letterSpacing: '-2.5px',
            lineHeight: 1.05,
            margin: '0 0 24px',
          }}
        >
          Built for startups shipping fast.
        </h1>
        <p style={{ fontSize: '18px', lineHeight: 1.5, color: '#2c2e2a', maxWidth: '600px', margin: '0 auto' }}>
          Serverless inference credits, direct support, and flexible billing for early-stage teams. Tell us what
          you&apos;re building and we&apos;ll get back to you.
        </p>
      </div>

      {/* BENEFITS */}
      <div
        style={{
          maxWidth: '1000px',
          margin: '56px auto 0',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {BENEFITS.map((b) => (
          <div key={b.title} style={{ background: '#ffffff', borderRadius: '40px', padding: '28px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.dot, display: 'inline-block', marginBottom: '16px' }}></span>
            <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>{b.title}</div>
            <p style={{ fontSize: '14px', color: '#80827f', lineHeight: 1.5, margin: 0 }}>{b.body}</p>
          </div>
        ))}
      </div>

      {/* APPLICATION FORM */}
      <div style={{ maxWidth: '620px', margin: '56px auto 0', padding: '0 24px 100px' }}>
        <div style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '14px', color: '#8ed462', fontWeight: 500, marginBottom: '8px' }}>ALMOST THERE</div>
              <h2 style={{ fontSize: '26px', fontWeight: 500, margin: '0 0 12px' }}>Your email app should be open</h2>
              <p style={{ fontSize: '14px', color: '#80827f', lineHeight: 1.5, margin: 0 }}>
                We pre-filled a message to <span className="mono">{CONTACT_EMAIL}</span> — just hit send. If nothing
                opened, email us directly at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2c2e2a', borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                style={{
                  marginTop: '20px',
                  background: '#f5f1e4',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px 22px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Back to form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 500, margin: 0 }}>Apply for the startup program</h2>
                <p style={{ fontSize: '14px', color: '#80827f', margin: '6px 0 0' }}>
                  This opens your email client with a message addressed to {CONTACT_EMAIL}.
                </p>
              </div>

              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                Company name
                <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
              </label>

              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                Your name
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
              </label>

              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                Work email
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
              </label>

              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                What are you building?
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A quick summary of your product and expected usage..."
                  style={{ ...inputStyle, marginTop: '6px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </label>

              <button
                type="submit"
                style={{
                  background: '#2c2e2a',
                  color: '#f5f1e4',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Send application
              </button>

              <p style={{ fontSize: '13px', color: '#80827f', textAlign: 'center', margin: 0 }}>
                Prefer to email directly?{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2c2e2a', borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
