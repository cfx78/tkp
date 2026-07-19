const CACHE_PREFIX = 'tkp-shell-';
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [OFFLINE_URL, '/brand/kitsune-mark.svg', '/brand/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE).map((key) => caches.delete(key)))),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('authorization') || request.headers.has('range')) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/studio')) return;
  if (request.destination === 'audio' || request.destination === 'video') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then((response) => response || Response.error())));
    return;
  }

  const safeStaticAsset = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/');
  if (!safeStaticAsset) return;
  event.respondWith(cacheSafeStatic(request));
});

async function cacheSafeStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cacheControl = response.headers.get('cache-control') || '';
  if (!response.ok || response.redirected || /(?:no-store|private)/i.test(cacheControl)) return response;
  const cache = await caches.open(SHELL_CACHE);
  await cache.put(request, response.clone());
  return response;
}
