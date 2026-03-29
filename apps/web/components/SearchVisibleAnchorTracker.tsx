// apps/web/components/SearchVisibleAnchorTracker.tsx
'use client';

// Tracks the last visible search branch/result and saves it as a hash anchor,
// so returning to Search restores the exact last-viewed place more reliably.

import { useEffect, useRef } from 'react';
import { saveLastUrl } from '@/lib/study-context';

const STORAGE_KEY = 'iqra:last-search';

interface SavedSearch {
  q:       string;
  src:     string;
  book:    string;
  page:    string;
  url:     string;
  savedAt: number;
}

interface Props {
  query:  string;
  source: string;
  book:   string;
  page:   string;
}

export default function SearchVisibleAnchorTracker({ query, source, book, page }: Props) {
  const lastSavedRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (query.trim().length < 2) return;

    let rafId = 0;

    const getTargets = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-search-anchor]')).filter((el) => !!el.id);

    const persist = (id: string) => {
      if (!id || id === lastSavedRef.current) return;
      lastSavedRef.current = id;

      const exactUrl = `${window.location.pathname}${window.location.search}#${id}`;

      saveLastUrl('search', `Search: ${query.trim()}`, exactUrl);

      try {
        const saved: SavedSearch = {
          q:       query.trim(),
          src:     source || 'all',
          book:    book   || '',
          page:    page   || '1',
          url:     exactUrl,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
    };

    const pickActive = () => {
      rafId = 0;

      const targets = getTargets();
      if (!targets.length) return;

      const topBoundary = 96;
      const viewportLimit = window.innerHeight * 0.82;

      const firstVisible = targets.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= topBoundary && rect.top < viewportLimit;
      });

      const crossingBoundary = targets.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= topBoundary && rect.bottom > topBoundary;
      });

      const active = firstVisible ?? crossingBoundary ?? targets[0];
      if (!active?.id) return;

      persist(active.id);
    };

    const schedule = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(pickActive);
    };

    const flush = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      pickActive();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    const onRestored = () => {
      window.setTimeout(schedule, 200);
      window.setTimeout(schedule, 650);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('iqra:search-ui-restored', onRestored);

    const timerId = window.setTimeout(schedule, 900);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('iqra:search-ui-restored', onRestored);
    };
  }, [query, source, book, page]);

  return null;
}
