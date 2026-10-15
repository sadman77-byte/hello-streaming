import { PLANS, paymentConfig } from './payment-config';
import {
  getOrder,
  updateOrder,
  activateSubscription,
} from './payment-store';

function cents(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export async function verifyPaymentNotification(notification) {
  const tranId = String(notification.tran_id || '');
  const valId = String(notification.val_id || '');

  if (!/^[A-Za-z0-9_-]{8,60}$/.test(tranId) || !valId) {
    return { ok: false, reason: 'Missing or invalid transaction details' };
  }

  const order = await getOrder(tranId);

  if (!order) {
    return { ok: false, reason: 'Unknown transaction' };
  }

  // Idempotent response for duplicate notifications.
  if (order.status === 'paid') {
    return { ok: true, alreadyPaid: true };
  }

  if (order.status !== 'pending') {
    return { ok: false, reason: 'Order is not pending' };
  }

  const config = paymentConfig();

  if (!config.storeId || !config.password) {
    return { ok: false, reason: 'Payment credentials are not configured' };
  }

  const validationUrl = new URL(
    '/validator/api/validationserverAPI.php',
    config.base
  );

  validationUrl.searchParams.set('val_id', valId);
  validationUrl.searchParams.set('store_id', config.storeId);
  validationUrl.searchParams.set('store_passwd', config.password);
  validationUrl.searchParams.set('format', 'json');

  const response = await fetch(validationUrl, {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    return { ok: false, reason: 'Validation API unavailable' };
  }

  const result = await response.json();

  if (!['VALID', 'VALIDATED'].includes(result.status)) {
    return { ok: false, reason: 'Gateway did not validate transaction' };
  }

  const expectedPlan = PLANS[order.planId];

  if (
    !expectedPlan ||
    result.tran_id !== order.tranId ||
    cents(result.amount) !== cents(order.amount) ||
    result.currency !== order.currency ||
    cents(result.amount) !== cents(expectedPlan.amount)
  ) {
    return { ok: false, reason: 'Transaction details do not match order' };
  }

  // Risky transactions must be held for manual review.
  if (String(result.risk_level) !== '0') {
    await updateOrder(tranId, current => {
      if (current.status === 'pending') {
        current.status = 'review';
        current.reviewReason = 'Gateway risk review required';
      }
    });

    return { ok: false, reason: 'Transaction held for risk review' };
  }

  try {
    const subscription = await activateSubscription(tranId, result);
    return { ok: true, subscriptionId: subscription?.id || null };
  } catch {
    return { ok: false, reason: 'Could not update order after validation' };
  }
}
