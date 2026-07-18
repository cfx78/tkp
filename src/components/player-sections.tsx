'use client';

import Link from 'next/link';
import { ArrowUpRight, FileAudio, LoaderCircle, Maximize2, Pause, Play, Shuffle } from 'lucide-react';
import { BeatLibrary } from './beat-library';
import { PlaybackQueue } from './playback-queue';
import { PlaybackHistorySections } from './playback-history-sections';
import { MediaArtwork, ProtocolLabel, SectionHeading } from './presentation-primitives';
import { usePlayer } from './player-provider';
import { BeatArtwork, useBeatArtworkUrl } from './beat-artwork';
import type { PlayerBeat, PlayerLane, PlayerRelease } from '@/src/types/player';
import { SensitiveSanityArtwork } from './sensitive-sanity-artwork';
import { SensitiveNavigationBoundary, useSensitiveAction } from './content-warning-action';

type Props = { mainLibrary: PlayerBeat[]; allBeats: PlayerBeat[]; recentlyAdded: PlayerBeat[]; releases: PlayerRelease[]; lanes: PlayerLane[] };

export function PlayerSections({ mainLibrary, allBeats, recentlyAdded, releases, lanes }: Props) {
  const player = usePlayer();
  const current = player.beat;
  const cover = useBeatArtworkUrl(current);
  const currentSlug = current?.sourceType === 'version' ? current.parentBeatSlug : current?.slug;
  const shuffleMain = () => {
    const shuffled = [...mainLibrary];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    if (shuffled.length > 1 && shuffled[0]._id === player.beat?._id) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    void player.playQueue(shuffled, { type: 'main-library', title: 'Main Library · Shuffled' }, 0, true);
  };

  return <div className="flex flex-col gap-[clamp(3.5rem,10vw,7rem)]">
    <section className="border-b border-[var(--line-subtle)] pb-12 pt-3">
      <ProtocolLabel>Player</ProtocolLabel><h1 className="type-display mt-4">Beats</h1>
      {current ? <div className="mt-10 grid items-center gap-7 sm:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)] sm:gap-10">
        <div className="relative mx-auto w-full max-w-56 sm:mx-0"><div aria-hidden="true" className="absolute inset-[20%] -z-10 bg-[var(--artwork-halo)] blur-3xl" /><MediaArtwork src={cover} size="feature" className="w-full max-w-none shadow-[var(--artwork-bloom)]" /></div>
        <div className="min-w-0"><p className="type-metadata">Current media</p><h2 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">{current.title}</h2><p className="type-small mt-3 break-words">{current.sourceType === 'version' ? `Context · ${current.parentBeatTitle}` : current.lane?.name || 'Unassigned lane'}</p><div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"><Link href="/player/now-playing" className="text-cta focusable-surface"><Maximize2 className="h-4 w-4" /> Now Playing</Link>{currentSlug ? <Link href={`/player/beats/${currentSlug}`} className="editorial-link focusable-surface"><FileAudio className="h-4 w-4" /> Beat File</Link> : null}</div></div>
      </div> : <div className="mt-10 max-w-xl border-l border-[var(--line-subtle)] pl-4"><p className="text-lg font-semibold text-[var(--text-primary)]">The archive is quiet.</p><p className="type-small mt-2">Choose a Beat below or let the Main Library decide.</p></div>}
      <button type="button" onClick={shuffleMain} disabled={!mainLibrary.length} className="action-control focusable-surface mt-8"><Shuffle className="h-4 w-4" /> Shuffle Main Library</button>
    </section>
    <PlaybackHistorySections />
    <RecentlyAdded beats={recentlyAdded} />
    <Library title="Main Library" label="Primary archive" beats={mainLibrary} type="main-library" />
    <Releases releases={releases} />
    <Library title="All Beats" label="Complete playable archive" beats={allBeats} type="all-beats" />
    <PlaybackQueue />
    <Lanes lanes={lanes} />
  </div>;
}

