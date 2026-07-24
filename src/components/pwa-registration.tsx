'use client';

import { useEffect } from 'react';

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || window.location.pathname.startsWith('/studio')) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(
        (registration) => { if (process.env.NODE_ENV === 'development') console.info('TKP service worker registered', registration.scope); },
        (error: unknown) => { if (process.env.NODE_ENV === 'development') console.error('TKP service worker registration failed', error instanceof Error ? error.message : 'Unknown error'); },
      );
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  return null;
}
