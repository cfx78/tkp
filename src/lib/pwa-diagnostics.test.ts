import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('temporary diagnostics route is unlinked, noindex, shell-free, and content-free', async () => {
  await stat(new URL('src/app/pwa-diagnostics/page.tsx', root));
  const page = await readFile(new URL('src/app/pwa-diagnostics/page.tsx', root), 'utf8');
  const panel = await readFile(new URL('src/components/pwa-diagnostics-panel.tsx', root), 'utf8');
  const shell = await readFile(new URL('src/components/app-shell.tsx', root), 'utf8');
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(shell, /pathname === '\/pwa-diagnostics'/);
  assert.doesNotMatch(panel, /fetchSanity|<audio|<img|iframe|spotify|youtube|sanity\.io|r2\./i);
  for (const file of ['src/components/app-shell.tsx']) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(source, /href=["'`]\/pwa-diagnostics/);
  }
});

test('diagnostics are bounded, local-only, sanitized, and non-destructive', async () => {
  const panel = await readFile(new URL('src/components/pwa-diagnostics-panel.tsx', root), 'utf8');
  assert.match(panel, /READY_TIMEOUT_MS = 3000/);
  assert.match(panel, /HANDSHAKE_TIMEOUT_MS = 2000/);
  assert.match(panel, /withTimeout\(navigator\.serviceWorker\.ready/);
  assert.match(panel, /register\('\/sw\.js', \{ scope: '\/', updateViaCache: 'none' \}\)/);
  assert.match(panel, /if \(!\('serviceWorker' in navigator\) \|\| await navigator\.serviceWorker\.getRegistration\('\/'\)\) return/);
  assert.match(panel, /referrerOrigin/);
  assert.match(panel, /pathname: url\.pathname/);
  assert.match(panel, /TIMELINE_KEY/);
  assert.match(panel, /slice\(-30\)/);
  assert.doesNotMatch(panel, /document\.cookie|location\.search|location\.href|localStorage\.clear|caches\.delete|unregister\(|storage\.persist\(\)|skipWaiting|location\.reload|X-Amz-/);
});

test('classification requires expected controller, cache, offline HTML, and worker handshake', async () => {
  const panel = await readFile(new URL('src/components/pwa-diagnostics-panel.tsx', root), 'utf8');
  for (const requirement of ['controlled', 'controllerExpectedWorker', 'expectedCacheExists', 'offlinePresent', 'offlineValid', 'handshakeSucceeded', 'workerVersionMatches', 'standalone']) assert.match(panel, new RegExp(`report\\.${requirement}`));
  for (const status of ['READY FOR OFFLINE RETEST', 'NO SERVICE WORKER SUPPORT', 'NO REGISTRATION', 'REGISTRATION PRESENT, NO ACTIVE WORKER', 'ACTIVE WORKER, PAGE NOT CONTROLLED', 'OFFLINE CACHE MISSING', 'OFFLINE DOCUMENT INVALID', 'WORKER VERSION MISMATCH', 'ORIGIN OR SCOPE MISMATCH', 'DIAGNOSTIC INCOMPLETE']) assert.match(panel, new RegExp(status));
});

test('worker handshake uses the exact request and exposes only approved diagnostic fields', async () => {
  const worker = await readFile(new URL('public/sw.js', root), 'utf8');
  assert.match(worker, /event\.data\?\.type !== 'TKP_PWA_DIAGNOSTICS_REQUEST'/);
  const response = worker.slice(worker.indexOf('async function respondToDiagnostics'), worker.indexOf("self.addEventListener('fetch'"));
  for (const field of ['protocolVersion', 'cacheVersion', 'scriptPathname', 'workerState', 'expectedCacheExists', 'offlinePresent', 'offlineStatus', 'offlineContentType']) assert.match(response, new RegExp(field));
  assert.doesNotMatch(response, /entries\(|keys:\s*cacheNames|requestUrl|cookies|tokens|authorization|X-Amz/i);
  assert.doesNotMatch(worker, /skipWaiting\s*\(/);
});

test('diagnostic work leaves package declarations untouched and preserves paused visual files', async () => {
  const packageSource = await readFile(new URL('package.json', root), 'utf8');
  assert.doesNotMatch(packageSource, /workbox|playwright|puppeteer/);
  for (const file of ['src/app/page.tsx', 'src/app/player/page.tsx', 'src/components/editorial-display-title.tsx', 'src/components/player-sections.tsx', 'src/components/presentation-primitives.tsx']) await stat(new URL(file, root));
});
