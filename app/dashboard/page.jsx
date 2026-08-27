'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { store, TTL } from '@/lib/store';
import { Poller } from '@/lib/polling';
import { Nav } from '@/components/Nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatCardSkeleton, ChartSkeleton, TableRowSkeleton } from '@/components/LoadingSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';

// Default mock shapes so template holes never see undefined
const DEFAULT_STATS_BY_RANGE = {
  '24h': { requests: '48.2K', tokens: '312M', spend: '$284', latency: '41ms' },
  '7d': { requests: '338K', tokens: '2.1B', spend: '$1,960', latency: '44ms' },
  '30d': { requests: '1.42M', tokens: '9.4B', spend: '$8,240', latency: '46ms' },
};

const DEFAULT_CHART_BY_RANGE = {
  '24h': [22, 28, 19, 34, 41, 38, 52, 61, 58, 70, 65, 74, 80, 76, 68, 72, 85, 90, 82, 77, 64, 55, 48, 40],
  '7d': [45, 52, 60, 58, 70, 66, 74],
  '30d': [40, 44, 48, 46, 52, 55, 58, 54, 60, 63, 61, 66, 70, 68, 72, 75, 71, 69, 74, 78, 80, 76, 73, 77, 82, 85, 81, 79, 84, 88],
};

const DEFAULT_ENDPOINTS = [
  { id: 'ep_1', name: 'chat-prod', model: 'llama-3.1-70b', live: true },
  { id: 'ep_2', name: 'embeddings', model: 'bge-large', live: true },
  { id: 'ep_3', name: 'sd-image-gen', model: 'stable-diffusion-3', live: false },
  { id: 'ep_4', name: 'ft-support-bot', model: 'custom fine-tune', live: true },
];

class DashboardComponent extends React.Component {
  state = {
    range: '24h',
    grown: false,
    loading: true,
    error: null,
    statsData: null,
    endpointsData: null,
  };

  poller = null;

  componentDidMount() {
    requestAnimationFrame(() => this.setState({ grown: true }));
    this.fetchData();

    // Polling interval that pauses when document.hidden is true
    this.poller = new Poller(() => this.fetchData(true), 15000, { pauseOnHidden: true });
    this.poller.start(false);
  }

  componentWillUnmount() {
    if (this.poller) {
      this.poller.stop();
    }
  }

