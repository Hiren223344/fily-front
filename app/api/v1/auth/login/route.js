import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required', type: 'invalid_request_error', code: 'missing_credentials' } },
        { status: 400 }
      );
    }

    const user = db.users.find((u) => u.email === email) || {
      id: `usr_${Date.now()}`,
      email,
      name: email.split('@')[0],
      plan: 'Pay as you go',
    };

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 }))}.sig`;
    const refreshToken = `ref_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const res = NextResponse.json({
      token,
      access_token: token,
      user,
    });

    res.cookies.set('filybase_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
