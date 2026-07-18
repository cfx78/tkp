'use client';
import Link from 'next/link';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import { BeatArtwork } from './beat-artwork';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function BeatLibrary({ beats, contextType, contextTitle }: { beats: PlayerBeat[]; contextType: 'main-library' | 'all-beats'; contextTitle: string }) {
  const player = usePlayer();
  if (!beats.length) return <p className="type-small border-y border-[var(--line-subtle)] py-6">No playable Beats have been published yet.</p>;
  return <div className="border-t border-[var(--line-subtle)]">{beats.map((beat, index) => { const selected = player.beat?._id === beat._id; return <article key={beat._id} className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line-subtle)] py-3 sm:grid-cols-[2rem_auto_minmax(0,1fr)_auto] sm:gap-4 ${selected ? 'bg-white/[0.025] shadow-[inset_2px_0_0_var(--accent)]' : ''}`}>
    <span className="type-numeric hidden w-7 text-center sm:block">{String(index + 1).padStart(2, '0')}</span>{beat.slug ? <Link href={`/player/beats/${beat.slug}`} aria-label={`Open Beat File for ${beat.title}`} className="artwork-link focusable-surface"><BeatArtwork beat={beat} size="row" /></Link> : <BeatArtwork beat={beat} size="row" />}
    <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[var(--text-primary)] sm:text-base">{beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="metadata-link focusable-surface">{beat.title}</Link> : beat.title}</h3><p className="type-metadata mt-1 truncate">{beat.lane?.name || 'Unassigned lane'}{beat.releases?.[0] ? ` · ${beat.releases[0].title}` : ''}</p>{selected ? <span className="type-protocol-label mt-1 block text-[9px]">Current</span> : null}</div>
    <button type="button" onClick={() => selected ? void player.togglePlayback() : void player.selectBeat(beat, beats, { type: contextType, title: contextTitle })} disabled={selected && player.isLoading} aria-label={`${selected && player.isPlaying ? 'Pause' : 'Play'} ${beat.title}`} className="icon-control focusable-surface">{selected && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : selected && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}</button>
  </article>; })}</div>;
}
