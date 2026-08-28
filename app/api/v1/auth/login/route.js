import { NextResponse } from 'next/server';
import { BACKEND_ORIGIN, setSessionCookies, extractBackendRefresh } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.text();

  let backendRes;
  try {
    backendRes = await fetch(`${BACKEND_ORIGIN}/v1/auth/login`, {
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
      { error: data.error || 'unauthorized', message: data.message || 'Invalid email or password.' },
      { status: backendRes.status }
    );
  }

  const res = NextResponse.json({ user: data.user });
  setSessionCookies(res, { access: data.token, refresh: extractBackendRefresh(backendRes) });
  return res;
}
