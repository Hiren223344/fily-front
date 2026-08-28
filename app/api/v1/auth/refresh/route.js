import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { REFRESH_COOKIE, setSessionCookies, clearSessionCookies, refreshTokens } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

export async function POST() {
  const refresh = cookies().get(REFRESH_COOKIE)?.value;
  const rotated = await refreshTokens(refresh);

  if (!rotated) {
    const res = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    clearSessionCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true, user: rotated.user });
  setSessionCookies(res, rotated);
  return res;
}
