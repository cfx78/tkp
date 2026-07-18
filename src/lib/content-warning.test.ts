import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes TypeScript tests directly and requires extensions.
import { CONTENT_APPROVAL_VALUE, clearContentApproval, contentApprovalKey, isContentApprovalKey, normalizePublicDocumentId, readContentApproval, runAfterContentApproval, subscribeContentApproval, writeContentApproval } from './content-warning.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

test('creates exact versioned approval keys and normalizes draft IDs', () => {
  assert.equal(contentApprovalKey('beat', 'abc-123'), 'kp_nsfw_approved:beat:abc-123');
  assert.equal(contentApprovalKey('beat', 'drafts.abc-123'), 'kp_nsfw_approved:beat:abc-123');
  assert.equal(normalizePublicDocumentId('drafts.abc-123'), 'abc-123');
  assert.equal(CONTENT_APPROVAL_VALUE, 'v1');
});

test('rejects empty, malformed, wildcard, URL, slug-like, and unknown approval identities', () => {
  for (const [type, id] of [['', 'id'], ['unknown', 'id'], ['beat', ''], ['beat', '*'], ['beat', 'https://example.com'], ['beat', 'id:version']]) assert.equal(contentApprovalKey(type, id), null);
  assert.equal(isContentApprovalKey('kp_nsfw_approved:beat:id'), true);
  assert.equal(isContentApprovalKey('kp_nsfw_approved:*:id'), false);
});

test('approval is isolated by exact item and content type and can be cleared', () => {
  const storage = memoryStorage();
  assert.equal(readContentApproval('beat', 'one', storage), false);
  assert.equal(writeContentApproval('beat', 'one', storage), true);
  assert.equal(readContentApproval('beat', 'one', storage), true);
  assert.equal(readContentApproval('beat', 'two', storage), false);
  assert.equal(readContentApproval('version', 'one', storage), false);
  assert.equal(readContentApproval('playlist', 'one', storage), false);
  assert.equal(readContentApproval('link', 'one', storage), false);
  assert.equal(clearContentApproval('beat', 'one', storage), true);
  assert.equal(readContentApproval('beat', 'one', storage), false);
});

test('unavailable or throwing storage safely defaults to unapproved', () => {
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(readContentApproval('beat', 'one', undefined), false);
  assert.equal(readContentApproval('beat', 'one', throwing), false);
  assert.equal(writeContentApproval('beat', 'one', throwing), false);
  assert.equal(clearContentApproval('beat', 'one', throwing), false);
});

test('sensitive action runs exactly once after approval and never after cancel', async () => {
  let actions = 0;
  assert.equal(await runAfterContentApproval(async () => false, () => { actions += 1; }), false);
  assert.equal(actions, 0);
  assert.equal(await runAfterContentApproval(async () => true, () => { actions += 1; }), true);
  assert.equal(actions, 1);
});

test('write and clear notify same-tab subscribers for only the exact approval key', () => {
  const storage = memoryStorage();
  const previousWindow = globalThis.window;
  const eventTarget = new EventTarget() as EventTarget & { localStorage: ReturnType<typeof memoryStorage> };
  eventTarget.localStorage = storage;
  Object.defineProperty(globalThis, 'window', { value: eventTarget, configurable: true });
  let notifications = 0;
  const unsubscribe = subscribeContentApproval('beat', 'one', () => { notifications += 1; });
  writeContentApproval('beat', 'two', storage);
  writeContentApproval('beat', 'one', storage);
  clearContentApproval('beat', 'one', storage);
  unsubscribe();
  writeContentApproval('beat', 'one', storage);
  assert.equal(notifications, 2);
  Object.defineProperty(globalThis, 'window', { value: previousWindow, configurable: true });
});
