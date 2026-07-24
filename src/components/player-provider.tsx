'use client';

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { PlaybackContext, PlayerBeat, RepeatMode } from '@/src/types/player';
import { historyEntryKey, isMeaningfulProgress, readPlaybackHistory, writePlaybackHistory } from '@/src/lib/playback-history';
import { useContentWarningGate } from './content-warning-provider';
import { useBeatArtworkUrl } from './beat-artwork';

type PlayerState = {
  queue: PlayerBeat[]; currentIndex: number; context: PlaybackContext | null; shuffle: boolean;
  repeatMode: RepeatMode; isLoading: boolean; isPlaying: boolean; currentTime: number;
  duration: number; hasEnded: boolean; isStopped: boolean; error: string | null;
};
type PlayerContextValue = PlayerState & {
  beat: PlayerBeat | null; hasPrevious: boolean; hasNext: boolean; isQueueComplete: boolean;
  selectBeat: (beat: PlayerBeat, queue?: PlayerBeat[], context?: PlaybackContext) => Promise<void>;
  resumeBeat: (beat: PlayerBeat, position: number) => Promise<void>;
  playQueue: (queue: PlayerBeat[], context: PlaybackContext, startIndex?: number, shuffle?: boolean) => Promise<void>;
  play: () => Promise<void>; pause: () => void; togglePlayback: () => Promise<void>; seek: (time: number) => void;
  next: () => Promise<void>; previous: () => Promise<void>; selectQueueIndex: (index: number) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void; cycleRepeatMode: () => void; replayQueue: () => Promise<void>; shuffleAgain: () => Promise<void>;
};
type Action =
  | { type: 'select'; queue: PlayerBeat[]; index: number; context: PlaybackContext; shuffle: boolean }
  | { type: 'repeat'; mode: RepeatMode } | { type: 'ready' } | { type: 'playing' } | { type: 'paused' }
  | { type: 'time'; currentTime: number; duration: number } | { type: 'ended' } | { type: 'stopped' } | { type: 'error'; message: string };

const initialState: PlayerState = { queue: [], currentIndex: -1, context: null, shuffle: false, repeatMode: 'off', isLoading: false, isPlaying: false, currentTime: 0, duration: 0, hasEnded: false, isStopped: false, error: null };
const PlayerContext = createContext<PlayerContextValue | null>(null);

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'select': return { ...state, queue: action.queue, currentIndex: action.index, context: action.context, shuffle: action.shuffle, isLoading: true, isPlaying: false, currentTime: 0, duration: 0, hasEnded: false, isStopped: false, error: null };
    case 'repeat': return { ...state, repeatMode: action.mode };
    case 'ready': return { ...state, isLoading: false, error: null };
    case 'playing': return { ...state, isLoading: false, isPlaying: true, hasEnded: false, isStopped: false, error: null };
    case 'paused': return { ...state, isPlaying: false };
    case 'time': return { ...state, currentTime: action.currentTime, duration: action.duration };
    case 'ended': return { ...state, isPlaying: false, hasEnded: true, currentTime: state.duration };
    case 'stopped': return { ...state, isLoading: false, isPlaying: false, currentTime: 0, hasEnded: false, isStopped: true };
    case 'error': return { ...state, isLoading: false, isPlaying: false, error: action.message };
  }
}

function shuffledCopy(beats: PlayerBeat[], previousOrder: PlayerBeat[] = []) {
  if (beats.length < 2) return [...beats];
  const previous = previousOrder.map((beat) => beat._id).join('|');
  let result = [...beats];
  for (let attempt = 0; attempt < 5; attempt++) {
    result = [...beats];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    if (result.map((beat) => beat._id).join('|') !== previous) break;
  }
  return result;
}

