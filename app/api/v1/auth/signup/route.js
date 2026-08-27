import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required', type: 'invalid_request_error', code: 'missing_credentials' } },
        { status: 400 }
      );
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      plan: 'Pay as you go',
      credits: 5.00,
    };

    db.users.push(newUser);

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: newUser.id, email: newUser.email, exp: Math.floor(Date.now() / 1000) + 3600 }))}.sig`;
    const refreshToken = `ref_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const res = NextResponse.json({
      token,
      access_token: token,
      user: newUser,
    });

    res.cookies.set('filybase_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
