'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Hello Streaming page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#080b14] px-5 py-16 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold">এই পেজটি লোড করা যায়নি</h1>
        <p className="mt-3 text-slate-300">সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করো অথবা হোমপেজে ফিরে যাও।</p>
        {error?.digest && <p className="mt-3 break-all text-xs text-slate-400">Error ID: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="rounded-xl bg-rose-600 px-5 py-3 font-semibold">Retry</button>
          <a href="/" className="rounded-xl bg-slate-700 px-5 py-3 font-semibold">Home</a>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-white/20 px-5 py-3">Reload</button>
        </div>
      </section>
    </main>
  );
}
