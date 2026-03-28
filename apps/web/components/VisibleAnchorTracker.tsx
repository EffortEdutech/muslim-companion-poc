// apps/web/components/VisibleAnchorTracker.tsx
'use client';

import { useEffect } from 'react';
import { saveLastUrl, SectionKey } from '@/lib/study-context';

interface Props {
  section:  SectionKey;
  label:    string;
  selector: string;
}

export default function VisibleAnchorTracker({ section, label, selector }: Props) {
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

    const saveActiveTarget = () => {
      rafId = 0;

      const targets = getTargets();
      if (!targets.length) return;

      // IMPORTANT:
      // If we arrived via hash and the user has not scrolled yet,
      // preserve that exact hash target instead of re-sampling.
      const currentHashId = window.location.hash.replace(/^#/, '');
      if (!userHasScrolled && currentHashId) {
        if (saveById(currentHashId)) return;
      }

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

      const active = best ?? targets[0];
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
      const currentHashId = window.location.hash.replace(/^#/, '');
      if (currentHashId) {
        saveById(currentHashId);
        return;
      }
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
  }, [section, label, selector]);

  return null;
}
