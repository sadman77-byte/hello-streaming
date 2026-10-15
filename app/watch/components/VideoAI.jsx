'use client';

import { useEffect, useState } from 'react';

const PROVIDERS = [
  ['openai', 'OpenAI'],
  ['mistral', 'Mistral'],
  ['claude', 'Claude'],
  ['deepseek', 'DeepSeek'],
  ['grok', 'Grok'],
  ['gemini', 'Gemini'],
];

export default function VideoAI({ videoId, initialTranscript = '', initialSummary = '' }) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [summary, setSummary] = useState(initialSummary);
  const [language, setLanguage] = useState('bn');
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    fetch(`/api/videos/${videoId}/ai`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'ডেটা লোড করা যায়নি');
        if (active && data.video) {
          setTranscript(data.video.transcript || '');
          setSummary(data.video.summary || '');
          setLanguage(data.video.summary_language || 'bn');
        }
      })
      .catch((error) => {
        if (active) setNotice(error.message);
      });

    return () => {
      active = false;
    };
  }, [videoId]);

  async function saveAI(fields) {
    const response = await fetch(`/api/videos/${videoId}/ai`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'সংরক্ষণ করা যায়নি');
    return data;
  }

  async function saveTranscript() {
    setBusy('save');
    setNotice('');
    try {
      await saveAI({ transcript });
      setNotice('Transcript সংরক্ষণ হয়েছে।');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy('');
    }
  }

  async function generateSummary() {
    setBusy('summary');
    setNotice('');
    try {
      if (!transcript.trim()) throw new Error('আগে transcript লিখো অথবা তৈরি করো।');

      const response = await fetch('/api/ai/video-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Summary তৈরি হয়নি');

      setSummary(data.summary || '');
      await saveAI({ transcript, summary: data.summary || '', summary_language: language });
      setNotice('Summary তৈরি ও সংরক্ষণ হয়েছে।');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy('');
    }
  }

  async function askAI(event) {
    event.preventDefault();
    setBusy('chat');
    setNotice('');
    setAnswer('');
    try {
      if (!transcript.trim()) throw new Error('AI chat-এর আগে transcript যোগ করো।');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, videoId, transcript, message: question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI chat ব্যর্থ হয়েছে');
      setAnswer(data.answer || '');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy('');
    }
  }

  const buttonClass = 'rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <section className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-[#111625] p-5 text-white sm:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">AI VIDEO STUDIO</p>
        <h2 className="mt-2 text-2xl font-black">Transcript, Summary & AI Chat</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Transcript যোগ বা সম্পাদনা করো, সারাংশ তৈরি করো এবং ভিডিওর বিষয় নিয়ে প্রশ্ন করো।
          Transcript স্বয়ংক্রিয়ভাবে সব ভিডিও থেকে পাওয়া যায় না।
        </p>
      </div>

      <div>
        <label htmlFor={`transcript-${videoId}`} className="mb-2 block font-bold">Video transcript</label>
        <textarea
          id={`transcript-${videoId}`}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          maxLength={200000}
          rows={8}
          placeholder="এখানে ভিডিওর transcript পেস্ট করো..."
          className="w-full rounded-xl border border-white/10 bg-[#080b14] p-4 text-sm leading-6 outline-none focus:border-rose-500"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className={buttonClass} onClick={saveTranscript} disabled={!!busy}>
            {busy === 'save' ? 'Saving...' : 'Save transcript'}
          </button>
          <span className="text-xs text-slate-500">{transcript.length.toLocaleString()} characters</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h3 className="font-bold">Video summary</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor={`language-${videoId}`} className="text-sm text-slate-300">Summary language</label>
          <select
            id={`language-${videoId}`}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#080b14] px-3 py-2 text-sm"
          >
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
          <button className={buttonClass} onClick={generateSummary} disabled={!!busy}>
            {busy === 'summary' ? 'Generating...' : 'Generate summary'}
          </button>
        </div>
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#080b14] p-4 text-sm leading-7 text-slate-300">
          {summary || 'এখনও কোনো summary তৈরি হয়নি।'}
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h3 className="font-bold">Ask AI about this video</h3>
        <p className="mt-2 text-sm text-slate-400">প্রতিটি provider-এর নিজস্ব API key ও API access প্রয়োজন।</p>
        <form onSubmit={askAI} className="mt-4 space-y-3">
          <label htmlFor={`provider-${videoId}`} className="block text-sm font-semibold">AI provider</label>
          <select
            id={`provider-${videoId}`}
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#080b14] p-3"
          >
            {PROVIDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            <option value="bing" disabled>Bing/Copilot (integration required)</option>
          </select>
          <label htmlFor={`question-${videoId}`} className="block text-sm font-semibold">Your question</label>
          <textarea
            id={`question-${videoId}`}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={8000}
            required
            rows={3}
            placeholder="এই ভিডিওর মূল বক্তব্য কী?"
            className="w-full rounded-xl border border-white/10 bg-[#080b14] p-4 text-sm outline-none focus:border-rose-500"
          />
          <button type="submit" className={buttonClass} disabled={!!busy || !question.trim()}>
            {busy === 'chat' ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>

        {answer && (
          <div className="mt-4 whitespace-pre-wrap rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-slate-200">
            <p className="mb-2 font-bold text-emerald-300">{provider.toUpperCase()} response</p>
            {answer}
          </div>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
          {notice}
        </p>
      )}
    </section>
  );
}
