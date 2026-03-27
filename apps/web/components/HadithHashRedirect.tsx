'use client';

// apps/web/components/HadithHashRedirect.tsx
// When the URL has #hadith-N but no ?chapter= param,
// find which chapter contains that hadith and redirect to include it.
// This makes deep links from search (/hadith/bukhari?page=1#hadith-3) work.

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface ChapterMap {
  [hadithIdInBook: number]: number; // hadithIdInBook → chapterId
}

interface Props {
  // Pre-built map of hadithIdInBook → chapterId (passed from server)
  hadithToChapter: ChapterMap;
}

export default function HadithHashRedirect({ hadithToChapter }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Already has a chapter param — no redirect needed
    if (searchParams.get('chapter')) return;

    // Parse #hadith-N
    const match = hash.match(/^#hadith-(\d+)$/);
    if (!match) return;

    const hadithId  = parseInt(match[1], 10);
    const chapterId = hadithToChapter[hadithId];
    if (!chapterId) return;

    // Redirect to same page with chapter param + hash preserved
    const params = new URLSearchParams(searchParams.toString());
    params.set('chapter', String(chapterId));
    // Remove page param — let it default to 1 for the chapter
    params.delete('page');

    router.replace(`${pathname}?${params.toString()}${hash}`);
  }, [hadithToChapter, pathname, router, searchParams]);

  return null;
}
