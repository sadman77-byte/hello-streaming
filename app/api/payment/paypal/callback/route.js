import { NextResponse } from 'next/server';
import { capturePaypal, PaymentAdapterError } from '../../../../../lib/payment-adapters';

export const runtime = 'nodejs';

export async function GET(request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get('transactionId');
  let status = 'pending';
  try { if (transactionId) { const result = await capturePaypal(transactionId); status = result.ok ? 'received' : 'pending'; } }
  catch (error) { if (!(error instanceof PaymentAdapterError)) console.error('PayPal callback failed:', error?.message || error); }
  const destination = new URL('/payment/result', request.url);
  destination.searchParams.set('status', status);
  destination.searchParams.set('provider', 'paypal');
  return NextResponse.redirect(destination, 303);
}
