'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const STORAGE_PREFIX = 'iqra:scroll:';

export default function SearchScrollRestore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = STORAGE_PREFIX + pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');

  useEffect(() => {
    let restored = false;

    const restore = () => {
      if (restored) return;
      restored = true;

      try {
        const saved = sessionStorage.getItem(key);
        if (!saved) return;

        const y = parseInt(saved, 10);
        if (isNaN(y) || y < 1) return;

        const doRestore = () => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });

        setTimeout(doRestore, 50);
        setTimeout(doRestore, 220);
        setTimeout(doRestore, 500);
      } catch {}
    };

    const onReady = () => restore();
    window.addEventListener('iqra:search-ui-restored', onReady);

    const timerId = window.setTimeout(restore, 900);

    return () => {
      window.removeEventListener('iqra:search-ui-restored', onReady);
      window.clearTimeout(timerId);
    };
  }, [key]);

  useEffect(() => {
    let ticking = false;

    const flush = () => {
      try {
        sessionStorage.setItem(key, String(Math.round(window.scrollY)));
      } catch {}
    };

    function onScroll() {
      if (ticking) return;
      ticking = true;

      setTimeout(() => {
        flush();
        ticking = false;
      }, 200);
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') flush();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [key]);

  return null;
}
