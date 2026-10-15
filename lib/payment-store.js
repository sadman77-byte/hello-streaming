import { mkdir, readFile, writeFile, rename, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dir = path.join(process.cwd(), 'data');
const file = path.join(dir, 'payment-store.json');
const lock = path.join(dir, 'payment-store.lock');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ensureStore() {
  await mkdir(dir, { recursive: true });

  try {
    await stat(file);
  } catch {
    try {
      await writeFile(
        file,
        JSON.stringify({ orders: {}, subscriptions: {} }, null, 2),
        { flag: 'wx', mode: 0o600 }
      );
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}

async function readStore() {
  await ensureStore();

  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    throw new Error('Payment store unreadable; manual recovery required');
  }
}

async function withLock(fn) {
  await ensureStore();

  let acquired = false;

  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await mkdir(lock);
      acquired = true;
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      try {
        const info = await stat(lock);
        if (Date.now() - info.mtimeMs > 120000) {
          await rm(lock, { recursive: true, force: true });
          continue;
        }
      } catch {}

      await sleep(50);
    }
  }

  if (!acquired) throw new Error('Payment store busy');

  try {
    const store = await readStore();
    const result = await fn(store);

    const temp = `${file}.${randomUUID()}.tmp`;

    await writeFile(temp, JSON.stringify(store, null, 2), {
      mode: 0o600,
    });

    await rename(temp, file);

    return result;
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

export async function createOrder(order) {
  return withLock(store => {
    if (store.orders[order.tranId]) {
      throw new Error('Duplicate transaction ID');
    }

    store.orders[order.tranId] = order;
    return order;
  });
}

export async function getOrder(tranId) {
  const store = await readStore();
  return store.orders[tranId] || null;
}

export async function updateOrder(tranId, updater) {
  return withLock(store => {
    const order = store.orders[tranId];
    if (!order) return null;

    updater(order, store);
    order.updatedAt = new Date().toISOString();

    return order;
  });
}

export async function activateSubscription(tranId, validation) {
  return withLock(store => {
    const order = store.orders[tranId];
    if (!order) throw new Error('Order not found');

    // Idempotency: do not activate twice.
    if (order.status === 'paid') {
      return store.subscriptions[order.subscriptionId] || null;
    }

    if (order.status !== 'pending') {
      throw new Error('Order is not pending');
    }

    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + 1);

    const subscriptionId = randomUUID();

    const subscription = {
      id: subscriptionId,
      customerEmail: order.customer.email,
      planId: order.planId,
      status: 'active',
      startsAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      tranId,
    };

    store.subscriptions[subscriptionId] = subscription;

    order.status = 'paid';
    order.subscriptionId = subscriptionId;
    order.verifiedAt = now.toISOString();
    order.gatewayValidation = {
      valId: validation.val_id,
      bankTranId: validation.bank_tran_id || null,
      currency: validation.currency,
      amount: validation.amount,
      riskLevel: validation.risk_level,
    };

    return subscription;
  });
}
