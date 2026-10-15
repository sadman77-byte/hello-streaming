import { NextResponse } from 'next/server';
import { verifyPaymentNotification } from '../../../../lib/payment-service';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const form = await request.formData();
    const notification = Object.fromEntries(form.entries());

    const result = await verifyPaymentNotification(notification);

    if (result.ok) {
      return NextResponse.json({ received: true });
    }

    // Do not expose internal validation details to the caller.
    return NextResponse.json(
      { received: true, pendingReview: true },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { received: false },
      { status: 500 }
    );
  }
}
