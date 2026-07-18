'use client';

import Link from 'next/link';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import { MediaArtwork, ProtocolLabel } from './presentation-primitives';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';

const statusLabels: Record<string, string> = {
  main: 'Main',
  approvedDemo: 'Approved Demo',
  sketch: 'Sketch',
  roughMix: 'Rough Mix',
  alternateMix: 'Alternate Mix'
};

export function LaneDetailPlayer({ laneName, beats, description, accentColor }: { laneName: string; beats: PlayerBeat[]; description?: string; accentColor: string }) {
  const player = usePlayer();
  const laneIsCurrent = player.context?.type === 'lane'
    && player.queue.length === beats.length
    && player.queue.every((beat, index) => beat._id === beats[index]?._id);
  const firstBeatIsLoading = laneIsCurrent && player.currentIndex === 0 && player.isLoading;

  return <>
    {description ? <p className="type-reading">{description}</p> : <p className="type-small">This Lane is still being described.</p>}

    <button
      type="button"
      onClick={() => beats.length && void player.playQueue(beats, { type: 'lane', title: laneName }, 0, false)}
      disabled={!beats.length || firstBeatIsLoading}
      aria-label={`Play lane ${laneName}`}
      className="action-control focusable-surface mt-7"
      style={{ borderColor: accentColor }}
    >
      {firstBeatIsLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />}
      {beats.length ? 'Play Lane' : 'Lane unavailable'}
    </button>

    <section className="mt-[var(--section-rhythm)]" aria-labelledby="lane-beats-heading">
      <ProtocolLabel>Lane sequence</ProtocolLabel>
      <h2 id="lane-beats-heading" className="type-section-heading mt-2">Related Beats</h2>
      {beats.length ? <ol className="mt-5 border-t border-[var(--line-subtle)]">
        {beats.map((beat, index) => {
          const active = laneIsCurrent && player.beat?._id === beat._id;
          const playing = active && player.isPlaying;
          const loading = active && player.isLoading;
          const artwork = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;
          const playBeat = () => active
            ? void player.togglePlayback()
            : void player.playQueue(beats, { type: 'lane', title: laneName }, index, false);

          return <li key={beat._id}>
            <article
              aria-current={active ? 'true' : undefined}
              className={`grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-[var(--line-subtle)] py-4 transition-colors duration-[var(--motion-ui)] sm:grid-cols-[2rem_auto_minmax(0,1fr)_2.75rem] ${active ? 'bg-white/[0.035]' : ''}`}
              style={{ boxShadow: active ? `inset 2px 0 0 ${accentColor}` : undefined }}
            >
              <span className="type-numeric text-center">{String(index + 1).padStart(2, '0')}</span>
              <MediaArtwork src={artwork} size="compact" className="hidden sm:block" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                  {beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="metadata-link focusable-surface">{beat.title}</Link> : beat.title}
                </h3>
                <p className="type-metadata mt-1 truncate">{statusLabels[beat.status || ''] || 'Beat'}{beat.publishedAt ? ` · ${formatDate(beat.publishedAt)}` : ''}</p>
                {active ? <span className="type-protocol-label mt-1 block text-[9px]">Current · {loading ? 'Loading' : playing ? 'Playing' : 'Paused'}</span> : null}
              </div>
              <button
                type="button"
                onClick={playBeat}
                disabled={loading}
                aria-label={`${playing ? 'Pause' : active ? 'Resume' : 'Play'} ${beat.title}`}
                className="icon-control focusable-surface"
                style={{ borderColor: active ? accentColor : undefined }}
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
              </button>
            </article>
          </li>;
        })}
      </ol> : <p className="type-small mt-5 border-y border-[var(--line-subtle)] py-6">No playable Beats are available in this Lane.</p>}
    </section>
  </>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}
