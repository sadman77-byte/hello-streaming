// Cache only eligible same-origin MP4 files; never intercept YouTube streams.
const CACHE_NAME = 'hello-streaming-video-v1';
const STUDIO_CACHE = 'hello-ai-studio-shell-v1';
const MAX_BYTES = 25 * 1024 * 1024;
self.addEventListener('install', (event) => { event.waitUntil((async () => { const c = await caches.open(STUDIO_CACHE); await c.add('/ai-studio').catch(() => {}); await self.skipWaiting(); })()); });
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('hello-streaming-video-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === 'GET' && url.origin === self.location.origin && url.pathname === '/ai-studio') { event.respondWith((async () => { const c = await caches.open(STUDIO_CACHE); try { const r = await fetch(request); if (r.ok) await c.put(request, r.clone()); return r; } catch { return (await c.match(request)) || Response.error(); } })()); return; }
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
