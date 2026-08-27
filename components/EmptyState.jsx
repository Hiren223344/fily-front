import React from 'react';

export function EmptyState({ title = 'No items found', description = 'Get started by creating your first entry.', actionLabel, onAction }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '40px', padding: '48px 24px', textAlign: 'center', margin: '16px 0' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f1e4', color: '#80827f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>
        ∅
      </div>
      <div style={{ fontSize: '18px', fontWeight: '500', color: '#2c2e2a', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', color: '#80827f', maxWidth: '380px', margin: '0 auto 20px' }}>
        {description}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: '#8ed462',
            color: '#2c2e2a',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
