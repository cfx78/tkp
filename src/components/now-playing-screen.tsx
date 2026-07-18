'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Expand, FileAudio, ListMusic, LoaderCircle, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { ListeningMode } from './listening-mode';
import { PlaybackQueue } from './playback-queue';
import { ProtocolLabel } from './presentation-primitives';
import { usePlayer } from './player-provider';
import { useBeatArtworkUrl } from './beat-artwork';

function time(value: number) { if (!Number.isFinite(value)) return '0:00'; return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`; }

export function NowPlayingScreen() {
  const router = useRouter();
  const player = usePlayer();
  const beat = player.beat;
  const cover = useBeatArtworkUrl(beat);
  const [isListeningModeOpen, setListeningModeOpen] = useState(false);
  const listeningModeEntryRef = useRef<HTMLButtonElement>(null);
  const closeListeningMode = useCallback(() => { setListeningModeOpen(false); requestAnimationFrame(() => listeningModeEntryRef.current?.focus()); }, []);

  if (!beat) return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center"><ProtocolLabel>Now Playing</ProtocolLabel><h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">Nothing queued yet</h1><p className="type-small mt-3">Choose a Beat, Release, or Main Library shuffle to begin.</p><Link href="/player" className="text-cta focusable-surface mt-7">Open Player</Link></main>;

  const RepeatIcon = player.repeatMode === 'one' ? Repeat1 : Repeat;
  const progress = player.duration > 0 ? Math.min(100, Math.max(0, player.currentTime / player.duration * 100)) : 0;
  const slug = beat.sourceType === 'version' ? beat.parentBeatSlug : beat.slug;
  return <>
    <main inert={isListeningModeOpen ? true : undefined} aria-hidden={isListeningModeOpen ? true : undefined} className="mx-auto w-full max-w-[var(--player-measure)] pb-8">
      <header className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center border-b border-[var(--line-subtle)] pb-3"><button type="button" onClick={() => window.history.length > 1 ? router.back() : router.push('/player')} className="icon-control focusable-surface" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0 px-4 text-center"><ProtocolLabel>Now Playing</ProtocolLabel><p className="type-metadata mt-1 truncate">{player.context?.title}</p></div><span aria-hidden="true" /></header>
      <section className="mx-auto mt-10 max-w-lg"><div className="relative mx-auto max-w-md"><div aria-hidden="true" className="absolute inset-[18%] -z-10 bg-[var(--artwork-halo)] blur-3xl" /><div className="aspect-square overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] shadow-[var(--artwork-bloom)]">{cover ? <img src={cover} alt={`Artwork for ${beat.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ListMusic className="h-16 w-16 text-white/15" /></div>}</div></div>
        <div className="mt-9">{beat.sourceType === 'version' ? <ProtocolLabel>Context · {beat.versionType || 'Version'}</ProtocolLabel> : <ProtocolLabel>Main Beat</ProtocolLabel>}<h1 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)] sm:text-4xl">{beat.title}</h1><p className="type-small mt-2">{beat.lane?.name || 'Unassigned lane'}{beat.sourceType === 'version' && beat.parentBeatTitle ? ` · From ${beat.parentBeatTitle}` : player.context?.type === 'release' ? ` · ${player.context.title}` : ''}</p><p className="type-protocol-label mt-2 text-[9px]">{player.isLoading ? 'Loading' : player.isPlaying ? 'Playing' : player.isQueueComplete ? 'Complete' : 'Paused'}</p></div>
        <div className="mt-8"><div className="relative h-5"><div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10"><span className="block h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} /></div><input type="range" min={0} max={player.duration || 0} step={0.1} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} disabled={!player.duration} aria-label="Playback progress" className="absolute inset-x-0 -top-3 h-11 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" /></div><div className="flex justify-between type-numeric"><span>{time(player.currentTime)}</span><span>{time(player.duration)}</span></div></div>
        <div className="mt-7 grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-1"><button type="button" onClick={player.cycleRepeatMode} className={`focusable-surface grid min-h-11 min-w-11 place-items-center justify-self-start ${player.repeatMode === 'off' ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}`} aria-label={`Repeat ${player.repeatMode}`} aria-pressed={player.repeatMode !== 'off'}><RepeatIcon className="h-5 w-5" /><span className="type-numeric text-[8px]">{player.repeatMode}</span></button><Transport label="Previous Beat" onClick={() => void player.previous()} disabled={!player.hasPrevious && player.currentTime <= 3}><SkipBack className="h-5 w-5" fill="currentColor" /></Transport><button type="button" onClick={() => void player.togglePlayback()} disabled={player.isLoading} className="focusable-surface grid h-14 w-14 place-items-center rounded-[var(--radius-interactive)] border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-0)] disabled:opacity-50" aria-label={player.isPlaying ? 'Pause' : 'Play'}>{player.isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : player.isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}</button><Transport label="Next Beat" onClick={() => void player.next()} disabled={!player.hasNext}><SkipForward className="h-5 w-5" fill="currentColor" /></Transport><span className={`grid min-h-11 min-w-11 place-items-center justify-self-end ${player.shuffle ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title={player.shuffle ? 'Shuffled queue' : 'Queue is not shuffled'}><Shuffle className="h-5 w-5" /><span className="type-numeric text-[8px]">{player.shuffle ? 'on' : 'off'}</span></span></div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"><button ref={listeningModeEntryRef} type="button" onClick={() => setListeningModeOpen(true)} className="action-control focusable-surface" aria-label="Open Listening Mode"><Expand className="h-4 w-4" /> Listening Mode</button>{slug ? <Link href={`/player/beats/${slug}`} className="editorial-link focusable-surface"><FileAudio className="h-4 w-4" /> Beat File</Link> : <span className="type-small">Beat File unavailable</span>}</div>
        {player.error ? <p className="type-small mt-5 text-[var(--danger)]">{player.error}</p> : null}
      </section>
      <section className="mx-auto mt-[clamp(4rem,12vw,8rem)] max-w-2xl"><PlaybackQueue compact /></section>
    </main>
    {isListeningModeOpen ? <ListeningMode onClose={closeListeningMode} /> : null}
  </>;
}

function Transport({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) { return <button type="button" onClick={onClick} disabled={disabled} className="icon-control focusable-surface h-12 w-12" aria-label={label}>{children}</button>; }
