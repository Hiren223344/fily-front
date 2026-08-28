import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_ORIGIN, REFRESH_COOKIE, clearSessionCookies } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

export async function POST() {
  const refresh = cookies().get(REFRESH_COOKIE)?.value;

  // Best-effort: tell the gateway to clear its refresh cookie too.
  if (refresh) {
    try {
      await fetch(`${BACKEND_ORIGIN}/v1/auth/logout`, {
        method: 'POST',
        headers: { cookie: `fb_refresh_token=${encodeURIComponent(refresh)}` },
        cache: 'no-store',
      });
    } catch {
      /* ignore */
    }
  }

  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
