'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const plans = [
  { id: 'plus', name: 'Plus', price: 199, features: ['Video search', 'AI summaries and translation'] },
  { id: 'pro', name: 'Pro', price: 499, features: ['Plus features', 'Multi-AI assistant and advanced features'] },
];

export default function PaymentPage() {
  const [selected, setSelected] = useState('plus');
  const [provider, setProvider] = useState('sslcommerz');
  const [providers, setProviders] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const plan = plans.find(item => item.id === selected);

  useEffect(() => {
    fetch('/api/payment/providers', { cache: 'no-store' }).then(response => response.json()).then(data => setProviders(data.providers || [])).catch(() => {});
  }, []);

  async function startPayment(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/payment/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: selected, provider, customer }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Payment could not be started. পেমেন্ট শুরু করা যায়নি।');
      if (!data.redirectUrl) throw new Error('Gateway did not return a redirect URL. Gateway redirect URL দেয়নি।');
      window.location.assign(data.redirectUrl);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return <main className="min-h-screen bg-[#080b14] px-5 py-10 text-white"><div className="mx-auto max-w-5xl">
    <Link href="/" className="text-rose-400">← Hello Streaming</Link>
    <h1 className="mt-8 text-3xl font-black">Payment & Subscription</h1>
    <p className="mt-3 text-slate-400">প্ল্যান ও payment provider নির্বাচন করুন। Secret কখনো browser-এ রাখা হয় না।</p>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{plans.map(item => <button type="button" key={item.id} onClick={() => setSelected(item.id)} className={`rounded-2xl border p-6 text-left ${selected === item.id ? 'border-rose-500 bg-[#191524]' : 'border-white/10 bg-[#111625]'}`}><h2 className="text-xl font-bold">{item.name}</h2><p className="mt-4 text-3xl font-black">৳{item.price}<span className="text-sm font-normal text-slate-400">/month</span></p><ul className="mt-6 space-y-3">{item.features.map(feature => <li key={feature} className="text-sm text-slate-300">✓ {feature}</li>)}</ul></button>)}</div>
    <form onSubmit={startPayment} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[#111625] p-6">
      <h2 className="text-xl font-bold">Checkout · ৳{plan.price} BDT</h2>
      <label className="block text-sm">Payment provider<select value={provider} onChange={e => setProvider(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b14] p-3">{(providers.length ? providers : [{ id: 'sslcommerz', name: 'SSLCommerz' }, { id: 'stripe', name: 'Stripe' }, { id: 'paypal', name: 'PayPal' }]).map(item => <option key={item.id} value={item.id}>{item.name}{item.configured === false ? ' — not configured' : ''}</option>)}</select></label>
      <div className="grid gap-3 md:grid-cols-3">{[['name','Full name'],['email','Email'],['phone','Bangladesh phone (01XXXXXXXXX)']].map(([key, label]) => <label key={key} className="text-sm">{label}<input required value={customer[key]} onChange={e => setCustomer(value => ({ ...value, [key]: e.target.value }))} type={key === 'email' ? 'email' : 'text'} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080b14] p-3" /></label>)}</div>
      <button disabled={busy} className="rounded-xl bg-rose-600 px-6 py-3 font-bold disabled:opacity-50">{busy ? 'Starting payment…' : `Pay ৳${plan.price}`}</button>
      {error && <p role="alert" className="whitespace-pre-wrap rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <p className="text-sm text-slate-400">SSLCommerz may expose enabled bKash, Nagad, or Rocket methods on its hosted page. Direct bKash, Paytm, Alipay, and Google Pay adapters remain safely unavailable until their processor-specific contracts are configured.</p>
    </form>
  </div></main>;
}
