import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { externalDestinationLabel } from './link-display.ts';

test('formats a quiet hostname without exposing paths, queries, or fragments', () => {
  const href = 'https://www.example.com/a/very/long/path?utm_source=test&list=123#section';
  assert.equal(externalDestinationLabel(href), 'example.com');
  assert.equal(href, 'https://www.example.com/a/very/long/path?utm_source=test&list=123#section');
});

test('keeps recognizable provider hostnames', () => {
  assert.equal(externalDestinationLabel('https://open.spotify.com/playlist/123?si=abc'), 'open.spotify.com');
  assert.equal(externalDestinationLabel('https://music.youtube.com/playlist?list=123'), 'music.youtube.com');
});

test('returns a safe fallback for malformed or non-web destinations', () => {
  assert.equal(externalDestinationLabel('not a url'), 'External link');
  assert.equal(externalDestinationLabel('javascript:alert(1)'), 'External link');
  assert.equal(externalDestinationLabel(undefined, 'Source'), 'Source');
});
