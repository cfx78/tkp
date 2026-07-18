'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { contentApprovalKey, readContentApproval, subscribeContentApproval, warningLabel, writeContentApproval, type ContentWarningRequest, type ContentWarningType } from '@/src/lib/content-warning';

type WarningContextValue = { requestContentWarning: (request: ContentWarningRequest) => Promise<boolean> };
type PendingWarning = { request: ContentWarningRequest; resolve: (approved: boolean) => void; returnFocus: HTMLElement | null };

const WarningContext = createContext<WarningContextValue | null>(null);

export function ContentWarningProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingWarning | null>(null);
  const pendingRef = useRef<PendingWarning | null>(null);

  const finish = useCallback((approved: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    pendingRef.current = null;
    setPending(null);
    if (approved && current.request.rememberApproval !== false) writeContentApproval(current.request.contentType, current.request.documentId);
    current.resolve(approved);
    requestAnimationFrame(() => current.returnFocus?.focus());
  }, []);

  const requestContentWarning = useCallback((request: ContentWarningRequest) => {
    if (!contentApprovalKey(request.contentType, request.documentId)) return Promise.resolve(false);
    if (readContentApproval(request.contentType, request.documentId)) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      if (pendingRef.current) pendingRef.current.resolve(false);
      const next = { request, resolve, returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  useEffect(() => () => { pendingRef.current?.resolve(false); pendingRef.current = null; }, []);
  useEffect(() => { const current = pendingRef.current; if (current) { pendingRef.current = null; setPending(null); current.resolve(false); } }, [pathname]);

  return <WarningContext.Provider value={{ requestContentWarning }}>{children}{pending ? <ContentWarningDialog pending={pending} onContinue={() => finish(true)} onCancel={() => finish(false)} /> : null}</WarningContext.Provider>;
}

export function useContentWarningGate() {
  const value = useContext(WarningContext);
  if (!value) throw new Error('useContentWarningGate must be used inside ContentWarningProvider.');
  return value;
}

export function useContentApproval(contentType: ContentWarningType, documentId?: string) {
  const subscribe = useCallback((listener: () => void) => documentId ? subscribeContentApproval(contentType, documentId, listener) : () => {}, [contentType, documentId]);
  const snapshot = useCallback(() => Boolean(documentId && readContentApproval(contentType, documentId)), [contentType, documentId]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

function ContentWarningDialog({ pending, onContinue, onCancel }: { pending: PendingWarning; onContinue: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { request } = pending;

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.public-app-shell');
    const previousOverflow = document.body.style.overflow;
    shell?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); return; }
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); shell?.removeAttribute('inert'); document.body.style.overflow = previousOverflow; };
  }, [onCancel]);

  return createPortal(<div className="fixed inset-0 z-[100] grid overflow-y-auto bg-black/80 px-4 py-[max(1rem,env(safe-area-inset-top))]" role="presentation">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="content-warning-title" aria-describedby="content-warning-description" className="my-auto w-full max-w-md justify-self-center border border-white/15 bg-[var(--bg-1)] p-5 shadow-2xl sm:p-7">
      <p className="type-protocol-label text-[var(--warning)]">Content warning · {warningLabel(request.contentType)}</p>
      <h2 id="content-warning-title" className="mt-3 break-words text-2xl font-semibold leading-tight text-[var(--text-primary)]">Continue to {request.intendedAction}?</h2>
      <div id="content-warning-description" className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
        {request.title ? <p className="break-words font-semibold text-[var(--text-primary)]">{request.title}</p> : null}
        <p>This item may contain explicit language or sensitive material.</p>
        {request.reason ? <p className="break-words border-l-2 border-[var(--warning)] pl-3"><span className="font-semibold text-[var(--text-primary)]">Reason:</span> {request.reason}</p> : null}
        {request.rememberApproval !== false ? <p className="type-metadata">Continuing remembers approval for this exact item on this browser.</p> : null}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 min-[360px]:flex-row min-[360px]:justify-end">
        <button ref={cancelRef} type="button" onClick={onCancel} className="action-control focusable-surface justify-center">Cancel</button>
        <button type="button" onClick={onContinue} className="action-control focusable-surface justify-center border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-0)]">Continue</button>
      </div>
    </div>
  </div>, document.body);
}
