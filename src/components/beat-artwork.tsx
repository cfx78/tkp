'use client';

import type { SanityImageSource } from '@sanity/image-url';
import { urlFor } from '@/src/sanity/lib/image';
import type { PlayerBeat } from '@/src/types/player';
import { beatArtworkDecision } from '@/src/lib/beat-artwork';
import { useContentApproval } from './content-warning-provider';
import { MediaArtwork } from './presentation-primitives';

type ArtworkBeat = Pick<PlayerBeat, '_id' | 'nsfw' | 'coverArt' | 'coverArtUrl' | 'lane'>;

export function useBeatArtworkUrl(beat?: ArtworkBeat | null) {
  const approved = useContentApproval('beat', beat?._id);
  return resolveBeatArtworkUrl(beat, approved);
}

export function BeatArtwork({ beat, alt = '', size = 'row', className }: { beat: ArtworkBeat; alt?: string; size?: 'compact' | 'row' | 'feature'; className?: string }) {
  return <MediaArtwork src={useBeatArtworkUrl(beat)} alt={alt} size={size} className={className} />;
}

export function resolveBeatArtworkUrl(beat: ArtworkBeat | null | undefined, approved: boolean, buildCanonical = canonicalBeatArtworkUrl) {
  const decision = beatArtworkDecision(beat, approved);
  return decision?.kind === 'canonical' ? buildCanonical(decision.source) : decision?.url;
}

export function canonicalBeatArtworkUrl(source?: PlayerBeat['coverArt']) {
  if (!source) return undefined;
  try { return urlFor(source as SanityImageSource).width(1200).height(1200).fit('crop').auto('format').url(); } catch { return undefined; }
}
