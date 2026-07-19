'use client';

import { useCallback, useEffect, useState } from 'react';

const EXPECTED_CACHE = 'tkp-shell-v2';
const EXPECTED_WORKER_PATH = '/sw.js';
const TIMELINE_KEY = 'tkp_pwa_diagnostics_timeline:v1';
const READY_TIMEOUT_MS = 3000;
const HANDSHAKE_TIMEOUT_MS = 2000;
const ENDPOINTS = ['/sw.js', '/offline', '/manifest.webmanifest', '/icon.png', '/apple-icon.png'] as const;

type TimelineEvent = { label: string; timestamp: string };
type WorkerSummary = { state: string | null; pathname: string | null };
type DiagnosticReport = Record<string, unknown> & { classification: string };

function safePath(value?: string | null) {
  if (!value) return null;
  try { const url = new URL(value, window.location.origin); return { origin: url.origin, pathname: url.pathname }; } catch { return null; }
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, label: string): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(`${label} timed out`)), milliseconds))]);
}

function readTimeline(): TimelineEvent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TIMELINE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is TimelineEvent => typeof item?.label === 'string' && typeof item?.timestamp === 'string').slice(-30) : [];
  } catch { return []; }
}

function recordTimeline(label: string) {
  const events = [...readTimeline(), { label, timestamp: new Date().toISOString() }].slice(-30);
  try { localStorage.setItem(TIMELINE_KEY, JSON.stringify(events)); } catch { /* Diagnostics remain usable without storage. */ }
  return events;
}

function workerSummary(worker?: ServiceWorker | null): WorkerSummary {
  const path = safePath(worker?.scriptURL);
  return { state: worker?.state || null, pathname: path?.pathname || null };
}

function classify(report: Record<string, unknown>) {
  if (!report.secureContext) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.serviceWorkerSupported) return 'NO SERVICE WORKER SUPPORT';
  if (!report.registrationFound) return 'NO REGISTRATION';
  if (!report.activeExpectedWorker) return 'REGISTRATION PRESENT, NO ACTIVE WORKER';
  if (!report.scopeMatches || !report.manifestSameOrigin) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.controlled) return 'ACTIVE WORKER, PAGE NOT CONTROLLED';
  if (!report.controllerExpectedWorker) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.expectedCacheExists || !report.offlinePresent) return 'OFFLINE CACHE MISSING';
  if (!report.offlineValid) return 'OFFLINE DOCUMENT INVALID';
  if (!report.handshakeSucceeded || !report.workerVersionMatches) return 'WORKER VERSION MISMATCH';
  if (!report.standalone) return 'DIAGNOSTIC INCOMPLETE';
  return 'READY FOR OFFLINE RETEST';
}

async function workerHandshake(worker: ServiceWorker) {
  const channel = new MessageChannel();
  const response = new Promise<Record<string, unknown>>((resolve) => { channel.port1.onmessage = (event) => resolve(event.data as Record<string, unknown>); });
  worker.postMessage({ type: 'TKP_PWA_DIAGNOSTICS_REQUEST' }, [channel.port2]);
  return withTimeout(response, HANDSHAKE_TIMEOUT_MS, 'Worker handshake');
}

