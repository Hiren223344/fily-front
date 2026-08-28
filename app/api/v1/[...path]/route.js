import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  BACKEND_ORIGIN,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  setSessionCookies,
  refreshTokens,
} from '@/lib/server/backend';

export const dynamic = 'force-dynamic';
// Allow long-running SSE streams (playground). Hobby plans still cap at 10s.
export const maxDuration = 60;

// Gateway response headers worth surfacing to the browser.
const PASS_THROUGH = [
  'x-filybase-request-id',
  'x-filybase-model',
  'x-filybase-latency-ms',
  'x-filybase-ttft-ms',
  'x-filybase-credits-used',
  'retry-after',
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-reset-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-tokens',
];

// Headers we must not forward verbatim to the gateway. `origin`/`referer` are
// dropped because this is a server-to-server call — forwarding the browser's
// origin makes the gateway's CORS check reject it.
const STRIP = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'cookie',
  'authorization',
  'origin',
  'referer',
]);

async function forward(req, params) {
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const jar = cookies();
  let access = jar.get(ACCESS_COOKIE)?.value || null;
  const refresh = jar.get(REFRESH_COOKIE)?.value || null;

  const incoming = new URL(req.url);
  const target = `${BACKEND_ORIGIN}/v1/${pathParts.join('/')}${incoming.search}`;

  const fwdHeaders = {};
  for (const [key, value] of req.headers) {
    if (!STRIP.has(key.toLowerCase())) fwdHeaders[key] = value;
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const bodyBuffer = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  const call = (token) =>
    fetch(target, {
      method: req.method,
      headers: { ...fwdHeaders, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: bodyBuffer,
      redirect: 'manual',
      cache: 'no-store',
    });

  let backendRes;
  try {
    backendRes = await call(access);
  } catch {
    return NextResponse.json(
      { error: { message: 'Upstream gateway unreachable', code: 'bad_gateway' } },
      { status: 502 }
    );
  }

  let rotated = null;
  if (backendRes.status === 401 && refresh) {
    try {
      await backendRes.body?.cancel();
    } catch {
      /* ignore */
    }
    rotated = await refreshTokens(refresh);
    if (rotated) {
      backendRes = await call(rotated.access);
    }
  }

  const contentType = backendRes.headers.get('content-type') || '';
  const isStream = contentType.includes('text/event-stream');

  const headers = new Headers();
  if (contentType) headers.set('content-type', contentType);
  for (const name of PASS_THROUGH) {
    const v = backendRes.headers.get(name);
    if (v) headers.set(name, v);
  }
  if (isStream) {
    headers.set('cache-control', 'no-cache, no-transform');
    headers.set('x-accel-buffering', 'no');
  }

  // Stream the gateway body straight through — no buffering — so SSE tokens
  // reach the browser as they are produced.
  const out = new NextResponse(backendRes.body, { status: backendRes.status, headers });

  if (rotated) setSessionCookies(out, rotated);
  if (backendRes.status === 401 && refresh && !rotated) {
    out.cookies.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
    out.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
  }

  return out;
}

export const GET = (req, ctx) => forward(req, ctx.params);
export const POST = (req, ctx) => forward(req, ctx.params);
export const PATCH = (req, ctx) => forward(req, ctx.params);
export const PUT = (req, ctx) => forward(req, ctx.params);
export const DELETE = (req, ctx) => forward(req, ctx.params);
