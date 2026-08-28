'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Nav } from '@/components/Nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';
import { formatCount, formatUsd, formatShortDate } from '@/lib/format';

const MIN_TOPUP = 5;
const PRESETS = [10, 25, 50, 100];

const card = {
  background: '#ffffff',
  borderRadius: '40px',
  padding: '32px',
};

function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

// Balance can carry sub-cent fractions from per-token billing — show them.
function formatBalance(usd) {
  const v = Number(usd) || 0;
  const trimmed = v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return `$${trimmed.includes('.') ? trimmed : `${trimmed}.00`}`;
}

function statusColor(status) {
  const s = String(status || '').toLowerCase();
  if (['credited', 'paid', 'finished', 'confirmed'].includes(s)) return '#8ed462';
  if (['failed', 'expired', 'refunded', 'void'].includes(s)) return '#ff705d';
  return '#f5a623'; // pending / confirming / waiting
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'credited') return 'Credited';
  if (s === 'pending') return 'Awaiting payment';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function breakdownUsage(item) {
  if (item.category === 'image' && item.images) return `${formatCount(item.images)} images`;
  if (item.category === 'audio' && item.audio_sec) return `${Math.round(item.audio_sec / 60)} min`;
  const toks = (Number(item.in_tokens) || 0) + (Number(item.out_tokens) || 0);
  return `${formatCount(toks)} tok`;
}

