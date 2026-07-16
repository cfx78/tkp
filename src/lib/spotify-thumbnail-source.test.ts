import assert from 'node:assert/strict'; import test from 'node:test';
// @ts-expect-error Node executes TypeScript directly.
import { parseSpotifyThumbnailSource } from './spotify-thumbnail-source.ts';
const track='4uLU6hMCjMI75M1A2tKUQC', album='1ATL5GLyefJaxhQzSPVrLX';
for (const [name,input,type,id] of [
  ['track',`https://open.spotify.com/track/${track}`,'track',track],
  ['track share',`https://open.spotify.com/track/${track}?si=abc&utm_source=x`,'track',track],
  ['track embed',`https://open.spotify.com/embed/track/${track}?theme=0`,'track',track],
  ['track iframe',`<iframe src="https://open.spotify.com/embed/track/${track}?utm_source=generator"></iframe>`,'track',track],
  ['album',`https://open.spotify.com/album/${album}`,'album',album],
  ['album share',`https://open.spotify.com/album/${album}?si=abc`,'album',album],
  ['album embed',`https://open.spotify.com/embed/album/${album}`,'album',album],
  ['album iframe',`<iframe title="Spotify" src="https://open.spotify.com/embed/album/${album}"></iframe>`,'album',album],
] as const) test(`normalizes ${name}`,()=>assert.deepEqual(parseSpotifyThumbnailSource(input),{ok:true,entityType:type,entityId:id,canonicalUrl:`https://open.spotify.com/${type}/${id}`}));

for (const [name,input] of [
  ['playlist',`https://open.spotify.com/playlist/${track}`],['artist',`https://open.spotify.com/artist/${track}`],['episode',`https://open.spotify.com/episode/${track}`],['show',`https://open.spotify.com/show/${track}`],['profile','https://open.spotify.com/user/example'],['bad id','https://open.spotify.com/track/bad'],['lookalike',`https://open.spotify.com.evil.test/track/${track}`],['credentials',`https://x:y@open.spotify.com/track/${track}`],['unsafe','javascript:alert(1)'],['iframe host',`<iframe src="https://evil.test/track/${track}"></iframe>`],['null',`https://open.spotify.com/track/${track}\0`],['html',`<script>https://open.spotify.com/track/${track}</script>`],
] as const) test(`rejects ${name}`,()=>assert.equal(parseSpotifyThumbnailSource(input).ok,false));
test('rejects excessive input',()=>assert.equal(parseSpotifyThumbnailSource('x'.repeat(100001)).ok,false));
