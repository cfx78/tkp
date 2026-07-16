import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test directly.
import { classifyThumbnailProvenance, decideThumbnailOverwrite } from './thumbnail-overwrite-policy.ts';

const assetRef = 'image-abcdef123456-1200x800-webp';
const sourceCanonicalUrl = 'https://open.spotify.com/track/1234567890AB';
const provenance = {
  provider: 'spotify', method: 'spotify-oembed', assetRef,
  sourceCanonicalUrl, fetchedAt: '2026-07-16T12:00:00.000Z', sha256: 'a'.repeat(64),
};

test('allows automatic assignment when no thumbnail exists', () => {
  assert.deepEqual(decideThumbnailOverwrite({ currentSourceUrl: sourceCanonicalUrl }), {
    allowed: true, requiresConfirmation: false, state: 'absent', reason: 'no-current-thumbnail',
  });
});

test('protects manual or unknown thumbnails without provenance', () => {
  const result = decideThumbnailOverwrite({ currentThumbnailAssetRef: assetRef, currentSourceUrl: sourceCanonicalUrl });
  assert.equal(result.allowed, false);
  assert.equal(result.requiresConfirmation, true);
  assert.equal(result.state, 'absent');
});

test('classifies a matching automatic thumbnail but requires confirmation to refresh it', () => {
  const input = { currentThumbnailAssetRef: assetRef, currentSourceUrl: sourceCanonicalUrl, provenance };
  assert.equal(classifyThumbnailProvenance(input), 'valid-current-automatic');
  assert.equal(decideThumbnailOverwrite(input).allowed, false);
  assert.equal(decideThumbnailOverwrite({ ...input, replacementConfirmed: true }).allowed, true);
});

test('detects asset replacement, absent asset reference, stale source, and malformed provenance', () => {
  assert.equal(classifyThumbnailProvenance({ currentThumbnailAssetRef: 'image-other123-10x10-webp', currentSourceUrl: sourceCanonicalUrl, provenance }), 'asset-replaced');
  assert.equal(classifyThumbnailProvenance({ currentSourceUrl: sourceCanonicalUrl, provenance }), 'asset-replaced');
  assert.equal(classifyThumbnailProvenance({ currentThumbnailAssetRef: assetRef, currentSourceUrl: 'https://open.spotify.com/track/DIFFERENT123', provenance }), 'stale-source');
  assert.equal(classifyThumbnailProvenance({ currentThumbnailAssetRef: assetRef, currentSourceUrl: sourceCanonicalUrl, provenance: { ...provenance, sha256: 'bad' } }), 'malformed');
});

test('protects mismatched, stale, and malformed thumbnails unless replacement is explicit', () => {
  for (const changed of [
    { currentThumbnailAssetRef: 'image-other123-10x10-webp', currentSourceUrl: sourceCanonicalUrl, provenance },
    { currentThumbnailAssetRef: assetRef, currentSourceUrl: `${sourceCanonicalUrl}?changed=1`, provenance },
    { currentThumbnailAssetRef: assetRef, currentSourceUrl: sourceCanonicalUrl, provenance: { ...provenance, assetRef: undefined } },
  ]) {
    assert.equal(decideThumbnailOverwrite(changed).allowed, false);
    assert.equal(decideThumbnailOverwrite({ ...changed, replacementConfirmed: true }).allowed, true);
  }
});

test('canonical equality is stable after tracking parameters were removed upstream', () => {
  assert.equal(classifyThumbnailProvenance({ currentThumbnailAssetRef: assetRef, currentSourceUrl: sourceCanonicalUrl, provenance }), 'valid-current-automatic');
  assert.equal(classifyThumbnailProvenance({ currentThumbnailAssetRef: assetRef, currentSourceUrl: `${sourceCanonicalUrl}?utm_source=test`, provenance }), 'stale-source');
});
