import VideoAI from '../components/VideoAI';
import db from '../../../lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function getPlayer(raw) {
  try {
    const url = new URL(raw);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { type: 'unsupported' };
    }

    const host = url.hostname.toLowerCase();
    let id = null;

    if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
    ) {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
        if (match) id = match[1];
      }
    } else if (host === 'youtu.be') {
      id = url.pathname.split('/')[1];
    }

    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return {
        type: 'embed',
        src: `https://www.youtube.com/embed/${id}`,
      };
    }

    if (host === 'www.bilibili.com' || host === 'm.bilibili.com') {
      const match = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);

      if (match) {
        return {
          type: 'embed',
          src: `https://player.bilibili.com/player.html?bvid=${match[1]}`,
        };
      }
    }

    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
      return { type: 'video', src: url.href };
    }

    return { type: 'unsupported' };
  } catch {
    return { type: 'unsupported' };
  }
}

export default async function Watch({ params }) {
  const { id } = await params;
  const videoId = Number(id);

  if (!Number.isSafeInteger(videoId) || videoId < 1) {
    notFound();
  }

  const video = db
    .prepare('SELECT * FROM videos WHERE id = ?')
    .get(videoId);

  if (!video) {
    notFound();
  }

  const player = getPlayer(video.url);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="text-xl font-black">
            <span className="text-rose-500">▶</span> Hello
            <span className="text-rose-400">Streaming</span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-rose-400">
          NOW PLAYING
        </p>

        <h1 className="mb-6 text-2xl font-black sm:text-4xl">
          {video.title}
        </h1>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-rose-950/20">
          {player.type === 'embed' && (
            <iframe
              className="aspect-video w-full"
              src={player.src}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}

          {player.type === 'video' && (
            <video
              className="aspect-video w-full"
              src={player.src}
              controls
              playsInline
              preload="metadata"
            >
              তোমার ব্রাউজার ভিডিও প্লে করতে পারছে না।
            </video>
          )}

          {player.type === 'unsupported' && (
            <div className="flex aspect-video flex-col items-center justify-center px-5 text-center">
              <span className="text-5xl">🎬</span>
              <h2 className="mt-4 text-xl font-bold">
                এই ভিডিওটি চালানো যাচ্ছে না
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                একটি সমর্থিত YouTube, Bilibili অথবা সরাসরি MP4, WebM কিংবা Ogg ভিডিও লিংক ব্যবহার করো।
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111625] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Published by
              </p>
              <p className="mt-1 font-semibold">
                {video.owner || 'Creator'}
              </p>
            </div>

            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
              Video
            </span>
          </div>

          {video.description && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <h2 className="font-bold">About this video</h2>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-300">
                {video.description}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold hover:bg-rose-500"
            >
              Discover more videos
            </Link>

            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10"
            >
              Open original source ↗
            </a>
          </div>
        </section>

        <VideoAI
          videoId={video.id}
          initialTranscript={video.transcript || ''}
          initialSummary={video.summary || ''}
        />

        <p className="mt-6 text-xs leading-6 text-slate-500">
          Playback depends on the source, network connection, browser support
          and the provider's embedding permissions. Publish only content you
          own or are authorized to share.
        </p>
      </div>
    </main>
  );
}
