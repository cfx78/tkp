'use client';

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { PlayerBeat } from '@/src/types/player';

type PlayerState = {
  beat: PlayerBeat | null;
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasEnded: boolean;
  error: string | null;
};

type PlayerContextValue = PlayerState & {
  selectBeat: (beat: PlayerBeat) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  togglePlayback: () => Promise<void>;
  seek: (time: number) => void;
};

type Action =
  | { type: 'select'; beat: PlayerBeat }
  | { type: 'ready' }
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'time'; currentTime: number; duration: number }
  | { type: 'ended' }
  | { type: 'error'; message: string };

const initialState: PlayerState = {
  beat: null,
  isLoading: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  hasEnded: false,
  error: null
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'select':
      return { ...initialState, beat: action.beat, isLoading: true };
    case 'ready':
      return { ...state, isLoading: false, error: null };
    case 'playing':
      return { ...state, isLoading: false, isPlaying: true, hasEnded: false, error: null };
    case 'paused':
      return { ...state, isPlaying: false };
    case 'time':
      return { ...state, currentTime: action.currentTime, duration: action.duration };
    case 'ended':
      return { ...state, isPlaying: false, hasEnded: true, currentTime: state.duration };
    case 'error':
      return { ...state, isLoading: false, isPlaying: false, error: action.message };
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const updateTime = () => dispatch({
      type: 'time',
      currentTime: audio.currentTime || 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0
    });
    const handleReady = () => {
      dispatch({ type: 'ready' });
      updateTime();
    };
    const handlePlaying = () => dispatch({ type: 'playing' });
    const handlePause = () => dispatch({ type: 'paused' });
    const handleEnded = () => dispatch({ type: 'ended' });
    const handleError = () => dispatch({ type: 'error', message: 'The audio file could not be loaded. The signed URL may have expired.' });

    audio.addEventListener('loadedmetadata', handleReady);
    audio.addEventListener('durationchange', updateTime);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      requestRef.current?.abort();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('loadedmetadata', handleReady);
      audio.removeEventListener('durationchange', updateTime);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    try {
      await audio.play();
    } catch {
      dispatch({ type: 'error', message: 'Playback could not start. Try pressing play again.' });
    }
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const selectBeat = useCallback(async (beat: PlayerBeat) => {
    const audio = audioRef.current;
    if (!audio) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    dispatch({ type: 'select', beat });

    try {
      const response = await fetch('/api/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId: beat._id }),
        cache: 'no-store',
        signal: controller.signal
      });
      const payload: { url?: string; error?: string } = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to sign this Beat.');
      if (controller.signal.aborted) return;

      audio.src = payload.url;
      audio.load();
      await play();
    } catch (error) {
      if (controller.signal.aborted) return;
      dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Playback is temporarily unavailable.' });
    }
  }, [play]);

  const togglePlayback = useCallback(async () => {
    if (audioRef.current?.paused) await play();
    else pause();
  }, [pause, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time);
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, selectBeat, play, pause, togglePlayback, seek }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider.');
  return context;
}
