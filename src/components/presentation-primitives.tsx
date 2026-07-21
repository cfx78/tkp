import type { HTMLAttributes, ReactNode } from 'react';
import { EditorialDisplayTitle } from './editorial-display-title';

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function ProtocolLabel({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes('type-protocol-label', className)} {...props}>{children}</p>;
}

export function SectionHeading({ label, title, description, className, editorial = false }: { label?: string; title: string; description?: string; className?: string; editorial?: boolean }) {
  return <header className={className}>{label ? <ProtocolLabel>{label}</ProtocolLabel> : null}{editorial ? <EditorialDisplayTitle variant="section" className={label ? 'mt-3' : undefined}>{title}</EditorialDisplayTitle> : <h2 className={classes('type-section-heading', label && 'mt-2')}>{title}</h2>}{description ? <p className="type-small mt-2 max-w-2xl">{description}</p> : null}</header>;
}

export function HairlineDivider({ className }: { className?: string }) {
  return <hr aria-hidden="true" className={classes('hairline-divider', className)} />;
}

export function MediaArtwork({ src, alt = '', size = 'row', className }: { src?: string; alt?: string; size?: 'compact' | 'row' | 'feature'; className?: string }) {
  const sizes = { compact: 'h-[var(--artwork-compact)] w-[var(--artwork-compact)]', row: 'h-[var(--artwork-row)] w-[var(--artwork-row)]', feature: 'aspect-square w-[var(--artwork-feature)]' };
  return <span className={classes('media-artwork block shrink-0', sizes[size], className)}>{src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : null}</span>;
}

export function MetadataLine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={classes('type-metadata', className)}>{children}</p>;
}

export function MetadataGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>{children}</div>;
}

export function EmptyState({ title, detail, className }: { title: string; detail?: string; className?: string }) {
  return <div className={classes('border-y border-white/10 py-6', className)}><p className="type-protocol-label text-[var(--text-muted)]">Empty state</p><p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{title}</p>{detail ? <p className="type-small mt-1">{detail}</p> : null}</div>;
}

export function ActiveEdge({ children, active = true, className }: { children: ReactNode; active?: boolean; className?: string }) {
  return <div className={classes(active && 'active-edge', className)} data-active={active || undefined}>{children}</div>;
}

export function FocusableSurface({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes('focusable-surface', className)} {...props}>{children}</div>;
}
