'use client';

import { useId, useState } from 'react';
import { getPlaylistPreviewOptions, type PlaylistPreviewOption, type PlaylistPreviewProvider, type PlaylistPreviewSources } from '@/src/lib/playlist-preview';

type PlaylistPreviewProps = PlaylistPreviewSources & {
  title: string;
  className?: string;
};

export function PlaylistPreview({ title, className = '', ...sources }: PlaylistPreviewProps) {
  const options = getPlaylistPreviewOptions(sources);
  const [selectedProvider, setSelectedProvider] = useState<PlaylistPreviewProvider | undefined>(options[0]?.provider);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewId = useId();
  const selected = options.find((option) => option.provider === selectedProvider) || options[0];

  if (!selected) return null;

  const selectProvider = (provider: PlaylistPreviewProvider) => {
    setSelectedProvider(provider);
  };

  return <div className={className}>
    {options.length > 1 ? <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Preview provider">
      <span className="type-metadata">Preview</span>
      {options.map((option) => <button key={option.provider} type="button" aria-pressed={selected.provider === option.provider} onClick={() => selectProvider(option.provider)} className={`focusable-surface inline-flex min-h-11 items-center border-b px-1 text-sm font-semibold ${selected.provider === option.provider ? 'border-[var(--accent)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--line-subtle)] hover:text-[var(--text-primary)]'}`}>{option.label}</button>)}
    </div> : null}
    <button type="button" aria-controls={previewId} aria-expanded={previewOpen} onClick={() => setPreviewOpen((open) => !open)} className="focusable-surface mt-2 inline-flex min-h-11 items-center border border-[var(--line-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/[0.05]">{previewOpen ? 'Close Preview' : `Load ${selected.label} Preview`}</button>
    {previewOpen ? <div id={previewId} role="region" aria-label={`${title} ${selected.label} preview`} className="mt-3 w-full overflow-hidden"><ProviderIframe key={selected.provider} title={title} option={selected} /></div> : null}
  </div>;
}

function ProviderIframe({ title, option }: { title: string; option: PlaylistPreviewOption }) {
  const isYouTube = option.provider === 'youtube' || option.provider === 'youtubeMusic';
  const className = option.provider === 'spotify'
    ? 'h-[152px] w-full rounded-xl border-0'
    : option.provider === 'appleMusic'
      ? 'h-[450px] max-h-[70vh] w-full rounded-xl border-0'
      : 'aspect-video w-full rounded-xl border-0';
  const allow = option.provider === 'spotify'
    ? 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
    : option.provider === 'appleMusic'
      ? 'encrypted-media; fullscreen'
      : 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

  return <iframe
    className={className}
    src={option.embedUrl}
    title={`${title} on ${option.label}`}
    loading="lazy"
    allow={allow}
    allowFullScreen={isYouTube}
  />;
}
