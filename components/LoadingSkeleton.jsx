import React from 'react';

export function StatCardSkeleton() {
  return (
    <div style={{ background: '#ffffff', borderRadius: '50px', padding: '28px 30px' }} className="animate-pulse">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e0dbce', display: 'inline-block' }}></span>
        <div style={{ height: '14px', width: '80px', background: '#e0dbce', borderRadius: '6px' }}></div>
      </div>
      <div style={{ height: '36px', width: '120px', background: '#e0dbce', borderRadius: '8px' }}></div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, padding: '16px 4px', borderTop: '1px solid #e0dbce', alignItems: 'center', gap: '12px' }} className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ height: '16px', background: '#e0dbce', borderRadius: '6px', width: i === 0 ? '70%' : '50%' }}></div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div style={{ height: '260px', display: 'flex', alignItems: 'flex-end', gap: '6px', borderBottom: '1px solid #e0dbce', paddingBottom: '2px' }} className="animate-pulse">
      {Array.from({ length: 24 }).map((_, i) => {
        const h = 20 + Math.sin(i) * 15 + (i % 5) * 12;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(15, Math.min(90, h))}%`,
              background: '#e0dbce',
              borderRadius: '6px 6px 0 0',
              minHeight: '8px',
            }}
          ></div>
        );
      })}
    </div>
  );
}

export function ModelCardSkeleton() {
  return (
    <div style={{ background: '#ffffff', borderRadius: '50px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-pulse">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e0dbce', display: 'inline-block' }}></span>
        <div style={{ height: '13px', width: '60px', background: '#e0dbce', borderRadius: '6px' }}></div>
      </div>
      <div style={{ height: '22px', width: '140px', background: '#e0dbce', borderRadius: '6px' }}></div>
      <div style={{ height: '14px', width: '90px', background: '#e0dbce', borderRadius: '6px' }}></div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px', paddingTop: '14px', borderTop: '1px solid #e0dbce' }}>
        <div style={{ height: '16px', width: '100px', background: '#e0dbce', borderRadius: '6px' }}></div>
        <div style={{ height: '14px', width: '50px', background: '#e0dbce', borderRadius: '6px' }}></div>
      </div>
    </div>
  );
}
