import assert from 'node:assert/strict'; import test from 'node:test';
// @ts-expect-error Node executes TypeScript directly.
import { validateSpotifyArtworkUrl } from './spotify-artwork-url.ts';
test('accepts exact official artwork host and path',()=>assert.deepEqual(validateSpotifyArtworkUrl('https://i.scdn.co/image/abC123'),{ok:true,url:'https://i.scdn.co/image/abC123'}));
for(const value of ['http://i.scdn.co/image/a','https://u:p@i.scdn.co/image/a','https://i.scdn.co/image/a#x','https://i.scdn.co:444/image/a','https://i.scdn.co.evil.test/image/a','https://x.i.scdn.co/image/a','https://127.0.0.1/image/a','https://localhost/image/a','https://i.scdn.co/image/a?x=1','https://i.scdn.co/other/a','data:image/png;base64,x','//i.scdn.co/image/a','x'.repeat(2049)]) test(`rejects unsafe artwork ${value.slice(0,30)}`,()=>assert.equal(validateSpotifyArtworkUrl(value).ok,false));
