// apps/web/components/ReadingProgress.tsx
'use client';

// Invisible — renders nothing. Saves reading position + breadcrumb silently.

import { useEffect, useMemo } from 'react';
import {
  saveLastUrl,
  saveBreadcrumb,
  BreadcrumbPart,
} from '@/lib/study-context';

type ReaderSectionKey = 'quran' | 'tafseer' | 'hadith';

interface Props {
  section:    ReaderSectionKey;
  label:      string;
  breadcrumb: BreadcrumbPart[];
}

export default function ReadingProgress({ section, label, breadcrumb }: Props) {
  const breadcrumbKey = useMemo(() => JSON.stringify(breadcrumb), [breadcrumb]);

  useEffect(() => {
    saveLastUrl(section, label);
    saveBreadcrumb({ section, parts: breadcrumb });

    window.dispatchEvent(new Event('iqra:breadcrumb-updated'));
  }, [section, label, breadcrumbKey, breadcrumb]);

  return null;
}
