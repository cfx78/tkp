import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

type WorkerRequest = { url: string; method: string; mode: string; destination: string; headers: Headers };

function request(path: string, overrides: Partial<WorkerRequest> = {}): WorkerRequest {
  return { url: `https://tkp.example${path}`, method: 'GET', mode: 'navigate', destination: 'document', headers: new Headers(), ...overrides };
}

async function createHarness() {
  const source = await readFile(new URL('public/sw.js', root), 'utf8');
  const listeners = new Map<string, (event: unknown) => void>();
  const entries = new Map<string, Response>();
  let claimed = false;
  const key = (value: string | Request) => new URL(typeof value === 'string' ? value : value.url, 'https://tkp.example').pathname;
  const cache = {
    put: async (value: string | Request, response: Response) => { entries.set(key(value), response.clone()); },
    match: async (value: string | Request) => entries.get(key(value))?.clone(),
  };
  const caches = {
    open: async () => cache,
    keys: async () => ['tkp-shell-v1', 'unrelated-cache'],
    delete: async () => true,
    match: async (value: string | Request) => cache.match(value),
  };
  const fetch = async (value: string | WorkerRequest) => {
    const url = typeof value === 'string' ? value : value.url;
    if (url === '/offline') return new Response('<!doctype html><title>TKP Offline</title><p>Music is not available offline.</p>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    if (url.includes('kitsune-mark.svg')) throw new TypeError('optional asset unavailable');
    if (url.includes('icon-192.png')) return new Response('icon', { status: 200 });
    throw new TypeError('network offline');
  };
  const self = {
    location: { origin: 'https://tkp.example' },
    clients: { claim: async () => { claimed = true; } },
    addEventListener: (name: string, handler: (event: unknown) => void) => listeners.set(name, handler),
  };
  vm.runInNewContext(source, { self, caches, fetch, Request, Response, URL, Promise, Error });

  const dispatchWait = async (name: string) => {
    let pending: Promise<unknown> | undefined;
    listeners.get(name)?.({ waitUntil: (value: Promise<unknown>) => { pending = value; } });
    await pending;
  };
  const dispatchFetch = async (value: WorkerRequest) => {
    let response: Promise<Response> | undefined;
    listeners.get('fetch')?.({ request: value, respondWith: (result: Promise<Response>) => { response = result; } });
    return response ? await response : undefined;
  };
  return { dispatchWait, dispatchFetch, entries, cache, claimed: () => claimed };
}

test('worker installs the critical offline document despite optional asset failure and claims clients', async () => {
  const harness = await createHarness();
  await harness.dispatchWait('install');
  assert.equal(harness.entries.has('/offline'), true);
  await harness.dispatchWait('activate');
  assert.equal(harness.claimed(), true);
});

test('offline start URL, deep links, and query navigations return cached HTTP 200 HTML', async () => {
  const harness = await createHarness();
  await harness.dispatchWait('install');
  for (const path of ['/', '/player/beats/example', '/search?q=rain']) {
    const response = await harness.dispatchFetch(request(path));
    assert.equal(response?.status, 200);
    assert.match(response?.headers.get('content-type') || '', /^text\/html/i);
    assert.match(await response!.text(), /Music is not available offline/i);
  }
});

test('missing cached document uses self-contained HTTP 200 HTML emergency fallback', async () => {
  const harness = await createHarness();
  harness.entries.delete('/offline');
  const response = await harness.dispatchFetch(request('/?source=installed'));
  assert.equal(response?.status, 200);
  assert.match(response?.headers.get('content-type') || '', /^text\/html/i);
  assert.match(await response!.text(), /You are offline/);
  assert.match(await (await harness.dispatchFetch(request('/another')))!.text(), /Music is not available offline/);
});

test('API, Studio, media, Range, and cross-origin requests stay outside fallback interception', async () => {
  const harness = await createHarness();
  const rangeHeaders = new Headers({ Range: 'bytes=0-1023' });
  const cases = [
    request('/api/playback'),
    request('/studio'),
    request('/beat.mp3', { mode: 'cors', destination: 'audio' }),
    request('/beat.mp3', { mode: 'cors', destination: 'audio', headers: rangeHeaders }),
    { ...request('/embed'), url: 'https://provider.example/embed' },
  ];
  for (const value of cases) assert.equal(await harness.dispatchFetch(value), undefined);
});
