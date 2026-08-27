'use client';

import React from 'react';
import { api } from '@/lib/api';
import { store, TTL } from '@/lib/store';
import { Poller } from '@/lib/polling';
import { Nav } from '@/components/Nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';

const DEFAULT_ENDPOINTS = [
  { id: 'ep_1', name: 'chat-prod', model: 'llama-3.1-70b', requests: '48.2K', requests_24h: 48200, latency: '41ms', p50_latency_ms: 41, created: 'Jun 12, 2026', live: true },
  { id: 'ep_2', name: 'embeddings', model: 'bge-large', requests: '12.9K', requests_24h: 12900, latency: '9ms', p50_latency_ms: 9, created: 'Jun 12, 2026', live: true },
  { id: 'ep_3', name: 'sd-image-gen', model: 'stable-diffusion-3', requests: '2.1K', requests_24h: 2100, latency: '640ms', p50_latency_ms: 640, created: 'Jul 2, 2026', live: false },
  { id: 'ep_4', name: 'ft-support-bot', model: 'custom fine-tune', requests: '6.4K', requests_24h: 6400, latency: '52ms', p50_latency_ms: 52, created: 'Jul 18, 2026', live: true },
  { id: 'ep_5', name: 'summarizer', model: 'qwen-2.5-32b', requests: '980', requests_24h: 980, latency: '38ms', p50_latency_ms: 38, created: 'Aug 3, 2026', live: true },
  { id: 'ep_6', name: 'moderation-check', model: 'llama-3.1-8b', requests: '31.5K', requests_24h: 31500, latency: '18ms', p50_latency_ms: 18, created: 'Aug 9, 2026', live: false },
];

class EndpointsComponent extends React.Component {
  state = {
    filter: 'all',
    modalOpen: false,
    formName: '',
    formModel: 'llama-3.1-70b',
    loading: true,
    deploying: false,
    error: null,
    endpoints: DEFAULT_ENDPOINTS,
  };

  poller = null;

  componentDidMount() {
    this.fetchEndpoints();

    // Smart polling with document.hidden pause
    this.poller = new Poller(() => this.fetchEndpoints(true), 10000, { pauseOnHidden: true });
    this.poller.start(false);
  }

  componentWillUnmount() {
    if (this.poller) {
      this.poller.stop();
    }
  }

