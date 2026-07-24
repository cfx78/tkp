import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { getSpotifyPlaylistEmbedUrl, parseSpotifyPlaylistSource } from './spotify-playlist.ts';

const playlistId = '37i9dQZF1DXcBWIGoYBM5M';
const canonicalUrl = `https://open.spotify.com/playlist/${playlistId}`;
const trustedEmbedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

test('normalizes Spotify playlist public, share, and embed URLs', () => {
  for (const source of [
    canonicalUrl,
    `${canonicalUrl}?si=share-token&utm_source=copy-link`,
    `${trustedEmbedUrl}?utm_source=generator`,
  ]) {
    assert.deepEqual(parseSpotifyPlaylistSource(source), {
      ok: true,
      playlistId,
      canonicalUrl,
      trustedEmbedUrl,
    });
  }
});

test('extracts a playlist from iframe code without retaining markup', () => {
  assert.deepEqual(
    parseSpotifyPlaylistSource(`<iframe src="${trustedEmbedUrl}?utm_source=generator" allow="autoplay"><script>alert(1)</script></iframe>`),
    { ok: true, playlistId, canonicalUrl, trustedEmbedUrl },
  );
});

test('rejects non-playlist Spotify sources and unsafe or malformed input', () => {
  for (const source of [
    'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
    'https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<script>alert(1)</script>',
  ]) {
    assert.equal(parseSpotifyPlaylistSource(source).ok, false);
  }
});

test('prefers a trusted embed derived from the canonical public URL', () => {
  assert.equal(
    getSpotifyPlaylistEmbedUrl(canonicalUrl, 'https://open.spotify.com/embed/playlist/37i9dQZF1FwUTAo96bbrnV'),
    trustedEmbedUrl,
  );
  assert.equal(
    getSpotifyPlaylistEmbedUrl(undefined, `${trustedEmbedUrl}?utm_source=generator`),
    trustedEmbedUrl,
  );
  assert.equal(getSpotifyPlaylistEmbedUrl('https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl'), null);
});
