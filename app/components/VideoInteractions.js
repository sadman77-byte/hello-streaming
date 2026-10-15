'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';

const emojis = ['❤️', '😂', '😭', '🔥', '👏', '😮', '😍', '👍'];

const labels = {
  bn: {
    name: 'আপনার নাম',
    comment: 'কমেন্ট লিখুন...',
    send: 'পাঠান',
    comments: 'কমেন্ট',
    reactions: 'রিঅ্যাকশন',
    empty: 'এখনো কোনো কমেন্ট নেই',
    record: '🎤 রেকর্ড',
    stop: '⏹ বন্ধ করুন',
    sendVoice: 'ভয়েস পাঠান',
    recording: '🔴 রেকর্ড হচ্ছে...',
    saving: 'সংরক্ষণ হচ্ছে...',
    error: 'অডিও সংরক্ষণ করা যায়নি',
  },
  en: {
    name: 'Your name',
    comment: 'Write a comment...',
    send: 'Send',
    comments: 'Comments',
    reactions: 'Reactions',
    empty: 'No comments yet',
    record: '🎤 Record',
    stop: '⏹ Stop',
    sendVoice: 'Send Voice',
    recording: '🔴 Recording...',
    saving: 'Saving...',
    error: 'Could not save audio',
  },
  hi: {
    name: 'आपका नाम',
    comment: 'कमेंट लिखें...',
    send: 'भेजें',
    comments: 'कमेंट',
    reactions: 'रिएक्शन',
    empty: 'अभी कोई कमेंट नहीं',
    record: '🎤 रिकॉर्ड',
    stop: '⏹ रोकें',
    sendVoice: 'वॉइस भेजें',
    recording: '🔴 रिकॉर्ड हो रहा है...',
    saving: 'सेव हो रहा है...',
    error: 'ऑडियो सेव नहीं हो सका',
  },
};

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hello-stream-audio', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeAudio(id, blob) {
  const db = await openAudioDB();

  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      tx.objectStore('recordings').put(blob, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function loadAudio(id) {
  const db = await openAudioDB();

  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readonly');
      const request = tx.objectStore('recordings').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

function uniqueId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export default function VideoInteractions({
  videoId,
  platform = 'youtube',
}) {
  const { language } = useLanguage();
  const t = labels[language] || labels.en;

  const storageKey = `hello-interactions-${platform}-${videoId}`;

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const previewUrlRef = useRef('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let active = true;
    const createdUrls = [];

    setReady(false);
    setAudioUrls({});
    setComments([]);
    setReactions([]);

    async function restore() {
      let saved = {};

      try {
        saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      } catch {}

      const restoredComments = Array.isArray(saved.comments)
        ? saved.comments
        : [];

      const restoredReactions = Array.isArray(saved.reactions)
        ? saved.reactions
        : [];

      const urls = {};

      for (const comment of restoredComments) {
        if (comment.type !== 'voice' || !comment.audioId) continue;

        try {
          const blob = await loadAudio(comment.audioId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            createdUrls.push(url);
            urls[comment.audioId] = url;
          }
        } catch {}
      }

      if (!active) return;

      setComments(restoredComments);
      setReactions(restoredReactions);
      setAudioUrls(urls);

      try {
        setName(localStorage.getItem('hello-comment-name') || '');
      } catch {}

      setReady(true);
    }

    restore();

    return () => {
      active = false;
      createdUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach(track => track.stop());

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function persist(nextComments, nextReactions) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        comments: nextComments.slice(-100),
        reactions: nextReactions.slice(-100),
      })
    );
  }

  function react(emoji) {
    if (!ready) return;

    const next = [
      ...reactions,
      {
        id: uniqueId(),
        name: name.trim() || 'Guest',
        emoji,
      },
    ].slice(-100);

    try {
      persist(comments, next);
      setReactions(next);
    } catch {
      setError('Reaction could not be saved');
    }
  }

  function sendText(e) {
    e.preventDefault();
    if (!ready || !message.trim()) return;

    const author = name.trim() || 'Guest';

    const next = [
      ...comments,
      {
        id: uniqueId(),
        name: author,
        type: 'text',
        text: message.trim().slice(0, 1000),
      },
    ].slice(-100);

    try {
      persist(next, reactions);
      localStorage.setItem('hello-comment-name', author);
      setComments(next);
      setMessage('');
      setError('');
    } catch {
      setError('Comment could not be saved');
    }
  }

  async function startRecording() {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === 'undefined') {
      setError('Microphone recording is not supported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;

        setVoiceBlob(blob);
        setPreviewUrl(url);

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone permission denied or unavailable');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  async function sendVoice() {
    if (!voiceBlob || !ready || saving) return;

    setSaving(true);
    setError('');

    const audioId = `${platform}-${videoId}-${uniqueId()}`;
    const author = name.trim() || 'Guest';

    try {
      await storeAudio(audioId, voiceBlob);

      const next = [
        ...comments,
        {
          id: uniqueId(),
          audioId,
          name: author,
          type: 'voice',
        },
      ].slice(-100);

      persist(next, reactions);
      localStorage.setItem('hello-comment-name', author);

      const url = URL.createObjectURL(voiceBlob);

      setAudioUrls(previous => ({
        ...previous,
        [audioId]: url,
      }));

      setComments(next);
      setVoiceBlob(null);
      setPreviewUrl('');

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-2 text-xs font-bold text-slate-400">
        {t.reactions}
      </p>

      <div className="flex flex-wrap gap-2">
        {emojis.map(emoji => (
          <button
            type="button"
            key={emoji}
            onClick={() => react(emoji)}
            className="rounded-lg bg-white/5 px-2 py-1 text-xl"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-20 overflow-y-auto border-y border-white/10 py-2">
        <div className="flex flex-wrap gap-3">
          {reactions.slice(-12).map(item => (
            <span key={item.id} className="text-xs text-slate-300">
              {item.name} {item.emoji}
            </span>
          ))}
        </div>
      </div>

      <p className="mb-2 mt-4 text-xs font-bold text-slate-400">
        {t.comments} ({comments.length})
      </p>

      <form onSubmit={sendText} className="space-y-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          placeholder={t.name}
          className="w-full rounded-lg border border-white/10 bg-[#080b14] p-2 text-sm text-white"
        />

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t.comment}
          className="w-full rounded-lg border border-white/10 bg-[#080b14] p-2 text-sm text-white"
        />

        <button
          type="submit"
          disabled={!ready || !message.trim()}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          {t.send}
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-3 text-sm font-bold">🎤 Voice Comment</p>

        <div className="flex flex-wrap gap-2">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={!ready || saving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              {t.record}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold"
            >
              {t.stop}
            </button>
          )}

          {voiceBlob && !recording && (
            <button
              type="button"
              onClick={sendVoice}
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              {saving ? t.saving : t.sendVoice}
            </button>
          )}
        </div>

        {recording && (
          <p className="mt-2 text-sm text-red-400">
            {t.recording}
          </p>
        )}

        {previewUrl && !recording && (
          <audio controls src={previewUrl} className="mt-3 w-full" />
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}

      <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-slate-500">{t.empty}</p>
        )}

        {comments.slice().reverse().map(comment => (
          <div key={comment.id} className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-bold text-rose-300">
              {comment.name}
            </p>

            {comment.type === 'voice' ? (
              audioUrls[comment.audioId] ? (
                <audio
                  controls
                  src={audioUrls[comment.audioId]}
                  className="mt-2 w-full"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Audio unavailable
                </p>
              )
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                {comment.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
