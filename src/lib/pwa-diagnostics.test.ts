import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
// @ts-expect-error Node 24 executes this TypeScript test file directly and requires the extension.
import { classifyPwaDiagnostics } from './pwa-diagnostics-classification.ts';

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
  assert.match(panel, /classifyPwaDiagnostics\(base\)/);
  assert.match(panel, /EXPECTED_CACHE = 'tkp-shell-v3'/);
  assert.match(panel, /handshake\.cacheVersion === 'v3'/);
  assert.match(panel, /standalone:/);

  const healthy = {
    secureContext: true,
    serviceWorkerSupported: true,
    registrationFound: true,
    activeExpectedWorker: true,
    scopeMatches: true,
    manifestSameOrigin: true,
    controlled: true,
    controllerExpectedWorker: true,
    expectedCacheExists: true,
    offlinePresent: true,
    offlineValid: true,
    handshakeSucceeded: true,
    workerVersionMatches: true,
  };
  assert.equal(classifyPwaDiagnostics({ ...healthy, standalone: false }), 'READY FOR OFFLINE RETEST');
  assert.equal(classifyPwaDiagnostics(healthy), 'READY FOR OFFLINE RETEST');

  const failures: Array<[Partial<typeof healthy>, string]> = [
    [{ secureContext: false }, 'ORIGIN OR SCOPE MISMATCH'],
    [{ serviceWorkerSupported: false }, 'NO SERVICE WORKER SUPPORT'],
    [{ registrationFound: false }, 'NO REGISTRATION'],
    [{ activeExpectedWorker: false }, 'REGISTRATION PRESENT, NO ACTIVE WORKER'],
    [{ scopeMatches: false }, 'ORIGIN OR SCOPE MISMATCH'],
    [{ controlled: false }, 'ACTIVE WORKER, PAGE NOT CONTROLLED'],
    [{ controllerExpectedWorker: false }, 'ORIGIN OR SCOPE MISMATCH'],
    [{ expectedCacheExists: false }, 'OFFLINE CACHE MISSING'],
    [{ offlinePresent: false }, 'OFFLINE CACHE MISSING'],
    [{ offlineValid: false }, 'OFFLINE DOCUMENT INVALID'],
    [{ handshakeSucceeded: false }, 'WORKER VERSION MISMATCH'],
    [{ workerVersionMatches: false }, 'WORKER VERSION MISMATCH'],
  ];
  for (const [override, expected] of failures) assert.equal(classifyPwaDiagnostics({ ...healthy, ...override }), expected);
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
