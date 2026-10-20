// Offline caching is limited to eligible local MP4 files.
// Never cache Next.js pages, RSC responses, JavaScript, or API responses.
const CACHE_NAME = 'hello-streaming-video-v2';
const MAX_BYTES = 25 * 1024 * 1024;
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k =>
      (k.startsWith('hello-streaming-video-') && k !== CACHE_NAME) ||
      k.startsWith('hello-ai-studio-shell-')
    ).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.toLowerCase().endsWith('.mp4') ||
      request.headers.has('range')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    const length = Number(response.headers.get('content-length'));
    if (response.ok && response.status === 200 && response.type === 'basic' &&
        length > 0 && length <= MAX_BYTES &&
        !/no-store|private/i.test(response.headers.get('cache-control') || '')) {
      event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    }
    return response;
  })());
});
