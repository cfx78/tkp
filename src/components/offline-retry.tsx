'use client';

export function OfflineRetry() {
  return <button type="button" onClick={() => window.location.reload()} className="action-control focusable-surface">Retry connection</button>;
}
