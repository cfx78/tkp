import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { hasPlaylistSource } from './playlist-sources.ts';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { getSpotifyPlaylistEmbedUrl } from './spotify-playlist.ts';

const spotifyUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
const appleMusicUrl = 'https://music.apple.com/us/playlist/night-drive/pl.u-76oNl2muvdZJ7Y';
const youtubeMusicUrl = 'https://music.youtube.com/playlist?list=PL1234567890ABCDE';
const youtubeUrl = 'https://www.youtube.com/playlist?list=PL1234567890ABCDE';

test('accepts Spotify-only Playlist sources', () => assert.equal(hasPlaylistSource({ spotifyUrl }), true));
test('accepts Apple Music-only Playlist sources', () => assert.equal(hasPlaylistSource({ appleMusicUrl }), true));
test('accepts YouTube Music-only Playlist sources', () => assert.equal(hasPlaylistSource({ youtubeMusicUrl }), true));
test('accepts standard YouTube-only Playlist sources', () => assert.equal(hasPlaylistSource({ youtubeMusicUrl: youtubeUrl }), true));
test('accepts multiple Playlist providers', () => assert.equal(hasPlaylistSource({ spotifyUrl, appleMusicUrl, youtubeMusicUrl }), true));
test('rejects a Playlist with no provider source', () => assert.equal(hasPlaylistSource({ spotifyUrl: ' ', appleMusicUrl: null }), false));

test('does not derive a Spotify iframe when Spotify is absent', () => {
  assert.equal(hasPlaylistSource({ appleMusicUrl, youtubeMusicUrl: youtubeUrl }), true);
  assert.equal(getSpotifyPlaylistEmbedUrl(undefined, undefined), null);
});
