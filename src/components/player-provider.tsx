'use client';

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { PlaybackContext, PlayerBeat, RepeatMode } from '@/src/types/player';

type PlayerState = {
  queue: PlayerBeat[]; currentIndex: number; context: PlaybackContext | null; shuffle: boolean;
  repeatMode: RepeatMode; isLoading: boolean; isPlaying: boolean; currentTime: number;
  duration: number; hasEnded: boolean; error: string | null;
};
type PlayerContextValue = PlayerState & {
  beat: PlayerBeat | null; hasPrevious: boolean; hasNext: boolean; isQueueComplete: boolean;
  selectBeat: (beat: PlayerBeat, queue?: PlayerBeat[], context?: PlaybackContext) => Promise<void>;
  playQueue: (queue: PlayerBeat[], context: PlaybackContext, startIndex?: number, shuffle?: boolean) => Promise<void>;
  play: () => Promise<void>; pause: () => void; togglePlayback: () => Promise<void>; seek: (time: number) => void;
  next: () => Promise<void>; previous: () => Promise<void>; selectQueueIndex: (index: number) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void; cycleRepeatMode: () => void; replayQueue: () => Promise<void>; shuffleAgain: () => Promise<void>;
};
type Action =
  | { type: 'select'; queue: PlayerBeat[]; index: number; context: PlaybackContext; shuffle: boolean }
  | { type: 'repeat'; mode: RepeatMode } | { type: 'ready' } | { type: 'playing' } | { type: 'paused' }
  | { type: 'time'; currentTime: number; duration: number } | { type: 'ended' } | { type: 'error'; message: string };

