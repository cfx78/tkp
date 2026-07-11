'use client';

import { ListMusic, Play, Shuffle } from 'lucide-react';
import { BeatLibrary } from './beat-library';
import { usePlayer } from './player-provider';
import type { PlayerBeat, PlayerRelease } from '@/src/types/player';

export function PlayerSections({ mainLibrary, allBeats, releases }: { mainLibrary: PlayerBeat[]; allBeats: PlayerBeat[]; releases: PlayerRelease[] }) {
  const player = usePlayer();
  const shuffleMain = () => {
    const shuffled = [...mainLibrary];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    if (shuffled.length > 1 && shuffled[0]._id === player.beat?._id) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    void player.playQueue(shuffled, { type: 'main-library', title: 'Main Library · Shuffled' }, 0, true);
  };
  return <>
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
      <p className="text-[11px] uppercase tracking-[0.32em] text-cobalt">Player library</p><h1 className="mt-3 text-3xl font-semibold text-white">Beats</h1>
      <p className="mt-3 text-sm leading-7 text-mist/70">Private R2 listening copies, delivered with temporary signed playback access.</p>
      <button type="button" onClick={shuffleMain} disabled={!mainLibrary.length} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"><Shuffle className="h-4 w-4" /> Shuffle Main Library</button>
    </section>
    <Library title="Main Library" beats={mainLibrary} type="main-library" />
    <section><h2 className="text-xl font-semibold text-white">Releases</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{releases.length ? releases.map((release) => <article key={release._id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><Artwork url={release.coverArtUrl} size="h-20 w-20" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[0.2em] text-cobalt">{release.releaseType || 'Release'}</p><h3 className="mt-1 truncate font-semibold text-white">{release.title}</h3><p className="mt-1 text-xs text-mist/55">{release.beats.length} playable tracks</p><button type="button" disabled={!release.beats.length} onClick={() => void player.playQueue(release.beats, { type: 'release', title: release.title })} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white disabled:opacity-35"><Play className="h-4 w-4" fill="currentColor" /> Play Release</button></div></article>) : <Empty text="No releases have been published." />}</div></section>
    <Library title="All Beats" beats={allBeats} type="all-beats" />
    <Queue />
  </>;
}
function Library({ title, beats, type }: { title: string; beats: PlayerBeat[]; type: 'main-library' | 'all-beats' }) { return <section><h2 className="text-xl font-semibold text-white">{title}</h2><div className="mt-3"><BeatLibrary beats={beats} contextType={type} contextTitle={title} /></div></section>; }
function Queue() { const p = usePlayer(); if (!p.queue.length) return null; return <section className="rounded-[1.75rem] border border-white/10 bg-[#0a0d14] p-5"><div className="flex items-center gap-2 text-cobalt"><ListMusic className="h-4 w-4" /><p className="text-[11px] uppercase tracking-[0.25em]">Queue · {p.context?.title}</p></div><h2 className="mt-3 text-xl font-semibold text-white">Now Playing</h2>{p.beat ? <QueueRow beat={p.beat} active onClick={() => void p.selectQueueIndex(p.currentIndex)} /> : null}{p.currentIndex < p.queue.length - 1 ? <><h3 className="mt-5 text-sm font-semibold text-mist/60">Up Next</h3>{p.queue.slice(p.currentIndex + 1).map((beat, offset) => <QueueRow key={beat._id} beat={beat} onClick={() => void p.selectQueueIndex(p.currentIndex + offset + 1)} />)}</> : <p className="mt-4 text-sm text-mist/50">End of queue</p>}</section>; }
function QueueRow({ beat, active, onClick }: { beat: PlayerBeat; active?: boolean; onClick: () => void }) { const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl; return <button type="button" onClick={onClick} className={`mt-3 flex w-full items-center gap-3 rounded-xl p-2 text-left ${active ? 'bg-white/10 ring-1 ring-cobalt/50' : 'hover:bg-white/5'}`}><Artwork url={cover} size="h-11 w-11" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{beat.title}</span><span className="block truncate text-xs text-mist/50">{beat.lane?.name || 'Unassigned lane'}</span></span>{active ? <span className="text-[10px] uppercase tracking-wider text-cobalt">Current</span> : null}</button>; }
function Artwork({ url, size }: { url?: string; size: string }) { return <span className={`${size} block shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cobalt/40 to-ember/30`}>{url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}</span>; }
function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-mist/60">{text}</p>; }
