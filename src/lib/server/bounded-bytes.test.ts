import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 24 executes this TypeScript test directly.
import { collectBoundedBytes } from './bounded-bytes.ts';

async function* chunks(values: number[][]) {
  for (const value of values) yield Uint8Array.from(value);
}

test('collects one or many Uint8Array chunks without quadratic concatenation', async () => {
  const single = await collectBoundedBytes(chunks([[1, 2, 3]]), 3);
  assert.equal(single.ok, true);
  if (single.ok) assert.deepEqual([...single.bytes], [1, 2, 3]);
  const multiple = await collectBoundedBytes(chunks([[1], [2, 3]]), 3);
  assert.equal(multiple.ok, true);
  if (multiple.ok) assert.deepEqual([...multiple.bytes], [1, 2, 3]);
});

test('accepts the exact byte limit and rejects one byte over it', async () => {
  assert.equal((await collectBoundedBytes(chunks([[1, 2]]), 2)).ok, true);
  assert.deepEqual(await collectBoundedBytes(chunks([[1, 2], [3]]), 2), {
    ok: false, reason: 'input-too-large', byteLength: 3,
  });
});

test('distinguishes empty input and invalid limits', async () => {
  assert.deepEqual(await collectBoundedBytes(chunks([]), 2), { ok: false, reason: 'empty-input', byteLength: 0 });
  for (const limit of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(await collectBoundedBytes(chunks([[1]]), limit), { ok: false, reason: 'invalid-limit', byteLength: 0 });
  }
});

test('handles a large number of small chunks', async () => {
  async function* many() { for (let index = 0; index < 10_000; index += 1) yield Uint8Array.of(index % 256); }
  const result = await collectBoundedBytes(many(), 10_000);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.byteLength, 10_000);
});

test('stops and closes the source immediately after overflow', async () => {
  let readCount = 0;
  let closed = false;
  async function* cancellable() {
    try {
      for (const value of [1, 2, 3, 4]) { readCount += 1; yield Uint8Array.of(value); }
    } finally { closed = true; }
  }
  const result = await collectBoundedBytes(cancellable(), 2);
  assert.deepEqual(result, { ok: false, reason: 'input-too-large', byteLength: 3 });
  assert.equal(readCount, 3);
  assert.equal(closed, true);
});

test('collects a ReadableStream and cancels its reader', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(Uint8Array.of(7)); controller.close(); },
  });
  const result = await collectBoundedBytes(stream, 1);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual([...result.bytes], [7]);
});
