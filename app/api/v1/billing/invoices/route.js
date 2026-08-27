import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let list = db.invoices;
  if (status && status !== 'all') {
    list = list.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json(list);
}
