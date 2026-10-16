'use client';

import TranscribeSubscribe from './components/TranscribeSubscribe';
import YouTubeSearch from './components/YouTubeSearch';
import BilibiliSearch from './components/BilibiliSearch';
import LocalVideoLibrary from './components/LocalVideoLibrary';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from './components/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();

  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/videos', {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(t('videoLoadError'));

      const data = await res.json();
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err) {
      setError(err.message || t('videoLoadError'));
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  async function publish(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('publishError'));
      }

      setTitle('');
      setUrl('');
      setShowUpload(false);
      await load();
    } catch (err) {
      setError(err.message || t('publishError'));
    }
  }

  const filtered = videos.filter((v) =>
    String(v.title || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080b14]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-rose-500">▶</span> Hello
            <span className="text-rose-400">Streaming</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#discover" className="hover:text-rose-400">
              {t('discover')}
            </a>
            <a href="#library" className="hover:text-rose-400">
              {t('library')}
            </a>
            <Link href="/ai-tools" className="hover:text-rose-400">AI Video Tools</Link>
            <Link href="/studio" className="hover:text-rose-400">
              {t('studio')}
            </Link>
            <Link href="/earnings" className="hover:text-rose-400">
              {t('earnings')}
            </Link>
            <Link href="/settings" className="hover:text-rose-400">
              {t('settings')}
            </Link>
          </nav>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold hover:bg-rose-500"
          >
            + {t('publish')}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pt-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-rose-950 via-[#21132b] to-[#101b35] p-7 sm:p-12">
          <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-rose-300">
              {t('yourWorld')}
            </p>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              {t('heroTitle')}
            </h1>

            <p className="mt-5 max-w-xl leading-7 text-slate-300">
              {t('heroDescription')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#discover"
                className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950 hover:bg-rose-100"
              >
                ▶ {t('exploreVideos')}
              </a>

              <button
                onClick={() => setShowUpload(true)}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10"
              >
                {t('uploadVideo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showUpload && (
        <section className="mx-auto max-w-7xl px-5 pt-8">
          <div className="rounded-2xl border border-rose-500/30 bg-[#111625] p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {t('publishTitle')}
              </h2>

              <button
                onClick={() => setShowUpload(false)}
                className="rounded-lg px-3 py-1 text-slate-400 hover:bg-white/10"
              >
                {t('close')} ✕
              </button>
            </div>

            <form onSubmit={publish} className="grid gap-3 md:grid-cols-3">
              <input
                required
                maxLength={150}
                placeholder={t('videoTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-w-0 rounded-xl border border-white/10 bg-[#080b14] p-3 outline-none focus:border-rose-500"
              />

              <input
                required
                type="url"
                placeholder={t('videoUrl')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="min-w-0 rounded-xl border border-white/10 bg-[#080b14] p-3 outline-none focus:border-rose-500"
              />

              <button
                type="submit"
                className="rounded-xl bg-rose-600 p-3 font-bold hover:bg-rose-500"
              >
                {t('publishButton')}
              </button>
            </form>
          </div>
        </section>
      )}

      {error && (
        <p className="mx-auto mt-5 max-w-7xl px-5 text-sm text-rose-400">
          {error}
        </p>
      )}


      <div className="mx-auto max-w-7xl px-5 pt-5">
        <a
          href="/payment"
          className="inline-block rounded-xl bg-rose-600 px-5 py-3 font-bold text-white"
        >
          💳 Payment & Subscription
        </a>
      </div>

<YouTubeSearch />
      <BilibiliSearch />
      <LocalVideoLibrary />

      <section id="discover" className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-400">
              {t('collection')}
            </p>

            <h2 className="text-3xl font-black">
              {t('discoverVideos')}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {t('latestVideos')}
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {filtered.length} {t('videos')}
          </span>
        </div>

        <input
          placeholder={`⌕  ${t('searchVideos')}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-7 w-full rounded-xl border border-white/10 bg-[#111625] px-5 py-4 outline-none focus:border-rose-500"
        />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-14 text-center">
            <div className="text-5xl">🎬</div>

            <h3 className="mt-4 text-xl font-bold">
              {t('noVideos')}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {t('noVideosDescription')}
            </p>

            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 rounded-xl bg-rose-600 px-5 py-3 font-bold"
            >
              + {t('addFirstVideo')}
            </button>
          </div>
        ) : (
          <div id="library" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v, index) => (
              <Link
                key={v.id}
                href={`/watch/${v.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111625] transition duration-300 hover:-translate-y-1 hover:border-rose-500/50"
              >
                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-800 to-rose-950">
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />

                  <span className="text-6xl opacity-70 transition duration-300 group-hover:scale-110">
                    {['▶', '🎬', '✨'][index % 3]}
                  </span>

                  <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs">
                    VIDEO
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-lg font-bold group-hover:text-rose-400">
                    {v.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {v.owner || t('creator')}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
-                    <span className="text-slate-400">
-                      {t('watchVideo')}
-                    </span>
-
-                    <span className="text-rose-400">
-                      ▶ {t('play')} →
-                    </span>
+                    <div className="flex items-center gap-3">
+                      <span className="text-slate-400">
+                        {t('watchVideo')}
+                      </span>
+
+                      <span className="text-rose-400">
+                        ▶ {t('play')} →
+                      </span>
+
+                      <TranscribeSubscribe videoId={v.id} />
+                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        <p className="font-bold text-slate-300">
          ▶ Hello Streaming
        </p>

        <p className="mt-2">
          {t('createDiscoverStream')}
        </p>

        <p className="mt-2">
          {t('permissionNotice')}
        </p>
      </footer>
    </main>
  );
}