function RecentlyAdded({ beats }: { beats: PlayerBeat[] }) { const player = usePlayer(); return <section className="min-w-0"><SectionHeading label="Recently Added" title="New to the archive" /><div className="mt-5 border-t border-[var(--line-subtle)]">{beats.length ? beats.map((beat, index) => <TrackRow key={beat._id} beat={beat} index={index} active={player.beat?._id === beat._id} onPlay={() => player.beat?._id === beat._id ? void player.togglePlayback() : void player.selectBeat(beat, beats, { type: 'manual', title: 'Recently Added' })} loading={player.beat?._id === beat._id && player.isLoading} playing={player.beat?._id === beat._id && player.isPlaying} />) : <p className="type-small border-b border-[var(--line-subtle)] py-6">No recently added Beats.</p>}</div></section>; }
function TrackRow({ beat, index, active, onPlay, loading, playing }: { beat: PlayerBeat; index: number; active: boolean; onPlay: () => void; loading: boolean; playing: boolean }) { return <article aria-current={active ? 'true' : undefined} className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line-subtle)] py-3 sm:grid-cols-[2rem_auto_minmax(0,1fr)_auto] sm:gap-4 ${active ? 'bg-[var(--surface-active)] shadow-[inset_2px_0_0_var(--accent)]' : ''}`}><span className="type-numeric hidden text-center sm:block">{String(index + 1).padStart(2, '0')}</span><BeatArtwork beat={beat} size="compact" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="hover:text-[var(--accent)]">{beat.title}</Link> : beat.title}</p><p className="type-metadata mt-1 truncate">{beat.lane?.name || 'Unassigned lane'} · {beat.status || `Track ${index + 1}`}</p>{active ? <span className="type-protocol-label mt-1 block text-[9px]">Current</span> : null}</div><button type="button" onClick={onPlay} disabled={loading} aria-label={`${playing ? 'Pause' : 'Play'} ${beat.title}`} className="icon-control focusable-surface">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}</button></article>; }
function Releases({ releases }: { releases: PlayerRelease[] }) { return <section><SectionHeading label="Collections" title="Releases" /><div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2">{releases.length ? releases.map((release, index) => <ReleaseCard key={release._id} release={release} index={index} />) : <p className="type-small border-y border-[var(--line-subtle)] py-6">No releases have been published.</p>}</div></section>; }
function ReleaseCard({ release, index }: { release: PlayerRelease; index: number }) { const player = usePlayer(); const identity = { id: release._id, type: 'release' as const, nsfw: release.nsfw, nsfwReason: release.nsfwReason, title: release.title }; const { run } = useSensitiveAction(identity, 'play this release'); return <SensitiveNavigationBoundary identity={identity}><article className={`min-w-0 ${index % 2 ? 'sm:pt-12' : ''}`}><SensitiveSanityArtwork identity={identity} source={release.coverArt} fallbackUrl={release.coverArtUrl} size="feature" className="w-full max-w-none shadow-none" /><ProtocolLabel className="mt-4 text-[var(--text-muted)]">{release.releaseType || 'Release'}</ProtocolLabel><h3 className="mt-2 truncate text-xl font-semibold text-[var(--text-primary)]">{release.slug ? <Link href={`/releases/${release.slug}`} className="focusable-surface hover:text-[var(--accent)]">{release.title}</Link> : release.title}</h3><p className="type-metadata mt-2">{release.beats.length ? `${release.beats.length} playable tracks` : 'No playable tracks'}</p><div className="mt-4 flex flex-wrap items-center gap-x-5"><button type="button" disabled={!release.beats.length} onClick={() => void run(() => player.playQueue(release.beats, { type: 'release', title: release.title }, 0, false))} className="action-control focusable-surface"><Play className="h-4 w-4" fill="currentColor" /> {release.beats.length ? 'Play Release' : 'Release unavailable'}</button>{release.slug ? <Link href={`/releases/${release.slug}`} className="editorial-link focusable-surface">Open Release <ArrowUpRight className="h-4 w-4" /></Link> : null}</div></article></SensitiveNavigationBoundary>; }
function Lanes({ lanes }: { lanes: PlayerLane[] }) { const player = usePlayer(); return <section><SectionHeading label="Sound categories" title="Lanes" /><div className="mt-6 border-t border-[var(--line-subtle)]">{lanes.length ? lanes.map((lane, index) => <article key={lane._id} className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-[var(--line-subtle)] py-6 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"><MediaArtwork src={lane.coverArtUrl} size="row" className="h-12 w-12 sm:h-16 sm:w-16" /><div className="min-w-0"><ProtocolLabel className="text-[var(--text-muted)]">Lane {String(index + 1).padStart(2, '0')}</ProtocolLabel><h3 className="mt-2 truncate text-lg font-semibold text-[var(--text-primary)]">{lane.slug ? <Link href={`/lanes/${lane.slug}`} className="focusable-surface hover:text-[var(--accent)]">{lane.name}</Link> : lane.name}</h3><p className="type-small mt-1 line-clamp-2">{lane.plainDescription || 'Sound archive'}</p><p className="type-metadata mt-2">{lane.beats.length ? `${lane.beats.length} playable Beats` : 'No playable Beats'}</p></div><div className="col-start-2 flex flex-wrap items-center gap-x-5 sm:col-auto">{lane.beats.length ? <button type="button" onClick={() => void player.playQueue(lane.beats, { type: 'lane', title: lane.name }, 0, false)} aria-label={`Play lane ${lane.name}`} className="action-control focusable-surface" style={{ borderColor: lane.accentColor }}><Play className="h-4 w-4" fill="currentColor" /> Play Lane</button> : <button type="button" disabled className="action-control"><Play className="h-4 w-4" /> Lane unavailable</button>}{lane.slug ? <Link href={`/lanes/${lane.slug}`} className="editorial-link focusable-surface">Open Lane <ArrowUpRight className="h-4 w-4" /></Link> : null}</div></article>) : <p className="type-small border-b border-[var(--line-subtle)] py-6">No Lanes have been published.</p>}</div></section>; }
function Library({ title, label, beats, type }: { title: string; label: string; beats: PlayerBeat[]; type: 'main-library' | 'all-beats' }) { return <section className="min-w-0"><SectionHeading label={label} title={title} /><div className="mt-5"><BeatLibrary beats={beats} contextType={type} contextTitle={title} /></div></section>; }
