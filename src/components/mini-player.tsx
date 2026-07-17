'use client';

import Link from 'next/link';
import { LoaderCircle, Maximize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from './player-provider';

export function MiniPlayer() {
  const { beat, isLoading, isPlaying, isQueueComplete, currentTime, duration, error, togglePlayback, seek, previous, next, hasPrevious, hasNext } = usePlayer();
  if (!beat) return null;

  const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;
  const progress = duration > 0 ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0;
  const artwork = <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-[var(--radius-subtle)] bg-[var(--bg-2)]">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}</span>;

  return (
    <aside className="mini-player-shell shell-material fixed inset-x-0 bottom-[var(--mini-player-offset)] z-40 mx-auto max-w-xl border-x border-t px-1 pb-1 pt-1 sm:px-2" aria-label="Mini player">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center">
        <div className="flex min-w-0 items-center gap-1.5">
          {beat.slug ? <Link href={`/player/beats/${beat.slug}`} aria-label={`Open Beat File for ${beat.title}`} className="focusable-surface shrink-0">{artwork}</Link> : artwork}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--text-primary)] sm:text-sm">{beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="focusable-surface">{beat.title}</Link> : beat.title}</p>
            <p className="type-metadata mt-0.5 truncate text-[9px] sm:text-[10px]">{isQueueComplete ? 'Queue complete' : beat.sourceType === 'version' ? `Context · ${beat.lane?.name || 'Unassigned lane'}` : beat.lane?.name || 'Unassigned lane'}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <Control label="Previous Beat" onClick={() => void previous()} disabled={!hasPrevious && currentTime <= 3}><SkipBack className="h-4 w-4" fill="currentColor" /></Control>
          <Control label={isPlaying ? 'Pause' : 'Play'} onClick={() => void togglePlayback()} disabled={isLoading} primary>{isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}</Control>
          <Control label="Next Beat" onClick={() => void next()} disabled={!hasNext}><SkipForward className="h-4 w-4" fill="currentColor" /></Control>
          <Link href="/player/now-playing" aria-label="Open Now Playing" className="focusable-surface grid h-11 w-11 place-items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><Maximize2 className="h-4 w-4" /></Link>
        </div>
      </div>
      <div className="mini-player-scrubber relative">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/15"><span className="block h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} /></div>
        <input className="mini-player-scrubber-input absolute inset-0 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" type="range" min={0} max={duration || 0} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Playback progress" disabled={!duration} />
      </div>
      {error ? <p className="px-1 pb-1 text-xs text-[var(--danger)]">{error}</p> : null}
    </aside>
  );
}

function Control({ label, onClick, disabled, primary, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={`focusable-surface grid h-11 w-11 place-items-center disabled:text-[var(--text-muted)] disabled:opacity-40 ${primary ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{children}</button>;
}
