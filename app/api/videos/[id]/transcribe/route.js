import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export async function POST(req, { params }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  // Try YouTube public captions first
  try {
    const { getTranscript } = await import('youtube-transcript');
    const match = (video.url || '').match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    const ytId = match ? match[1] : null;
    if (ytId) {
      try {
        const segments = await getTranscript(ytId);
        const text = Array.isArray(segments) ? segments.map(s => s.text).join(' ') : '';
        if (text && text.trim()) {
          db.prepare('UPDATE videos SET transcript = ? WHERE id = ?').run(text, id);
          return NextResponse.json({ transcript: text, source: 'youtube_captions' });
        }
      } catch (err) {
        // continue to provider fallback
        console.error('youtube-transcript failed', err?.message || err);
      }
    }
  } catch (e) {
    console.warn('youtube-transcript not available', e?.message || e);
  }

  // Fallback to provider (Whisper via OpenAI). Read provider key from data/providers.json
  const providersPath = path.join(process.cwd(), 'data', 'providers.json');
  let providers = {};
  try {
    if (fs.existsSync(providersPath)) {
      providers = JSON.parse(fs.readFileSync(providersPath, 'utf8') || '{}');
    }
  } catch (e) {
    console.error('Failed to read providers.json', e?.message || e);
  }

  const OPENAI_KEY = providers.openai || providers.OPENAI_API_KEY || null;
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: 'No captions found and no transcription provider configured' }, { status: 400 });
  }

  try {
    // download audio using ytdl-core
    const ytdl = (await import('ytdl-core')).default;
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const outFile = path.join(tmpDir, `audio-${id}.mp3`);

    await new Promise((resolve, reject) => {
      const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
        .pipe(fs.createWriteStream(outFile));
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(outFile));
    form.append('model', 'whisper-1');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, ...form.getHeaders() },
      body: form,
    });

    const j = await resp.json();
    if (!resp.ok) throw new Error(j.error?.message || 'Transcription provider error');

    const transcriptText = j.text || j.transcript || '';
    if (transcriptText && transcriptText.trim()) {
      db.prepare('UPDATE videos SET transcript = ? WHERE id = ?').run(transcriptText, id);
      try { fs.unlinkSync(outFile); } catch {}
      return NextResponse.json({ transcript: transcriptText, source: 'whisper' });
    } else {
      try { fs.unlinkSync(outFile); } catch {}
      return NextResponse.json({ error: 'Transcription returned empty text' }, { status: 500 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Transcription failed' }, { status: 500 });
  }
}
