import { randomUUID } from 'node:crypto';
import { PLANS, paymentConfig, siteUrl } from './payment-config';
import { createOrder, updateOrder } from './payment-store';

export class PaymentAdapterError extends Error {
  constructor(code, message, status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const unsupported = (provider, requirements) => new PaymentAdapterError(
  'UNSUPPORTED_PROVIDER',
  `${provider} direct integration is not enabled yet. Configure the required merchant contract first: ${requirements}. এই gateway এখনো এই সাইটে সরাসরি সক্রিয় নয়।`,
  501,
);

function scaffold(provider, envNames, requirements) {
  const missing = envNames.filter(name => !process.env[name]);
  if (missing.length) throw new PaymentAdapterError('NOT_CONFIGURED', `${provider} configuration is incomplete: ${missing.join(', ')}. ${provider} কনফিগারেশনের প্রয়োজনীয় তথ্য অনুপস্থিত।`);
  throw unsupported(provider, requirements);
}

function requireSiteUrl() {
  const origin = siteUrl();
  if (!origin) throw new PaymentAdapterError('SITE_URL_MISSING', 'NEXT_PUBLIC_SITE_URL must be a valid http(s) URL. পেমেন্ট শুরু করতে সঠিক site URL প্রয়োজন।');
  return origin;
}

function transactionId() {
  return 'HS' + randomUUID().replaceAll('-', '').slice(0, 24);
}

async function saveOrder({ tranId, provider, planId, plan, customer }) {
  const now = new Date().toISOString();
  await createOrder({
    tranId, provider, planId, amount: plan.amount, currency: plan.currency,
    status: 'pending', customer, createdAt: now, updatedAt: now,
  });
}

function validateExternalUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null;
    return url.href;
  } catch { return null; }
}

async function createSslcommerz({ tranId, planId, plan, customer, origin }) {
  const config = paymentConfig();
  if (!config.storeId || !config.password) throw new PaymentAdapterError('NOT_CONFIGURED', 'SSLCommerz credentials are missing. SSLCommerz-এর Store ID ও password কনফিগার করো।');
  const fields = new URLSearchParams({
    store_id: config.storeId, store_passwd: config.password, total_amount: plan.amount.toFixed(2), currency: plan.currency,
    tran_id: tranId, success_url: `${origin}/api/payment/callback`, fail_url: `${origin}/api/payment/callback`, cancel_url: `${origin}/api/payment/callback`, ipn_url: `${origin}/api/payment/ipn`,
    cus_name: customer.name, cus_email: customer.email, cus_phone: customer.phone, cus_add1: 'Bangladesh', cus_city: 'Dhaka', cus_postcode: '1000', cus_country: 'Bangladesh',
    shipping_method: 'NO', product_name: plan.name, product_category: 'Digital Subscription', product_profile: 'non-physical-goods', value_a: planId,
  });
  const response = await fetch(`${config.base}/gwprocess/v4/api.php`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const result = await response.json().catch(() => ({}));
  const gatewayUrl = validateExternalUrl(result.GatewayPageURL, ['sslcommerz.com']);
  if (!response.ok || result.status !== 'SUCCESS' || !gatewayUrl) throw new PaymentAdapterError('GATEWAY_ERROR', 'SSLCommerz payment session could not be created. SSLCommerz payment session তৈরি হয়নি।', 502);
  return { redirectUrl: gatewayUrl, mode: config.live ? 'live' : 'sandbox' };
}

async function createStripe({ tranId, plan, customer, origin }) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new PaymentAdapterError('NOT_CONFIGURED', 'STRIPE_SECRET_KEY is missing. Stripe secret key কনফিগার করো।');
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: `${origin}/payment/result?status=received&provider=stripe&transactionId=${encodeURIComponent(tranId)}`,
    cancel_url: `${origin}/payment?status=cancelled`,
    'line_items[0][price_data][currency]': 'bdt',
    'line_items[0][price_data][product_data][name]': plan.name,
    'line_items[0][price_data][unit_amount]': String(Math.round(plan.amount * 100)),
    'line_items[0][quantity]': '1',
    'customer_email': customer.email,
    'metadata[transaction_id]': tranId,
    'metadata[plan_id]': plan.id || '',
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const result = await response.json().catch(() => ({}));
  const redirectUrl = validateExternalUrl(result.url, ['stripe.com']);
  if (!response.ok || !redirectUrl) throw new PaymentAdapterError('GATEWAY_ERROR', 'Stripe Checkout session could not be created. Stripe Checkout session তৈরি হয়নি।', 502);
  return { redirectUrl, mode: key.startsWith('sk_live_') ? 'live' : 'test', providerOrderId: result.id };
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new PaymentAdapterError('NOT_CONFIGURED', 'PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are missing. PayPal credentials কনফিগার করো।');
  const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const response = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new PaymentAdapterError('GATEWAY_ERROR', 'PayPal authentication failed. PayPal authentication ব্যর্থ হয়েছে।', 502);
  return { base, token: data.access_token };
}

