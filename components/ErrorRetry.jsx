import React from 'react';

export function ErrorRetry({ error, onRetry, message = 'Unable to load data' }) {
  const displayMsg = typeof error === 'string' ? error : error?.message || message;

  return (
    <div style={{ background: '#ffffff', borderRadius: '40px', padding: '32px 24px', textAlign: 'center', margin: '16px 0', border: '1px solid #ff705d' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffebe8', color: '#ff705d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '18px', fontWeight: 'bold' }}>
        !
      </div>
      <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c2e2a', marginBottom: '6px' }}>
        {message}
      </div>
      <div style={{ fontSize: '13px', color: '#80827f', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px', wordBreak: 'break-word' }}>
        {displayMsg}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#2c2e2a',
            color: '#f5f1e4',
            border: 'none',
            borderRadius: '50px',
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 200ms ease',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorRetry;
