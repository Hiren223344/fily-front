'use client';

import React from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '100px' }}>
      <Nav variant="marketing" />

      <div style={{ maxWidth: '760px', margin: '56px auto 0', padding: '0 24px', opacity: 0, animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>LEGAL</div>
        <h1 style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: '0 0 12px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '15px', color: '#80827f', margin: '0 0 40px' }}>Last updated August 27, 2026</p>

        <div style={{ background: '#ffffff', borderRadius: '40px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
              This Privacy Policy explains how FilyBase, Inc. (&quot;FilyBase&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, and shares information when you use our serverless inference API, dashboard, and related services (the &quot;Service&quot;).
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>1. Information we collect</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: '0 0 12px' }}>
              We collect information you provide directly, such as your name, email, and billing details when you create an account. We also collect usage data automatically, including API request metadata (timestamps, model used, token counts, latency), IP address, and device/browser information.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We do not use the content of your API requests or responses (prompts, completions, uploaded files) to train models, and we do not review request content except as needed to investigate abuse or at your request for support.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>2. How we use information</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We use collected information to operate and improve the Service, process payments, provide customer support, detect fraud and abuse, send service-related communications, and comply with legal obligations.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>3. Sharing of information</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We share information with infrastructure and payment providers who process it on our behalf under confidentiality obligations. We do not sell personal information. We may disclose information if required by law or to protect the rights, safety, or property of FilyBase and our users.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>4. Data retention</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Account and billing information is retained for as long as your account is active and as required for tax and accounting purposes. Request logs are retained for up to 30 days for debugging and abuse prevention unless you request shorter retention on a paid plan.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>5. Your rights</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Depending on your location, you may have the right to access, correct, export, or delete your personal information. To exercise these rights, contact us at the address below.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>6. Cookies</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We use cookies and similar technologies to keep you signed in and understand aggregate usage of our site. See our <Link href="/cookies" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a' }}>Cookie Policy</Link> for details.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>7. Security</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We use industry-standard technical and organizational measures, including encryption in transit and at rest, to protect your information. No method of transmission or storage is fully secure, and we cannot guarantee absolute security.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>8. Changes to this policy</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We may update this policy from time to time. We will post the updated version here and revise the &quot;Last updated&quot; date above.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>9. Contact us</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Questions about this policy can be sent to <a href="mailto:privacy@filybase.ai" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a' }}>privacy@filybase.ai</a>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '20px', fontSize: '14px', color: '#80827f' }}>
          <Link href="/terms" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Terms of Service
          </Link>
          <Link href="/cookies" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
