'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AIVideoToolsPage() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [language, setLanguage] = useState('bn');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function summarize() {
    if (!transcript.trim()) {
      setMessage('প্রথমে ট্রান্সক্রিপ্ট লিখে বা পেস্ট করে দাও।');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/ai/video-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'সারাংশ তৈরি করা যায়নি।');
      setSummary(data.summary || '');
      setMessage('AI সারাংশ তৈরি হয়েছে।');
    } catch (error) {
      setMessage(error.message || 'নেটওয়ার্ক সমস্যা হয়েছে।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-rose-400">← Hello Streaming</Link>
        <h1 className="text-3xl font-bold">AI Video Tools</h1>
        <p className="text-slate-300">ট্রান্সক্রিপ্ট থেকে AI সারাংশ তৈরি করো।</p>

        <div className="space-y-3">
          <label htmlFor="transcript" className="block font-semibold">Transcript</label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={9}
            maxLength={50000}
            placeholder="এখানে ট্রান্সক্রিপ্ট লিখে বা পেস্ট করে দাও।"
            className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-white"
          />
          <label htmlFor="summary-language" className="block font-semibold">সারাংশের ভাষা</label>
          <select id="summary-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-xl bg-slate-800 p-3 text-white">
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={summarize} className="rounded-xl bg-rose-600 px-5 py-3 font-semibold disabled:opacity-50">{busy ? 'অপেক্ষা করো...' : 'Generate Summary'}</button>
            <button type="button" onClick={() => navigator.clipboard.writeText(transcript)} className="rounded-xl bg-slate-700 px-5 py-3">Copy Transcript</button>
          </div>
        </div>

        {message && <p role="status" className="rounded-xl bg-white/10 p-4">{message}</p>}
        {summary && (
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-bold">AI Summary</h2>
            <p className="whitespace-pre-wrap">{summary}</p>
            <button type="button" onClick={() => navigator.clipboard.writeText(summary)} className="rounded-xl bg-slate-700 px-4 py-2">Copy Summary</button>
          </section>
        )}
      </div>
    </main>
  );
}