  async fetchData(isPolling = false) {
    if (!isPolling) {
      this.setState({ loading: true, error: null });
    }

    try {
      const range = this.state.range;
      const usageKey = `/v1/usage?range=${range}`;
      const endpointsKey = `/v1/endpoints`;

      // Use store.get with deduplication and TTL
      const [usageRes, endpointsRes] = await Promise.all([
        store.get(usageKey, () => api.get(usageKey), TTL.USAGE, isPolling),
        store.get(endpointsKey, () => api.get(endpointsKey), TTL.ENDPOINTS, isPolling),
      ]);

      this.setState({
        statsData: usageRes,
        endpointsData: endpointsRes,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
      if (!isPolling) {
        this.setState({
          error: err.message || 'Failed to load dashboard metrics',
          loading: false,
        });
      }
    }
  }

  setRange(newRange) {
    if (this.state.range === newRange) return;
    this.setState({ range: newRange, loading: true, grown: false }, () => {
      this.fetchData();
      requestAnimationFrame(() => this.setState({ grown: true }));
    });
  }

  async toggleEndpoint(ep, index) {
    const currentEndpoints = this.getEndpointsList();
    const targetEp = currentEndpoints[index];
    if (!targetEp) return;

    const previousLiveState = targetEp.live;
    const nextLiveState = !previousLiveState;

    // 1. Optimistic UI update
    const updated = [...currentEndpoints];
    updated[index] = { ...targetEp, live: nextLiveState };
    this.setState({ endpointsData: updated });

    try {
      // 2. Network call
      const epId = targetEp.id || targetEp.name;
      await api.patch(`/v1/endpoints/${epId}`, { live: nextLiveState });
      store.invalidatePrefix('/v1/endpoints');
    } catch (err) {
      console.error('[Dashboard] Toggle endpoint failed, reverting:', err);
      // 3. Revert on failure
      const reverted = [...currentEndpoints];
      reverted[index] = { ...targetEp, live: previousLiveState };
      this.setState({ endpointsData: reverted, error: `Failed to toggle ${targetEp.name}: ${err.message}` });
    }
  }

  getEndpointsList() {
    if (Array.isArray(this.state.endpointsData) && this.state.endpointsData.length > 0) {
      return this.state.endpointsData;
    }
    return DEFAULT_ENDPOINTS;
  }

  renderVals() {
    const range = this.state.range;
    const defaultStats = DEFAULT_STATS_BY_RANGE[range] || DEFAULT_STATS_BY_RANGE['24h'];
    const defaultChart = DEFAULT_CHART_BY_RANGE[range] || DEFAULT_CHART_BY_RANGE['24h'];

    // Read real API data with fallback to mock default shape so template holes never see undefined
    const realStats = this.state.statsData;
    const stats = {
      requests: realStats?.requests || defaultStats.requests,
      tokens: realStats?.tokens || defaultStats.tokens,
      spend: realStats?.spend || defaultStats.spend,
      latency: realStats?.latency || (realStats?.p50_latency_ms ? `${realStats.p50_latency_ms}ms` : defaultStats.latency),
    };

    const rawChart = realStats?.chart && Array.isArray(realStats.chart) && realStats.chart.length > 0
      ? realStats.chart
      : defaultChart;

    const maxVal = Math.max(...rawChart, 1);
    const grown = this.state.grown;

    const chartBars = rawChart.map((v, i) => ({
      heightPct: grown ? Math.round((v / maxVal) * 100) : 0,
      delay: `${i * 15}ms`,
    }));

    const rawEndpoints = this.getEndpointsList();
    const endpoints = rawEndpoints.map((ep, i) => ({
      ...ep,
      statusLabel: ep.live ? 'Live' : 'Paused',
      statusColor: ep.live ? '#8ed462' : '#ff705d',
      toggle: () => this.toggleEndpoint(ep, i),
    }));

    return {
      stats,
      chartBars,
      endpoints,
      range24Bg: range === '24h' ? '#8ed462' : 'transparent',
      range7Bg: range === '7d' ? '#8ed462' : 'transparent',
      range30Bg: range === '30d' ? '#8ed462' : 'transparent',
      setRange24: () => this.setRange('24h'),
      setRange7: () => this.setRange('7d'),
      setRange30: () => this.setRange('30d'),
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
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '15px',
                color: '#80827f',
                marginBottom: '8px',
                opacity: 0,
                animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0s forwards',
              }}
            >
              GOOD MORNING, JORDAN
            </div>
            <h1
              style={{
                fontSize: '53px',
                fontWeight: 500,
                letterSpacing: '-2.12px',
                lineHeight: 1.1,
                margin: 0,
                opacity: 0,
                animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.06s forwards',
              }}
            >
              Overview
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: '#ffffff', borderRadius: '50px', padding: '4px' }}>
            <button
              type="button"
              onClick={vals.setRange24}
              style={{
                border: 'none',
                borderRadius: '50px',
                padding: '9px 16px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                background: vals.range24Bg,
                color: '#2c2e2a',
              }}
            >
              24h
            </button>
            <button
              type="button"
              onClick={vals.setRange7}
              style={{
                border: 'none',
                borderRadius: '50px',
                padding: '9px 16px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                background: vals.range7Bg,
                color: '#2c2e2a',
              }}
            >
              7d
            </button>
            <button
              type="button"
              onClick={vals.setRange30}
              style={{
                border: 'none',
                borderRadius: '50px',
                padding: '9px 16px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                background: vals.range30Bg,
                color: '#2c2e2a',
              }}
            >
              30d
            </button>
          </div>
        </div>

