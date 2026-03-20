'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[IQRA] SW registered, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[IQRA] SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
