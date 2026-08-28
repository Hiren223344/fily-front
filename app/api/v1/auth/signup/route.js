import { NextResponse } from 'next/server';
import { BACKEND_ORIGIN, setSessionCookies, extractBackendRefresh } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.text();

  let backendRes;
  try {
    backendRes = await fetch(`${BACKEND_ORIGIN}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'bad_gateway', message: 'Authentication service is unreachable.' },
      { status: 502 }
    );
  }

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json(
      { error: data.error || 'signup_failed', message: data.message || 'Could not create account.' },
      { status: backendRes.status }
    );
  }

  const user = data.user || {};
  // The gateway returns a one-time initial API key on signup — surface it once
  // so the client can show it, but never persist it here.
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    initial_api_key: user.initial_api_key || null,
  });
  setSessionCookies(res, { access: data.token, refresh: extractBackendRefresh(backendRes) });
  return res;
}