  async fetchEndpoints(isPolling = false) {
    if (!isPolling) {
      this.setState({ loading: true, error: null });
    }

    try {
      const endpointsKey = '/v1/endpoints';
      const data = await store.get(endpointsKey, () => api.get(endpointsKey), TTL.ENDPOINTS, isPolling);
      this.setState({
        endpoints: Array.isArray(data) ? data : DEFAULT_ENDPOINTS,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[Endpoints] Fetch error:', err);
      if (!isPolling) {
        this.setState({
          error: err.message || 'Failed to load endpoints list',
          loading: false,
        });
      }
    }
  }

  async toggleEndpoint(ep) {
    const prevLive = ep.live;
    const nextLive = !prevLive;
    const epId = ep.id || ep.name;

    // 1. Optimistic toggle
    const currentList = this.state.endpoints;
    const updated = currentList.map((item) =>
      item.id === ep.id || item.name === ep.name ? { ...item, live: nextLive } : item
    );
    this.setState({ endpoints: updated });

    try {
      // 2. Real API call
      await api.patch(`/v1/endpoints/${epId}`, { live: nextLive });
      store.invalidatePrefix('/v1/endpoints');
    } catch (err) {
      console.error('[Endpoints] Toggle failed, reverting optimistic state:', err);
      // 3. Revert on failure
      const reverted = currentList.map((item) =>
        item.id === ep.id || item.name === ep.name ? { ...item, live: prevLive } : item
      );
      this.setState({
        endpoints: reverted,
        error: `Could not toggle status for ${ep.name}: ${err.message}`,
      });
    }
  }

  async handleDeploy() {
    const name = this.state.formName.trim() || `endpoint-${Math.floor(Math.random() * 900 + 100)}`;
    const model = this.state.formModel;

    this.setState({ deploying: true, error: null });

    try {
      const created = await api.post('/v1/endpoints', { name, model });
      store.invalidatePrefix('/v1/endpoints');

      this.setState((s) => ({
        modalOpen: false,
        formName: '',
        formModel: 'llama-3.1-70b',
        deploying: false,
        endpoints: [created, ...s.endpoints],
      }));
    } catch (err) {
      console.error('[Endpoints] Deploy failed:', err);
      this.setState({
        error: `Failed to deploy endpoint: ${err.message}`,
        deploying: false,
      });
    }
  }

  async handleDelete(ep) {
    if (!confirm(`Are you sure you want to delete endpoint "${ep.name}"?`)) return;

    const epId = ep.id || ep.name;
    const prevList = this.state.endpoints;
    this.setState({ endpoints: prevList.filter((item) => item.id !== ep.id && item.name !== ep.name) });

    try {
      await api.delete(`/v1/endpoints/${epId}`);
      store.invalidatePrefix('/v1/endpoints');
    } catch (err) {
      this.setState({
        endpoints: prevList,
        error: `Failed to delete endpoint: ${err.message}`,
      });
    }
  }

  renderVals() {
    const filter = this.state.filter;
    const source = this.state.endpoints || DEFAULT_ENDPOINTS;

    const filtered = source.filter((ep) =>
      filter === 'all' || (filter === 'live' ? ep.live : !ep.live)
    );

    const endpoints = filtered.map((ep) => ({
      ...ep,
      requests: ep.requests || (ep.requests_24h ? `${(ep.requests_24h / 1000).toFixed(1)}K` : '0'),
      latency: ep.latency || (ep.p50_latency_ms ? `${ep.p50_latency_ms}ms` : '—'),
      created: ep.created || (ep.created_at ? new Date(ep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'),
      statusLabel: ep.live ? 'Live' : 'Paused',
      statusColor: ep.live ? '#8ed462' : '#ff705d',
      toggle: () => this.toggleEndpoint(ep),
      delete: () => this.handleDelete(ep),
    }));

    return {
      endpoints,
      allBg: filter === 'all' ? '#8ed462' : '#ffffff',
      liveBg: filter === 'live' ? '#8ed462' : '#ffffff',
      pausedBg: filter === 'paused' ? '#8ed462' : '#ffffff',
      setFilterAll: () => this.setState({ filter: 'all' }),
      setFilterLive: () => this.setState({ filter: 'live' }),
      setFilterPaused: () => this.setState({ filter: 'paused' }),
      modalOpen: this.state.modalOpen,
      formName: this.state.formName,
      formModel: this.state.formModel,
      sharedBorder: '#8ed462',
      sharedBg: '#f5f1e4',
      openModal: () => this.setState({ modalOpen: true, formName: '', formModel: 'llama-3.1-70b', error: null }),
      closeModal: () => this.setState({ modalOpen: false }),
      stopClick: (e) => e.stopPropagation(),
      setFormName: (e) => this.setState({ formName: e.target.value }),
      setFormModel: (e) => this.setState({ formModel: e.target.value }),
      selectShared: () => {},
      deploy: () => this.handleDeploy(),
    };
  }

  render() {
    const vals = this.renderVals();
    const { loading, deploying, error } = this.state;

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
          <div style={{ opacity: 0, animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0s forwards' }}>
            <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>DEPLOYMENTS</div>
            <h1 style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.1, margin: 0 }}>
              Endpoints
            </h1>
          </div>
          <button
            type="button"
            onClick={vals.openModal}
            style={{
              background: '#2c2e2a',
              color: '#f5f1e4',
              border: 'none',
              borderRadius: '50px',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              opacity: 0,
              animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.08s forwards',
              transition: 'background 200ms ease',
            }}
          >
            New endpoint
          </button>
        </div>

        {/* ERROR NOTIFICATION WITH RETRY */}
        {error && (
          <div style={{ maxWidth: '1280px', margin: '20px auto 0', padding: '0 24px' }}>
            <ErrorRetry error={error} onRetry={() => this.fetchEndpoints(true)} message="Endpoint operation alert" />
          </div>
        )}

        {/* FILTERS */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '24px auto 0',
            padding: '0 24px',
            display: 'flex',
            gap: '8px',
            opacity: 0,
            animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.14s forwards',
          }}
        >
          <button
            type="button"
            onClick={vals.setFilterAll}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.allBg,
              color: '#2c2e2a',
              transition: 'background 200ms ease',
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={vals.setFilterLive}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.liveBg,
              color: '#2c2e2a',
              transition: 'background 200ms ease',
            }}
          >
            Live
          </button>
          <button
            type="button"
            onClick={vals.setFilterPaused}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.pausedBg,
              color: '#2c2e2a',
              transition: 'background 200ms ease',
            }}
          >
            Paused
          </button>
        </div>

