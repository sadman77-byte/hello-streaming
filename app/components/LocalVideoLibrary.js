'use client';

import { useEffect, useRef, useState } from 'react';

const DB_NAME = 'hello-streaming-local-videos';
const STORE_NAME = 'videos';

function openVideoDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('এই ব্রাউজারে IndexedDB সমর্থিত নয়।'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('ভিডিও ডেটাবেস খোলা যায়নি।'));
  });
}

async function getAllVideos() {
  const db = await openVideoDB();

  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .getAll();

      request.onsuccess = () => {
        const videos = request.result || [];
        videos.sort((a, b) => b.addedAt - a.addedAt);
        resolve(videos);
      };

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function saveVideo(video) {
  const db = await openVideoDB();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');

      transaction.objectStore(STORE_NAME).put(video);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error('ভিডিও সংরক্ষণ বাতিল হয়েছে।'));
    });
  } finally {
    db.close();
  }
}

async function removeVideo(id) {
  const db = await openVideoDB();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');

      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LocalVideoLibrary() {
  const [videos, setVideos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeUrl, setActiveUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);

  async function refreshLibrary() {
    const savedVideos = await getAllVideos();
    setVideos(savedVideos);
  }

  useEffect(() => {
    let mounted = true;

    getAllVideos()
      .then((savedVideos) => {
        if (mounted) setVideos(savedVideos);
      })
      .catch((error) => {
        if (mounted) setMessage(error.message || 'লাইব্রেরি লোড করা যায়নি।');
      });

    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [activeUrl]);

  async function addFiles(event) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    setBusy(true);
    setMessage('নির্বাচিত ফাইল: ' + files.map(f => f.name + ' [' + (f.type || 'MIME type নেই') + ']').join(', '));
    try {
      let added = 0;
      for (const file of files) {
        const isVideo = (file.type || '').startsWith('video/') || /\.(mp4|m4v|mkv|webm|mov|avi|mpeg|mpg|3gp|ogv)$/i.test(file.name);
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
        await saveVideo({ id, title: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, type: file.type || 'video/mp4', size: file.size, addedAt: Date.now(), blob: file });
        added++;
      }
      await refreshLibrary();
      setMessage(added ? added + 'টি ভিডিও সংরক্ষিত হয়েছে।' : 'ভিডিও ফাইল শনাক্ত হয়নি: ' + files.map(f => f.name + ' [' + (f.type || 'MIME type নেই') + ']').join(', '));
    } catch (error) {
      setMessage('সংরক্ষণ ব্যর্থ [' + (error.name || 'Error') + ']: ' + (error.message || String(error)));
    } finally { setBusy(false); }
  }

  function playVideo(video) {
    if (!video?.blob) {
      setMessage('ভিডিও ডেটা পাওয়া যায়নি। ফাইলটি আবার যোগ করো।');
      return;
    }

    if (activeUrl) URL.revokeObjectURL(activeUrl);

    setActiveUrl(URL.createObjectURL(video.blob));
    setActiveId(video.id);
    setMessage('');
  }

  async function deleteVideo(id) {
    if (activeId === id) {
      setActiveId(null);
      setActiveUrl('');
    }

    try {
      await removeVideo(id);
      await refreshLibrary();
      setMessage('ভিডিওটি লাইব্রেরি থেকে মুছে ফেলা হয়েছে।');
    } catch (error) {
      setMessage(`ভিডিও মুছতে সমস্যা হয়েছে: ${error.message}`);
    }
  }

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(query.toLowerCase())
  );

  const activeVideo = videos.find((video) => video.id === activeId);

  return (
    <section
      id="offline-library"
      className="mx-auto max-w-7xl px-5 py-10 text-white"
    >
      <div className="rounded-3xl border border-emerald-400/20 bg-[#0d1720] p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
              Hybrid Mode
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              📥 Offline Video Library
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              ফোনের ভিডিও এখানে যোগ করো। সংরক্ষণ সফল হলে ইন্টারনেট ছাড়াও
              এই ব্রাউজারে ভিডিও চালাতে পারবে।
            </p>
          </div>

          <span className="rounded-full border border-emerald-400/30 px-3 py-2 text-sm text-emerald-300">
            {videos.length}টি ভিডিও
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => { setMessage('ফাইল পিকার খুলছে—একটি ভিডিও নির্বাচন করো।'); fileInputRef.current?.click(); }}
            className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {busy ? 'সংরক্ষণ হচ্ছে…' : '+ ফোন থেকে ভিডিও যোগ করো'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={addFiles}
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              refreshLibrary()
                .then(() => setMessage('লাইব্রেরি আপডেট হয়েছে।'))
                .catch((error) => setMessage(error.message))
            }
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5"
          >
            ↻ রিফ্রেশ
          </button>
        </div>

        {message && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200"
          >
            {message}
          </p>
        )}

        {activeVideo && activeUrl && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4">
            <h3 className="mb-3 break-words font-bold">
              ▶ {activeVideo.title}
            </h3>
            <video
              key={activeVideo.id}
              src={activeUrl}
              controls
              playsInline
              preload="metadata"
              className="max-h-[65vh] w-full rounded-xl bg-black"
            >
              তোমার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।
            </video>
            <p className="mt-2 text-xs text-slate-400">
              ভিডিওটি এই ডিভাইসের লোকাল স্টোরেজ থেকে চালানো হচ্ছে।
            </p>
          </div>
        )}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="⌕ লোকাল ভিডিও খুঁজুন"
          className="mt-6 w-full rounded-xl border border-white/10 bg-[#080b14] px-4 py-3 outline-none focus:border-emerald-400"
        />

        {filteredVideos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <div className="text-4xl">🎞️</div>
            <p className="mt-3 font-semibold">
              {videos.length ? 'কোনো ভিডিও মেলেনি' : 'এখনো কোনো লোকাল ভিডিও যোগ করা হয়নি'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              ভিডিও যোগ করতে উপরের বোতামটি চাপো।
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => (
              <article
                key={video.id}
                className="min-w-0 rounded-2xl border border-white/10 bg-[#111625] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎬</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-bold">{video.title}</h3>
                    <p className="mt-1 break-all text-xs text-slate-400">
                      {video.fileName}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatSize(video.size)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => playVideo(video)}
                    className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 font-bold text-slate-950"
                  >
                    ▶ চালাও
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteVideo(video.id)}
                    className="rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-300"
                  >
                    মুছুন
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-400">
          নোট: ভিডিও ব্রাউজারের IndexedDB-তে রাখা হয়। স্টোরেজ সীমা, ব্রাউজার
          ডেটা মুছে ফেলা, বা অনুমতির কারণে স্থায়ী সংরক্ষণ নিশ্চিত নয়।
          গুরুত্বপূর্ণ ভিডিও ফোনের মূল ফাইল হিসেবেও রেখে দাও।
        </p>
      </div>
    </section>
  );
}
