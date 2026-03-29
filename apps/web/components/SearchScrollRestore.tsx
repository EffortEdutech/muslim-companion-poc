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
        const hashId = window.location.hash.replace(/^#/, '');

        if (hashId) {
          const runHashRestore = () => {
            const el = document.getElementById(hashId);
            if (!el) return;
            const TOP_OFFSET = 92;
            const rect = el.getBoundingClientRect();
            const delta = rect.top - TOP_OFFSET;
            window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
          };

          setTimeout(runHashRestore, 40);
          setTimeout(runHashRestore, 220);
          return;
        }

        const saved = sessionStorage.getItem(key);
        if (!saved) return;
        const y = parseInt(saved, 10);
        if (isNaN(y) || y < 1) return;

        const doRestore = () => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
        setTimeout(doRestore, 40);
        setTimeout(doRestore, 180);
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
