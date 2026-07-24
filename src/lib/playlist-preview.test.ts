import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { getPlaylistPreviewOptions } from './playlist-preview.ts';

const spotifyUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
const spotifyEmbedUrl = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator';
const appleMusicUrl = 'https://music.apple.com/us/playlist/night-drive/pl.u-76oNl2muvdZJ7Y';
const youtubeMusicUrl = 'https://music.youtube.com/playlist?list=PL1234567890ABCDE';
const youtubeUrl = 'https://www.youtube.com/playlist?list=PL1234567890ABCDE';

test('returns trusted options in Spotify, Apple Music, then YouTube order', () => {
  const options = getPlaylistPreviewOptions({ spotifyUrl, appleMusicUrl, youtubeMusicUrl });
  assert.deepEqual(options.map(({ provider, label }) => ({ provider, label })), [
    { provider: 'spotify', label: 'Spotify' },
    { provider: 'appleMusic', label: 'Apple Music' },
    { provider: 'youtubeMusic', label: 'YouTube Music' },
  ]);
});

test('derives an Apple Music-only preview', () => {
  assert.deepEqual(getPlaylistPreviewOptions({ appleMusicUrl }), [{
    provider: 'appleMusic',
    label: 'Apple Music',
    embedUrl: 'https://embed.music.apple.com/us/playlist/night-drive/pl.u-76oNl2muvdZJ7Y',
    externalUrl: appleMusicUrl,
  }]);
});

test('distinguishes standard YouTube and YouTube Music previews', () => {
  assert.equal(getPlaylistPreviewOptions({ youtubeMusicUrl })[0]?.provider, 'youtubeMusic');
  assert.equal(getPlaylistPreviewOptions({ youtubeMusicUrl: youtubeUrl })[0]?.provider, 'youtube');
});

test('uses a validated legacy Spotify embed only as fallback', () => {
  const option = getPlaylistPreviewOptions({ spotifyEmbedUrl })[0];
  assert.equal(option?.provider, 'spotify');
  assert.equal(option?.externalUrl, spotifyUrl);
});

test('rejects invalid providers and does not retain URL parameters', () => {
  assert.deepEqual(getPlaylistPreviewOptions({
    spotifyUrl: 'https://example.com/playlist/invalid',
    appleMusicUrl: 'https://music.apple.com/us/album/not-a-playlist/123',
    youtubeMusicUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  }), []);
});
