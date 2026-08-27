import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.endpoints);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, model } = body;

    if (!name) {
      return NextResponse.json(
        { error: { message: 'Endpoint name is required', code: 'invalid_parameter' } },
        { status: 400 }
      );
    }

    const newEndpoint = {
      id: `ep_${Date.now()}`,
      name: name.trim(),
      model: model || 'llama-3.1-70b',
      requests: '0',
      requests_24h: 0,
      latency: '—',
      p50_latency_ms: 0,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      created_at: new Date().toISOString(),
      live: true,
    };

    db.endpoints.unshift(newEndpoint);
    return NextResponse.json(newEndpoint, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
