'use client';

import React from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function TermsOfServicePage() {
  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '100px' }}>
      <Nav variant="marketing" />

      <div style={{ maxWidth: '760px', margin: '56px auto 0', padding: '0 24px', opacity: 0, animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '12px' }}>LEGAL</div>
        <h1 style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.15, margin: '0 0 12px' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: '15px', color: '#80827f', margin: '0 0 40px' }}>Last updated August 27, 2026</p>

        <div style={{ background: '#ffffff', borderRadius: '40px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of FilyBase&apos;s serverless inference API, dashboard, and related services (the &quot;Service&quot;), operated by FilyBase, Inc. By creating an account or using the Service, you agree to these Terms.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>1. Accounts</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              You must provide accurate information when creating an account and are responsible for maintaining the confidentiality of your API keys and credentials. You are responsible for all activity under your account.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>2. Use of the Service</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              You may use the Service to send requests to hosted models and receive inference results. You agree not to use the Service to generate content that is illegal, infringing, or that violates the rights of others, and not to attempt to circumvent rate limits, reverse-engineer hosted models, or resell access without our written consent.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>3. Fees and billing</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Usage is billed per token, image, or minute of audio processed, as described on our Pricing page. Fees are non-refundable except as required by law. We may suspend access for accounts with an outstanding balance.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>4. API rate limits and availability</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We aim to provide reliable access to the Service but do not guarantee uninterrupted availability. Rate limits apply per plan tier and may change with notice. Scheduled maintenance will be communicated where practical.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>5. Your content</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              You retain ownership of prompts, inputs, and outputs you submit to or receive from the Service (&quot;Your Content&quot;). You grant us a limited license to process Your Content solely to provide the Service. We do not use Your Content to train models without your explicit opt-in.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>6. Intellectual property</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              The Service, including our software, branding, and documentation, is owned by FilyBase and protected by intellectual property laws. These Terms do not grant you any rights to our trademarks or proprietary technology beyond what is necessary to use the Service.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>7. Disclaimers</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              The Service is provided &quot;as is&quot; without warranties of any kind. Model outputs may be inaccurate, incomplete, or unsuitable for your use case, and you are responsible for evaluating outputs before relying on them.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>8. Limitation of liability</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              To the maximum extent permitted by law, FilyBase will not be liable for indirect, incidental, or consequential damages arising from your use of the Service. Our total liability for any claim will not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>9. Termination</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              You may stop using the Service and close your account at any time. We may suspend or terminate your access if you violate these Terms or misuse the Service.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>10. Governing law</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law principles.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>11. Changes to these Terms</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px' }}>12. Contact us</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Questions about these Terms can be sent to <a href="mailto:legal@filybase.ai" style={{ borderBottom: '1px solid #80827f', color: '#2c2e2a' }}>legal@filybase.ai</a>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '20px', fontSize: '14px', color: '#80827f' }}>
          <Link href="/privacy" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/cookies" style={{ borderBottom: '1px solid #80827f', color: '#80827f', textDecoration: 'none' }}>
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
