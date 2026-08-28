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

// Headers we must not forward verbatim to the gateway.
const STRIP = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'cookie',
  'authorization',
]);

async function forward(req, params) {
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const jar = cookies();
  let access = jar.get(ACCESS_COOKIE)?.value || null;
  const refresh = jar.get(REFRESH_COOKIE)?.value || null;

  const incoming = new URL(req.url);
  const target = `${BACKEND_ORIGIN}/v1/${pathParts.join('/')}${incoming.search}`;

  const headers = {};
  for (const [key, value] of req.headers) {
    if (!STRIP.has(key.toLowerCase())) headers[key] = value;
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const bodyBuffer = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  const call = (token) =>
    fetch(target, {
      method: req.method,
      headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
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
    rotated = await refreshTokens(refresh);
    if (rotated) {
      backendRes = await call(rotated.access);
    }
  }

  const payload = Buffer.from(await backendRes.arrayBuffer());
  const out = new NextResponse(payload.length ? payload : null, { status: backendRes.status });

  const contentType = backendRes.headers.get('content-type');
  if (contentType) out.headers.set('content-type', contentType);

  if (rotated) setSessionCookies(out, rotated);
  // If refresh was attempted and failed, drop the stale session.
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
