import { NextResponse } from 'next/server';
import { verifyPaymentNotification } from '../../../../lib/payment-service';

export const runtime = 'nodejs';

async function handle(request) {
  let result = { ok: false };

  try {
    const contentType = request.headers.get('content-type') || '';
    let fields = {};

    if (request.method === 'POST' &&
        contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      fields = Object.fromEntries(form.entries());
    } else {
      const url = new URL(request.url);
      fields = Object.fromEntries(url.searchParams.entries());
    }

    if (fields.val_id && fields.tran_id) {
      result = await verifyPaymentNotification(fields);
    }
  } catch {}

  const destination = new URL('/payment/result', request.url);
  destination.searchParams.set(
    'status',
    result.ok ? 'received' : 'pending'
  );

  return NextResponse.redirect(destination, 303);
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
