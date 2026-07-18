'use client';

import { ListMusic } from 'lucide-react';
import type { PlayerBeat } from '@/src/types/player';
import { useBeatArtworkUrl } from './beat-artwork';

export function BeatFileArtwork({ beat }: { beat: PlayerBeat }) {
  const artwork = useBeatArtworkUrl(beat);
  return <div className="aspect-square overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] shadow-[var(--artwork-bloom)]">{artwork ? <img src={artwork} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ListMusic className="h-14 w-14 text-white/15" /></div>}</div>;
}
