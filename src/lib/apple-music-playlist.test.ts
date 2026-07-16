import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { parseAppleMusicPlaylistSource } from './apple-music-playlist.ts';

const playlistId = 'pl.u-76oNl2muvdZJ7Y';
const canonicalUrl = `https://music.apple.com/us/playlist/night-drive/${playlistId}`;
const trustedEmbedUrl = `https://embed.music.apple.com/us/playlist/night-drive/${playlistId}`;
const expected = { ok: true, playlistId, canonicalUrl, trustedEmbedUrl };

const accepted = [
  ['normal playlist URL', canonicalUrl],
  ['playlist share URL', `${canonicalUrl}?l=en-US&ls=1&at=tracking`],
  ['trusted embed URL', `${trustedEmbedUrl}?app=music`],
  ['complete iframe', `<iframe src="${trustedEmbedUrl}"></iframe>`],
  ['iframe with harmless attributes', `<iframe height="450" allow="autoplay" src="${trustedEmbedUrl}?app=music" loading="lazy"></iframe>`],
  ['surrounding whitespace', `  \n${canonicalUrl}\n  `],
] as const;

for (const [name, source] of accepted) test(`accepts Apple Music ${name}`, () => assert.deepEqual(parseAppleMusicPlaylistSource(source), expected));

const rejected = [
  ['song URL', 'https://music.apple.com/us/song/example/123456789'],
  ['album URL', 'https://music.apple.com/us/album/example/123456789'],
  ['artist URL', 'https://music.apple.com/us/artist/example/123456789'],
  ['non-playlist page', 'https://music.apple.com/us/browse'],
  ['lookalike host', `https://music.apple.com.example.com/us/playlist/night-drive/${playlistId}`],
  ['HTTP iframe', `<iframe src="http://embed.music.apple.com/us/playlist/night-drive/${playlistId}"></iframe>`],
  ['credential-bearing URL', `https://user:pass@music.apple.com/us/playlist/night-drive/${playlistId}`],
  ['unknown-host iframe', `<iframe src="https://example.com/us/playlist/night-drive/${playlistId}"></iframe>`],
  ['arbitrary surrounding HTML', `<div><iframe src="${trustedEmbedUrl}"></iframe><a href="https://example.com">Other</a></div>`],
  ['malformed iframe', '<iframe src="not a url"></iframe>'],
  ['unsafe scheme', '<iframe src="javascript:alert(1)"></iframe>'],
  ['null-byte input', `${canonicalUrl}\0payload`],
  ['excessive input', `https://music.apple.com/${'a'.repeat(100_001)}`],
] as const;

for (const [name, source] of rejected) test(`rejects Apple Music ${name}`, () => assert.equal(parseAppleMusicPlaylistSource(source).ok, false));