function mediaArtwork(src?: string): MediaImage[] | undefined {
  if (!src) return undefined;
  try {
    return [96, 128, 192, 256, 384, 512].map((size) => {
      const url = new URL(src);
      if (url.hostname.endsWith('sanity.io')) {
        url.searchParams.set('w', String(size)); url.searchParams.set('h', String(size));
        url.searchParams.set('fit', 'crop'); url.searchParams.set('auto', 'format');
      }
      return { src: url.toString(), sizes: `${size}x${size}` };
    });
  } catch { return undefined; }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { requestContentWarning } = useContentWarningGate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state); stateRef.current = state;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const lastPositionUpdateRef = useRef(0);
  const lastHistoryWriteRef = useRef(0);

  const saveCurrentHistory = useCallback((completed = false, force = false) => {
    const audio = audioRef.current; const beat = stateRef.current.queue[stateRef.current.currentIndex];
    if (!audio || !beat) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : stateRef.current.duration;
    const rawPosition = Number.isFinite(audio.currentTime) ? audio.currentTime : stateRef.current.currentTime;
    if (!Number.isFinite(duration) || duration <= 0 || !isMeaningfulProgress(rawPosition, duration)) return;
    const now = Date.now(); if (!force && now - lastHistoryWriteRef.current < 5000) return;
    const position = Math.min(Math.max(rawPosition, 0), duration);
    const isCompleted = completed || position / duration >= 0.95;
    const entry = { sourceType: beat.sourceType === 'version' ? 'version' as const : 'main' as const, beatId: beat.sourceType === 'version' ? beat.parentBeatId || '' : beat._id, versionKey: beat.sourceType === 'version' ? beat.versionKey : undefined, position: isCompleted ? duration : position, duration, completed: isCompleted, lastPlayedAt: new Date(now).toISOString() };
    if (!entry.beatId) return;
    const history = readPlaybackHistory().filter((item) => historyEntryKey(item) !== historyEntryKey(entry));
    writePlaybackHistory([entry, ...history]); lastHistoryWriteRef.current = now;
  }, []);

  const play = useCallback(async () => { const audio = audioRef.current; if (!audio?.src) return; try { await audio.play(); } catch { dispatch({ type: 'error', message: 'Playback could not start. Try pressing play again.' }); } }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const loadIndex = useCallback(async (queue: PlayerBeat[], index: number, context: PlaybackContext, shuffle = false, resumeAt = 0) => {
    const audio = audioRef.current; const beat = queue[index]; if (!audio || !beat) return;
    if (beat.nsfw) {
      const documentId = beat.sourceType === 'version' && beat.parentBeatId && beat.versionKey ? `${beat.parentBeatId}.${beat.versionKey}` : beat._id;
      const approved = await requestContentWarning({ contentType: beat.sourceType === 'version' ? 'version' : 'beat', documentId, title: beat.title, reason: beat.nsfwReason, intendedAction: 'play this audio' });
      if (!approved) return;
    }
    saveCurrentHistory(false, true);
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    audio.pause(); audio.removeAttribute('src'); audio.load(); dispatch({ type: 'select', queue, index, context, shuffle });
    try {
      const requestBody = beat.sourceType === 'version'
        ? { sourceType: 'version', beatId: beat.parentBeatId, versionKey: beat.versionKey }
        : { sourceType: 'main', beatId: beat._id };
      const response = await fetch('/api/playback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), cache: 'no-store', signal: controller.signal });
      const payload: { url?: string; error?: string } = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to sign this Beat.');
      if (controller.signal.aborted) return; audio.src = payload.url; audio.load();
      if (resumeAt > 0) {
        await new Promise<void>((resolve, reject) => {
          const ready = () => { cleanup(); resolve(); }; const failed = () => { cleanup(); reject(new Error('Playback metadata could not be loaded.')); };
          const cleanup = () => { audio.removeEventListener('loadedmetadata', ready); audio.removeEventListener('error', failed); };
          audio.addEventListener('loadedmetadata', ready, { once: true }); audio.addEventListener('error', failed, { once: true });
        });
        if (controller.signal.aborted) return;
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        audio.currentTime = duration > 0 && resumeAt < duration * 0.95 ? Math.min(Math.max(resumeAt, 0), duration) : 0;
      }
      await audio.play();
    } catch (error) { if (!controller.signal.aborted) dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Playback is temporarily unavailable.' }); }
  }, [requestContentWarning, saveCurrentHistory]);
  const next = useCallback(async () => { const s = stateRef.current; if (s.currentIndex < s.queue.length - 1 && s.context) await loadIndex(s.queue, s.currentIndex + 1, s.context, s.shuffle); }, [loadIndex]);
  const previous = useCallback(async () => { const audio = audioRef.current; if (audio && audio.currentTime > 3) { audio.currentTime = 0; await play(); return; } const s = stateRef.current; if (s.currentIndex > 0 && s.context) await loadIndex(s.queue, s.currentIndex - 1, s.context, s.shuffle); }, [loadIndex, play]);

  useEffect(() => {
    const audio = new Audio(); audio.preload = 'metadata'; audioRef.current = audio;
    const update = () => dispatch({ type: 'time', currentTime: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
    const ended = () => {
      saveCurrentHistory(true, true);
      dispatch({ type: 'ended' }); const s = stateRef.current; if (!s.context) return;
      if (s.repeatMode === 'one') void loadIndex(s.queue, s.currentIndex, s.context, s.shuffle);
      else if (s.currentIndex < s.queue.length - 1) void loadIndex(s.queue, s.currentIndex + 1, s.context, s.shuffle);
      else if (s.repeatMode === 'all') void loadIndex(s.queue, 0, s.context, s.shuffle);
    };
    const ready = () => { dispatch({ type: 'ready' }); update(); };
    const playing = () => { lastPositionUpdateRef.current = 0; dispatch({ type: 'playing' }); };
    const paused = () => { lastPositionUpdateRef.current = 0; saveCurrentHistory(false, true); dispatch({ type: 'paused' }); };
    const seeked = () => { lastPositionUpdateRef.current = 0; update(); saveCurrentHistory(false, true); };
    const progress = () => { update(); saveCurrentHistory(false, false); };
    const pagehide = () => saveCurrentHistory(false, true);
    const error = () => dispatch({ type: 'error', message: 'The audio file could not be loaded. The signed URL may have expired.' });
    audio.addEventListener('loadedmetadata', ready); audio.addEventListener('durationchange', update); audio.addEventListener('timeupdate', progress); audio.addEventListener('playing', playing); audio.addEventListener('pause', paused); audio.addEventListener('seeked', seeked); audio.addEventListener('ended', ended); audio.addEventListener('error', error); window.addEventListener('pagehide', pagehide);
    return () => { requestRef.current?.abort(); saveCurrentHistory(false, true); audio.pause(); audio.removeAttribute('src'); audio.load(); audio.removeEventListener('loadedmetadata', ready); audio.removeEventListener('durationchange', update); audio.removeEventListener('timeupdate', progress); audio.removeEventListener('playing', playing); audio.removeEventListener('pause', paused); audio.removeEventListener('seeked', seeked); audio.removeEventListener('ended', ended); audio.removeEventListener('error', error); window.removeEventListener('pagehide', pagehide); audioRef.current = null; };
  }, [loadIndex, saveCurrentHistory]);

  const playQueue = useCallback(async (queue: PlayerBeat[], context: PlaybackContext, startIndex = 0, shuffle = false) => { if (queue.length) await loadIndex(queue, startIndex, context, shuffle); }, [loadIndex]);
  const selectBeat = useCallback(async (beat: PlayerBeat, queue = [beat], context: PlaybackContext = { type: 'manual', title: beat.title }) => { const index = Math.max(0, queue.findIndex((item) => item._id === beat._id)); await loadIndex(queue, index, context, false); }, [loadIndex]);
  const resumeBeat = useCallback(async (beat: PlayerBeat, position: number) => { await loadIndex([beat], 0, { type: 'manual', title: 'Continue Listening' }, false, position); }, [loadIndex]);
  const togglePlayback = useCallback(async () => { if (audioRef.current?.paused) await play(); else pause(); }, [pause, play]);
  const seek = useCallback((time: number) => { const audio = audioRef.current; if (audio && Number.isFinite(time)) audio.currentTime = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time); }, []);
  const selectQueueIndex = useCallback(async (index: number) => { const s = stateRef.current; if (s.context) await loadIndex(s.queue, index, s.context, s.shuffle); }, [loadIndex]);
  const setRepeatMode = useCallback((mode: RepeatMode) => dispatch({ type: 'repeat', mode }), []);
  const cycleRepeatMode = useCallback(() => { const modes: RepeatMode[] = ['off', 'all', 'one']; const current = stateRef.current.repeatMode; dispatch({ type: 'repeat', mode: modes[(modes.indexOf(current) + 1) % modes.length] }); }, []);
  const replayQueue = useCallback(async () => { const s = stateRef.current; if (s.queue.length && s.context) await loadIndex(s.queue, 0, s.context, s.shuffle); }, [loadIndex]);
  const shuffleAgain = useCallback(async () => { const s = stateRef.current; if (s.context?.type !== 'main-library' || !s.queue.length) return; const queue = shuffledCopy(s.queue, s.queue); await loadIndex(queue, 0, { type: 'main-library', title: 'Main Library · Shuffled' }, true); }, [loadIndex]);
  const beat = state.queue[state.currentIndex] || null;
  const approvedArtwork = useBeatArtworkUrl(beat);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
    if (!beat) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; return; }
    const artwork = mediaArtwork(approvedArtwork);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: beat.title,
      artist: beat.lane?.name || 'The Kitsune Protocol',
      album: beat.sourceType === 'version' ? beat.parentBeatTitle || state.context?.title || 'Context' : state.context?.title || 'Player',
      artwork
    });
    return () => { navigator.mediaSession.metadata = null; };
  }, [approvedArtwork, beat, state.context]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = !beat || state.isStopped ? 'none' : state.isPlaying ? 'playing' : 'paused';
  }, [beat, state.isPlaying, state.isStopped]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    const audio = audioRef.current;
    const duration = state.duration;
    if (!beat || state.isStopped || !audio || !Number.isFinite(duration) || duration <= 0) return;
    const now = Date.now();
    if (state.isPlaying && now - lastPositionUpdateRef.current < 1000 && state.currentTime < duration) return;
    const position = Math.min(Math.max(state.currentTime, 0), duration);
    const playbackRate = Number.isFinite(audio.playbackRate) && audio.playbackRate > 0 ? audio.playbackRate : 1;
    try { navigator.mediaSession.setPositionState({ duration, position, playbackRate }); lastPositionUpdateRef.current = now; } catch { /* Browser rejected a transient position update. */ }
  }, [beat, state.currentTime, state.duration, state.isPlaying, state.isStopped]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const mediaSession = navigator.mediaSession;
    const actions: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto', 'seekbackward', 'seekforward', 'stop'];
    const handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
      play: () => { void play(); },
      pause,
      previoustrack: () => { void previous(); },
      nexttrack: () => { void next(); },
      seekto: (details) => { if (typeof details.seekTime === 'number') seek(details.seekTime); },
      seekbackward: (details) => { const audio = audioRef.current; if (audio) seek(audio.currentTime - (details.seekOffset || 10)); },
      seekforward: (details) => { const audio = audioRef.current; if (audio) seek(audio.currentTime + (details.seekOffset || 10)); },
      stop: () => { const audio = audioRef.current; if (!audio) return; audio.pause(); audio.currentTime = 0; dispatch({ type: 'stopped' }); }
    };
    for (const action of actions) { try { mediaSession.setActionHandler(action, handlers[action] || null); } catch { /* Unsupported Media Session action. */ } }
    return () => {
      for (const action of actions) { try { mediaSession.setActionHandler(action, null); } catch { /* Unsupported Media Session action. */ } }
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
    };
  }, [next, pause, play, previous, seek]);

  const isQueueComplete = state.hasEnded && state.repeatMode === 'off' && state.currentIndex === state.queue.length - 1;
  return <PlayerContext.Provider value={{ ...state, beat, hasPrevious: state.currentIndex > 0, hasNext: state.currentIndex >= 0 && state.currentIndex < state.queue.length - 1, isQueueComplete, selectBeat, resumeBeat, playQueue, play, pause, togglePlayback, seek, next, previous, selectQueueIndex, setRepeatMode, cycleRepeatMode, replayQueue, shuffleAgain }}>{children}</PlayerContext.Provider>;
}
export function usePlayer() { const context = useContext(PlayerContext); if (!context) throw new Error('usePlayer must be used inside PlayerProvider.'); return context; }
