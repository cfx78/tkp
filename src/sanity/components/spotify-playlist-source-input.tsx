'use client';

import { useState } from 'react';
import { set, unset, type StringInputProps } from 'sanity';
import { parseSpotifyPlaylistSource } from '@/src/lib/spotify-playlist';

export function SpotifyPlaylistSourceInput(props: StringInputProps) {
  const value = typeof props.value === 'string' ? props.value : '';
  return <SpotifyPlaylistSourceEditor key={value} {...props} initialValue={value} />;
}

function SpotifyPlaylistSourceEditor(props: StringInputProps & { initialValue: string }) {
  const [draft, setDraft] = useState(props.initialValue);
  const [error, setError] = useState<string>();

  const commit = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) {
      props.onChange(unset());
      setDraft('');
      setError(undefined);
      return;
    }

    const result = parseSpotifyPlaylistSource(trimmed);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setDraft(result.canonicalUrl);
    setError(undefined);
    props.onChange(set(result.canonicalUrl));
  };

  return <div style={{ display: 'grid', gap: '0.75rem' }}>
    <textarea
      {...props.elementProps}
      value={draft}
      rows={4}
      placeholder="Paste a Spotify playlist URL or iframe code"
      onChange={(event) => { setDraft(event.currentTarget.value); setError(undefined); }}
      onBlur={() => commit(draft)}
      onPaste={(event) => {
        const pasted = event.clipboardData.getData('text');
        if (!pasted) return;
        event.preventDefault();
        commit(pasted);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          commit(draft);
        }
      }}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '7rem',
        resize: 'vertical',
        border: error ? '1px solid var(--card-critical-fg-color)' : '1px solid var(--card-border-color)',
        borderRadius: '3px',
        padding: '0.75rem',
        background: 'var(--card-bg-color)',
        color: 'var(--card-fg-color)',
        font: 'inherit',
      }}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${props.id}-spotify-source-error` : undefined}
    />
    {error ? <p id={`${props.id}-spotify-source-error`} style={{ margin: 0, color: 'var(--card-critical-fg-color)', fontSize: '0.8125rem' }}>{error}</p> : null}
  </div>;
}