function BillingView() {
  const [plan, setPlan] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState(10);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('payment');
    if (p === 'success') setBanner({ tone: 'ok', text: 'Payment received. Credits will appear in your balance once the transaction confirms on-chain (usually a few minutes).' });
    else if (p === 'cancelled') setBanner({ tone: 'warn', text: 'Checkout was cancelled — no charge was made.' });
    if (p) window.history.replaceState({}, '', '/billing');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, breakdownRes, invoicesRes, paymentsRes] = await Promise.all([
        api.get('/v1/billing/plan'),
        api.get(`/v1/billing/cost-breakdown?period=${currentPeriod()}`),
        api.get('/v1/billing/invoices').catch(() => []),
        api.get('/v1/billing/payments').catch(() => []),
      ]);
      setPlan(planRes || null);
      setBreakdown(Array.isArray(breakdownRes) ? breakdownRes : []);
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
    } catch (err) {
      setError(err.message || 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckout() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < MIN_TOPUP) {
      setCheckoutError(`Minimum top-up is $${MIN_TOPUP}.`);
      return;
    }
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await api.post('/v1/billing/checkout', { amount: amt });
      if (res?.invoice_url) {
        window.location.assign(res.invoice_url);
      } else {
        setCheckoutError('Could not start checkout. Please try again.');
        setCheckingOut(false);
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed');
      setCheckingOut(false);
    }
  }

  const balanceUsd = plan?.balance_usd ?? 0;
  const spendUsd = plan?.usage_this_month?.cost_usd ?? 0;
  const tokensThisMonth = (plan?.usage_this_month?.in_tokens ?? 0) + (plan?.usage_this_month?.out_tokens ?? 0);
  const projected = plan?.estimated_total ?? 0;
  const breakdownTotal = (breakdown || []).reduce((acc, i) => acc + (Number(i.cost_usd) || 0), 0);
  const realInvoices = (invoices || []).filter(Boolean);

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '80px' }}>
      <Nav variant="dashboard" />

      <div style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>ACCOUNT</div>
        <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 500, letterSpacing: '-1.8px', lineHeight: 1.1, margin: 0 }}>Billing</h1>
      </div>

      {banner && (
        <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 24px' }}>
          <div style={{
            background: banner.tone === 'ok' ? '#eef8e4' : '#fff3e0',
            color: banner.tone === 'ok' ? '#3d6b1a' : '#8a5a00',
            border: `1px solid ${banner.tone === 'ok' ? '#cfe8b4' : '#f0d9b0'}`,
            borderRadius: '16px',
            padding: '14px 18px',
            fontSize: '14px',
          }}>
            {banner.text}
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 24px' }}>
          <ErrorRetry error={error} onRetry={load} message="Failed to load billing" />
        </div>
      )}

      {/* BALANCE + ADD CREDITS */}
      <div style={{ maxWidth: '1100px', margin: '28px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={card}>
          <div style={{ fontSize: '14px', color: '#80827f', marginBottom: '6px' }}>CREDIT BALANCE</div>
          <div style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-1.5px' }}>
            {loading && !plan ? '—' : formatBalance(balanceUsd)}
          </div>
          <div style={{ fontSize: '13px', color: '#80827f', marginTop: '4px' }}>
            {(plan?.balance_credits ?? 0).toLocaleString()} credits · {plan?.plan || 'Pay-as-you-go'}
          </div>
          {balanceUsd <= 0 && !loading && (
            <div style={{ marginTop: '14px', background: '#fff3e0', color: '#8a5a00', borderRadius: '12px', padding: '10px 14px', fontSize: '13px' }}>
              Your balance is empty — add credits to keep serving inference.
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: '14px', color: '#80827f', marginBottom: '12px' }}>ADD CREDITS</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                style={{
                  border: `1px solid ${Number(amount) === v ? '#8ed462' : '#e0dbce'}`,
                  background: Number(amount) === v ? '#eef8e4' : '#f5f1e4',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                ${v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f1e4', border: '1px solid #e0dbce', borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ color: '#80827f' }}>$</span>
            <input
              type="number"
              min={MIN_TOPUP}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', fontFamily: 'inherit', color: '#2c2e2a' }}
            />
          </div>
          {checkoutError && (
            <div style={{ marginTop: '10px', color: '#ff705d', fontSize: '13px' }}>{checkoutError}</div>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            style={{
              marginTop: '14px',
              width: '100%',
              background: '#2c2e2a',
              color: '#f5f1e4',
              border: 'none',
              borderRadius: '50px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: checkingOut ? 'not-allowed' : 'pointer',
              opacity: checkingOut ? 0.7 : 1,
            }}
          >
            {checkingOut ? 'Starting checkout…' : 'Pay with crypto'}
          </button>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#80827f' }}>
            Secure checkout via NOWPayments. Credits are added after the payment confirms.
          </div>
        </div>
      </div>

      {/* USAGE THIS MONTH */}
      <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Spend this month', value: formatUsd(spendUsd) },
          { label: 'Tokens processed', value: formatCount(tokensThisMonth) },
          { label: 'Projected month total', value: formatUsd(projected) },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '24px 28px' }}>
            <div style={{ fontSize: '13px', color: '#80827f', marginBottom: '10px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.8px' }}>
              {loading && !plan ? '—' : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* COST BREAKDOWN */}
      <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 24px' }}>
        <div style={{ ...card, overflowX: 'auto' }}>
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>
            Cost breakdown — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', padding: '0 4px 10px', fontSize: '13px', color: '#80827f', minWidth: '460px' }}>
            <div>Model</div>
            <div>Usage</div>
            <div style={{ textAlign: 'right' }}>Cost</div>
          </div>
          {loading && !breakdown ? (
            <>
              <TableRowSkeleton cols={3} />
              <TableRowSkeleton cols={3} />
            </>
          ) : (breakdown || []).length === 0 ? (
            <div style={{ padding: '16px 4px', color: '#80827f', fontSize: '14px', borderTop: '1px solid #e0dbce' }}>
              No usage recorded this month.
            </div>
          ) : (
            breakdown.map((item, i) => (
              <div key={`${item.model}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', padding: '14px 4px', borderTop: '1px solid #e0dbce', alignItems: 'center', fontSize: '14px', minWidth: '460px' }}>
                <div className="mono">{item.model}</div>
                <div className="mono" style={{ color: '#80827f' }}>{breakdownUsage(item)}</div>
                <div className="mono" style={{ textAlign: 'right' }}>{formatUsd(item.cost_usd)}</div>
              </div>
            ))
          )}
          {(breakdown || []).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', padding: '14px 4px 0', borderTop: '1px solid #e0dbce', fontSize: '15px', fontWeight: 500, minWidth: '460px' }}>
              <div>Total</div>
              <div></div>
              <div className="mono" style={{ textAlign: 'right' }}>{formatUsd(breakdownTotal)}</div>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT HISTORY */}
      <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 24px' }}>
        <div style={{ ...card, overflowX: 'auto' }}>
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Top-up history</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0 4px 10px', fontSize: '13px', color: '#80827f', minWidth: '460px' }}>
            <div>Date</div>
            <div>Amount</div>
            <div>Credits</div>
            <div>Status</div>
          </div>
          {loading && !payments ? (
            <><TableRowSkeleton cols={4} /><TableRowSkeleton cols={4} /></>
          ) : (payments || []).length === 0 ? (
            <div style={{ padding: '16px 4px', color: '#80827f', fontSize: '14px', borderTop: '1px solid #e0dbce' }}>
              No top-ups yet.
            </div>
          ) : (
            payments.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 4px', borderTop: '1px solid #e0dbce', alignItems: 'center', fontSize: '14px', minWidth: '460px' }}>
                <div style={{ color: '#80827f' }}>{formatShortDate(p.created_at)}</div>
                <div className="mono">{formatUsd(p.amount_usd)}</div>
                <div className="mono" style={{ color: '#80827f' }}>{formatCount(p.credits)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor(p.status), display: 'inline-block' }}></span>
                  {statusLabel(p.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* INVOICES (only if any exist) */}
      {realInvoices.length > 0 && (
        <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 24px' }}>
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Invoices</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.7fr', padding: '0 4px 10px', fontSize: '13px', color: '#80827f', minWidth: '460px' }}>
              <div>Invoice</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            {realInvoices.map((inv) => (
              <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.7fr', padding: '14px 4px', borderTop: '1px solid #e0dbce', alignItems: 'center', fontSize: '14px', minWidth: '460px' }}>
                <span className="mono" style={{ fontWeight: 500 }}>{inv.id}</span>
                <div>{formatShortDate(inv.date)}</div>
                <div className="mono">{formatUsd(inv.amount)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor(inv.status), display: 'inline-block' }}></span>
                  {statusLabel(inv.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingView />
    </ProtectedRoute>
  );
}
