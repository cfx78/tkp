import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('manifest defines a same-origin standalone app with approved icons', async () => {
  const source = await readFile(new URL('src/app/manifest.ts', root), 'utf8');
  assert.match(source, /name: 'The Kitsune Protocol'/);
  assert.match(source, /start_url: '\/'/);
  assert.match(source, /scope: '\/'/);
  assert.match(source, /display: 'standalone'/);
  assert.match(source, /background_color: '#05070b'/);
  assert.match(source, /theme_color: '#05070b'/);
  const icons = [
    ['/brand/icon-192.png', '192x192', 'any'],
    ['/brand/icon-512.png', '512x512', 'any'],
    ['/brand/icon-maskable-192.png', '192x192', 'maskable'],
    ['/brand/icon-maskable-512.png', '512x512', 'maskable'],
  ] as const;
  for (const [src, sizes, purpose] of icons) {
    assert.match(source, new RegExp(`src: '${src.replaceAll('/', '\\/')}'[\\s\\S]*?sizes: '${sizes}'[\\s\\S]*?purpose: '${purpose}'`));
    await stat(new URL(`public${src}`, root));
  }
});

test('service worker has narrow shell caching and explicit unsafe-request bypasses', async () => {
  const worker = await readFile(new URL('public/sw.js', root), 'utf8');
  assert.match(worker, /CACHE_PREFIX = 'tkp-shell-'/);
  assert.match(worker, /CACHE_VERSION = 'v2'/);
  assert.match(worker, /OFFLINE_CACHE_KEY = new Request\(new URL\(OFFLINE_URL, self\.location\.origin\)/);
  assert.match(worker, /offlineResponse\.ok/);
  assert.match(worker, /cache\.put\(OFFLINE_CACHE_KEY, offlineResponse\)/);
  assert.match(worker, /Promise\.allSettled\(OPTIONAL_SHELL_URLS/);
  assert.match(worker, /self\.clients\.claim\(\)/);
  assert.doesNotMatch(worker, /skipWaiting\s*\(/);
  assert.match(worker, /request\.method !== 'GET'/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /headers\.has\('authorization'\)/);
  assert.match(worker, /headers\.has\('range'\)/);
  assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(worker, /url\.pathname\.startsWith\('\/studio'\)/);
  assert.match(worker, /request\.destination === 'audio'/);
  assert.match(worker, /request\.destination === 'video'/);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /caches\.match\(OFFLINE_CACHE_KEY, \{ ignoreSearch: true \}\)/);
  assert.match(worker, /status: 200/);
  assert.match(worker, /'Content-Type': 'text\/html; charset=utf-8'/);
  const navigationHandler = worker.slice(worker.indexOf('async function networkFirstNavigation'), worker.indexOf('function emergencyOfflineResponse'));
  assert.doesNotMatch(navigationHandler, /cache\.put/);
  assert.doesNotMatch(worker, /api\/playback[\s\S]*cache\.put|spotify|youtube|apple\.com|sanity\.io|r2\.cloudflarestorage|X-Amz-/i);
});

test('offline route is content-free and registration is production-safe', async () => {
  const offline = await readFile(new URL('src/app/offline/page.tsx', root), 'utf8');
  assert.match(offline, /music are not available offline/);
  assert.match(offline, /<OfflineRetry \/>/);
  assert.match(offline, /href="\/"/);
  assert.doesNotMatch(offline, /fetchSanity|iframe|audio|Signal/);
  const registration = await readFile(new URL('src/components/pwa-registration.tsx', root), 'utf8');
  assert.match(registration, /process\.env\.NODE_ENV !== 'production'/);
  assert.match(registration, /pathname\.startsWith\('\/studio'\)/);
  assert.match(registration, /register\('\/sw\.js', \{ scope: '\/'/);
  assert.match(registration, /updateViaCache: 'none'/);
  assert.match(registration, /setTimeout\([\s\S]*?, 0\)/);
  assert.doesNotMatch(registration, /requestIdleCallback|addEventListener\('load'|skipWaiting|location\.reload/);
});

test('installed metadata references the manifest without changing audio architecture', async () => {
  const layout = await readFile(new URL('src/app/layout.tsx', root), 'utf8');
  assert.match(layout, /manifest: '\/manifest\.webmanifest'/);
  assert.match(layout, /viewportFit: 'cover'/);
  assert.match(layout, /themeColor: '#05070b'/);
  assert.match(layout, /appleWebApp/);
  let audioConstructors = 0;
  for (const file of ['src/components/player-provider.tsx', 'src/components/pwa-registration.tsx', 'src/app/offline/page.tsx']) {
    const source = await readFile(new URL(file, root), 'utf8');
    audioConstructors += (source.match(/new Audio\s*\(/g) || []).length;
  }
  assert.equal(audioConstructors, 1);
});

test('required public route families remain present', async () => {
  for (const file of ['src/app/page.tsx', 'src/app/player/page.tsx', 'src/app/logs/page.tsx', 'src/app/fixations/page.tsx', 'src/app/search/page.tsx', 'src/app/(site)/studio/[[...index]]/page.tsx']) {
    await stat(new URL(file, root));
  }
});
