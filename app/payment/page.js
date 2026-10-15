'use client';

import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Video search',
      'Emoji reactions',
      'Text and voice comments',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 199,
    features: [
      'Free plan features',
      'Planned AI summaries',
      'Planned AI translation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    features: [
      'Plus plan features',
      'Planned multi-AI assistant',
      'Planned advanced features',
    ],
  },
];

export default function PaymentPage() {
  const [selected, setSelected] = useState('free');

  const plan = plans.find(p => p.id === selected);

  return (
    <main className="min-h-screen bg-[#080b14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-rose-400">
          ← Hello Streaming
        </Link>

        <h1 className="mt-8 text-3xl font-black">
          Payment & Subscription
        </h1>

        <p className="mt-3 text-slate-400">
          পছন্দের প্ল্যান নির্বাচন করুন।
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`rounded-2xl border p-6 text-left ${
                selected === item.id
                  ? 'border-rose-500 bg-[#191524]'
                  : 'border-white/10 bg-[#111625]'
              }`}
            >
              <h2 className="text-xl font-bold">
                {item.name}
              </h2>

              <p className="mt-4 text-3xl font-black">
                ৳{item.price}
                <span className="text-sm font-normal text-slate-400">
                  /month
                </span>
              </p>

              <ul className="mt-6 space-y-3">
                {item.features.map(feature => (
                  <li key={feature} className="text-sm text-slate-300">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#111625] p-6">
          <h2 className="text-xl font-bold">
            Checkout
          </h2>

          <p className="mt-3">
            Selected: {plan.name}
          </p>

          <p className="mt-2 text-2xl font-bold">
            ৳{plan.price} BDT
          </p>

          {plan.price === 0 ? (
            <p className="mt-5 text-green-400">
              Free plan — কোনো পেমেন্ট প্রয়োজন নেই।
            </p>
          ) : (
            <div className="mt-5">
              <button
                disabled
                className="rounded-xl bg-rose-600 px-6 py-3 font-bold opacity-50"
              >
                Pay ৳{plan.price} — Coming Soon
              </button>

              <p className="mt-3 text-sm text-amber-300">
                Payment gateway এখনো সংযুক্ত হয়নি।
                কোনো টাকা কাটা হবে না।
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
