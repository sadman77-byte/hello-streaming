import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const MIME_TYPES = {
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpeg: 'audio/mpeg',
  mpga: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  webm: 'video/webm',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
};

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY কনফিগার করা হয়নি।' },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file.name !== 'string') {
      return NextResponse.json(
        { error: 'একটি অডিও বা ভিডিও ফাইল নির্বাচন করো।' },
        { status: 400 }
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = MIME_TYPES[extension];

    if (!mimeType) {
      return NextResponse.json(
        { error: 'এই ফাইল ফরম্যাট সমর্থিত নয়।' },
        { status: 415 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ফাইলটি ৪ MB-এর মধ্যে হতে হবে।' },
        { status: 413 }
      );
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
    const payload = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Transcribe all clearly audible spoken words in this audio or video as accurately as possible. Preserve the original language and writing system. Do not summarize, translate, or add commentary. If no speech is audible, say so briefly.' },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8000 },
    });

    let data = {};
    let providerStatus = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: payload,
        cache: 'no-store',
        signal: AbortSignal.timeout(45000),
      });
      providerStatus = response.status;
      data = await response.json().catch(() => ({}));
      if (response.ok) break;

      const providerMessage = data.error?.message || 'Unknown provider error';
      console.error('Gemini transcription provider error:', providerStatus, providerMessage);
      const retryable = [408, 429, 500, 502, 503, 504].includes(providerStatus);
      if (retryable && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** attempt) + Math.floor(Math.random() * 300)));
        continue;
      }

      const safeMessage = providerStatus === 429
        ? 'Gemini rate limit বা quota শেষ হয়েছে। Google AI Studio-তে quota পরীক্ষা করো।'
        : providerStatus === 401 || providerStatus === 403
          ? 'Gemini API key বা permission সমস্যা। Vercel Environment Variables পরীক্ষা করো।'
          : providerStatus === 404
            ? 'Gemini model পাওয়া যায়নি। Model name ও API access পরীক্ষা করো।'
            : providerStatus === 400
              ? 'Gemini অনুরোধ গ্রহণ করেনি। ফাইল ও model compatibility পরীক্ষা করো।'
              : 'Gemini provider সাময়িকভাবে ব্যর্থ হয়েছে।';
      return NextResponse.json(
        { error: safeMessage, providerStatus, providerCode: data.error?.status || null },
        { status: providerStatus === 429 ? 429 : 502 }
      );
    }

    const transcript = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || '')
      .join('\n')
      .trim();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Gemini কোনো transcription text দেয়নি।' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transcript,
      model: 'gemini-3.1-flash-lite',
    });
  } catch (error) {
    console.error('Gemini transcription failed:', error.message);
    return NextResponse.json(
      { error: 'Transcription সার্ভারে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
