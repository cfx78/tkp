'use client';

import { useState } from 'react';
import { set, unset, type StringInputProps } from 'sanity';
import { parseYouTubePlaylistSource } from '@/src/lib/youtube-playlist';

export function YouTubePlaylistSourceInput(props: StringInputProps) {
  const value = typeof props.value === 'string' ? props.value : '';
  return <YouTubePlaylistSourceEditor key={value} {...props} initialValue={value} />;
}

function YouTubePlaylistSourceEditor(props: StringInputProps & { initialValue: string }) {
  const [draft, setDraft] = useState(props.initialValue);
  const [error, setError] = useState<string>();
  const parsed = parseYouTubePlaylistSource(draft);
  const helperId = `${props.id}-youtube-helper`;
  const statusId = `${props.id}-youtube-status`;
  const errorId = `${props.id}-youtube-error`;

  const commit = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) {
      props.onChange(unset());
      setDraft('');
      setError(undefined);
      return;
    }
    const result = parseYouTubePlaylistSource(trimmed);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setDraft(result.canonicalUrl);
    setError(undefined);
    props.onChange(set(result.canonicalUrl));
  };

  const status = parsed.ok ? parsed.provider === 'youtubeMusic' ? 'YouTube Music Playlist' : 'YouTube Playlist' : null;
  return <div style={{ display: 'grid', gap: '0.75rem' }}>
    <p id={helperId} style={{ margin: 0, color: 'var(--card-muted-fg-color)', fontSize: '0.8125rem' }}>Accepts a YouTube or YouTube Music playlist link, trusted playlist embed link, or complete trusted playlist iframe code.</p>
    <textarea
      {...props.elementProps}
      value={draft}
      rows={4}
      placeholder="Paste a YouTube playlist URL or iframe code"
      onChange={(event) => { setDraft(event.currentTarget.value); setError(undefined); }}
      onBlur={() => commit(draft)}
      onPaste={(event) => { const pasted = event.clipboardData.getData('text'); if (pasted) { event.preventDefault(); commit(pasted); } }}
      onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); commit(draft); } }}
      style={inputStyle(Boolean(error))}
      aria-invalid={Boolean(error)}
      aria-describedby={[helperId, error ? errorId : status ? statusId : ''].filter(Boolean).join(' ')}
    />
    {error ? <p id={errorId} role="alert" style={errorStyle}>{error}</p> : null}
    {status && parsed.ok ? <div id={statusId} aria-live="polite" style={statusStyle}><strong>{status}</strong><span style={urlStyle}>{parsed.canonicalUrl}</span></div> : null}
  </div>;
}

const inputStyle = (error: boolean) => ({ boxSizing: 'border-box' as const, width: '100%', minHeight: '7rem', resize: 'vertical' as const, border: `1px solid var(${error ? '--card-critical-fg-color' : '--card-border-color'})`, borderRadius: '3px', padding: '0.75rem', background: 'var(--card-bg-color)', color: 'var(--card-fg-color)', font: 'inherit' });
const errorStyle = { margin: 0, color: 'var(--card-critical-fg-color)', fontSize: '0.8125rem' };
const statusStyle = { display: 'grid', gap: '0.25rem', padding: '0.75rem', border: '1px solid var(--card-border-color)', borderRadius: '3px', fontSize: '0.8125rem' };
const urlStyle = { overflowWrap: 'anywhere' as const, color: 'var(--card-muted-fg-color)', fontFamily: 'monospace', fontSize: '0.75rem' };
