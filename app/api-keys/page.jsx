'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Nav } from '@/components/Nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeTime(value) {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function KeysView() {
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [revoking, setRevoking] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/v1/keys');
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke(id) {
    if (!window.confirm('Revoke this API key? Requests using it will immediately stop working.')) return;
    setRevoking((r) => ({ ...r, [id]: true }));
    try {
      await api.delete(`/v1/keys/${id}`);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to revoke key');
    } finally {
      setRevoking((r) => ({ ...r, [id]: false }));
    }
  }

  const activeKeys = (keys || []).filter((k) => !k.revoked_at);
  const revokedKeys = (keys || []).filter((k) => k.revoked_at);

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '80px' }}>
      <Nav variant="dashboard" />

      <div style={{ maxWidth: '1000px', margin: '40px auto 0', padding: '0 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>AUTHENTICATION</div>
          <h1 style={{ fontSize: 'clamp(30px, 8vw, 44px)', fontWeight: 500, letterSpacing: '-1.6px', margin: 0 }}>API Keys</h1>
          <p style={{ fontSize: '14px', color: '#80827f', margin: '10px 0 0', maxWidth: '520px' }}>
            Use these keys to authenticate requests to the inference gateway with{' '}
            <span className="mono">Authorization: Bearer sk-fb-…</span>. The full key is shown only once at creation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{ background: '#8ed462', border: 'none', borderRadius: '50px', padding: '13px 22px', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          + Create API key
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '28px auto 0', padding: '0 24px' }}>
        {error && <div style={{ marginBottom: '16px' }}><ErrorRetry error={error} onRetry={load} message="Error loading API keys" /></div>}

        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '28px 32px' }}>
          {loading && !keys ? (
            <>
              <TableRowSkeleton cols={3} />
              <TableRowSkeleton cols={3} />
            </>
          ) : activeKeys.length === 0 ? (
            <EmptyState
              title="No API keys yet"
              description="Create your first key to start making authenticated inference calls."
              actionLabel="Create API key"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            activeKeys.map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '16px 0', borderTop: '1px solid #e0dbce' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{k.name}</div>
                  <div className="mono" style={{ fontSize: '13px', color: '#80827f' }}>
                    {(k.prefix || 'sk-fb-')}••••{k.last4 || ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#80827f' }}>Created {formatDate(k.created_at)}</div>
                    <div style={{ fontSize: '13px', color: '#80827f' }}>Last used {relativeTime(k.last_used_at)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(k.id)}
                    disabled={revoking[k.id]}
                    style={{ background: '#ffebe8', color: '#ff705d', border: 'none', borderRadius: '50px', padding: '9px 16px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: revoking[k.id] ? 'not-allowed' : 'pointer' }}
                  >
                    {revoking[k.id] ? 'Revoking…' : 'Revoke'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {revokedKeys.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: '32px', padding: '20px 32px', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: '#80827f', marginBottom: '4px', fontWeight: 500 }}>REVOKED</div>
            {revokedKeys.map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '12px 0', borderTop: '1px solid #e0dbce' }}>
                <div style={{ fontSize: '14px', color: '#80827f', textDecoration: 'line-through' }}>{k.name}</div>
                <div className="mono" style={{ fontSize: '12px', color: '#80827f' }}>{(k.prefix || 'sk-fb-')}••••{k.last4 || ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApiKeyModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => load()} />
    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <ProtectedRoute>
      <KeysView />
    </ProtectedRoute>
  );
}
