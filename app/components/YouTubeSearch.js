'use client';

import { useState } from 'react';
import VideoInteractions from './VideoInteractions';
import { useLanguage } from './LanguageProvider';

export default function YouTubeSearch() {
  const { language, t } = useLanguage();

  const [query, setQuery] = useState('');
  const [order, setOrder] = useState('relevance');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function searchVideos(next = false) {
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        order,
      });

      if (next && pageToken) {
        params.set('pageToken', pageToken);
      }

      if (fromDate) {
        params.set('publishedAfter', fromDate + 'T00:00:00Z');
      }

      if (toDate) {
        params.set('publishedBefore', toDate + 'T23:59:59Z');
      }

      const res = await fetch(
        `/api/youtube/search?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'YouTube search failed');
      }

      setVideos((previous) =>
        next ? [...previous, ...data.videos] : data.videos
      );

      setPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err.message || 'Could not load videos');
    } finally {
      setLoading(false);
    }
  }

  const dateLocale =
    language === 'bn'
      ? 'bn-BD'
      : language === 'hi'
        ? 'hi-IN'
        : 'en-US';

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="rounded-3xl border border-white/10 bg-[#111625] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-400">
          YouTube
        </p>

        <h2 className="mb-5 text-2xl font-black">
          YouTube Video Search
        </h2>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            {language === 'bn' ? 'শুরুর তারিখ' : language === 'hi' ? 'शुरू की तारीख' : 'From date'}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#080b14] p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            {language === 'bn' ? 'শেষের তারিখ' : language === 'hi' ? 'अंतिम तारीख' : 'To date'}
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#080b14] p-3 text-white"
            />
          </label>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchVideos(false);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchVideos')}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b14] p-3 text-white outline-none focus:border-rose-500"
            required
          />

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#080b14] p-3 text-white"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Newest first</option>
            <option value="viewCount">Most viewed</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-rose-600 px-6 py-3 font-bold disabled:opacity-50"
          >
            {loading ? t('loading') : t('search')}
          </button>
        </form>

        {error && (
          <p className="mt-4 break-words text-sm text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article
              key={video.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#080b14]"
            >
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              </a>

              <div className="p-4">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold leading-6 hover:text-rose-400"
                >
                  {video.title}
                </a>

                <p className="mt-2 text-sm text-slate-400">
                  {video.channel}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {video.publishedAt
                    ? new Date(video.publishedAt).toLocaleDateString(
                        dateLocale
                      )
                    : ''}
                </p>

                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-bold text-rose-400"
                >
                  {t('watchVideo')} ↗
                </a>
                <VideoInteractions videoId={video.id} platform="youtube" />
              </div>
            </article>
          ))}
        </div>

        {videos.length === 0 && !loading && !error && (
          <p className="mt-6 text-sm text-slate-400">
            Search for a topic to discover YouTube videos.
          </p>
        )}

        {pageToken && (
          <button
            onClick={() => searchVideos(true)}
            disabled={loading}
            className="mt-7 w-full rounded-xl border border-white/15 px-5 py-3 font-bold hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? t('loading') : 'Load more videos'}
          </button>
        )}
      </div>
    </section>
  );
}
