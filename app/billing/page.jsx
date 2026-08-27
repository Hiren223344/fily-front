'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { store, TTL } from '@/lib/store';
import { Nav } from '@/components/Nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';

const DEFAULT_PLAN = {
  plan: 'Pay as you go',
  requests_this_month: '1.42M',
  tokens_processed: '9.4B',
  estimated_total: '$8,240.16',
  billing_email: 'jordan@filybase.ai',
  payment_method: {
    brand: 'Visa',
    last4: '4242',
    exp: '09/28',
  },
};

const DEFAULT_INVOICES = [
  { id: 'INV-0912', date: 'Aug 1, 2026', amount: '$8,240.40', status: 'Paid', statusColor: '#8ed462' },
  { id: 'INV-0871', date: 'Jul 1, 2026', amount: '$6,110.20', status: 'Paid', statusColor: '#8ed462' },
  { id: 'INV-0834', date: 'Jun 1, 2026', amount: '$5,982.75', status: 'Paid', statusColor: '#8ed462' },
  { id: 'INV-0799', date: 'May 1, 2026', amount: '$4,420.05', status: 'Unpaid', statusColor: '#ff705d' },
];

const DEFAULT_COST_BREAKDOWN = [
  { model: 'Llama 3.1 70B', usage: '6.1B tok', rate: '$0.90/M', cost: '$5,490.00' },
  { model: 'Mixtral 8x22B', usage: '2.2B tok', rate: '$1.20/M', cost: '$2,640.00' },
  { model: 'Stable Diffusion 3', usage: '4,120 img', rate: '$0.02/img', cost: '$82.40' },
  { model: 'BGE Embeddings', usage: '2.8B tok', rate: '$0.01/M', cost: '$28.00' },
];

class BillingComponent extends React.Component {
  state = {
    filter: 'all',
    loading: true,
    error: null,
    planData: null,
    invoicesData: null,
    costData: null,
  };

  componentDidMount() {
    this.fetchBillingData();
  }

