import { NextResponse } from 'next/server';
import { PAYMENT_PROVIDERS } from '../../../../lib/payment-config';
import { providerStatus } from '../../../../lib/payment-adapters';

export const runtime = 'nodejs';

export function GET() {
  const status = providerStatus();
  return NextResponse.json({ providers: PAYMENT_PROVIDERS.map(provider => ({ ...provider, configured: status[provider.id] })) });
}