const initialState: PlayerState = { queue: [], currentIndex: -1, context: null, shuffle: false, repeatMode: 'off', isLoading: false, isPlaying: false, currentTime: 0, duration: 0, hasEnded: false, error: null };
const PlayerContext = createContext<PlayerContextValue | null>(null);

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'select': return { ...state, queue: action.queue, currentIndex: action.index, context: action.context, shuffle: action.shuffle, isLoading: true, isPlaying: false, currentTime: 0, duration: 0, hasEnded: false, error: null };
    case 'repeat': return { ...state, repeatMode: action.mode };
    case 'ready': return { ...state, isLoading: false, error: null };
    case 'playing': return { ...state, isLoading: false, isPlaying: true, hasEnded: false, error: null };
    case 'paused': return { ...state, isPlaying: false };
    case 'time': return { ...state, currentTime: action.currentTime, duration: action.duration };
    case 'ended': return { ...state, isPlaying: false, hasEnded: true, currentTime: state.duration };
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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state); stateRef.current = state;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const play = useCallback(async () => { const audio = audioRef.current; if (!audio?.src) return; try { await audio.play(); } catch { dispatch({ type: 'error', message: 'Playback could not start. Try pressing play again.' }); } }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const loadIndex = useCallback(async (queue: PlayerBeat[], index: number, context: PlaybackContext, shuffle = false) => {
    const audio = audioRef.current; const beat = queue[index]; if (!audio || !beat) return;
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    audio.pause(); audio.removeAttribute('src'); audio.load(); dispatch({ type: 'select', queue, index, context, shuffle });
    try {
      const response = await fetch('/api/playback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ beatId: beat._id }), cache: 'no-store', signal: controller.signal });
      const payload: { url?: string; error?: string } = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to sign this Beat.');
      if (controller.signal.aborted) return; audio.src = payload.url; audio.load(); await audio.play();
    } catch (error) { if (!controller.signal.aborted) dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Playback is temporarily unavailable.' }); }
  }, []);
  const next = useCallback(async () => { const s = stateRef.current; if (s.currentIndex < s.queue.length - 1 && s.context) await loadIndex(s.queue, s.currentIndex + 1, s.context, s.shuffle); }, [loadIndex]);
  const previous = useCallback(async () => { const audio = audioRef.current; if (audio && audio.currentTime > 3) { audio.currentTime = 0; await play(); return; } const s = stateRef.current; if (s.currentIndex > 0 && s.context) await loadIndex(s.queue, s.currentIndex - 1, s.context, s.shuffle); }, [loadIndex, play]);

  useEffect(() => {
    const audio = new Audio(); audio.preload = 'metadata'; audioRef.current = audio;
    const update = () => dispatch({ type: 'time', currentTime: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
    const ended = () => {
      dispatch({ type: 'ended' }); const s = stateRef.current; if (!s.context) return;
      if (s.repeatMode === 'one') void loadIndex(s.queue, s.currentIndex, s.context, s.shuffle);
      else if (s.currentIndex < s.queue.length - 1) void loadIndex(s.queue, s.currentIndex + 1, s.context, s.shuffle);
      else if (s.repeatMode === 'all') void loadIndex(s.queue, 0, s.context, s.shuffle);
    };
    const ready = () => { dispatch({ type: 'ready' }); update(); };
    const playing = () => dispatch({ type: 'playing' }); const paused = () => dispatch({ type: 'paused' });
    const error = () => dispatch({ type: 'error', message: 'The audio file could not be loaded. The signed URL may have expired.' });
    audio.addEventListener('loadedmetadata', ready); audio.addEventListener('durationchange', update); audio.addEventListener('timeupdate', update); audio.addEventListener('playing', playing); audio.addEventListener('pause', paused); audio.addEventListener('ended', ended); audio.addEventListener('error', error);
    return () => { requestRef.current?.abort(); audio.pause(); audio.removeAttribute('src'); audio.load(); audio.removeEventListener('loadedmetadata', ready); audio.removeEventListener('durationchange', update); audio.removeEventListener('timeupdate', update); audio.removeEventListener('playing', playing); audio.removeEventListener('pause', paused); audio.removeEventListener('ended', ended); audio.removeEventListener('error', error); audioRef.current = null; };
  }, [loadIndex]);

  const playQueue = useCallback(async (queue: PlayerBeat[], context: PlaybackContext, startIndex = 0, shuffle = false) => { if (queue.length) await loadIndex(queue, startIndex, context, shuffle); }, [loadIndex]);
  const selectBeat = useCallback(async (beat: PlayerBeat, queue = [beat], context: PlaybackContext = { type: 'manual', title: beat.title }) => { const index = Math.max(0, queue.findIndex((item) => item._id === beat._id)); await loadIndex(queue, index, context, false); }, [loadIndex]);
  const togglePlayback = useCallback(async () => { if (audioRef.current?.paused) await play(); else pause(); }, [pause, play]);
  const seek = useCallback((time: number) => { const audio = audioRef.current; if (audio && Number.isFinite(time)) audio.currentTime = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time); }, []);
  const selectQueueIndex = useCallback(async (index: number) => { const s = stateRef.current; if (s.context) await loadIndex(s.queue, index, s.context, s.shuffle); }, [loadIndex]);
  const setRepeatMode = useCallback((mode: RepeatMode) => dispatch({ type: 'repeat', mode }), []);
  const cycleRepeatMode = useCallback(() => { const modes: RepeatMode[] = ['off', 'all', 'one']; const current = stateRef.current.repeatMode; dispatch({ type: 'repeat', mode: modes[(modes.indexOf(current) + 1) % modes.length] }); }, []);
  const replayQueue = useCallback(async () => { const s = stateRef.current; if (s.queue.length && s.context) await loadIndex(s.queue, 0, s.context, s.shuffle); }, [loadIndex]);
  const shuffleAgain = useCallback(async () => { const s = stateRef.current; if (s.context?.type !== 'main-library' || !s.queue.length) return; const queue = shuffledCopy(s.queue, s.queue); await loadIndex(queue, 0, { type: 'main-library', title: 'Main Library · Shuffled' }, true); }, [loadIndex]);
  const beat = state.queue[state.currentIndex] || null;
  const isQueueComplete = state.hasEnded && state.repeatMode === 'off' && state.currentIndex === state.queue.length - 1;
  return <PlayerContext.Provider value={{ ...state, beat, hasPrevious: state.currentIndex > 0, hasNext: state.currentIndex >= 0 && state.currentIndex < state.queue.length - 1, isQueueComplete, selectBeat, playQueue, play, pause, togglePlayback, seek, next, previous, selectQueueIndex, setRepeatMode, cycleRepeatMode, replayQueue, shuffleAgain }}>{children}</PlayerContext.Provider>;
}
export function usePlayer() { const context = useContext(PlayerContext); if (!context) throw new Error('usePlayer must be used inside PlayerProvider.'); return context; }
