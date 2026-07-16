import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { parseYouTubePlaylistSource, youtubePlaylistProviderLabel } from './youtube-playlist.ts';

const playlistId = 'PL1234567890ABCDE';
const canonicalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
const musicUrl = `https://music.youtube.com/playlist?list=${playlistId}`;
const trustedEmbedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;

const accepted = [
  ['standard playlist URL', canonicalUrl, 'youtube', canonicalUrl],
  ['mobile playlist URL', `https://m.youtube.com/playlist?list=${playlistId}&feature=share`, 'youtube', canonicalUrl],
  ['YouTube Music playlist URL', `${musicUrl}&si=tracking`, 'youtubeMusic', musicUrl],
  ['watch URL with playlist ID', `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${playlistId}&autoplay=1`, 'youtube', canonicalUrl],
  ['playlist embed URL', `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`, 'youtube', canonicalUrl],
  ['No-Cookie playlist embed', trustedEmbedUrl, 'youtube', canonicalUrl],
  ['complete playlist iframe', `<iframe src="${trustedEmbedUrl}&amp;autoplay=1" allowfullscreen></iframe>`, 'youtube', canonicalUrl],
] as const;

for (const [name, source, provider, expectedCanonical] of accepted) {
  test(`accepts YouTube ${name}`, () => assert.deepEqual(parseYouTubePlaylistSource(source), { ok: true, provider, playlistId, canonicalUrl: expectedCanonical, trustedEmbedUrl }));
}

const rejected = [
  ['standalone video URL', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ['standalone Shorts URL', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'],
  ['channel URL', 'https://www.youtube.com/channel/UC1234567890ABCDE'],
  ['missing playlist ID', 'https://www.youtube.com/playlist'],
  ['malformed playlist ID', 'https://www.youtube.com/playlist?list=bad'],
  ['generated mix ID', 'https://music.youtube.com/playlist?list=RDAMVMdQw4w9WgXcQ'],
  ['unsupported embed path', `https://www.youtube.com/embed/channel?list=${playlistId}`],
  ['lookalike host', `https://youtube.com.example.com/playlist?list=${playlistId}`],
  ['HTTP iframe', `<iframe src="http://www.youtube.com/embed/videoseries?list=${playlistId}"></iframe>`],
  ['credential-bearing URL', `https://user:pass@www.youtube.com/playlist?list=${playlistId}`],
  ['unknown-host iframe', `<iframe src="https://example.com/embed/videoseries?list=${playlistId}"></iframe>`],
  ['arbitrary surrounding HTML', `<div><iframe src="${trustedEmbedUrl}"></iframe><a href="https://example.com">Other</a></div>`],
  ['script-only markup', `<script src="https://www.youtube.com/playlist?list=${playlistId}"></script>`],
  ['null-byte input', `${canonicalUrl}\0payload`],
  ['excessive input', `https://www.youtube.com/${'a'.repeat(100_001)}`],
] as const;

for (const [name, source] of rejected) test(`rejects YouTube ${name}`, () => assert.equal(parseYouTubePlaylistSource(source).ok, false));

test('labels normalized playlist providers accurately', () => {
  assert.equal(youtubePlaylistProviderLabel(canonicalUrl), 'YouTube');
  assert.equal(youtubePlaylistProviderLabel(musicUrl), 'YouTube Music');
});
