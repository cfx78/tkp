'use client';

import { LoaderCircle, Pause, Play } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

export function BeatLibrary({ beats, contextType, contextTitle }: { beats: PlayerBeat[]; contextType: 'main-library' | 'all-beats'; contextTitle: string }) {
  const player = usePlayer();

  if (!beats.length) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-mist/60">No playable Beats have been published yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {beats.map((beat) => {
        const selected = player.beat?._id === beat._id;
        const cover = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;
        return (
          <article key={beat._id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cobalt/40 to-ember/30">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-white">{beat.title}</h3>
              <p className="mt-1 truncate text-xs text-mist/55">{beat.lane?.name || 'Unassigned lane'}</p>
              {beat.releases?.[0] ? <p className="mt-1 truncate text-xs text-cobalt">{beat.releases[0].title}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => selected ? void player.togglePlayback() : void player.selectBeat(beat, beats, { type: contextType, title: contextTitle })}
              disabled={selected && player.isLoading}
              aria-label={`${selected && player.isPlaying ? 'Pause' : 'Play'} ${beat.title}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              {selected && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : selected && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
            </button>
          </article>
        );
      })}
    </div>
  );
}
