export const PLAYBACK_HISTORY_KEY = 'kp_playback_history_v1';
export const PLAYBACK_HISTORY_LIMIT = 50;

export type PlaybackHistoryEntry = {
  sourceType: 'main' | 'version';
  beatId: string;
  versionKey?: string;
  position: number;
  duration: number;
  completed: boolean;
  lastPlayedAt: string;
};

const idPattern = /^[A-Za-z0-9_-]{1,128}$/;

export function historyEntryKey(entry: Pick<PlaybackHistoryEntry, 'sourceType' | 'beatId' | 'versionKey'>) {
  return entry.sourceType === 'version' ? `version:${entry.beatId}:${entry.versionKey}` : `main:${entry.beatId}`;
}

export function isMeaningfulProgress(position: number, duration: number) {
  return position >= 10 || (duration > 0 && position / duration >= 0.05);
}

export function readPlaybackHistory(): PlaybackHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(PLAYBACK_HISTORY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, PLAYBACK_HISTORY_LIMIT);
  } catch { return []; }
}

export function writePlaybackHistory(entries: PlaybackHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(PLAYBACK_HISTORY_KEY, JSON.stringify(entries.slice(0, PLAYBACK_HISTORY_LIMIT))); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event('kp-playback-history-change'));
}

export function clearPlaybackHistory() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(PLAYBACK_HISTORY_KEY); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event('kp-playback-history-change'));
}

function isHistoryEntry(value: unknown): value is PlaybackHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (item.sourceType === 'main' || item.sourceType === 'version') && typeof item.beatId === 'string' && idPattern.test(item.beatId)
    && (item.sourceType === 'main' || (typeof item.versionKey === 'string' && idPattern.test(item.versionKey)))
    && typeof item.position === 'number' && Number.isFinite(item.position) && item.position >= 0
    && typeof item.duration === 'number' && Number.isFinite(item.duration) && item.duration > 0
    && typeof item.completed === 'boolean' && typeof item.lastPlayedAt === 'string' && Number.isFinite(Date.parse(item.lastPlayedAt));
}
