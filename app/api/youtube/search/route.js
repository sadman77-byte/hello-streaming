import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'YOUTUBE_API_KEY .env.local-এ পাওয়া যায়নি' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json(
        { error: 'ভিডিও খুঁজতে একটি keyword দাও' },
        { status: 400 }
      );
    }

    const allowedOrders = ['relevance', 'date', 'viewCount', 'rating'];
    const requestedOrder = searchParams.get('order') || 'relevance';
    const order = allowedOrders.includes(requestedOrder)
      ? requestedOrder
      : 'relevance';

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      q,
      maxResults: '20',
      order,
      regionCode: 'BD',
      key: apiKey,
    });

    const pageToken = searchParams.get('pageToken');
    if (pageToken) params.set('pageToken', pageToken);

    const publishedAfter = searchParams.get('publishedAfter');
    const publishedBefore = searchParams.get('publishedBefore');

    if (publishedAfter) params.set('publishedAfter', publishedAfter);
    if (publishedBefore) params.set('publishedBefore', publishedBefore);

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data.error?.code);
      return NextResponse.json(
        {
          error: data.error?.message || 'YouTube সার্চ ব্যর্থ হয়েছে',
          reason: data.error?.errors?.[0]?.reason || 'unknown',
        },
        { status: response.status }
      );
    }

    const videos = (data.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet?.title || '',
        channel: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || '',
        description: item.snippet?.description || '',
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        platform: 'YouTube',
      }));

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null,
      prevPageToken: data.prevPageToken || null,
      totalResults: data.pageInfo?.totalResults || 0,
    });
  } catch (error) {
    console.error('YouTube search failed:', error.message);

    return NextResponse.json(
      { error: 'সার্ভারের সঙ্গে যোগাযোগ করা যায়নি' },
      { status: 500 }
    );
  }
}
