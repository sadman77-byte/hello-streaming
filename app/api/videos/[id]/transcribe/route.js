import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const videoId = Number(id);
    if (!Number.isSafeInteger(videoId) || videoId < 1) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (video.transcript?.trim()) {
      return NextResponse.json({ transcript: video.transcript, source: 'saved' });
    }

    const rawUrl = String(video.url || '');
    let ytId = null;
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.toLowerCase();
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
        ytId = url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/)?.[1];
      } else if (host === 'youtu.be') {
        ytId = url.pathname.split('/')[1];
      }
    } catch {}
    if (!ytId || !/^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
      return NextResponse.json({
        error: 'এই ভিডিওর স্বয়ংক্রিয় captions পাওয়া যায়নি। নিজের অডিও/ভিডিও ফাইল AI Video Tools-এ আপলোড করে Transcribe করো।',
      }, { status: 422 });
    }

    try {
      const mod = await import('youtube-transcript');
      const getTranscript = mod.getTranscript || mod.YoutubeTranscript?.fetchTranscript;
      if (typeof getTranscript !== 'function') throw new Error('Caption library unavailable');
      const segments = await getTranscript(ytId);
      const transcript = Array.isArray(segments) ? segments.map(s => s.text || '').join(' ').trim() : '';
      if (!transcript) throw new Error('No captions returned');
      try {
        db.prepare('UPDATE videos SET transcript = ? WHERE id = ?').run(transcript, videoId);
      } catch (error) {
        console.warn('Transcript save unavailable:', error?.message);
      }
      return NextResponse.json({ transcript, source: 'youtube_captions' });
    } catch (error) {
      console.warn('YouTube captions unavailable:', error?.message);
      return NextResponse.json({
        error: 'এই YouTube ভিডিওর captions পাওয়া যায়নি। AI Video Tools-এ নিজের অডিও/ভিডিও ফাইল দিয়ে Transcribe করো।',
      }, { status: 422 });
    }
  } catch (error) {
    console.error('Video transcription error:', error);
    return NextResponse.json({ error: 'ভিডিও ট্রান্সক্রিপশন সার্ভারে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
