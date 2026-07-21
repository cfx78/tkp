const CACHE_PREFIX = 'tkp-shell-';
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const OFFLINE_CACHE_KEY = new Request(new URL(OFFLINE_URL, self.location.origin), { method: 'GET' });
const OPTIONAL_SHELL_URLS = ['/brand/kitsune-mark.svg', '/brand/icon-192.png'];
const DIAGNOSTIC_PROTOCOL_VERSION = '1';

self.addEventListener('install', (event) => {
  event.waitUntil(installOfflineShell());
});

async function installOfflineShell() {
  const cache = await caches.open(SHELL_CACHE);
  const offlineResponse = await fetch(OFFLINE_URL, { cache: 'no-store' });
  if (!offlineResponse.ok) throw new Error('TKP offline document failed to install');
  await cache.put(OFFLINE_CACHE_KEY, offlineResponse);
  await Promise.allSettled(OPTIONAL_SHELL_URLS.map(async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok && !response.redirected) await cache.put(url, response);
  }));
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'TKP_PWA_DIAGNOSTICS_REQUEST' || !event.ports?.[0]) return;
  event.waitUntil(respondToDiagnostics(event.ports[0]));
});

async function respondToDiagnostics(port) {
  const cacheNames = await caches.keys();
  const expectedCacheExists = cacheNames.includes(SHELL_CACHE);
  const offlineResponse = expectedCacheExists ? await caches.match(OFFLINE_CACHE_KEY, { ignoreSearch: true }) : undefined;
  port.postMessage({
    protocolVersion: DIAGNOSTIC_PROTOCOL_VERSION,
    cacheVersion: CACHE_VERSION,
    scriptPathname: new URL(self.location.href).pathname,
    workerState: self.registration?.active?.state || 'unknown',
    expectedCacheExists,
    offlinePresent: Boolean(offlineResponse),
    offlineStatus: offlineResponse?.status ?? null,
    offlineContentType: offlineResponse?.headers.get('content-type') || null,
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.headers.has('authorization') || request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/studio')) return;
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/studio')) return;
  if (request.destination === 'audio' || request.destination === 'video') return;

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

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const fallback = await caches.match(OFFLINE_CACHE_KEY, { ignoreSearch: true });
    return fallback || emergencyOfflineResponse();
  }
}

function emergencyOfflineResponse() {
  return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | The Kitsune Protocol</title><body style="margin:0;background:#05070b;color:#f4f6f8;font:16px/1.6 system-ui,sans-serif"><main style="max-width:40rem;margin:auto;padding:12vh 1.25rem"><p>THE KITSUNE PROTOCOL</p><h1>You are offline.</h1><p>The archive needs a connection. Music is not available offline.</p></main></body></html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
