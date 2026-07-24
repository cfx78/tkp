import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this test directly and requires the extension.
import { filterSearchResults, normalizeSearchResult, type RawSearchResult } from './search.ts';

test('normalizes completed internal routes and Logs without inventing detail routes', () => {
  assert.equal(normalizeSearchResult({ _id: 'b', _type: 'beat', title: 'Beat', slug: 'beat' })?.href, '/player/beats/beat');
  assert.equal(normalizeSearchResult({ _id: 'r', _type: 'release', title: 'Release', slug: 'release' })?.href, '/releases/release');
  assert.equal(normalizeSearchResult({ _id: 'l', _type: 'lane', name: 'Lane', slug: 'lane' })?.href, '/lanes/lane');
  assert.equal(normalizeSearchResult({ _id: 'f', _type: 'fixation', title: 'Fixation', slug: 'fixation' })?.href, '/fixations/fixation');
  assert.equal(normalizeSearchResult({ _id: 'g', _type: 'log', body: 'Opening thought\nMore' })?.href, '/logs');
});

test('keeps Links external and rejects unsafe or missing destinations', () => {
  const link = normalizeSearchResult({ _id: 'x', _type: 'link', title: 'Example', url: 'https://example.com/path?tracking=kept', platformAuto: 'Website/Article' });
  assert.equal(link?.external, true);
  assert.equal(link?.externalLabel, 'Website/Article');
  assert.equal(link?.href, 'https://example.com/path?tracking=kept');
  assert.equal(normalizeSearchResult({ _id: 'x', _type: 'link', title: 'Bad', url: 'javascript:alert(1)' }), null);
});

test('uses shared Playlist priority for Spotify, Apple-only, YouTube-only, and YouTube Music', () => {
  assert.equal(normalizeSearchResult({ _id: 's', _type: 'playlist', title: 'S', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', appleMusicUrl: 'https://music.apple.com/us/playlist/example/pl.1234567890abcdef1234567890abcdef' })?.externalLabel, 'Spotify');
  assert.equal(normalizeSearchResult({ _id: 'a', _type: 'playlist', title: 'A', appleMusicUrl: 'https://music.apple.com/us/playlist/example/pl.1234567890abcdef1234567890abcdef' })?.externalLabel, 'Apple Music');
  assert.equal(normalizeSearchResult({ _id: 'y', _type: 'playlist', title: 'Y', youtubeMusicUrl: 'https://www.youtube.com/playlist?list=PL1234567890abcdef' })?.externalLabel, 'YouTube');
  assert.equal(normalizeSearchResult({ _id: 'm', _type: 'playlist', title: 'M', youtubeMusicUrl: 'https://music.youtube.com/playlist?list=PL1234567890abcdef' })?.externalLabel, 'YouTube Music');
});

test('filters query text and every supported stable dimension together', () => {
  const result = normalizeSearchResult({ _id: '1', _type: 'quote', quoteText: 'Stay curious', person: 'Someone', sourceTitle: 'Book', sourceUrl: 'https://example.com', tagIds: ['tag', 'mood'], relatedLaneIds: ['lane'], fixationIds: ['fix'], releaseIds: ['release'], effectivePublishedAt: '2026-02-01T00:00:00Z' });
  assert.ok(result);
  const criteria = { query: 'CURIOUS', type: 'Quote' as const, tagId: 'tag', moodId: 'mood', laneId: 'lane', fixationId: 'fix', releaseId: 'release', year: '2026', quoteSource: 'Book' };
  assert.equal(filterSearchResults([result], criteria).length, 1);
  assert.equal(filterSearchResults([result], { ...criteria, query: 'missing' }).length, 0);
});

test('normalization omits malformed optional data and remains serializable', () => {
  const result = normalizeSearchResult({ _id: '1', _type: 'quote', quoteText: 'Words', person: 'Person', sourceUrl: 'not a URL', effectivePublishedAt: 'bad', tagIds: ['', 'tag', 'tag'] });
  assert.ok(result);
  assert.equal(result.sourceHref, undefined);
  assert.equal(result.date, undefined);
  assert.deepEqual(result.tagIds, ['tag']);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('normalizes canonical manual and generated Sanity thumbnails identically', () => {
  const canonical = 'https://cdn.sanity.io/images/c6w1fv0f/tkp-v2/example-300x300.webp';
  const manual = normalizeSearchResult({ _id: 'manual', _type: 'link', title: 'Manual', url: 'https://example.com/manual', imageUrl: canonical });
  const generated = normalizeSearchResult({ _id: 'generated', _type: 'link', title: 'Generated', url: 'https://example.com/generated', imageUrl: canonical });
  const expected = `${canonical}?fm=webp&w=96&h=96&fit=crop`;
  assert.equal(manual?.imageUrl, expected);
  assert.equal(generated?.imageUrl, expected);
});

test('does not use provenance or arbitrary image URLs as Search artwork', () => {
  const provenanceOnly = normalizeSearchResult({ _id: 'provenance', _type: 'link', title: 'Provenance', url: 'https://example.com', thumbnailAutomation: { assetRef: 'image-private' } } as RawSearchResult & { thumbnailAutomation: { assetRef: string } });
  const malformed = normalizeSearchResult({ _id: 'malformed', _type: 'link', title: 'Malformed', url: 'https://example.com', imageUrl: 'https://example.com/image.jpg' });
  assert.equal(provenanceOnly?.imageUrl, undefined);
  assert.equal(malformed?.imageUrl, undefined);
  assert.doesNotThrow(() => JSON.stringify(provenanceOnly));
});
