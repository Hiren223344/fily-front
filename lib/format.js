/**
 * format.js — display helpers for gateway responses.
 * The gateway returns raw numbers (0-based) where the old mock returned
 * pre-formatted strings like "48.2K". These keep the UI honest about zeros.
 */

export function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(v));
}

export function formatUsd(n) {
  const v = Number(n) || 0;
  if (v === 0) return '$0.00';
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`;
  if (v > 0 && v < 0.01) return `$${v.toPrecision(2)}`; // sub-cent: e.g. $0.00042
  return `$${v.toFixed(2)}`;
}

export function formatMs(n) {
  return `${Math.round(Number(n) || 0)}ms`;
}

export function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
