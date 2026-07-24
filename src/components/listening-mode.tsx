'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { ListMusic, LoaderCircle, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, X } from 'lucide-react';
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
  const RepeatIcon = player.repeatMode === 'one' ? Repeat1 : Repeat;

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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Listening Mode"
      aria-live="off"
      style={style}
      className={`listening-mode fixed inset-0 z-[100] overflow-hidden bg-[#020307] text-[var(--text-primary)] ${player.isPlaying ? 'is-playing' : 'is-quiet'}`}
    >
      <div aria-hidden="true" className="listening-mode__environment" />
      <div aria-hidden="true" className="listening-mode__ambient" />

      <div className="listening-mode__frame">
        <header className="listening-mode__header">
          <div className="min-w-0">
            <ProtocolLabel>Listening Mode</ProtocolLabel>
            <span lang="ja" className="listening-mode__katakana">キツネ・プロトコル</span>
          </div>
          <button ref={exitRef} type="button" onClick={onClose} className="focusable-surface inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Exit Listening Mode">
            <span>Exit</span><X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        {beat ? (
          <div className="listening-mode__composition">
            <div className="listening-mode__art-stage">
              <div className="listening-mode__halo" aria-hidden="true" />
              {cover ? <span className="listening-mode__art-echo" style={{ backgroundImage: `url(${JSON.stringify(cover)})` }} aria-hidden="true" /> : null}
              <div className="listening-mode__cover">
                {cover ? <img src={cover} alt={`Artwork for ${beat.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ListMusic aria-hidden="true" className="h-16 w-16 text-white/15" /></div>}
              </div>
            </div>

            <section className="listening-mode__details" aria-labelledby="listening-title">
              {beat.sourceType === 'version' ? <ProtocolLabel>Context · {beat.versionType || 'Version'}</ProtocolLabel> : <ProtocolLabel>Main Beat</ProtocolLabel>}
              <h1 id="listening-title" className="listening-mode__title">{beat.title}</h1>
              <p className="listening-mode__metadata type-small">
                {beat.lane?.name || 'Unassigned lane'}{beat.sourceType === 'version' && beat.parentBeatTitle ? ` · From ${beat.parentBeatTitle}` : ''}
              </p>
              <p className="listening-mode__status type-protocol-label">{player.isLoading ? 'Loading' : player.isPlaying ? 'Playing' : player.isQueueComplete ? 'Complete' : 'Paused'}</p>

              <div className="listening-mode__progress">
                <div className="relative h-5">
                  <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15"><span className="block h-full bg-[var(--listening-accent)]" style={{ width: `${progress}%` }} /></div>
                  <input type="range" min={0} max={player.duration || 0} step={0.1} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} disabled={!player.duration} aria-label="Playback progress" className="absolute inset-x-0 -top-3 h-11 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                </div>
                <div className="flex justify-between type-numeric"><span>{formatTime(player.currentTime)}</span><span>{formatTime(player.duration)}</span></div>
              </div>

              <div className="listening-mode__controls">
                <button type="button" onClick={player.cycleRepeatMode} className={`listening-mode__mode-control focusable-surface ${player.repeatMode === 'off' ? '' : 'is-active'}`} aria-label={`Repeat ${player.repeatMode}`} aria-pressed={player.repeatMode !== 'off'}><RepeatIcon aria-hidden="true" className="h-5 w-5" /><span className="type-numeric text-[8px]">{player.repeatMode}</span></button>
                <button type="button" onClick={() => void player.previous()} disabled={!player.hasPrevious && player.currentTime <= 3} className="icon-control focusable-surface h-12 w-12 border-white/15" aria-label="Previous Beat"><SkipBack aria-hidden="true" className="h-6 w-6" fill="currentColor" /></button>
                <button type="button" onClick={() => void player.togglePlayback()} disabled={player.isLoading} className="focusable-surface grid h-16 w-16 place-items-center rounded-[var(--radius-interactive)] border border-white/20 bg-[var(--text-primary)] text-[var(--bg-0)] shadow-[0_0_32px_rgba(var(--listening-accent-rgb)/0.14)] disabled:opacity-50" aria-label={player.isPlaying ? 'Pause' : 'Play'}>
                  {player.isLoading ? <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" /> : player.isPlaying ? <Pause aria-hidden="true" className="h-6 w-6" fill="currentColor" /> : <Play aria-hidden="true" className="ml-0.5 h-6 w-6" fill="currentColor" />}
                </button>
                <button type="button" onClick={() => void player.next()} disabled={!player.hasNext} className="icon-control focusable-surface h-12 w-12 border-white/15" aria-label="Next Beat"><SkipForward aria-hidden="true" className="h-6 w-6" fill="currentColor" /></button>
                <span className={`listening-mode__mode-control ${player.shuffle ? 'is-active' : ''}`} aria-label={player.shuffle ? 'Queue shuffled' : 'Queue not shuffled'}><Shuffle aria-hidden="true" className="h-5 w-5" /><span className="type-numeric text-[8px]">{player.shuffle ? 'on' : 'off'}</span></span>
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
