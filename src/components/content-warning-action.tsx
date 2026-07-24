'use client';

import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useContentApproval, useContentWarningGate } from './content-warning-provider';
import type { ContentWarningType } from '@/src/lib/content-warning';

export type SensitiveIdentity = { id: string; type: ContentWarningType; nsfw?: boolean; nsfwReason?: string; title?: string };

export function useSensitiveAction(identity: SensitiveIdentity, intendedAction: string) {
  const approved = useContentApproval(identity.type, identity.nsfw ? identity.id : undefined);
  const { requestContentWarning } = useContentWarningGate();
  const run = useCallback(async (action: () => void | Promise<void>) => {
    if (identity.nsfw && !approved) {
      const allowed = await requestContentWarning({ contentType: identity.type, documentId: identity.id, title: identity.title, reason: identity.nsfwReason, intendedAction });
      if (!allowed) return false;
    }
    await action();
    return true;
  }, [approved, identity.id, identity.nsfw, identity.nsfwReason, identity.title, identity.type, intendedAction, requestContentWarning]);
  return { approved: !identity.nsfw || approved, run };
}

export function WarningExternalLink({ identity, href, children, className, ariaLabel }: { identity: SensitiveIdentity; href: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  const { run } = useSensitiveAction(identity, 'open this destination');
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!identity.nsfw) return;
    event.preventDefault();
    void run(() => { window.open(href, '_blank', 'noopener,noreferrer'); });
  };
  return <a href={identity.nsfw ? '#' : href} target="_blank" rel="noopener noreferrer" onClick={open} onAuxClick={(event) => { if (identity.nsfw) { event.preventDefault(); void run(() => { window.open(href, '_blank', 'noopener,noreferrer'); }); } }} className={className} aria-label={ariaLabel}>{children}</a>;
}

export function SensitiveNavigationBoundary({ identity, children, className }: { identity: SensitiveIdentity; children: ReactNode; className?: string }) {
  const router = useRouter();
  const { run } = useSensitiveAction(identity, 'open this item');
  return <div className={className} onClick={(event) => {
    if (!identity.nsfw) return;
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) return;
    event.preventDefault();
    const href = anchor.getAttribute('href');
    if (href) void run(() => anchor.target === '_blank' ? void window.open(anchor.href, '_blank', 'noopener,noreferrer') : router.push(href));
  }}>{children}</div>;
}

export function SensitiveReveal({ identity, children, fallback = null }: { identity: SensitiveIdentity; children: ReactNode; fallback?: ReactNode }) {
  const { approved } = useSensitiveAction(identity, 'reveal this item');
  return approved ? children : fallback;
}

export function SensitivePageReveal({ identity, children }: { identity: SensitiveIdentity; children: ReactNode }) {
  const { approved, run } = useSensitiveAction(identity, 'reveal this page');
  if (approved) return children;
  return <main className="mx-auto w-full max-w-3xl py-16"><p className="type-protocol-label text-[var(--warning)]">Sensitive content</p><h1 className="mt-4 break-words text-3xl font-semibold text-[var(--text-primary)]">{identity.title || 'This item'} is hidden.</h1><p className="type-small mt-4">Review the exact-item warning before revealing this page.</p><button type="button" onClick={() => void run(() => {})} className="action-control focusable-surface mt-6">Reveal content</button></main>;
}

export function SensitiveRevealButton({ identity, label = 'Reveal item' }: { identity: SensitiveIdentity; label?: string }) {
  const { approved, run } = useSensitiveAction(identity, 'reveal this item');
  return approved ? null : <button type="button" onClick={() => void run(() => {})} className="action-control focusable-surface mt-4">{label}</button>;
}
