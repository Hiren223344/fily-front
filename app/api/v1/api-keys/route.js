import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(
    db.apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: k.maskedKey,
      created_at: k.created_at,
      last_used: k.last_used,
    }))
  );
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || `API Key ${db.apiKeys.length + 1}`;

    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const fullKey = `sk-fb-live-${randomHex}`;
    const last4 = randomHex.slice(-4);
    const maskedKey = `sk-fb-••••${last4}`;

    const keyRecord = {
      id: `key_${Date.now()}`,
      name,
      key: fullKey,
      maskedKey,
      created_at: new Date().toISOString().split('T')[0],
      last_used: 'Never',
    };

    db.apiKeys.unshift(keyRecord);

    // Full key is returned ONLY upon creation!
    return NextResponse.json(
      {
        id: keyRecord.id,
        name: keyRecord.name,
        key: fullKey,
        maskedKey: keyRecord.maskedKey,
        created_at: keyRecord.created_at,
        last_used: keyRecord.last_used,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
