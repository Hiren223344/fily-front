'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function ApiKeyModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCreatedKey(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/v1/api-keys', { name: name.trim() || 'Default Secret Key' });
      setCreatedKey(res.key);
      if (onCreated) onCreated(res);
    } catch (err) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,46,42,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
        animation: 'overlayIn 220ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '40px',
          padding: '40px',
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          animation: 'modalIn 260ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {!createdKey ? (
          <>
            <div>
              <div style={{ fontSize: '14px', color: '#80827f', marginBottom: '8px' }}>AUTHENTICATION</div>
              <h2 style={{ fontSize: '28px', fontWeight: '500', margin: 0 }}>Create a new API key</h2>
              <p style={{ fontSize: '14px', color: '#80827f', margin: '8px 0 0' }}>
                API keys are used to authenticate requests to the FilyBase serverless inference gateway.
              </p>
            </div>

            {error && (
              <div style={{ background: '#ffebe8', color: '#ff705d', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Key name (optional)</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production Backend, Local Agent"
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: '#f5f1e4',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#8ed462',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating...' : 'Create Secret Key'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <div style={{ fontSize: '14px', color: '#8ed462', fontWeight: '500', marginBottom: '8px' }}>KEY GENERATED</div>
              <h2 style={{ fontSize: '28px', fontWeight: '500', margin: 0 }}>Save your secret key</h2>
              <p style={{ fontSize: '14px', color: '#ff705d', margin: '8px 0 0', fontWeight: '500' }}>
                Please save this secret key now. For your security, you will not be able to view it again.
              </p>
            </div>

            <div style={{ background: '#f5f1e4', borderRadius: '16px', padding: '16px', border: '1px solid #e0dbce' }}>
              <div className="mono" style={{ fontSize: '13px', color: '#2c2e2a', wordBreak: 'break-all', userSelect: 'all' }}>
                {createdKey}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  flex: 1,
                  background: copied ? '#2c2e2a' : '#8ed462',
                  color: copied ? '#f5f1e4' : '#2c2e2a',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'background 200ms ease',
                }}
              >
                {copied ? '✓ Copied to clipboard' : 'Copy key'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: '#f5f1e4',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ApiKeyModal;
