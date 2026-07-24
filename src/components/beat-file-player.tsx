'use client';

import Link from 'next/link';
import { LoaderCircle, Pause, Play, SquareArrowOutUpRight } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function BeatFilePlayer({ beat }: { beat: PlayerBeat }) {
  const player = usePlayer();
  const active = player.beat?._id === beat._id;
  const label = active && player.isPlaying ? 'Pause' : active ? 'Resume' : 'Play Main Beat';
  const activate = () => active ? void player.togglePlayback() : void player.selectBeat(beat, [beat], { type: 'manual', title: 'Beat File' });
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
    <button type="button" onClick={activate} disabled={active && player.isLoading} className="action-control focusable-surface">{active && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : active && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}{label}</button>
    {active ? <><span className="type-protocol-label">Current Main Beat</span><Link href="/player/now-playing" className="editorial-link focusable-surface"><SquareArrowOutUpRight className="h-4 w-4" /> Now Playing</Link></> : null}
  </div>;
}
