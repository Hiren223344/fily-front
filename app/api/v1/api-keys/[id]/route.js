import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const index = db.apiKeys.findIndex((k) => k.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: { message: 'API key not found', code: 'not_found' } },
        { status: 404 }
      );
    }

    const removed = db.apiKeys.splice(index, 1);
    return NextResponse.json({ success: true, removed: removed[0].id });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
