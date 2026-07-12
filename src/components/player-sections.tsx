'use client';

import { Play, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { BeatLibrary } from './beat-library';
import { PlaybackQueue } from './playback-queue';
import { usePlayer } from './player-provider';
import { PlaybackHistorySections } from './playback-history-sections';
import type { PlayerBeat, PlayerRelease } from '@/src/types/player';

export function PlayerSections({ mainLibrary, allBeats, recentlyAdded, releases }: { mainLibrary: PlayerBeat[]; allBeats: PlayerBeat[]; recentlyAdded: PlayerBeat[]; releases: PlayerRelease[] }) {
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
    <PlaybackHistorySections />
    <RecentlyAdded beats={recentlyAdded} />
    <Library title="Main Library" beats={mainLibrary} type="main-library" />
    <section><h2 className="text-xl font-semibold text-white">Releases</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{releases.length ? releases.map((release) => <article key={release._id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><Artwork url={release.coverArtUrl} size="h-20 w-20" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[0.2em] text-cobalt">{release.releaseType || 'Release'}</p><h3 className="mt-1 truncate font-semibold text-white">{release.title}</h3><p className="mt-1 text-xs text-mist/55">{release.beats.length ? `${release.beats.length} playable tracks` : 'No playable tracks'}</p><button type="button" disabled={!release.beats.length} onClick={() => void player.playQueue(release.beats, { type: 'release', title: release.title }, 0, false)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:text-mist/30"><Play className="h-4 w-4" fill="currentColor" /> {release.beats.length ? 'Play Release' : 'Release unavailable'}</button></div></article>) : <Empty text="No releases have been published." />}</div></section>
    <Library title="All Beats" beats={allBeats} type="all-beats" />
    <PlaybackQueue />
  </>;
}
function RecentlyAdded({ beats }: { beats: PlayerBeat[] }) { const player = usePlayer(); return <section className="min-w-0"><p className="text-[10px] uppercase tracking-[0.28em] text-cobalt">Recently Added</p><h2 className="mt-2 text-xl font-semibold text-white">New to the archive</h2><div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">{beats.length ? beats.map((beat) => { const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl; return <article key={beat._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"><Artwork url={cover} size="h-14 w-14" /><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-white">{beat.slug ? <Link href={`/player/beats/${beat.slug}`}>{beat.title}</Link> : beat.title}</h3><p className="truncate text-xs text-mist/50">{beat.lane?.name || 'Unassigned lane'} · {beat.status || 'Beat'}</p></div><button type="button" onClick={() => void player.selectBeat(beat, beats, { type: 'manual', title: 'Recently Added' })} aria-label={`Play ${beat.title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white"><Play className="h-4 w-4" fill="currentColor" /></button></article>; }) : <Empty text="No recently added Beats." />}</div></section>; }
function Library({ title, beats, type }: { title: string; beats: PlayerBeat[]; type: 'main-library' | 'all-beats' }) { return <section className="w-full min-w-0 max-w-full"><h2 className="text-xl font-semibold text-white">{title}</h2><div className="mt-3 w-full min-w-0 max-w-full"><BeatLibrary beats={beats} contextType={type} contextTitle={title} /></div></section>; }
function Artwork({ url, size }: { url?: string; size: string }) { return <span className={`${size} block shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cobalt/40 to-ember/30`}>{url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}</span>; }
function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-mist/60">{text}</p>; }