  async fetchBillingData(forceRefresh = false) {
    this.setState({ loading: true, error: null });
    try {
      const planKey = '/v1/billing/plan';
      const invoicesKey = '/v1/billing/invoices';
      const costKey = '/v1/billing/cost-breakdown?period=2026-08';

      const [planRes, invoicesRes, costRes] = await Promise.all([
        store.get(planKey, () => api.get(planKey), TTL.BILLING, forceRefresh),
        store.get(invoicesKey, () => api.get(invoicesKey), TTL.BILLING, forceRefresh),
        store.get(costKey, () => api.get(costKey), TTL.BILLING, forceRefresh),
      ]);

      this.setState({
        planData: planRes || DEFAULT_PLAN,
        invoicesData: Array.isArray(invoicesRes) ? invoicesRes : DEFAULT_INVOICES,
        costData: costRes?.items || DEFAULT_COST_BREAKDOWN,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[Billing] Fetch error:', err);
      this.setState({
        error: err.message || 'Failed to fetch billing details',
        loading: false,
      });
    }
  }

  renderVals() {
    const filter = this.state.filter;
    const plan = this.state.planData || DEFAULT_PLAN;
    const sourceInvoices = this.state.invoicesData || DEFAULT_INVOICES;
    const costItems = this.state.costData || DEFAULT_COST_BREAKDOWN;

    const invoices = (filter === 'all'
      ? sourceInvoices
      : sourceInvoices.filter((i) => i.status?.toLowerCase() === 'unpaid')
    ).map((i) => ({
      ...i,
      statusColor: i.status === 'Paid' ? '#8ed462' : '#ff705d',
    }));

    const totalCost = costItems.reduce((acc, curr) => {
      const num = parseFloat(curr.cost?.replace(/[$,]/g, '')) || 0;
      return acc + num;
    }, 0);

    return {
      plan,
      costItems,
      totalCostFormatted: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      invoices,
      allBg: filter === 'all' ? '#ffffff' : 'transparent',
      unpaidBg: filter === 'unpaid' ? '#ffffff' : 'transparent',
      setFilterAll: () => this.setState({ filter: 'all' }),
      setFilterUnpaid: () => this.setState({ filter: 'unpaid' }),
    };
  }

  render() {
    const vals = this.renderVals();
    const { loading, error } = this.state;

    return (
      <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '80px' }}>
        <Nav variant="dashboard" />

        {/* HEADER */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '40px auto 0',
            padding: '0 24px',
            opacity: 0,
            animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0s forwards',
          }}
        >
          <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>ACCOUNT</div>
          <h1 style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.1, margin: 0 }}>
            Billing
          </h1>
        </div>

        {/* ERROR STATE WITH RETRY */}
        {error && (
          <div style={{ maxWidth: '1280px', margin: '20px auto 0', padding: '0 24px' }}>
            <ErrorRetry error={error} onRetry={() => this.fetchBillingData(true)} message="Failed to load billing metrics" />
          </div>
        )}

        {/* PLAN + PAYMENT */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '32px auto 0',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            opacity: 0,
            animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.08s forwards',
          }}
        >
          {/* CURRENT PLAN CARD */}
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', flex: 1.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#80827f', marginBottom: '6px' }}>CURRENT PLAN</div>
                <div style={{ fontSize: '24px', fontWeight: 500 }}>{vals.plan.plan || 'Pay as you go'}</div>
              </div>
              <Link
                href="/#pricing"
                style={{
                  background: '#8ed462',
                  borderRadius: '50px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderBottom: 'none',
                  color: '#2c2e2a',
                  textDecoration: 'none',
                }}
              >
                Upgrade to Scale
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px' }}>
                <div style={{ color: '#80827f' }}>Requests this month</div>
                <div className="mono">{vals.plan.requests_this_month || vals.plan.usage_this_month?.requests || '1.42M'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px' }}>
                <div style={{ color: '#80827f' }}>Tokens processed</div>
                <div className="mono">{vals.plan.tokens_processed || vals.plan.usage_this_month?.tokens || '9.4B'}</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  paddingTop: '14px',
                  borderTop: '1px solid #e0dbce',
                }}
              >
                <div style={{ fontWeight: 500 }}>Estimated total</div>
                <div className="mono" style={{ fontWeight: 500, fontSize: '18px' }}>
                  {vals.plan.estimated_total || '$8,240.16'}
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD CARD */}
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#80827f' }}>PAYMENT METHOD</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#f5f1e4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '20px', height: '14px', borderRadius: '3px', background: '#2c2e2a' }}></div>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>
                  {vals.plan.payment_method?.brand || 'Visa'} •••• {vals.plan.payment_method?.last4 || '4242'}
                </div>
                <div style={{ fontSize: '13px', color: '#80827f' }}>
                  Expires {vals.plan.payment_method?.exp || '09/28'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Payment method modal will be enabled upon connecting Stripe/PCI billing gateway.')}
              style={{
                background: '#f5f1e4',
                border: 'none',
                borderRadius: '50px',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Update payment method
            </button>
            <div style={{ fontSize: '13px', color: '#80827f' }}>
              Billing email: <span style={{ color: '#2c2e2a' }}>{vals.plan.billing_email || 'jordan@filybase.ai'}</span>
            </div>
          </div>
        </div>

        {/* COST BREAKDOWN */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '16px auto 0',
            padding: '0 24px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.16s forwards',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', overflowX: 'auto' }}>
            <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>Cost breakdown — August 2026</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr',
                padding: '0 4px 12px',
                fontSize: '13px',
                color: '#80827f',
                minWidth: '540px',
              }}
            >
              <div>Line item</div>
              <div>Usage</div>
              <div>Rate</div>
              <div>Cost</div>
            </div>
            {loading && !this.state.costData ? (
              <>
                <TableRowSkeleton cols={4} />
                <TableRowSkeleton cols={4} />
                <TableRowSkeleton cols={4} />
              </>
            ) : (
              vals.costItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr',
                    padding: '14px 4px',
                    borderTop: '1px solid #e0dbce',
                    alignItems: 'center',
                    fontSize: '14px',
                    minWidth: '540px',
                  }}
                >
                  <div>{item.model}</div>
                  <div className="mono">{item.usage}</div>
                  <div className="mono">{item.rate}</div>
                  <div className="mono">{item.cost}</div>
                </div>
              ))
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr',
                padding: '16px 4px 0',
                borderTop: '1px solid #e0dbce',
                alignItems: 'center',
                fontSize: '15px',
                fontWeight: 500,
                minWidth: '540px',
              }}
            >
              <div>Total</div>
              <div></div>
              <div></div>
              <div className="mono">{vals.totalCostFormatted}</div>
            </div>
          </div>
        </div>

        {/* INVOICE HISTORY */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '16px auto 0',
            padding: '0 24px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.22s forwards',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>Invoice history</div>
              <div style={{ display: 'flex', gap: '8px', background: '#f5f1e4', borderRadius: '50px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={vals.setFilterAll}
                  style={{
                    border: 'none',
                    borderRadius: '50px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    background: vals.allBg,
                    color: '#2c2e2a',
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={vals.setFilterUnpaid}
                  style={{
                    border: 'none',
                    borderRadius: '50px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    background: vals.unpaidBg,
                    color: '#2c2e2a',
                  }}
                >
                  Unpaid
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 0.6fr',
                padding: '0 4px 12px',
                fontSize: '13px',
                color: '#80827f',
                minWidth: '480px',
              }}
            >
              <div>Invoice</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            {loading && !this.state.invoicesData ? (
              <>
                <TableRowSkeleton cols={4} />
                <TableRowSkeleton cols={4} />
                <TableRowSkeleton cols={4} />
              </>
            ) : vals.invoices.length === 0 ? (
              <EmptyState title="No invoices found" description="You have no unpaid invoices at this time." />
            ) : (
              vals.invoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 0.6fr',
                    padding: '14px 4px',
                    borderTop: '1px solid #e0dbce',
                    alignItems: 'center',
                    fontSize: '14px',
                    transition: 'background 150ms ease',
                    minWidth: '480px',
                  }}
                >
                  <span className="mono" style={{ color: '#2c2e2a', fontWeight: 500 }}>
                    {inv.id}
                  </span>
                  <div>{inv.date}</div>
                  <div className="mono">{inv.amount}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: inv.statusColor,
                        display: 'inline-block',
                      }}
                    ></span>
                    {inv.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingComponent />
    </ProtectedRoute>
  );
}
