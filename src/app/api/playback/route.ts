import { NextResponse } from 'next/server';
import { createSignedBeatUrl } from '@/src/lib/r2';
import { sanityClient } from '@/src/sanity/lib/client';

export const dynamic = 'force-dynamic';

const beatIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('A valid JSON request body is required.', 400);
  }

  try {
    const beatId = typeof body === 'object' && body !== null && 'beatId' in body ? body.beatId : null;

    if (typeof beatId !== 'string' || !beatIdPattern.test(beatId)) {
      return errorResponse('A valid Beat ID is required.', 400);
    }

    const beat = await sanityClient.fetch<{ audioObjectKey?: string } | null>(
      `*[_type == "beat" && _id == $beatId && defined(audioObjectKey)][0]{audioObjectKey}`,
      { beatId },
      { cache: 'no-store', perspective: 'published' }
    );

    if (!beat?.audioObjectKey) {
      return errorResponse('Published Beat audio was not found.', 404);
    }

    const signed = await createSignedBeatUrl(beat.audioObjectKey);
    return NextResponse.json(signed, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Unable to create signed Beat playback URL.', error);
    return errorResponse('Playback is temporarily unavailable.', 500);
  }
}

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStoreHeaders });
}
