/**
 * backend.js — server-only helper for the BFF proxy.
 *
 * The browser never talks to the FilyBase gateway directly and never holds a
 * JWT. It talks same-origin to /api/v1/* (this Next app); these routes attach
 * the access token from an httpOnly cookie and forward to the gateway. This
 * keeps tokens out of JS-reachable storage (XSS cannot exfiltrate them) and
 * lets us do transparent refresh server-side.
 */

export const BACKEND_ORIGIN = (
  process.env.BACKEND_ORIGIN || 'http://localhost:8080'
).replace(/\/+$/, '');

export const ACCESS_COOKIE = 'fb_access';
export const REFRESH_COOKIE = 'fb_refresh';

const ACCESS_MAX_AGE = 15 * 60; // matches gateway JWT_EXPIRY (15m)
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // matches gateway REFRESH_TOKEN_EXPIRY_DAYS

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

export function setSessionCookies(res, { access, refresh }) {
  if (access) res.cookies.set(ACCESS_COOKIE, access, cookieOptions(ACCESS_MAX_AGE));
  if (refresh) res.cookies.set(REFRESH_COOKIE, refresh, cookieOptions(REFRESH_MAX_AGE));
}

export function clearSessionCookies(res) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

/** Pull the gateway's fb_refresh_token value out of a fetch Response. */
export function extractBackendRefresh(backendRes) {
  const jar =
    typeof backendRes.headers.getSetCookie === 'function'
      ? backendRes.headers.getSetCookie()
      : [backendRes.headers.get('set-cookie')].filter(Boolean);
  for (const cookie of jar) {
    const match = /(?:^|;\s*)fb_refresh_token=([^;]+)/.exec(cookie);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Exchange a refresh token for a fresh access token via the gateway.
 * Returns null when the refresh token is missing/expired/invalid.
 */
export async function refreshTokens(refreshValue) {
  if (!refreshValue) return null;
  let res;
  try {
    res = await fetch(`${BACKEND_ORIGIN}/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `fb_refresh_token=${encodeURIComponent(refreshValue)}` },
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || !data.token) return null;
  return {
    access: data.token,
    refresh: extractBackendRefresh(res) || refreshValue,
    user: data.user || null,
  };
}
