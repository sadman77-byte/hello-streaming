import { NextResponse } from 'next/server';
import { createPayment, PaymentAdapterError } from '../../../../lib/payment-adapters';

export const runtime = 'nodejs';

function customerFrom(body) {
  const customer = body?.customer || {};
  return { name: String(customer.name || '').trim().slice(0, 80), email: String(customer.email || '').trim().toLowerCase(), phone: String(customer.phone || '').trim() };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const provider = String(body?.provider || '').toLowerCase();
    const customer = customerFrom(body);
    if (!['sslcommerz', 'stripe', 'paypal', 'bkash', 'paytm', 'alipay', 'googlepay'].includes(provider)) return NextResponse.json({ error: 'Unsupported payment provider. সঠিক payment provider নির্বাচন করো।' }, { status: 400 });
    if (customer.name.length < 2 || !/^\S+@\S+\.\S+$/.test(customer.email) || !/^01[0-9]{9}$/.test(customer.phone)) return NextResponse.json({ error: 'Valid name, email and Bangladesh phone required. সঠিক নাম, ইমেইল ও বাংলাদেশি ফোন নম্বর দাও।' }, { status: 400 });
    return NextResponse.json(await createPayment({ provider, planId: body?.planId, customer }));
  } catch (error) {
    if (error instanceof PaymentAdapterError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Payment initialization failed:', error?.message || error);
    return NextResponse.json({ error: 'Payment initialization failed. পেমেন্ট শুরু করা যায়নি।' }, { status: 500 });
  }
}
