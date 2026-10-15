'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';

export default function BilibiliSearch() {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const labels = {
    en: {
      heading: 'Search Bilibili videos',
      description: 'Discover videos on Bilibili, from older uploads to recent releases.',
      searchPlaceholder: 'Search videos, anime, documentaries...',
      searchButton: 'Search Bilibili',
      urlHeading: 'Open a Bilibili video',
      urlPlaceholder: 'Paste a Bilibili video URL',
      openButton: 'Open video',
      invalid: 'Enter a valid Bilibili video URL.',
      notice: 'Search results open on Bilibili.',
    },
    bn: {
      heading: 'Bilibili ভিডিও খুঁজুন',
      description: 'Bilibili-তে পুরোনো থেকে সাম্প্রতিক ভিডিও খুঁজুন।',
      searchPlaceholder: 'ভিডিও, অ্যানিমে, ডকুমেন্টারি খুঁজুন...',
      searchButton: 'Bilibili-তে সার্চ',
      urlHeading: 'Bilibili ভিডিও খুলুন',
      urlPlaceholder: 'Bilibili ভিডিওর লিংক দিন',
      openButton: 'ভিডিও খুলুন',
      invalid: 'সঠিক Bilibili ভিডিও লিংক দিন।',
      notice: 'সার্চের ফলাফল Bilibili ওয়েবসাইটে খুলবে।',
    },
    hi: {
      heading: 'Bilibili वीडियो खोजें',
      description: 'Bilibili पर पुराने से नए वीडियो खोजें।',
      searchPlaceholder: 'वीडियो, एनीमे, डॉक्यूमेंट्री खोजें...',
      searchButton: 'Bilibili पर खोजें',
      urlHeading: 'Bilibili वीडियो खोलें',
      urlPlaceholder: 'Bilibili वीडियो लिंक डालें',
      openButton: 'वीडियो खोलें',
      invalid: 'सही Bilibili वीडियो लिंक डालें।',
      notice: 'खोज परिणाम Bilibili वेबसाइट पर खुलेंगे।',
    },
  };

  const text = labels[language] || labels.en;

  function search(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const url =
      'https://search.bilibili.com/all?keyword=' +
      encodeURIComponent(q);

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openVideo(e) {
    e.preventDefault();

    try {
      const parsed = new URL(videoUrl.trim());
      const hostname = parsed.hostname.toLowerCase();

      const allowed =
        hostname === 'bilibili.com' ||
        hostname.endsWith('.bilibili.com') ||
        hostname === 'b23.tv';

      if (parsed.protocol !== 'https:' || !allowed) {
        throw new Error('Invalid URL');
      }

      window.open(parsed.href, '_blank', 'noopener,noreferrer');
    } catch {
      alert(text.invalid);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="rounded-3xl border border-white/10 bg-[#111625] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-400">
          BILIBILI
        </p>

        <h2 className="text-2xl font-black">
          {text.heading}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {text.description}
        </p>

        <form
          onSubmit={search}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={text.searchPlaceholder}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b14] p-3 text-white outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-6 py-3 font-bold hover:bg-sky-500"
          >
            {text.searchButton}
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-400">
          {text.notice}
        </p>

        <div className="mt-7 border-t border-white/10 pt-6">
          <h3 className="font-bold">
            {text.urlHeading}
          </h3>

          <form
            onSubmit={openVideo}
            className="mt-3 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={text.urlPlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b14] p-3 text-white outline-none focus:border-sky-500"
            />

            <button
              type="submit"
              className="rounded-xl border border-sky-500/40 px-6 py-3 font-bold text-sky-300 hover:bg-white/5"
            >
              {text.openButton} ↗
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
