// apps/web/components/VisibleAnchorTracker.tsx
'use client';

// Saves the most relevant visible anchor on reader pages so top-tab switching
// can restore the user to the last ayah / tafseer entry / hadith card.

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

    const getTargets = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => !!el.id);

    const saveActiveTarget = () => {
      rafId = 0;

      const targets = getTargets();
      if (!targets.length) return;

      // Approximate "reading focus" just below the sticky top bar.
      const focusLine = 120;

      let best: HTMLElement | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const el of targets) {
        const rect = el.getBoundingClientRect();

        // If the card is already above the focus line but still on screen,
        // it is usually the one the user is reading.
        if (rect.top <= focusLine && rect.bottom > focusLine) {
          best = el;
          bestDistance = 0;
          break;
        }

        // Otherwise prefer the closest card to the focus line.
        const distance = Math.abs(rect.top - focusLine);
        if (distance < bestDistance) {
          best = el;
          bestDistance = distance;
        }
      }

      const active = best ?? targets[0];
      if (!active?.id || active.id === lastSavedId) return;

      lastSavedId = active.id;
      const explicitUrl = `${window.location.pathname}${window.location.search}#${active.id}`;
      saveLastUrl(section, label, explicitUrl);
    };

    const scheduleSave = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(saveActiveTarget);
    };

    // Delay the first save so hash-based restoration and sticky layout can settle first.
    const timerId = window.setTimeout(scheduleSave, 700);

    window.addEventListener('scroll', scheduleSave, { passive: true });
    window.addEventListener('resize', scheduleSave);

    return () => {
      window.clearTimeout(timerId);
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleSave);
      window.removeEventListener('resize', scheduleSave);
    };
  }, [section, label, selector]);

  return null;
}
