import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    plan: 'Pay as you go',
    status: 'active',
    requests_this_month: '1.42M',
    tokens_processed: '9.4B',
    usage_this_month: {
      requests: '1.42M',
      tokens: '9.4B',
    },
    estimated_total: '$8,240.16',
    billing_email: 'jordan@filybase.ai',
    payment_method: {
      brand: 'Visa',
      last4: '4242',
      exp: '09/28',
    },
  });
}
