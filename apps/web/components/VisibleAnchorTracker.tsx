// apps/web/components/VisibleAnchorTracker.tsx
'use client';

import { useEffect } from 'react';
import { saveLastUrl, SectionKey } from '@/lib/study-context';

interface Props {
  section:     SectionKey;
  label:       string;
  selector:    string;
  mode?:       'focus-line' | 'top-heading';
  topBoundary?: number;
}

export default function VisibleAnchorTracker({
  section,
  label,
  selector,
  mode = 'focus-line',
  topBoundary = 96,
}: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = 0;
    let lastSavedId = '';
    let userHasScrolled = false;

    const getTargets = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => !!el.id);

    const saveById = (id: string) => {
      if (!id) return false;

      const el = document.getElementById(id);
      if (!el) return false;

      if (id === lastSavedId) return true;
      lastSavedId = id;

      const explicitUrl = `${window.location.pathname}${window.location.search}#${id}`;
      saveLastUrl(section, label, explicitUrl);
      return true;
    };

    const pickByTopHeading = (targets: HTMLElement[]): HTMLElement | null => {
      const viewportLimit = window.innerHeight * 0.8;

      // Prefer the first entry whose HEADER/top is actually visible below the sticky nav.
      const firstVisibleHeading = targets.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= topBoundary && rect.top < viewportLimit;
      });
      if (firstVisibleHeading) return firstVisibleHeading;

      // Fallback: entry currently crossing the boundary.
      const crossingBoundary = targets.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= topBoundary && rect.bottom > topBoundary;
      });
      if (crossingBoundary) return crossingBoundary;

      return targets[0] ?? null;
    };

    const pickByFocusLine = (targets: HTMLElement[]): HTMLElement | null => {
      const focusLine = 120;

      let best: HTMLElement | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const el of targets) {
        const rect = el.getBoundingClientRect();

        if (rect.top <= focusLine && rect.bottom > focusLine) {
          best = el;
          bestDistance = 0;
          break;
        }

        const distance = Math.abs(rect.top - focusLine);
        if (distance < bestDistance) {
          best = el;
          bestDistance = distance;
        }
      }

      return best ?? targets[0] ?? null;
    };

    const saveActiveTarget = () => {
      rafId = 0;

      const targets = getTargets();
      if (!targets.length) return;

      // Only preserve hash as-is for focus-line mode.
      // For top-heading mode (used by tafseer), we intentionally recompute based
      // on what the user actually sees at the top of the screen.
      const currentHashId = window.location.hash.replace(/^#/, '');
      if (mode === 'focus-line' && !userHasScrolled && currentHashId) {
        if (saveById(currentHashId)) return;
      }

      const active =
        mode === 'top-heading'
          ? pickByTopHeading(targets)
          : pickByFocusLine(targets);

      if (!active?.id) return;
      saveById(active.id);
    };

    const scheduleSave = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(saveActiveTarget);
    };

    const onScroll = () => {
      userHasScrolled = true;
      scheduleSave();
    };

    const timerId = window.setTimeout(() => {
      scheduleSave();
    }, 700);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', scheduleSave);

    return () => {
      window.clearTimeout(timerId);
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', scheduleSave);
    };
  }, [section, label, selector, mode, topBoundary]);

  return null;
}
