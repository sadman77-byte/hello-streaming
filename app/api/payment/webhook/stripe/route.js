import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getOrder, activateSubscription } from '../../../../../lib/payment-store';

export const runtime = 'nodejs';

function validSignature(raw, header, secret) {
  const timestamp = header?.match(/(?:^|,)t=(\d+)/)?.[1];
  const signatures = [...(header || '').matchAll(/(?:^|,)v1=([a-f0-9]+)/g)].map(item => item[1]);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  return signatures.some(signature => { const a = Buffer.from(signature, 'hex'); const b = Buffer.from(expected, 'hex'); return a.length === b.length && timingSafeEqual(a, b); });
}

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await request.text();
  if (!secret || !validSignature(raw, request.headers.get('stripe-signature'), secret)) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const transactionId = session?.metadata?.transaction_id;
      const order = transactionId ? await getOrder(transactionId) : null;
      if (!order || order.provider !== 'stripe' || Number(session.amount_total) !== Math.round(order.amount * 100) || String(session.currency).toUpperCase() !== order.currency) return NextResponse.json({ error: 'Order mismatch' }, { status: 400 });
      await activateSubscription(transactionId, { provider: 'stripe', providerOrderId: session.id, amount: order.amount, currency: order.currency });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed:', error?.message || error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
