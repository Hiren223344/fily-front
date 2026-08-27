import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '24h';

  const stats = db.usageStats[range] || db.usageStats['24h'];
  return NextResponse.json({
    range,
    ...stats,
  });
}
