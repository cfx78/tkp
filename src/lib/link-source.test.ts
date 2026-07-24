import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test file directly.
import { parseLinkSource } from './link-source.ts';

test('normalizes YouTube URLs and iframe markup', () => {
  const expected = {
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    provider: 'youtube',
    contentKind: 'video',
    providerId: 'dQw4w9WgXcQ',
    trustedEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  };
  assert.deepEqual(parseLinkSource('https://youtu.be/dQw4w9WgXcQ?t=10'), expected);
  assert.deepEqual(parseLinkSource('<iframe width="560" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" allowfullscreen></iframe><script>alert(1)</script>'), expected);
  const playlist = parseLinkSource('https://www.youtube.com/embed/videoseries?list=PL1234567890ABCDE');
  assert.equal(playlist?.canonicalUrl, 'https://www.youtube.com/playlist?list=PL1234567890ABCDE');
  assert.equal(playlist?.contentKind, 'playlist');
});

test('normalizes Spotify public and embed URLs', () => {
  const parsed = parseLinkSource('<iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator"></iframe>');
  assert.equal(parsed?.canonicalUrl, 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(parsed?.trustedEmbedUrl, 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(parsed?.provider, 'spotify');
});

test('extracts supported blockquote URLs without retaining markup', () => {
  const instagram = parseLinkSource('<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/ABC_123/?utm_source=ig_embed"><script src="https://www.instagram.com/embed.js"></script></blockquote>');
  assert.equal(instagram?.canonicalUrl, 'https://www.instagram.com/reel/ABC_123/');
  assert.equal(instagram?.provider, 'instagram');

  const tiktok = parseLinkSource('<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@creator/video/7250000000000000000" data-video-id="7250000000000000000"></blockquote>');
  assert.equal(tiktok?.canonicalUrl, 'https://www.tiktok.com/@creator/video/7250000000000000000');
  assert.equal(parseLinkSource('<iframe src="https://www.tiktok.com/player/v1/7250000000000000000?autoplay=1"></iframe>')?.canonicalUrl, 'https://www.tiktok.com/player/v1/7250000000000000000');

  const x = parseLinkSource('<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/1234567890?ref_src=twsrc"></a></blockquote>');
  assert.equal(x?.canonicalUrl, 'https://x.com/user/status/1234567890');
});

test('normalizes Apple Music embeds and detects other supported providers', () => {
  assert.equal(parseLinkSource('https://embed.music.apple.com/us/album/example/123?i=456')?.canonicalUrl, 'https://music.apple.com/us/album/example/123?i=456');
  assert.equal(parseLinkSource('https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVM')?.provider, 'youtubeMusic');
  assert.equal(parseLinkSource('https://letterboxd.com/film/moonlight/')?.provider, 'letterboxd');
});

test('rejects executable text, unsafe schemes, credentials, and malformed provider URLs', () => {
  assert.equal(parseLinkSource('<script src="https://example.com/payload.js"></script>'), null);
  assert.equal(parseLinkSource('javascript:alert(1)'), null);
  assert.equal(parseLinkSource('data:text/html,<h1>hello</h1>'), null);
  assert.equal(parseLinkSource('https://user:password@example.com/private'), null);
  assert.equal(parseLinkSource('<iframe src="javascript:alert(1)"></iframe>'), null);
  assert.equal(parseLinkSource('<iframe src="https://example.com/embed/123"></iframe>'), null);
  assert.equal(parseLinkSource('https://www.youtube.com/watch?v=invalid'), null);
});

test('prefers a recognized provider destination over unrelated markup attributes', () => {
  const parsed = parseLinkSource('<blockquote cite="https://example.com/tracker"><a href="https://x.com/user/status/1234567890">Post</a></blockquote>');
  assert.equal(parsed?.canonicalUrl, 'https://x.com/user/status/1234567890');
  assert.equal(parsed?.provider, 'x');
});
