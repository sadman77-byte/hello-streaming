import { YoutubeTranscript } from 'youtube-transcript';

export const runtime = 'nodejs';

function youtubeId(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'www.youtu.be') return u.pathname.split('/')[1];
    if (['youtube.com','www.youtube.com','m.youtube.com'].includes(host)) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/);
      return m?.[1];
    }
  } catch {}
  return null;
}

export async function POST(req) {
  try {
    const {url} = await req.json();
    if (typeof url !== 'string' || url.length > 2048) return Response.json({error:'Valid YouTube URL required'},{status:400});
    const id = youtubeId(url);
    if (!id || !/^[\w-]{11}$/.test(id)) return Response.json({error:'এই মুহূর্তে লিংক থেকে শুধু YouTube-এর উপলব্ধ captions সমর্থিত। MP3/MP4 ফাইল আপলোড করো।'},{status:400});
    const items = await YoutubeTranscript.fetchTranscript(id);
    const transcript = items.map(x => x.text).join(' ').slice(0,60000).trim();
    if (!transcript) return Response.json({error:'এই ভিডিওতে transcript পাওয়া যায়নি।'},{status:404});
    return Response.json({transcript,source:'youtube-captions'});
  } catch {
    return Response.json({error:'এই ভিডিওর captions পাওয়া যায়নি বা YouTube access সীমিত। ফাইল আপলোড বা transcript পেস্ট করে চেষ্টা করো।'},{status:422});
  }
}
