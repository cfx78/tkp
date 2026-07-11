'use client';

import Link from 'next/link';
import { LoaderCircle, Maximize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from './player-provider';

export function MiniPlayer() {
  const { beat, isLoading, isPlaying, isQueueComplete, currentTime, duration, error, togglePlayback, seek, previous, next, hasPrevious, hasNext } = usePlayer();
  if (!beat) return null;

  const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;

  return (
    <aside className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0a0d14]/95 p-3 shadow-[0_-14px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cobalt/40 to-ember/30">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{beat.title}</p>
          <p className="truncate text-xs text-mist/55">{isQueueComplete ? 'Queue complete' : beat.lane?.name || 'Unassigned lane'}</p>
        </div>
        <button type="button" onClick={() => void previous()} disabled={!hasPrevious && currentTime <= 3} aria-label="Previous Beat" className="grid h-9 w-9 place-items-center text-white disabled:text-mist/25"><SkipBack className="h-4 w-4" fill="currentColor" /></button>
        <button type="button" onClick={() => void togglePlayback()} disabled={isLoading} aria-label={isPlaying ? 'Pause' : 'Play'} className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink disabled:opacity-50">
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
        </button>
        <button type="button" onClick={() => void next()} disabled={!hasNext} aria-label="Next Beat" className="grid h-9 w-9 place-items-center text-white disabled:text-mist/25"><SkipForward className="h-4 w-4" fill="currentColor" /></button>
        <Link href="/player/now-playing" aria-label="Open Now Playing" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-mist/70 transition hover:bg-white/10 hover:text-white">
          <Maximize2 className="h-4 w-4" />
        </Link>
      </div>
      <input
        className="mt-2 h-1 w-full cursor-pointer accent-cobalt"
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(event) => seek(Number(event.target.value))}
        aria-label="Playback progress"
        disabled={!duration}
      />
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </aside>
  );
}
