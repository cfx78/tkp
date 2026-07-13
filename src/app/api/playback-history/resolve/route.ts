import { NextResponse } from 'next/server';
import { sanityClient } from '@/src/sanity/lib/client';
import type { ResolvedHistoryItem } from '@/src/types/player';

export const dynamic = 'force-dynamic';
const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };
type Ref = { sourceType: 'main' | 'version'; beatId: string; versionKey?: string };

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return error('A valid JSON request body is required.', 400); }
  if (!body || typeof body !== 'object' || !('references' in body) || !Array.isArray(body.references) || body.references.length > 50) return error('A valid reference list is required.', 400);
  const references = body.references as unknown[];
  const valid: Ref[] = [];
  for (const value of references) {
    if (!value || typeof value !== 'object' || 'audioObjectKey' in value) return error('A malformed playback reference was provided.', 400);
    const ref = value as Record<string, unknown>;
    if ((ref.sourceType !== 'main' && ref.sourceType !== 'version') || typeof ref.beatId !== 'string' || !idPattern.test(ref.beatId)) return error('A malformed playback reference was provided.', 400);
    if (ref.sourceType === 'version' && (typeof ref.versionKey !== 'string' || !idPattern.test(ref.versionKey))) return error('A malformed Context reference was provided.', 400);
    valid.push({ sourceType: ref.sourceType, beatId: ref.beatId, versionKey: typeof ref.versionKey === 'string' ? ref.versionKey : undefined });
  }
  const uniqueIds = Array.from(new Set(valid.map((ref) => ref.beatId)));
  const beats = await sanityClient.fetch<Array<{ _id: string; title: string; slug?: string; status?: string; audioAvailable?: boolean; coverArtUrl?: string; lane?: { name?: string; slug?: string; fallbackCoverArtUrl?: string }; versions?: Array<{ _key: string; title?: string; versionType?: string; nsfw?: boolean; audioAvailable?: boolean }> }>>(
    `*[_type == "beat" && _id in $ids && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]]{_id,title,"slug":slug.current,status,"audioAvailable":defined(audioObjectKey),"coverArtUrl":coverArt.asset->url,lane->{name,"slug":slug.current,"fallbackCoverArtUrl":fallbackCoverArt.asset->url},versions[]{_key,title,versionType,nsfw,"audioAvailable":defined(audioObjectKey)}}`,
    { ids: uniqueIds }, { cache: 'no-store', perspective: 'published' }
  );
  const byId = new Map(beats.map((beat) => [beat._id, beat]));
  const items: ResolvedHistoryItem[] = [];
  for (const ref of valid) {
    const beat = byId.get(ref.beatId); if (!beat) continue;
    if (ref.sourceType === 'main') { if (!beat.audioAvailable) continue; const { versions: _versions, audioAvailable: _audioAvailable, ...metadata } = beat; items.push({ ...metadata, sourceType: 'main', beatId: beat._id, eligible: true }); continue; }
    const version = beat.versions?.find((item) => item._key === ref.versionKey && item.audioAvailable && item.nsfw !== true); if (!version) continue;
    items.push({ _id: `version:${beat._id}:${version._key}`, sourceType: 'version', beatId: beat._id, parentBeatId: beat._id, versionKey: version._key, title: version.title || 'Untitled Context', versionType: version.versionType, parentBeatTitle: beat.title, parentBeatSlug: beat.slug, slug: beat.slug, coverArtUrl: beat.coverArtUrl, lane: beat.lane, eligible: true });
  }
  return NextResponse.json({ items }, { headers: noStoreHeaders });
}
function error(message: string, status: number) { return NextResponse.json({ error: message }, { status, headers: noStoreHeaders }); }
