import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Node 24 executes tests directly and requires the extension.
import { canRevealSensitiveValue, revealedValue, revealIdentityKey } from './sensitive-reveal.ts';
// @ts-expect-error Node 24 executes tests directly and requires the extension.
import { contentApprovalKey } from './content-warning.ts';

test('same document identity is stable across consumers while types remain isolated', () => {
  const link = { id: 'link-a', type: 'link' as const, nsfw: true };
  assert.equal(revealIdentityKey(link), revealIdentityKey({ ...link }));
  assert.notEqual(contentApprovalKey('link', 'shared'), contentApprovalKey('playlist', 'shared'));
});

test('parent approval never reveals a related child', () => {
  assert.equal(canRevealSensitiveValue({ id: 'child', type: 'link', nsfw: true }, false), false);
  assert.equal(canRevealSensitiveValue({ id: 'parent', type: 'fixation', nsfw: true }, true), true);
});

test('sensitive preview and artwork stay absent until exact approval', () => {
  const item = { id: 'link-a', type: 'link' as const, nsfw: true };
  assert.equal(revealedValue(item, false, 'https://cdn.sanity.io/images/p/d/image.webp'), undefined);
  assert.equal(revealedValue(item, false, 'https://www.youtube-nocookie.com/embed/abc'), undefined);
  assert.equal(revealedValue(item, true, 'canonical'), 'canonical');
});

test('ordinary values reveal and malformed identities remain unapproved', () => {
  assert.equal(revealedValue({ id: 'ordinary', type: 'quote' }, false, 'quote'), 'quote');
  assert.equal(canRevealSensitiveValue({ type: 'log', nsfw: true }, true), false);
  assert.equal(revealIdentityKey({ type: 'log', nsfw: true }), undefined);
});
