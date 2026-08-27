'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function LandingPage() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', overflowX: 'hidden' }}>
      <Nav variant="marketing" />

      {/* HERO */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 24px 0', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '15px',
            color: '#80827f',
            marginBottom: '20px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0s forwards',
          }}
        >
          SERVERLESS INFERENCE, WITHOUT THE CHAOS
        </div>
        <h1
          style={{
            fontSize: 'clamp(64px, 10vw, 140px)',
            fontWeight: 500,
            letterSpacing: 'clamp(-4px, -0.06em, -8.4px)',
            lineHeight: 0.95,
            margin: '0 0 28px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.08s forwards',
          }}
        >
          Fastest. Cheapest.
          <br />
          Inference.
        </h1>
        <p
          style={{
            fontSize: '20px',
            lineHeight: 1.5,
            color: '#2c2e2a',
            maxWidth: '640px',
            margin: '0 auto 40px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.16s forwards',
          }}
        >
          Deploy Llama, Mixtral and your own fine-tunes on GPUs that scale to zero — and back up in milliseconds. Real
          endpoints, real humans behind support.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            marginBottom: '24px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.24s forwards',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/signup"
            style={{
              background: '#2c2e2a',
              color: '#f5f1e4',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 28px',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Start building — free
          </Link>
          <Link
            href="/playground"
            style={{
              background: '#ffffff',
              color: '#2c2e2a',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 28px',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            Try in console
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8ed462', display: 'inline-block' }}></span>
          </Link>
        </div>
      </div>

      {/* ILLUSTRATION PANEL */}
      <div
        data-reveal
        style={{
          maxWidth: '1200px',
          margin: '40px auto 0',
          padding: '0 24px',
          opacity: 0,
          transform: 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ borderRadius: '63.75px', width: '100%', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
          <img
            src="/uploads/pasted-1787825987108-0.png"
            alt="FilyBase dashboard preview"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      </div>

      {/* CONTENT CARD: NO MORE CHAOS */}
      <div
        data-reveal
        style={{
          maxWidth: '700px',
          margin: '120px auto 0',
          padding: '0 24px',
          textAlign: 'center',
          opacity: 0,
          transform: 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ background: '#ffffff', borderRadius: '50px', padding: '48px 44px' }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: '0 0 20px' }}>
            No more idle GPU bills.
          </h2>
          <p style={{ fontSize: '18px', lineHeight: 1.5, margin: '0 0 28px', color: '#2c2e2a' }}>
            One endpoint, metered per token. Traffic spikes provision capacity in seconds; quiet hours cost nothing.
          </p>
          <Link
            href="/docs"
            style={{
              background: '#8ed462',
              color: '#2c2e2a',
              border: 'none',
              borderRadius: '50px',
              padding: '14px 26px',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* ILLUSTRATION + CARD SPLIT: MODELS */}
      <div
        id="models"
        data-reveal
        style={{
          maxWidth: '1200px',
          margin: '120px auto 0',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          opacity: 0,
          transform: 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ borderRadius: '63.75px', height: '460px', overflow: 'hidden' }}>
          <img
            src="/uploads/pasted-1787826459065-0.png"
            alt="Character browsing model shelf"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '15px', color: '#80827f' }}>MODEL CATALOG</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: '0 0 8px' }}>
            Bring any open model.
          </h2>
          <p style={{ fontSize: '18px', lineHeight: 1.5, margin: '0 0 8px', color: '#2c2e2a' }}>
            Or your own fine-tune. Every model gets an OpenAI-compatible endpoint.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '50px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '17px', fontWeight: 500 }}>Llama 3.1 70B</div>
                <div style={{ fontSize: '15px', color: '#80827f' }}>$0.90 / 1M tok</div>
              </div>
              <Link href="/models" style={{ color: '#2c2e2a', fontSize: '15px', fontWeight: 500, borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                View →
              </Link>
            </div>
            <div
              className="card-hover"
              style={{
                background: '#ffffff',
                borderRadius: '50px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div>
                <div style={{ fontSize: '17px', fontWeight: 500 }}>Mixtral 8x22B</div>
                <div style={{ fontSize: '15px', color: '#80827f' }}>$1.20 / 1M tok</div>
              </div>
              <Link href="/models" style={{ color: '#2c2e2a', fontSize: '15px', fontWeight: 500, borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                View →
              </Link>
            </div>
            <div
              className="card-hover"
              style={{
                background: '#ffffff',
                borderRadius: '50px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div>
                <div style={{ fontSize: '17px', fontWeight: 500 }}>Stable Diffusion 3</div>
                <div style={{ fontSize: '15px', color: '#80827f' }}>$0.02 / image</div>
              </div>
              <Link href="/models" style={{ color: '#2c2e2a', fontSize: '15px', fontWeight: 500, borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                View →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div
        data-reveal
        style={{
          maxWidth: '1200px',
          margin: '120px auto 0',
          padding: '0 24px',
          opacity: 0,
          transform: 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ textAlign: 'center', margin: '0 0 48px' }}>
          <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(42px, 6vw, 81px)', fontWeight: 500, letterSpacing: '-4px', lineHeight: 1.2, margin: 0 }}>
            Three steps to production.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div
            className="card-hover"
            style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)' }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#8ed462', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, marginBottom: '20px' }}>
              1
            </div>
            <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Pick a model</div>
            <p style={{ fontSize: '17px', color: '#2c2e2a', lineHeight: 1.5, margin: 0 }}>
              Choose from the catalog or upload a fine-tune.
            </p>
          </div>
          <div
            className="card-hover"
            style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)' }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#2ba0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, color: '#ffffff', marginBottom: '20px' }}>
              2
            </div>
            <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Call the API</div>
            <p style={{ fontSize: '17px', color: '#2c2e2a', lineHeight: 1.5, margin: 0 }}>
              Swap your base URL — existing SDKs keep working.
            </p>
          </div>
          <div
            className="card-hover"
            style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)' }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ff705d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, color: '#ffffff', marginBottom: '20px' }}>
              3
            </div>
            <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Scale automatically</div>
            <p style={{ fontSize: '17px', color: '#2c2e2a', lineHeight: 1.5, margin: 0 }}>
              GPUs provision in seconds; idle costs nothing.
            </p>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div
        id="pricing"
        data-reveal
        style={{
          maxWidth: '1200px',
          margin: '120px auto 0',
          padding: '0 24px',
          opacity: 0,
          transform: 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ textAlign: 'center', margin: '0 0 48px' }}>
          <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>PRICING</div>
          <h2 style={{ fontSize: 'clamp(42px, 6vw, 81px)', fontWeight: 500, letterSpacing: '-4px', lineHeight: 1.2, margin: 0 }}>
            Pay for tokens, not idle time.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>Pay as you go</div>
            <div style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px' }}>$0</div>
            <p style={{ fontSize: '15px', color: '#80827f', margin: 0 }}>Metered per token · shared pool</p>
            <Link
              href="/signup"
              style={{
                background: '#f5f1e4',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginTop: '8px',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
                color: '#2c2e2a',
              }}
            >
              Start free
            </Link>
          </div>
          <div style={{ background: '#8ed462', borderRadius: '50px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>Scale</div>
            <div style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px' }}>
              $399<span style={{ fontSize: '18px' }}>/mo</span>
            </div>
            <p style={{ fontSize: '15px', color: '#2c2e2a', margin: 0 }}>Higher rate limits · priority queue</p>
            <Link
              href="/signup"
              style={{
                background: '#2c2e2a',
                color: '#f5f1e4',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginTop: '8px',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Talk to sales
            </Link>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>Enterprise</div>
            <div style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px' }}>Custom</div>
            <p style={{ fontSize: '15px', color: '#80827f', margin: 0 }}>Custom terms · dedicated support</p>
            <Link
              href="/signup"
              style={{
                background: '#f5f1e4',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginTop: '8px',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
                color: '#2c2e2a',
              }}
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <CookieBanner />
      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </div>
  );
}
