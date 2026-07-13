'use client';

import { LoaderCircle, Pause, Play } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function HomeBeatPlay({ beat }: { beat: PlayerBeat }) {
  const player = usePlayer();
  const active = player.beat?._id === beat._id;
  const play = () => active ? void player.togglePlayback() : void player.selectBeat(beat, [beat], { type: 'manual', title: 'Latest Beat' });
  return <button type="button" onClick={play} disabled={active && player.isLoading} className="focusable-surface inline-flex min-h-11 items-center gap-2 border border-[var(--line-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/[0.06] disabled:opacity-50" aria-label={`${active && player.isPlaying ? 'Pause' : 'Play'} ${beat.title}`}>{active && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : active && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}<span>{active && player.isPlaying ? 'Pause' : active ? 'Resume' : 'Play Beat'}</span></button>;
}
