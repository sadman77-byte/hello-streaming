export const PLANS = Object.freeze({
  plus: { name: 'Hello Streaming Plus', amount: 199, currency: 'BDT' },
  pro: { name: 'Hello Streaming Pro', amount: 499, currency: 'BDT' },
});

export function paymentConfig() {
  const live = process.env.SSLCOMMERZ_MODE === 'live';

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    live,
    base: live
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com',
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    password: process.env.SSLCOMMERZ_STORE_PASSWORD,
  };
}

export const PAYMENT_PROVIDERS = Object.freeze([
  { id: 'sslcommerz', name: 'SSLCommerz', description: 'Cards and supported mobile wallets (bKash, Nagad, Rocket where enabled on your account).' },
  { id: 'stripe', name: 'Stripe', description: 'Stripe Checkout.' },
  { id: 'paypal', name: 'PayPal', description: 'PayPal Orders.' },
  { id: 'bkash', name: 'bKash direct', description: 'Direct bKash adapter scaffold; not enabled until the merchant API contract is configured.' },
  { id: 'paytm', name: 'Paytm', description: 'Paytm adapter scaffold; not enabled until merchant credentials and signing are implemented.' },
  { id: 'alipay', name: 'Alipay', description: 'Alipay adapter scaffold; not enabled until merchant credentials and signing are implemented.' },
  { id: 'googlepay', name: 'Google Pay', description: 'Wallet-only scaffold. Google Pay needs a supported processor for settlement.' },
]);

export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}