        {/* ERROR STATE WITH RETRY */}
        {error && (
          <div style={{ maxWidth: '1280px', margin: '20px auto 0', padding: '0 24px' }}>
            <ErrorRetry error={error} onRetry={() => this.fetchData(false)} message="Error connecting to metrics API" />
          </div>
        )}

        {/* STAT CARDS */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '32px auto 0',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {loading && !this.state.statsData ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div
                className="card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: '50px',
                  padding: '28px 30px',
                  opacity: 0,
                  animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s forwards',
                  transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8ed462', display: 'inline-block' }}></span>
                  <div style={{ fontSize: '14px', color: '#80827f' }}>Requests</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-1px' }}>{vals.stats.requests}</div>
              </div>

              <div
                className="card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: '50px',
                  padding: '28px 30px',
                  opacity: 0,
                  animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.16s forwards',
                  transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ba0ff', display: 'inline-block' }}></span>
                  <div style={{ fontSize: '14px', color: '#80827f' }}>Tokens processed</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-1px' }}>{vals.stats.tokens}</div>
              </div>

              <div
                className="card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: '50px',
                  padding: '28px 30px',
                  opacity: 0,
                  animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.22s forwards',
                  transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff705d', display: 'inline-block' }}></span>
                  <div style={{ fontSize: '14px', color: '#80827f' }}>Spend</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-1px' }}>{vals.stats.spend}</div>
              </div>

              <div
                className="card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: '50px',
                  padding: '28px 30px',
                  opacity: 0,
                  animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.28s forwards',
                  transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5e211', display: 'inline-block' }}></span>
                  <div style={{ fontSize: '14px', color: '#80827f' }}>P50 latency</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-1px' }}>{vals.stats.latency}</div>
              </div>
            </>
          )}
        </div>

        {/* USAGE + ENDPOINTS */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '16px auto 0',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {/* USAGE OVER TIME CHART */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '50px',
              padding: '32px',
              opacity: 0,
              animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.3s forwards',
              flex: '1.6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>Usage over time</div>
              <div style={{ fontSize: '14px', color: '#80827f' }}>tokens / hour</div>
            </div>
            {loading && !this.state.statsData ? (
              <ChartSkeleton />
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'flex-end', gap: '6px', borderBottom: '1px solid #e0dbce', paddingBottom: '2px' }}>
                {vals.chartBars.map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${bar.heightPct}%`,
                      background: '#8ed462',
                      borderRadius: '6px 6px 0 0',
                      minHeight: '4px',
                      transition: `height 500ms cubic-bezier(0.4,0,0.2,1) ${bar.delay}`,
                    }}
                    title={`Bucket ${i + 1}`}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* ENDPOINTS LIST */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '50px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              opacity: 0,
              animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.36s forwards',
              flex: '1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>Endpoints</div>
              <Link href="/endpoints" style={{ fontSize: '14px', color: '#80827f', borderBottom: '1px solid #80827f', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>

            {loading && !this.state.endpointsData ? (
              <>
                <TableRowSkeleton cols={2} />
                <TableRowSkeleton cols={2} />
                <TableRowSkeleton cols={2} />
              </>
            ) : vals.endpoints.length === 0 ? (
              <EmptyState title="No active endpoints" description="Deploy an endpoint to start serving inference." actionLabel="Create endpoint" onAction={() => window.location.href = '/endpoints'} />
            ) : (
              vals.endpoints.slice(0, 5).map((ep, i) => (
                <div
                  key={ep.id || ep.name || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '1px solid #e0dbce',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500 }}>{ep.name}</div>
                    <div style={{ fontSize: '13px', color: '#80827f' }} className="mono">
                      {ep.model}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={ep.toggle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      color: '#2c2e2a',
                    }}
                    title="Click to toggle live status"
                  >
                    {ep.statusLabel}
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: ep.statusColor,
                        display: 'inline-block',
                      }}
                    ></span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardComponent />
    </ProtectedRoute>
  );
}
