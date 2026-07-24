import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes TypeScript tests directly and requires extensions.
import { beatArtworkDecision } from './beat-artwork.ts';

const canonical = { _type: 'image', asset: { _type: 'reference', _ref: 'image-abcdef1234-600x600-webp' } };
const url = 'https://cdn.sanity.io/images/project/dataset/cover.webp';
const fallback = 'https://cdn.sanity.io/images/project/dataset/lane.webp';

test('unapproved sensitive artwork never exposes the canonical source', () => {
  assert.deepEqual(beatArtworkDecision({ nsfw: true, coverArt: canonical }, false), null);
  assert.deepEqual(beatArtworkDecision({ nsfw: true, coverArt: canonical, lane: { fallbackCoverArtUrl: fallback } }, false), { kind: 'url', url: fallback });
});

test('approved sensitive and ordinary Beats select canonical artwork correctly', () => {
  assert.deepEqual(beatArtworkDecision({ nsfw: true, coverArt: canonical }, true), { kind: 'canonical', source: canonical });
  assert.deepEqual(beatArtworkDecision({ nsfw: false, coverArtUrl: url }, false), { kind: 'url', url });
});

test('approval is evaluated per Beat and malformed or arbitrary artwork is omitted', () => {
  assert.equal(beatArtworkDecision({ nsfw: true, coverArt: canonical }, false), null);
  assert.equal(beatArtworkDecision({ nsfw: true, coverArt: { _type: 'image', asset: { _type: 'reference', _ref: 'bad' } } }, true), null);
  assert.equal(beatArtworkDecision({ nsfw: false, coverArtUrl: 'https://example.com/cover.jpg' }, true), null);
});