        {/* ENDPOINTS TABLE */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '16px auto 0',
            padding: '0 24px',
            opacity: 0,
            animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '50px', padding: '32px', overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr',
                padding: '0 4px 12px',
                fontSize: '13px',
                color: '#80827f',
                minWidth: '680px',
              }}
            >
              <div>Name</div>
              <div>Model</div>
              <div>Requests (24h)</div>
              <div>P50 latency</div>
              <div>Created</div>
              <div>Status</div>
            </div>

            {loading && !this.state.endpoints ? (
              <>
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
              </>
            ) : vals.endpoints.length === 0 ? (
              <EmptyState
                title="No endpoints matching filter"
                description="Create a new endpoint or change the active filter."
                actionLabel="Deploy new endpoint"
                onAction={vals.openModal}
              />
            ) : (
              vals.endpoints.map((ep) => (
                <div
                  key={ep.id || ep.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr',
                    padding: '16px 4px',
                    borderTop: '1px solid #e0dbce',
                    alignItems: 'center',
                    fontSize: '14px',
                    transition: 'background 150ms ease',
                    minWidth: '680px',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{ep.name}</div>
                  <div className="mono" style={{ color: '#80827f' }}>
                    {ep.model}
                  </div>
                  <div className="mono">{ep.requests}</div>
                  <div className="mono">{ep.latency}</div>
                  <div style={{ color: '#80827f' }}>{ep.created}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                        justifySelf: 'start',
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
                    <button
                      type="button"
                      onClick={ep.delete}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#80827f',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                      title="Delete endpoint"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DEPLOY MODAL */}
        {vals.modalOpen && (
          <div
            onClick={vals.closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(44,46,42,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '24px',
              animation: 'overlayIn 220ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div
              onClick={vals.stopClick}
              style={{
                background: '#ffffff',
                borderRadius: '40px',
                padding: '40px',
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                animation: 'modalIn 260ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>NEW ENDPOINT</div>
                <h2 style={{ fontSize: '30px', fontWeight: 500, margin: 0 }}>Deploy an endpoint</h2>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Endpoint name</div>
                <input
                  type="text"
                  value={vals.formName}
                  onChange={vals.setFormName}
                  placeholder="e.g. chat-prod"
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
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Model</div>
                <select
                  value={vals.formModel}
                  onChange={vals.setFormModel}
                  style={{
                    width: '100%',
                    background: '#f5f1e4',
                    border: '1px solid #e0dbce',
                    borderRadius: '10px',
                    padding: '13px 16px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    color: '#2c2e2a',
                    cursor: 'pointer',
                  }}
                >
                  <option value="llama-3.1-70b">Llama 3.1 70B</option>
                  <option value="llama-3.1-8b">Llama 3.1 8B</option>
                  <option value="mixtral-8x22b">Mixtral 8x22B</option>
                  <option value="qwen-2.5-32b">Qwen 2.5 32B</option>
                  <option value="stable-diffusion-3">Stable Diffusion 3</option>
                  <option value="bge-large">BGE Large (embeddings)</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Compute tier</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={vals.selectShared}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${vals.sharedBorder}`,
                      background: vals.sharedBg,
                      borderRadius: '16px',
                      padding: '14px 16px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Shared pool</div>
                    <div style={{ fontSize: '13px', color: '#80827f' }}>Autoscaling, pay per token — available now</div>
                  </button>
                  <div style={{ border: '1px solid #e0dbce', borderRadius: '16px', padding: '14px 16px', opacity: 0.5 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Dedicated GPU</div>
                    <div style={{ fontSize: '13px', color: '#80827f' }}>Reserved capacity, fixed hourly rate — coming soon</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={vals.closeModal}
                  style={{
                    flex: 1,
                    background: '#f5f1e4',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={vals.deploy}
                  disabled={deploying}
                  style={{
                    flex: 1,
                    background: '#8ed462',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: deploying ? 'not-allowed' : 'pointer',
                    opacity: deploying ? 0.7 : 1,
                  }}
                >
                  {deploying ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default function EndpointsPage() {
  return (
    <ProtectedRoute>
      <EndpointsComponent />
    </ProtectedRoute>
  );
}
