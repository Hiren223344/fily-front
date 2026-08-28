'use client';

import React from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function DocsPage() {
  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '100px' }}>
      <Nav variant="marketing" />

      {/* HEADER */}
      <div style={{ maxWidth: '1200px', margin: '56px auto 0', padding: '0 24px', opacity: 0, animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>DOCUMENTATION</div>
        <h1 style={{ fontSize: 'clamp(34px, 9vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: 0 }}>
          Getting started
        </h1>
      </div>

      {/* BODY */}
      <div
        className="docs-layout"
        style={{
          maxWidth: '1200px',
          margin: '40px auto 0',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: '48px',
          alignItems: 'start',
          opacity: 0,
          animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s forwards',
        }}
      >
        {/* SIDEBAR */}
        <div
          className="docs-sidebar"
          style={{
            background: '#ffffff',
            borderRadius: '32px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            position: 'sticky',
            top: '24px',
            minWidth: 0,
          }}
        >
          <a href="#getting-started" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', background: '#8ed462', fontSize: '14px', fontWeight: 500, borderBottom: 'none', width: '100%', textDecoration: 'none', color: '#2c2e2a' }}>
            Getting started
          </a>
          <a href="#making-requests" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Making requests
          </a>
          <a href="#response-handling" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Response handling
          </a>
          <a href="#authentication" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Authentication
          </a>
          <a href="#streaming" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Streaming responses
          </a>
          <a href="#errors" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Error handling
          </a>
          <a href="#rate-limits" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            Rate limits
          </a>
          <a href="#sdks" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 500, color: '#80827f', borderBottom: 'none', width: '100%', textDecoration: 'none' }}>
            SDKs
          </a>
        </div>

        {/* CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', minWidth: 0 }}>
          <div id="getting-started" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 16px' }}>1. Get your API key</h2>
            <p style={{ fontSize: '17px', lineHeights: 1.6, margin: '0 0 20px', color: '#2c2e2a' }}>
              Create a free account and grab a key from the dashboard. Every new account starts with $5 in credits — no card required.
            </p>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: '#8ed462',
                borderRadius: '50px',
                padding: '12px 22px',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: 'none',
                textDecoration: 'none',
                color: '#2c2e2a',
              }}
            >
              Create an account
            </Link>
          </div>

          <div id="making-requests" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 16px' }}>2. Make your first request</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: '0 0 20px', color: '#2c2e2a' }}>
              Endpoints are OpenAI-compatible — point your existing SDK at our base URL and pass any model from the{' '}
              <Link href="/models" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a', textDecoration: 'none' }}>
                catalog
              </Link>
              .
            </p>
            <div style={{ background: '#f5f1e4', borderRadius: '24px', padding: '22px 24px', fontSize: '14px', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }} className="mono">
              <div>curl https://api.filybase.ai/v1/completions \</div>
              <div style={{ paddingLeft: '14px' }}>-H &quot;Authorization: Bearer $FILYBASE_KEY&quot; \</div>
              <div style={{ paddingLeft: '14px' }}>-d &apos;&#123;&quot;model&quot;: &quot;llama-3.1-70b&quot;, &quot;prompt&quot;: &quot;Hello, world&quot;&#125;&apos;</div>
            </div>
          </div>

          <div id="response-handling" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 16px' }}>3. Handle the response</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: '0 0 20px', color: '#2c2e2a' }}>
              Responses stream back as JSON, with usage and timing metadata on every call.
            </p>
            <div style={{ background: '#f5f1e4', borderRadius: '24px', padding: '22px 24px', fontSize: '14px', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }} className="mono">
              <div>&#123;</div>
              <div style={{ paddingLeft: '20px' }}>&quot;id&quot;: &quot;cmpl-8f2a...&quot;,</div>
              <div style={{ paddingLeft: '20px' }}>&quot;model&quot;: &quot;llama-3.1-70b&quot;,</div>
              <div style={{ paddingLeft: '20px' }}>&quot;latency_ms&quot;: 41,</div>
              <div style={{ paddingLeft: '20px' }}>&quot;usage&quot;: &#123; &quot;total_tokens&quot;: 812 &#125;</div>
              <div>&#125;</div>
            </div>
          </div>

          <div id="authentication" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 16px' }}>Authentication</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0, color: '#2c2e2a' }}>
              Every request is authenticated with a bearer token in the <span className="mono" style={{ background: '#f5f1e4', borderRadius: '6px', padding: '2px 6px' }}>Authorization</span> header. Keys are scoped per project and can be rotated anytime from the dashboard — never share one in client-side code.
            </p>
          </div>

          <div id="streaming" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 12px' }}>Streaming responses</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0, color: '#2c2e2a' }}>
              Pass <span className="mono" style={{ background: '#f5f1e4', borderRadius: '6px', padding: '2px 6px' }}>&quot;stream&quot;: true</span> to receive server-sent events, token by token — ideal for chat interfaces.
            </p>
          </div>

          <div id="errors" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 12px' }}>Error handling</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0, color: '#2c2e2a' }}>
              Errors return standard HTTP status codes with a JSON body describing the issue, plus a <span className="mono" style={{ background: '#f5f1e4', borderRadius: '6px', padding: '2px 6px' }}>request_id</span> for support.
            </p>
          </div>

          <div id="rate-limits" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 12px' }}>Rate limits</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0, color: '#2c2e2a' }}>
              Pay-as-you-go accounts share a request pool. Need higher throughput? The Scale plan raises your limits — see <Link href="/#pricing" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a', textDecoration: 'none' }}>pricing</Link>.
            </p>
          </div>

          <div id="sdks" style={{ background: '#ffffff', borderRadius: '40px', padding: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 500, margin: '0 0 12px' }}>SDKs</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: '0 0 16px', color: '#2c2e2a' }}>
              Official clients for Python and Node — both are drop-in replacements for the OpenAI SDK.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#f5f1e4', borderRadius: '50px', padding: '10px 18px', fontSize: '14px' }} className="mono">
                pip install filybase
              </div>
              <div style={{ background: '#f5f1e4', borderRadius: '50px', padding: '10px 18px', fontSize: '14px' }} className="mono">
                npm i filybase
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
