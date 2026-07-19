'use client';

import { useEffect } from 'react';

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || window.location.pathname.startsWith('/studio')) return;
    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    };
    const requestIdle = window.requestIdleCallback?.bind(window);
    if (requestIdle) {
      const idleId = requestIdle(register, { timeout: 3000 });
      return () => { cancelled = true; window.cancelIdleCallback(idleId); };
    }
    window.addEventListener('load', register, { once: true });
    return () => { cancelled = true; window.removeEventListener('load', register); };
  }, []);

  return null;
}
