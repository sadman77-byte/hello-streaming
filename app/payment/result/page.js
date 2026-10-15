import Link from 'next/link';

export default async function PaymentResultPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status;

  return (
    <main className="min-h-screen bg-[#080b14] px-5 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#111625] p-8">
        <h1 className="text-2xl font-black">Payment Status</h1>

        <p className="mt-4 text-slate-300">
          {status === 'received'
            ? 'পেমেন্ট যাচাইয়ের অনুরোধ প্রক্রিয়া হয়েছে। Subscription সক্রিয় হওয়ার আগে server-side status নিশ্চিত করা হবে।'
            : 'পেমেন্ট এখনো নিশ্চিত নয়। Gateway notification বা verification সম্পন্ন হওয়ার জন্য অপেক্ষা করো।'}
        </p>

        <p className="mt-4 text-sm text-amber-300">
          এই পেজের status নিজে থেকে পেমেন্টের প্রমাণ নয়।
        </p>

        <Link
          href="/payment"
          className="mt-6 inline-block rounded-xl bg-rose-600 px-5 py-3 font-bold"
        >
          Back to Payment
        </Link>
      </div>
    </main>
  );
}
