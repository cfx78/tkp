'use client';
import Link from 'next/link';
import { ListMusic, RotateCcw, Shuffle } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function PlaybackQueue({ compact = false }: { compact?: boolean }) {
  const player = usePlayer();
  if (!player.queue.length) return <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-mist/55">Your queue is empty. Choose a Beat or Release from the Player.</p>;
  const upcoming = player.queue.slice(player.currentIndex + 1);
  return <section className={compact ? '' : 'rounded-[1.75rem] border border-white/10 bg-[#0a0d14] p-5'}>
    <div className="flex items-center gap-2 text-cobalt"><ListMusic className="h-4 w-4" /><p className="text-[11px] uppercase tracking-[0.22em]">Queue · {player.context?.title}</p></div>
    <h2 className="mt-3 text-xl font-semibold text-white">Now Playing</h2>
    {player.beat ? <QueueRow beat={player.beat} active onClick={() => void player.selectQueueIndex(player.currentIndex)} /> : null}
    {upcoming.length ? <><h3 className="mt-5 text-sm font-semibold text-mist/60">Up Next</h3>{upcoming.map((beat, offset) => <QueueRow key={`${beat._id}-${offset}`} beat={beat} onClick={() => void player.selectQueueIndex(player.currentIndex + offset + 1)} />)}</> : <p className="mt-4 text-sm text-mist/50">{player.isQueueComplete ? 'Queue complete' : 'End of queue'}</p>}
    {player.isQueueComplete ? <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void player.replayQueue()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Replay Queue</button>{player.context?.type === 'main-library' ? <button type="button" onClick={() => void player.shuffleAgain()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink"><Shuffle className="h-4 w-4" /> Shuffle Again</button> : null}</div> : null}
  </section>;
}
function QueueRow({ beat, active, onClick }: { beat: PlayerBeat; active?: boolean; onClick: () => void }) { const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl; const artwork = <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cobalt/40 to-ember/30">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}</span>; return <article className={`mt-3 flex min-h-14 w-full min-w-0 items-center gap-3 rounded-xl p-2 transition ${active ? 'bg-white/10 ring-1 ring-cobalt/50' : 'hover:bg-white/5'}`}>{beat.slug ? <Link href={`/player/beats/${beat.slug}`} aria-label={`Open Beat File for ${beat.title}`}>{artwork}</Link> : artwork}<span className="min-w-0 flex-1">{beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="block truncate text-sm font-semibold text-white hover:text-cobalt">{beat.title}</Link> : <span className="block truncate text-sm font-semibold text-white">{beat.title}</span>}<span className="block truncate text-xs text-mist/50">{beat.lane?.name || 'Unassigned lane'}</span></span><button type="button" onClick={onClick} className="min-h-11 shrink-0 rounded-full px-3 text-[10px] uppercase tracking-wider text-cobalt">{active ? 'Current' : 'Play'}</button></article>; }
