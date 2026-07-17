'use client';

import Link from 'next/link';
import { ListMusic, Play, RotateCcw, Shuffle } from 'lucide-react';
import { ProtocolLabel } from './presentation-primitives';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function PlaybackQueue({ compact = false }: { compact?: boolean }) {
  const player = usePlayer();
  if (!player.queue.length) return <p className="type-small border-y border-[var(--line-subtle)] py-6">Your queue is empty. Choose a Beat or Release from the Player.</p>;
  const upcoming = player.queue.slice(player.currentIndex + 1);
  return <section className={compact ? '' : 'border-t border-[var(--line-subtle)] pt-5'}>
    <div className="flex items-center gap-2"><ListMusic className="h-4 w-4 text-[var(--accent)]" /><ProtocolLabel>Queue · {player.context?.title}</ProtocolLabel></div>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-3"><h2 className="type-section-heading">Listening sequence</h2><span className="type-numeric">{player.currentIndex + 1} / {player.queue.length}</span></div>
    <div className="mt-5 border-t border-[var(--line-subtle)]">{player.beat ? <QueueRow beat={player.beat} active onClick={() => void player.selectQueueIndex(player.currentIndex)} /> : null}{upcoming.length ? <>{upcoming.map((beat, offset) => <QueueRow key={`${beat._id}-${offset}`} beat={beat} position={player.currentIndex + offset + 2} onClick={() => void player.selectQueueIndex(player.currentIndex + offset + 1)} />)}</> : <p className="type-small border-b border-[var(--line-subtle)] py-5">{player.isQueueComplete ? 'Queue complete' : 'End of queue'}</p>}</div>
    {player.isQueueComplete ? <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void player.replayQueue()} className="action-control focusable-surface"><RotateCcw className="h-4 w-4" /> Replay Queue</button>{player.context?.type === 'main-library' ? <button type="button" onClick={() => void player.shuffleAgain()} className="action-control focusable-surface"><Shuffle className="h-4 w-4" /> Shuffle Again</button> : null}</div> : null}
  </section>;
}

function QueueRow({ beat, active, position, onClick }: { beat: PlayerBeat; active?: boolean; position?: number; onClick: () => void }) {
  const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;
  const slug = beat.sourceType === 'version' ? beat.parentBeatSlug : beat.slug;
  const artwork = <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)]">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}</span>;
  return <article aria-current={active ? 'true' : undefined} className={`grid min-h-16 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line-subtle)] py-3 ${active ? 'bg-[var(--surface-active)] shadow-[inset_2px_0_0_var(--accent)]' : ''}`}>
    {slug ? <Link href={`/player/beats/${slug}`} aria-label={`Open Beat File for ${beat.parentBeatTitle || beat.title}`} className="artwork-link focusable-surface">{artwork}</Link> : artwork}
    <div className="min-w-0">{slug ? <Link href={`/player/beats/${slug}`} className="metadata-link focusable-surface block truncate text-sm font-semibold text-[var(--text-primary)]">{beat.title}</Link> : <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{beat.title}</span>}<span className="type-metadata mt-1 block truncate">{active ? 'Current · ' : position ? `${String(position).padStart(2, '0')} · ` : ''}{beat.sourceType === 'version' ? `${beat.versionType || 'Context'} · ${beat.parentBeatTitle}` : beat.lane?.name || 'Unassigned lane'}</span></div>
    <button type="button" onClick={onClick} className="icon-control focusable-surface" aria-label={`${active ? 'Restart' : 'Play'} ${beat.title}`}><Play className="h-4 w-4" fill="currentColor" /></button>
  </article>;
}
