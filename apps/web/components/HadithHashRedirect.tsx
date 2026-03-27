// apps/web/components/HadithHashRedirect.tsx
'use client';

// apps/web/components/HadithHashRedirect.tsx
// When URL has #hadith-N but no ?chapter= param, finds the correct chapter
// AND the correct page within that chapter, then redirects.

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const HADITHS_PER_PAGE = 50;

interface HadithInfo {
  chapterId:   number;
  chapterIndex: number; // position within chapter (0-based) for page calc
}

interface Props {
  hadithToChapter: Record<number, HadithInfo>;
}

export default function HadithHashRedirect({ hadithToChapter }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const hasRun       = useRef(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hasRun.current) return;

    // Already has chapter — no redirect needed, ScrollToHash handles it
    if (searchParams.get('chapter')) return;

    const match = hash.match(/^#hadith-(\d+)$/);
    if (!match) return;

    const hadithId = parseInt(match[1], 10);
    const info     = hadithToChapter[hadithId];
    if (!info) return;

    hasRun.current = true;

    // Calculate which page within the chapter this hadith falls on
    const page = Math.ceil((info.chapterIndex + 1) / HADITHS_PER_PAGE);

    const params = new URLSearchParams(searchParams.toString());
    params.set('chapter', String(info.chapterId));
    params.delete('page'); // remove old page
    if (page > 1) params.set('page', String(page));

    router.replace(`${pathname}?${params.toString()}${hash}`);
  }, [hadithToChapter, pathname, router, searchParams]);

  return null;
}
