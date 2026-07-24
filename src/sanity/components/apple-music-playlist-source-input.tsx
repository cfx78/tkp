'use client';

import { useState } from 'react';
import { set, unset, type StringInputProps } from 'sanity';
import { parseAppleMusicPlaylistSource } from '@/src/lib/apple-music-playlist';

export function AppleMusicPlaylistSourceInput(props: StringInputProps) {
  const value = typeof props.value === 'string' ? props.value : '';
  return <AppleMusicPlaylistSourceEditor key={value} {...props} initialValue={value} />;
}

function AppleMusicPlaylistSourceEditor(props: StringInputProps & { initialValue: string }) {
  const [draft, setDraft] = useState(props.initialValue);
  const [error, setError] = useState<string>();
  const parsed = parseAppleMusicPlaylistSource(draft);
  const helperId = `${props.id}-apple-music-helper`;
  const statusId = `${props.id}-apple-music-status`;
  const errorId = `${props.id}-apple-music-error`;

  const commit = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) {
      props.onChange(unset());
      setDraft('');
      setError(undefined);
      return;
    }
    const result = parseAppleMusicPlaylistSource(trimmed);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setDraft(result.canonicalUrl);
    setError(undefined);
    props.onChange(set(result.canonicalUrl));
  };

  return <div style={{ display: 'grid', gap: '0.75rem' }}>
    <p id={helperId} style={{ margin: 0, color: 'var(--card-muted-fg-color)', fontSize: '0.8125rem' }}>Accepts a normal Apple Music playlist link, Apple Music embed link, or complete Apple Music iframe code.</p>
    <textarea
      {...props.elementProps}
      value={draft}
      rows={4}
      placeholder="Paste an Apple Music playlist URL or iframe code"
      onChange={(event) => { setDraft(event.currentTarget.value); setError(undefined); }}
      onBlur={() => commit(draft)}
      onPaste={(event) => { const pasted = event.clipboardData.getData('text'); if (pasted) { event.preventDefault(); commit(pasted); } }}
      onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); commit(draft); } }}
      style={inputStyle(Boolean(error))}
      aria-invalid={Boolean(error)}
      aria-describedby={[helperId, error ? errorId : parsed.ok ? statusId : ''].filter(Boolean).join(' ')}
    />
    {error ? <p id={errorId} role="alert" style={errorStyle}>{error}</p> : null}
    {parsed.ok ? <div id={statusId} aria-live="polite" style={statusStyle}><strong>Apple Music Playlist</strong><span style={urlStyle}>{parsed.canonicalUrl}</span></div> : null}
  </div>;
}

const inputStyle = (error: boolean) => ({ boxSizing: 'border-box' as const, width: '100%', minHeight: '7rem', resize: 'vertical' as const, border: `1px solid var(${error ? '--card-critical-fg-color' : '--card-border-color'})`, borderRadius: '3px', padding: '0.75rem', background: 'var(--card-bg-color)', color: 'var(--card-fg-color)', font: 'inherit' });
const errorStyle = { margin: 0, color: 'var(--card-critical-fg-color)', fontSize: '0.8125rem' };
const statusStyle = { display: 'grid', gap: '0.25rem', padding: '0.75rem', border: '1px solid var(--card-border-color)', borderRadius: '3px', fontSize: '0.8125rem' };
const urlStyle = { overflowWrap: 'anywhere' as const, color: 'var(--card-muted-fg-color)', fontFamily: 'monospace', fontSize: '0.75rem' };
