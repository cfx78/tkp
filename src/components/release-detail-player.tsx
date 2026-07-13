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

export function ReleaseDetailPlayer({ releaseTitle, beats, description }: { releaseTitle: string; beats: PlayerBeat[]; description?: string }) {
  const player = usePlayer();
  const releaseIsCurrent = player.context?.type === 'release'
    && player.queue.length === beats.length
    && player.queue.every((beat, index) => beat._id === beats[index]?._id);
  const firstTrackIsLoading = releaseIsCurrent && player.currentIndex === 0 && player.isLoading;

  const playRelease = () => {
    if (beats.length) void player.playQueue(beats, { type: 'release', title: releaseTitle }, 0, false);
  };

  return <>
    <button
      type="button"
      onClick={playRelease}
      disabled={!beats.length || firstTrackIsLoading}
      aria-label={`Play release ${releaseTitle}`}
      className="focusable-surface inline-flex min-h-11 items-center gap-3 bg-[var(--text-primary)] px-5 text-sm font-semibold text-[var(--bg-0)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
    >
      {firstTrackIsLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />}
      {beats.length ? 'Play Release' : 'Release unavailable'}
    </button>

    {description ? <p className="type-reading mt-7">{description}</p> : null}

    <section className="mt-[var(--section-rhythm)]" aria-labelledby="release-tracks-heading">
      <ProtocolLabel>Manual sequence</ProtocolLabel>
      <h2 id="release-tracks-heading" className="type-section-heading mt-2">Track list</h2>
      {beats.length ? <ol className="mt-5 border-t border-[var(--line-subtle)]">
        {beats.map((beat, index) => {
          const active = releaseIsCurrent && player.beat?._id === beat._id;
          const playing = active && player.isPlaying;
          const loading = active && player.isLoading;
          const artwork = beat.coverArtUrl || beat.lane?.fallbackCoverArtUrl;
          const playTrack = () => active
            ? void player.togglePlayback()
            : void player.playQueue(beats, { type: 'release', title: releaseTitle }, index, false);

          return <li key={beat._id}>
            <article
              aria-current={active ? 'true' : undefined}
              className={`grid min-w-0 grid-cols-[2rem_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line-subtle)] py-4 transition-colors duration-[var(--motion-ui)] ${active ? 'bg-[var(--surface-active)] shadow-[inset_2px_0_0_var(--accent)]' : ''}`}
            >
              <span className="type-numeric text-center">{String(index + 1).padStart(2, '0')}</span>
              <MediaArtwork src={artwork} size="compact" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                  {beat.slug ? <Link href={`/player/beats/${beat.slug}`} className="focusable-surface hover:text-[var(--accent)]">{beat.title}</Link> : beat.title}
                </h3>
                <p className="type-metadata mt-1 truncate">{beat.lane?.name || 'Unassigned lane'} · {statusLabels[beat.status || ''] || 'Beat'}</p>
                {active ? <span className="type-protocol-label mt-1 block text-[9px]">Current · {loading ? 'Loading' : playing ? 'Playing' : 'Paused'}</span> : null}
              </div>
              <button
                type="button"
                onClick={playTrack}
                disabled={loading}
                aria-label={`${playing ? 'Pause' : active ? 'Resume' : 'Play'} ${beat.title}`}
                className="focusable-surface grid h-11 w-11 place-items-center rounded-full border border-[var(--line-subtle)] text-[var(--text-primary)] hover:bg-white/[0.06] disabled:opacity-40"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
              </button>
            </article>
          </li>;
        })}
      </ol> : <p className="type-small mt-5 border-y border-[var(--line-subtle)] py-6">No playable Beats are available in this Release.</p>}
    </section>
  </>;
}