async function createPaypal({ tranId, plan, customer, origin }) {
  const { base, token } = await paypalToken();
  const response = await fetch(`${base}/v2/checkout/orders`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ reference_id: tranId, amount: { currency_code: 'BDT', value: plan.amount.toFixed(2) }, description: plan.name, custom_id: tranId }], payer: { email_address: customer.email }, application_context: { brand_name: 'Hello Streaming', user_action: 'PAY_NOW', return_url: `${origin}/api/payment/paypal/callback?transactionId=${encodeURIComponent(tranId)}`, cancel_url: `${origin}/payment?status=cancelled` } }), cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const result = await response.json().catch(() => ({}));
  const approve = result.links?.find(link => link.rel === 'approve');
  const redirectUrl = validateExternalUrl(approve?.href, ['paypal.com', 'paypalobjects.com']);
  if (!response.ok || !redirectUrl) throw new PaymentAdapterError('GATEWAY_ERROR', 'PayPal order could not be created. PayPal order তৈরি হয়নি।', 502);
  return { redirectUrl, mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox', providerOrderId: result.id };
}

export function providerStatus() {
  const config = paymentConfig();
  return {
    sslcommerz: Boolean(config.storeId && config.password), stripe: Boolean(process.env.STRIPE_SECRET_KEY), paypal: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    bkash: false, paytm: false, alipay: false, googlepay: false,
  };
}

export async function createPayment({ provider, planId, customer }) {
  const plan = PLANS[planId];
  if (!plan) throw new PaymentAdapterError('INVALID_PLAN', 'Invalid plan. সঠিক plan নির্বাচন করো।', 400);
  const origin = requireSiteUrl();
  const tranId = transactionId();
  await saveOrder({ tranId, provider, planId, plan: { ...plan, id: planId }, customer });
  try {
    let result;
    if (provider === 'sslcommerz') result = await createSslcommerz({ tranId, planId, plan, customer, origin });
    else if (provider === 'stripe') result = await createStripe({ tranId, plan: { ...plan, id: planId }, customer, origin });
    else if (provider === 'paypal') result = await createPaypal({ tranId, plan, customer, origin });
    else if (provider === 'bkash') scaffold('bKash direct', ['BKASH_BASE_URL', 'BKASH_APP_KEY', 'BKASH_APP_SECRET', 'BKASH_USERNAME', 'BKASH_PASSWORD'], 'a reviewed bKash merchant API flow');
    else if (provider === 'paytm') scaffold('Paytm', ['PAYTM_MERCHANT_ID', 'PAYTM_MERCHANT_KEY', 'PAYTM_WEBSITE'], 'a reviewed checksum/callback implementation');
    else if (provider === 'alipay') scaffold('Alipay', ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY'], 'a reviewed signing/callback implementation');
    else if (provider === 'googlepay') scaffold('Google Pay', ['GOOGLE_PAY_MERCHANT_ID'], 'a supported processor (for example Stripe/Adyen); Google Pay does not settle directly');
    else throw new PaymentAdapterError('INVALID_PROVIDER', 'Unsupported payment provider. সঠিক payment provider নির্বাচন করো।', 400);
    await updateOrder(tranId, order => { order.providerOrderId = result.providerOrderId || null; order.mode = result.mode || null; });
    return { transactionId: tranId, provider, ...result };
  } catch (error) {
    await updateOrder(tranId, order => { if (order.status === 'pending') { order.status = error.code === 'UNSUPPORTED_PROVIDER' ? 'unsupported' : 'failed'; order.failureCode = error.code || 'UNKNOWN'; } });
    throw error;
  }
}

export async function capturePaypal(transactionId) {
  const { getOrder, activateSubscription } = await import('./payment-store');
  const order = await getOrder(transactionId);
  if (!order || order.provider !== 'paypal' || !order.providerOrderId) throw new PaymentAdapterError('INVALID_ORDER', 'PayPal order not found. PayPal order পাওয়া যায়নি।', 404);
  if (order.status === 'paid') return { ok: true, alreadyPaid: true };
  const { base, token } = await paypalToken();
  const response = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(order.providerOrderId)}/capture`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const result = await response.json().catch(() => ({}));
  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  if (!response.ok || result.status !== 'COMPLETED' || capture?.status !== 'COMPLETED' || Number(capture.amount?.value) !== Number(order.amount) || capture.amount?.currency_code !== order.currency) throw new PaymentAdapterError('GATEWAY_ERROR', 'PayPal payment could not be verified. PayPal payment যাচাই হয়নি।', 502);
  const subscription = await activateSubscription(transactionId, { provider: 'paypal', providerOrderId: order.providerOrderId, amount: capture.amount.value, currency: capture.amount.currency_code, captureId: capture.id });
  return { ok: true, subscriptionId: subscription?.id || null };
}
