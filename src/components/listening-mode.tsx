'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { ListMusic, LoaderCircle, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { ProtocolLabel } from './presentation-primitives';
import { usePlayer } from './player-provider';
import { useBeatArtworkUrl } from './beat-artwork';

type ListeningModeProps = {
  onClose: () => void;
};

const laneAccents: Record<string, { accent: string; rgb: string; secondary: string }> = {
  rainview: { accent: 'var(--accent-gold)', rgb: '211 176 105', secondary: 'var(--accent-cyan)' },
  'gray-shore': { accent: 'var(--accent-silver)', rgb: '183 192 204', secondary: 'var(--accent-blue)' },
  fluxwave: { accent: 'var(--accent-cyan)', rgb: '99 207 224', secondary: 'var(--accent-violet)' },
  'pretty-dark': { accent: 'var(--accent-magenta)', rgb: '185 87 145', secondary: 'var(--accent-blue)' },
};

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
}

export function ListeningMode({ onClose }: ListeningModeProps) {
  const player = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  const beat = player.beat;
  const laneKey = beat?.lane?.slug || beat?.lane?.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const palette = laneAccents[laneKey] || { accent: 'var(--accent-blue)', rgb: '92 141 246', secondary: 'var(--accent-cyan)' };
  const style = {
    '--listening-accent': palette.accent,
    '--listening-accent-rgb': palette.rgb,
    '--listening-secondary': palette.secondary,
  } as CSSProperties;
  const cover = useBeatArtworkUrl(beat);
  const progress = player.duration > 0 ? Math.min(100, Math.max(0, (player.currentTime / player.duration) * 100)) : 0;

  useEffect(() => {
    exitRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Listening Mode"
      aria-live="off"
      style={style}
      className={`listening-mode fixed inset-0 z-[100] overflow-x-hidden overflow-y-auto bg-[#020307] text-[var(--text-primary)] ${player.isPlaying ? 'is-playing' : 'is-quiet'}`}
    >
      <div aria-hidden="true" className="listening-mode__ambient" />
      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <header className="sticky top-[env(safe-area-inset-top)] z-10 flex min-h-11 shrink-0 items-center justify-between gap-4 bg-gradient-to-b from-[#020307] via-[#020307]/95 to-transparent pb-2">
          <ProtocolLabel>Listening Mode</ProtocolLabel>
          <button ref={exitRef} type="button" onClick={onClose} className="focusable-surface inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Exit Listening Mode">
            <span>Exit</span><X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        {beat ? (
          <div className="listening-mode__composition mx-auto grid w-full flex-1 content-center items-center gap-6 py-5 md:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)] md:gap-12 md:py-8">
            <div className="listening-mode__art-stage relative mx-auto w-full max-w-[min(72vw,30rem)] md:max-w-[min(42vw,34rem)]">
              <div className="listening-mode__halo absolute -inset-[12%] -z-20" aria-hidden="true" />
              <div className="aspect-square overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
                {cover ? <img src={cover} alt={`Artwork for ${beat.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ListMusic aria-hidden="true" className="h-16 w-16 text-white/15" /></div>}
              </div>
            </div>

            <section className="min-w-0 md:self-center" aria-labelledby="listening-title">
              {beat.sourceType === 'version' ? <ProtocolLabel>Context · {beat.versionType || 'Version'}</ProtocolLabel> : <ProtocolLabel>Main Beat</ProtocolLabel>}
              <h1 id="listening-title" className="mt-3 break-words text-[clamp(1.75rem,7vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.035em]">{beat.title}</h1>
              <p className="type-small mt-3 break-words">
                {beat.lane?.name || 'Unassigned lane'}{beat.sourceType === 'version' && beat.parentBeatTitle ? ` · From ${beat.parentBeatTitle}` : ''}
              </p>
              <p className="type-protocol-label mt-2 text-[9px]">{player.isLoading ? 'Loading' : player.isPlaying ? 'Playing' : player.isQueueComplete ? 'Complete' : 'Paused'}</p>

              <div className="mt-7">
                <div className="relative h-5">
                  <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15"><span className="block h-full bg-[var(--listening-accent)]" style={{ width: `${progress}%` }} /></div>
                  <input type="range" min={0} max={player.duration || 0} step={0.1} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} disabled={!player.duration} aria-label="Playback progress" className="absolute inset-x-0 -top-3 h-11 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                </div>
                <div className="flex justify-between type-numeric"><span>{formatTime(player.currentTime)}</span><span>{formatTime(player.duration)}</span></div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-5 sm:gap-7 md:justify-start">
                <button type="button" onClick={() => void player.previous()} disabled={!player.hasPrevious && player.currentTime <= 3} className="icon-control focusable-surface h-12 w-12 border-white/15" aria-label="Previous Beat"><SkipBack aria-hidden="true" className="h-6 w-6" fill="currentColor" /></button>
                <button type="button" onClick={() => void player.togglePlayback()} disabled={player.isLoading} className="focusable-surface grid h-16 w-16 place-items-center rounded-[var(--radius-interactive)] border border-white/20 bg-[var(--text-primary)] text-[var(--bg-0)] shadow-[0_0_32px_rgba(var(--listening-accent-rgb)/0.14)] disabled:opacity-50" aria-label={player.isPlaying ? 'Pause' : 'Play'}>
                  {player.isLoading ? <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" /> : player.isPlaying ? <Pause aria-hidden="true" className="h-6 w-6" fill="currentColor" /> : <Play aria-hidden="true" className="ml-0.5 h-6 w-6" fill="currentColor" />}
                </button>
                <button type="button" onClick={() => void player.next()} disabled={!player.hasNext} className="icon-control focusable-surface h-12 w-12 border-white/15" aria-label="Next Beat"><SkipForward aria-hidden="true" className="h-6 w-6" fill="currentColor" /></button>
              </div>
              {player.error ? <p className="type-small mt-5 text-[var(--danger)]">Playback is temporarily unavailable. You can exit Listening Mode and try again.</p> : null}
            </section>
          </div>
        ) : (
          <section className="m-auto max-w-md py-12 text-center" aria-labelledby="listening-unavailable">
            <h1 id="listening-unavailable" className="text-2xl font-semibold">This Beat is no longer available</h1>
            <p className="type-small mt-3">Exit Listening Mode to choose something else.</p>
          </section>
        )}
      </div>
    </div>
  );
}
