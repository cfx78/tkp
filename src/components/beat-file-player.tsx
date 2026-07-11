'use client';
import Link from 'next/link';
import { LoaderCircle, Pause, Play, SquareArrowOutUpRight } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function BeatFilePlayer({ beat }: { beat: PlayerBeat }) {
  const player = usePlayer(); const active = player.beat?._id === beat._id;
  const label = active && player.isPlaying ? 'Pause' : active ? 'Resume' : 'Play Beat';
  const activate = () => active ? void player.togglePlayback() : void player.selectBeat(beat, [beat], { type: 'manual', title: 'Beat File' });
  return <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={activate} disabled={active && player.isLoading} className="inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-ink disabled:opacity-50">{active && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : active && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}{label}</button>{active ? <Link href="/player/now-playing" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white"><SquareArrowOutUpRight className="h-4 w-4" /> Now Playing</Link> : null}</div>;
}
