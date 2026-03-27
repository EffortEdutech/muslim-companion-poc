'use client';

// apps/web/components/ScrollToHash.tsx

import { useEffect } from 'react';

export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);

    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }, 80);
        return;
      }
      if (attempts < 30) setTimeout(() => tryScroll(attempts + 1), 100);
    };

    // Wait 300ms for sticky nav + fonts to settle before first attempt
    setTimeout(() => tryScroll(), 300);
  }, []);

  return null;
}
