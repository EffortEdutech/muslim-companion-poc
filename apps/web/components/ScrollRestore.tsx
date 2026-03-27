// apps/web/components/ScrollRestore.tsx
'use client';

// Saves scroll position to sessionStorage on every scroll event (throttled).
// Restores it when returning to the same URL.
// Keyed by full URL (pathname + search) so each page has its own position.
//
// Uses sessionStorage (not localStorage) — positions reset on new session,
// which matches natural browser behaviour. No stale positions across days.
//
// Add to any reader page: <ScrollRestore />

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const STORAGE_PREFIX = 'iqra:scroll:';

export default function ScrollRestore() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const key          = STORAGE_PREFIX + pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
  const savedRef     = useRef(false);

  // ── Restore saved position on mount ────────────────────────────────────────
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return;
      const y = parseInt(saved, 10);
      if (isNaN(y) || y < 1) return;

      // Wait for layout — fonts + images settle before we scroll
      const restore = () => window.scrollTo({ top: y, behavior: 'instant' });

      // Try immediately
      setTimeout(restore, 100);
      // Safety net for slow renders
      setTimeout(restore, 500);
    } catch {}
  }, [key]);

  // ── Save position on scroll (throttled to every 300ms) ─────────────────────
  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      setTimeout(() => {
        try {
          sessionStorage.setItem(key, String(Math.round(window.scrollY)));
        } catch {}
        ticking = false;
      }, 300);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key]);

  return null;
}
