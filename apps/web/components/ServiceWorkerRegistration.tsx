'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register SW in production — in development it causes
    // hydration mismatches by serving stale cached JS bundles.
    if (process.env.NODE_ENV !== 'production') {
      // In development: unregister any existing SW so it stops interfering
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => {
            reg.unregister();
            console.log('[IQRA] SW unregistered for development');
          });
        });
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[IQRA] SW registered, scope:', reg.scope))
        .catch((err) => console.warn('[IQRA] SW registration failed:', err));
    }
  }, []);

  return null;
}
