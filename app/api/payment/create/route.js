import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { PLANS, paymentConfig } from '../../../../lib/payment-config';
import { createOrder, updateOrder } from '../../../../lib/payment-store';

export const runtime = 'nodejs';

export async function POST(request) {
  let tranId = null;

  try {
    const body = await request.json();
    const planId = body?.planId;
    const customer = body?.customer || {};

    if (!Object.hasOwn(PLANS, planId)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    const name = String(customer.name || '').trim().slice(0, 80);
    const email = String(customer.email || '').trim().toLowerCase();
    const phone = String(customer.phone || '').trim();

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^01[0-9]{9}$/.test(phone)
    ) {
      return NextResponse.json(
        { error: 'Valid name, email and Bangladesh phone required' },
        { status: 400 }
      );
    }

    const config = paymentConfig();

    if (!config.storeId || !config.password || !config.siteUrl) {
      return NextResponse.json(
        { error: 'Gateway credentials or site URL are missing' },
        { status: 503 }
      );
    }

    const origin = new URL(config.siteUrl).origin;

    if (config.live && !origin.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Live payments require public HTTPS' },
        { status: 503 }
      );
    }

    tranId = 'HS' + randomUUID().replaceAll('-', '').slice(0, 24);

    await createOrder({
      tranId,
      planId,
      amount: plan.amount,
      currency: 'BDT',
      status: 'pending',
      customer: { name, email, phone },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fields = new URLSearchParams({
      store_id: config.storeId,
      store_passwd: config.password,
      total_amount: plan.amount.toFixed(2),
      currency: 'BDT',
      tran_id: tranId,
      success_url: origin + '/api/payment/callback',
      fail_url: origin + '/api/payment/callback',
      cancel_url: origin + '/api/payment/callback',
      ipn_url: origin + '/api/payment/ipn',
      cus_name: name,
      cus_email: email,
      cus_phone: phone,
      cus_add1: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: plan.name,
      product_category: 'Digital Subscription',
      product_profile: 'non-physical-goods',
      value_a: planId,
    });

    const response = await fetch(
      config.base + '/gwprocess/v4/api.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: fields.toString(),
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      result.status !== 'SUCCESS' ||
      !result.GatewayPageURL
    ) {
      await updateOrder(tranId, order => {
        if (order.status === 'pending') order.status = 'failed';
      });

      return NextResponse.json(
        { error: 'Gateway could not create payment session' },
        { status: 502 }
      );
    }

    const gatewayUrl = new URL(result.GatewayPageURL);

    if (
      gatewayUrl.protocol !== 'https:' ||
      !gatewayUrl.hostname.endsWith('sslcommerz.com')
    ) {
      return NextResponse.json(
        { error: 'Unexpected payment gateway URL' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transactionId: tranId,
      gatewayUrl: gatewayUrl.href,
      mode: config.live ? 'live' : 'sandbox',
    });
  } catch {
    if (tranId) {
      try {
        await updateOrder(tranId, order => {
          if (order.status === 'pending') order.status = 'failed';
        });
      } catch {}
    }

    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
