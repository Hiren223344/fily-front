import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req) {
  try {
    const refreshToken = req.cookies.get('filybase_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: 'No refresh token available', type: 'authentication_error', code: 'unauthorized' } },
        { status: 401 }
      );
    }

    const user = db.users[0] || { id: 'usr_default', email: 'jordan@filybase.ai', name: 'Jordan Diaz' };
    const newToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 }))}.sig`;

    return NextResponse.json({
      token: newToken,
      access_token: newToken,
      user,
    });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
