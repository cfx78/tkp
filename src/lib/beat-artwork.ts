import type { PlayerBeat } from '@/src/types/player';

type ArtworkBeat = Pick<PlayerBeat, 'nsfw' | 'coverArt' | 'coverArtUrl' | 'lane'>;
export type BeatArtworkDecision = { kind: 'url'; url: string } | { kind: 'canonical'; source: NonNullable<PlayerBeat['coverArt']> } | null;

export function beatArtworkDecision(beat: ArtworkBeat | null | undefined, approved: boolean): BeatArtworkDecision {
  if (!beat) return null;
  const fallback = safeSanityImageUrl(beat.lane?.fallbackCoverArtUrl);
  if (!beat.nsfw) {
    const url = safeSanityImageUrl(beat.coverArtUrl) || fallback;
    return url ? { kind: 'url', url } : null;
  }
  if (!approved) return fallback ? { kind: 'url', url: fallback } : null;
  if (validImageReference(beat.coverArt)) return { kind: 'canonical', source: beat.coverArt };
  return fallback ? { kind: 'url', url: fallback } : null;
}

function validImageReference(value?: PlayerBeat['coverArt']): value is NonNullable<PlayerBeat['coverArt']> {
  return Boolean(value && value._type === 'image' && value.asset?._type === 'reference' && typeof value.asset._ref === 'string' && /^image-[a-f0-9]+-\d+x\d+-[a-z0-9]+$/.test(value.asset._ref));
}

function safeSanityImageUrl(value?: string) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io' && url.pathname.startsWith('/images/') ? url.toString() : undefined; } catch { return undefined; }
}
