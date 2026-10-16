'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TranscribeSubscribe({ videoId }) {
  const [busy, setBusy] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/videos/${videoId}/subscribe`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setSubscribed(!!data.subscribed);
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => { active = false; };
  }, [videoId]);

  async function handleTranscribe(e) {
    e?.preventDefault?.();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/transcribe`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      // navigate to watch page so user sees transcript
      router.push(`/watch/${videoId}`);
    } catch (err) {
      alert(err.message || 'Transcription failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleSubscribe(e) {
    e?.preventDefault?.();
    if (subscribing) return;
    setSubscribing(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/subscribe`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscribe failed');
      setSubscribed(!!data.subscribed);
      // optionally notify user
    } catch (err) {
      alert(err.message || 'Subscribe failed');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleTranscribe}
        className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        disabled={busy}
      >
        {busy ? 'Transcribing...' : 'ট্রান্সক্রাইব'}
      </button>

      <button
        onClick={toggleSubscribe}
        className={`rounded-xl px-3 py-2 text-sm ${subscribed ? 'bg-emerald-600' : 'border border-white/10 hover:bg-white/5'}`}
        disabled={subscribing}
      >
        {subscribing ? (subscribed ? 'Unsubscribing...' : 'Subscribing...') : (subscribed ? 'Subscribed' : 'Subscribe')}
      </button>
    </div>
  );
}
