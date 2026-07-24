import { Buffer } from 'node:buffer';

export type BoundedBytesFailure = 'invalid-limit' | 'empty-input' | 'input-too-large' | 'invalid-chunk';

export type BoundedBytesResult =
  | { ok: true; bytes: Buffer; byteLength: number }
  | { ok: false; reason: BoundedBytesFailure; byteLength: number };

type ByteSource = AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>;

export async function collectBoundedBytes(source: ByteSource, maximumBytes: number): Promise<BoundedBytesResult> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) {
    return { ok: false, reason: 'invalid-limit', byteLength: 0 };
  }

  const chunks: Buffer[] = [];
  let byteLength = 0;
  const iterable = toAsyncIterable(source);
  const iterator = iterable[Symbol.asyncIterator]();

  try {
    while (true) {
      const next = await iterator.next();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) {
        await cancelIterator(iterator);
        return { ok: false, reason: 'invalid-chunk', byteLength };
      }

      byteLength += next.value.byteLength;
      if (byteLength > maximumBytes) {
        await cancelIterator(iterator);
        return { ok: false, reason: 'input-too-large', byteLength };
      }
      chunks.push(Buffer.from(next.value.buffer, next.value.byteOffset, next.value.byteLength));
    }
  } catch {
    await cancelIterator(iterator);
    return { ok: false, reason: 'invalid-chunk', byteLength };
  }

  if (byteLength === 0) return { ok: false, reason: 'empty-input', byteLength: 0 };
  return { ok: true, bytes: Buffer.concat(chunks, byteLength), byteLength };
}

function toAsyncIterable(source: ByteSource): AsyncIterable<Uint8Array> {
  if (Symbol.asyncIterator in source) return source;
  return {
    async *[Symbol.asyncIterator]() {
      const reader = source.getReader();
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          yield result.value;
        }
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    },
  };
}

async function cancelIterator(iterator: AsyncIterator<Uint8Array>) {
  await iterator.return?.().catch(() => undefined);
}