export function PwaDiagnosticsPanel() {
  const [report, setReport] = useState<DiagnosticReport>({ classification: 'DIAGNOSTIC INCOMPLETE' });
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showOfflineInstructions, setShowOfflineInstructions] = useState(false);

  const addEvent = useCallback((label: string) => setTimeline(recordTimeline(label)), []);

  const runDiagnostics = useCallback(async () => {
    setBusy(true);
    setActionMessage('');
    addEvent('diagnostics started');
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const manifestPath = safePath(manifestLink?.href);
    const referrer = safePath(document.referrer);
    const iosNavigator = navigator as Navigator & { standalone?: boolean };
    const base: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      origin: location.origin,
      pathname: location.pathname,
      secureContext: window.isSecureContext,
      online: navigator.onLine,
      visibilityState: document.visibilityState,
      referrerOrigin: referrer?.origin || '',
      standaloneDisplayMode: matchMedia('(display-mode: standalone)').matches,
      legacyIosStandalone: iosNavigator.standalone ?? null,
      standalone: matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true,
      userAgent: navigator.userAgent,
      language: navigator.language,
      localTime: new Date().toString(),
      lifecycleState: (document as Document & { wasDiscarded?: boolean }).wasDiscarded ? 'restored-after-discard' : document.visibilityState,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheStorageSupported: 'caches' in window,
      manifestLink: manifestPath,
      manifestSameOrigin: manifestPath?.origin === location.origin,
      expectedCache: EXPECTED_CACHE,
      expectedWorkerPath: EXPECTED_WORKER_PATH,
      iosVersionNote: 'Enter the iOS version from Settings when sharing this report; the user agent may be reduced.',
    };

    try {
      if (manifestLink) {
        const response = await fetch(manifestLink.href, { cache: 'no-store' });
        const manifest = response.ok ? await response.json() as { name?: string; short_name?: string; start_url?: string; scope?: string; display?: string; icons?: Array<{ src?: string; sizes?: string; purpose?: string }> } : {};
        const icons = manifest.icons || [];
        Object.assign(base, { manifestStatus: response.status, manifestMime: response.headers.get('content-type'), manifestName: manifest.name || null, manifestShortName: manifest.short_name || null, manifestStartUrl: manifest.start_url || null, manifestScope: manifest.scope || null, manifestDisplay: manifest.display || null, manifestIconCount: icons.length, manifestStandard192: icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any'), manifestStandard512: icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any'), manifestMaskable192: icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'maskable'), manifestMaskable512: icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable') });
      }

      if ('serviceWorker' in navigator) {
        const controller = navigator.serviceWorker.controller;
        const registration = await navigator.serviceWorker.getRegistration('/');
        addEvent(registration ? 'registration found' : 'registration missing');
        addEvent(controller ? 'controller present' : 'controller missing');
        const registrationScope = safePath(registration?.scope);
        Object.assign(base, { controlled: Boolean(controller), controller: workerSummary(controller), controllerExpectedWorker: workerSummary(controller).pathname === EXPECTED_WORKER_PATH, registrationFound: Boolean(registration), registrationScope, scopeMatches: registrationScope?.origin === location.origin && registrationScope.pathname === '/', installing: workerSummary(registration?.installing), waiting: workerSummary(registration?.waiting), active: workerSummary(registration?.active), activeExpectedWorker: workerSummary(registration?.active).pathname === EXPECTED_WORKER_PATH });
        try {
          const ready = await withTimeout(navigator.serviceWorker.ready, READY_TIMEOUT_MS, 'Service worker ready');
          base.readyResolved = true;
          base.readyScope = safePath(ready.scope);
          addEvent('ready resolved');
        } catch (error) { base.readyResolved = false; base.readyError = error instanceof Error ? error.message : 'Ready failed'; addEvent('ready timed out'); }
        const handshakeTarget = controller || registration?.active;
        if (handshakeTarget) {
          try {
            const handshake = await workerHandshake(handshakeTarget);
            base.handshakeSucceeded = true;
            base.handshake = handshake;
            base.workerVersionMatches = handshake.cacheVersion === 'v2' && handshake.scriptPathname === EXPECTED_WORKER_PATH && handshake.protocolVersion === '1';
            addEvent('worker handshake success');
          } catch (error) { base.handshakeSucceeded = false; base.handshakeError = error instanceof Error ? error.message : 'Handshake failed'; addEvent('worker handshake failure'); }
        }
      }

      if ('caches' in window) {
        const names = await caches.keys();
        const response = await caches.match('/offline', { ignoreSearch: true });
        const body = response ? await response.clone().text() : '';
        Object.assign(base, { cacheNames: names, expectedCacheExists: names.includes(EXPECTED_CACHE), oldTkpCaches: names.filter((name) => name.startsWith('tkp-shell-') && name !== EXPECTED_CACHE), offlinePresent: Boolean(response), offlineStatus: response?.status ?? null, offlineResponseType: response?.type || null, offlineContentType: response?.headers.get('content-type') || null, offlineResponsePathname: safePath(response?.url)?.pathname || null, offlineHasApprovedHeading: /The archive needs a connection/i.test(body), offlineStatesMusicUnavailable: /music (?:is|are) not available offline/i.test(body), offlineValid: response?.status === 200 && Boolean(response.headers.get('content-type')?.includes('text/html')) && /The archive needs a connection/i.test(body) && /music (?:is|are) not available offline/i.test(body) });
        addEvent(response ? 'offline cache found' : 'offline cache missing');
      }

      base.endpointChecks = await Promise.all(ENDPOINTS.map(async (pathname) => {
        try { const response = await fetch(pathname, { cache: 'no-store' }); return { pathname, status: response.status, redirected: response.redirected, mime: response.headers.get('content-type') }; }
        catch { return { pathname, status: null, redirected: false, mime: null }; }
      }));

      if (navigator.storage?.estimate) { const estimate = await navigator.storage.estimate(); base.storageEstimate = { usage: estimate.usage ?? null, quota: estimate.quota ?? null }; }
      base.storagePersistSupported = Boolean(navigator.storage?.persist);
      base.storagePersisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    } catch (error) { base.diagnosticError = error instanceof Error ? error.message : 'Diagnostic failed'; }

    base.timeline = readTimeline();
    setReport({ ...base, classification: classify(base) });
    setBusy(false);
  }, [addEvent]);

  useEffect(() => {
    const mountedTimeline = recordTimeline('page mounted');
    const timelineTimer = window.setTimeout(() => { setTimeline(mountedTimeline); void runDiagnostics(); }, 0);
    const onControllerChange = () => addEvent('controllerchange');
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
    return () => { window.clearTimeout(timelineTimer); navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange); };
  }, [addEvent, runDiagnostics]);

  const requestUpdate = async () => {
    const registration = await navigator.serviceWorker?.getRegistration('/');
    if (!registration) { setActionMessage('No registration exists.'); return; }
    try { await registration.update(); setActionMessage('Worker update check completed.'); addEvent('worker update requested'); }
    catch (error) { setActionMessage(error instanceof Error ? error.message : 'Worker update failed.'); }
  };

  const registerExpectedWorker = async () => {
    if (!('serviceWorker' in navigator) || await navigator.serviceWorker.getRegistration('/')) return;
    try { await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }); setActionMessage('Expected worker registration requested.'); addEvent('expected worker registered'); await runDiagnostics(); }
    catch (error) { setActionMessage(error instanceof Error ? error.message : 'Registration failed.'); }
  };

  const copyReport = async () => {
    const text = `TKP PWA DIAGNOSTICS\n${JSON.stringify({ ...report, timeline }, null, 2)}`;
    await navigator.clipboard.writeText(text);
    setActionMessage('Diagnostic report copied.');
  };

  const noRegistration = report.serviceWorkerSupported === true && report.registrationFound === false;
  return (
    <main className="mx-auto min-h-screen min-h-dvh w-full max-w-3xl overflow-x-hidden px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-[var(--text-primary)]">
      <p className="type-protocol-label">Temporary local diagnostic</p>
      <h1 className="mt-3 break-words text-3xl font-semibold">iOS PWA control report</h1>
      <div className="mt-6 border-y border-[var(--line-subtle)] py-5"><p className="type-metadata">Result</p><p className="mt-2 break-words text-lg font-semibold" aria-live="polite">{report.classification}</p></div>
      <p className="type-small mt-5">Before sharing, add the exact iOS version from Settings. This report stays on this device unless you copy it.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void runDiagnostics()} disabled={busy} className="action-control focusable-surface">{busy ? 'Running…' : 'Run Diagnostics'}</button>
        <button type="button" onClick={() => void requestUpdate()} className="action-control focusable-surface">Request Worker Update</button>
        {noRegistration ? <button type="button" onClick={() => void registerExpectedWorker()} className="action-control focusable-surface">Register Expected Worker</button> : null}
        <button type="button" onClick={() => void copyReport()} className="action-control focusable-surface">Copy Report</button>
        <button type="button" onClick={() => setShowOfflineInstructions(true)} className="action-control focusable-surface">Prepare Offline Test</button>
        <button type="button" onClick={() => { localStorage.removeItem(TIMELINE_KEY); setTimeline([]); setActionMessage('Timeline cleared.'); }} className="action-control focusable-surface">Clear Timeline</button>
      </div>
      {actionMessage ? <p className="type-small mt-4" aria-live="polite">{actionMessage}</p> : null}
      {showOfflineInstructions ? <ol className="type-small mt-5 list-decimal space-y-2 pl-5"><li>Confirm Controlled is Yes.</li><li>Confirm the expected cache and `/offline` are present.</li><li>Fully close the app.</li><li>Enable airplane mode.</li><li>Relaunch from the Home Screen.</li></ol> : null}
      <section className="mt-8" aria-labelledby="report-title"><h2 id="report-title" className="text-xl font-semibold">Copyable report</h2><pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-words border border-[var(--line-subtle)] bg-black/30 p-3 text-[11px] leading-relaxed">{JSON.stringify({ ...report, timeline }, null, 2)}</pre></section>
    </main>
  );
}
