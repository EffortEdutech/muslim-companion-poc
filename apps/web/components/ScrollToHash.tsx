'use client';

// apps/web/components/ScrollToHash.tsx
// Scrolls to the element matching window.location.hash after page hydration.
// Required because Next.js App Router does not auto-scroll to hash anchors
// on server-rendered pages.
//
// Usage: <ScrollToHash /> anywhere inside the page, renders nothing.

import { useEffect } from 'react';

export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.slice(1); // strip leading #

    // Try immediately first (element may already be in DOM)
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // If not found immediately, poll briefly — content may still be painting
    let attempts = 0;
    const interval = setInterval(() => {
      const found = document.getElementById(id);
      if (found) {
        found.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clearInterval(interval);
      }
      if (++attempts > 20) clearInterval(interval); // give up after 2s
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return null;
}
