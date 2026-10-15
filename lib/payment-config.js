export const PLANS = Object.freeze({
  plus: { name: 'Hello Streaming Plus', amount: 199 },
  pro: { name: 'Hello Streaming Pro', amount: 499 },
});

export function paymentConfig() {
  const live = process.env.SSLCOMMERZ_MODE === 'live';

  return {
    live,
    base: live
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com',
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    password: process.env.SSLCOMMERZ_STORE_PASSWORD,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  };
}
