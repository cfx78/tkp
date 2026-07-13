import { NextResponse } from 'next/server';
import { createSignedBeatUrl, isValidBeatObjectKey } from '@/src/lib/r2';
import { sanityClient } from '@/src/sanity/lib/client';

export const dynamic = 'force-dynamic';

const beatIdPattern = /^[A-Za-z0-9_-]{1,128}$/;
const versionKeyPattern = /^[A-Za-z0-9_-]{1,128}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('A valid JSON request body is required.', 400);
  }

  try {
    if (typeof body !== 'object' || body === null || 'audioObjectKey' in body) {
      return errorResponse('A valid playback request is required.', 400);
    }
    const beatId = 'beatId' in body ? body.beatId : null;
    const sourceType = 'sourceType' in body ? body.sourceType : 'main';

    if (typeof beatId !== 'string' || !beatIdPattern.test(beatId)) {
      return errorResponse('A valid Beat ID is required.', 400);
    }

    if (sourceType !== 'main' && sourceType !== 'version') return errorResponse('A valid playback source is required.', 400);

    let audioObjectKey: string | undefined;
    if (sourceType === 'version') {
      const versionKey = 'versionKey' in body ? body.versionKey : null;
      if (typeof versionKey !== 'string' || !versionKeyPattern.test(versionKey)) return errorResponse('A valid Context key is required.', 400);
      const beat = await sanityClient.fetch<{ version?: { audioObjectKey?: string; nsfw?: boolean } } | null>(
        `*[_type == "beat" && _id == $beatId && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]][0]{"version": versions[_key == $versionKey][0]{audioObjectKey, nsfw}}`,
        { beatId, versionKey }, { cache: 'no-store', perspective: 'published' }
      );
      if (!beat?.version) return errorResponse('Published Context audio was not found.', 404);
      if (beat.version.nsfw === true) return errorResponse('This Context audio is locked.', 403);
      audioObjectKey = beat.version.audioObjectKey;
    } else {
      const beat = await sanityClient.fetch<{ audioObjectKey?: string } | null>(
        `*[_type == "beat" && _id == $beatId && defined(audioObjectKey) && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]][0]{audioObjectKey}`,
        { beatId }, { cache: 'no-store', perspective: 'published' }
      );
      audioObjectKey = beat?.audioObjectKey;
    }

    if (!audioObjectKey) return errorResponse(sourceType === 'version' ? 'Context audio is unavailable.' : 'Published Beat audio was not found.', 404);
    if (!isValidBeatObjectKey(audioObjectKey)) return errorResponse('Playback source is invalid.', 422);

    const signed = await createSignedBeatUrl(audioObjectKey);
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
