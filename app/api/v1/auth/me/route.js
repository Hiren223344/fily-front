import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  BACKEND_ORIGIN,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  setSessionCookies,
  clearSessionCookies,
  refreshTokens,
} from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

function fetchMe(token) {
  return fetch(`${BACKEND_ORIGIN}/v1/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

export async function GET() {
  const jar = cookies();
  const access = jar.get(ACCESS_COOKIE)?.value || null;
  const refresh = jar.get(REFRESH_COOKIE)?.value || null;

  let backendRes = null;
  let rotated = null;

  if (access) {
    try {
      backendRes = await fetchMe(access);
    } catch {
      return NextResponse.json({ authenticated: false, error: 'bad_gateway' }, { status: 502 });
    }
  }

  if ((!backendRes || backendRes.status === 401) && refresh) {
    rotated = await refreshTokens(refresh);
    if (rotated) backendRes = await fetchMe(rotated.access);
  }

  if (!backendRes || !backendRes.ok) {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    clearSessionCookies(res);
    return res;
  }

  const data = await backendRes.json().catch(() => ({}));
  const res = NextResponse.json({ authenticated: true, user: data.user, projects: data.projects || [] });
  if (rotated) setSessionCookies(res, rotated);
  return res;
}
