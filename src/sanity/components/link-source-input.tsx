'use client';

import { useState } from 'react';
import { set, unset, type StringInputProps } from 'sanity';
import { linkSourceProviderLabel, parseLinkSource, type ParsedLinkSource } from '@/src/lib/link-source';

export function LinkSourceInput(props: StringInputProps) {
  const value = typeof props.value === 'string' ? props.value : '';
  return <LinkSourceEditor key={value} {...props} initialValue={value} />;
}

function LinkSourceEditor(props: StringInputProps & { initialValue: string }) {
  const value = props.initialValue;
  const [draft, setDraft] = useState(value);
  const [parsed, setParsed] = useState<ParsedLinkSource | null>(() => parseLinkSource(value));
  const [error, setError] = useState<string>();

  const commit = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) {
      props.onChange(unset());
      setDraft('');
      setParsed(null);
      setError(undefined);
      return;
    }

    const result = parseLinkSource(trimmed);
    if (!result) {
      setParsed(null);
      setError('Paste a public HTTP/HTTPS URL or supported provider embed code.');
      return;
    }

    setDraft(result.canonicalUrl);
    setParsed(result);
    setError(undefined);
    props.onChange(set(result.canonicalUrl));
  };

  return <div style={{ display: 'grid', gap: '0.75rem' }}>
    <textarea
      {...props.elementProps}
      value={draft}
      rows={4}
      placeholder="Paste a public URL or provider embed code"
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
      aria-describedby={error ? `${props.id}-source-error` : parsed ? `${props.id}-source-status` : undefined}
    />
    {error ? <p id={`${props.id}-source-error`} style={{ margin: 0, color: 'var(--card-critical-fg-color)', fontSize: '0.8125rem' }}>{error}</p> : null}
    {parsed ? <div id={`${props.id}-source-status`} aria-live="polite" style={{ display: 'grid', gap: '0.25rem', padding: '0.75rem', border: '1px solid var(--card-border-color)', borderRadius: '3px' }}>
      <strong style={{ fontSize: '0.8125rem' }}>{linkSourceProviderLabel(parsed.provider)}{parsed.contentKind ? ` / ${parsed.contentKind}` : ''}</strong>
      <span style={{ overflowWrap: 'anywhere', color: 'var(--card-muted-fg-color)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{parsed.canonicalUrl}</span>
    </div> : null}
  </div>;
}
