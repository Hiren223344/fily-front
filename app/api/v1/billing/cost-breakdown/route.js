import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '2026-08';

  const total = db.costBreakdown.reduce((sum, item) => {
    const num = parseFloat(item.cost.replace(/[$,]/g, '')) || 0;
    return sum + num;
  }, 0);

  return NextResponse.json({
    period,
    items: db.costBreakdown,
    total: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  });
}
