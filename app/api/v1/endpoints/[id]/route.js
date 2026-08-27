import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const epIndex = db.endpoints.findIndex((e) => e.id === id || e.name === id);

    if (epIndex === -1) {
      return NextResponse.json(
        { error: { message: `Endpoint ${id} not found`, code: 'not_found' } },
        { status: 404 }
      );
    }

    if (typeof body.live === 'boolean') {
      db.endpoints[epIndex].live = body.live;
    }
    if (body.name) {
      db.endpoints[epIndex].name = body.name;
    }
    if (body.model) {
      db.endpoints[epIndex].model = body.model;
    }

    return NextResponse.json(db.endpoints[epIndex]);
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const epIndex = db.endpoints.findIndex((e) => e.id === id || e.name === id);

    if (epIndex === -1) {
      return NextResponse.json(
        { error: { message: `Endpoint ${id} not found`, code: 'not_found' } },
        { status: 404 }
      );
    }

    const removed = db.endpoints.splice(epIndex, 1);
    return NextResponse.json({ success: true, removed: removed[0] });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, code: 'internal_error' } },
      { status: 500 }
    );
  }
}
