// apps/web/components/ReadingProgress.tsx
'use client';

// Invisible — renders nothing. Saves reading position + breadcrumb silently.
//
// FIX 1: Dispatches 'iqra:breadcrumb-updated' custom event after saving
//         so Navigation updates immediately (storage event doesn't fire same-tab).
// FIX 2: saveLastUrl reads window.location — no url prop needed.
// FIX 3: breadcrumb uses BreadcrumbPart[] with href for clickable links.

import { useEffect } from 'react';
import { saveLastUrl, saveBreadcrumb, SectionKey, BreadcrumbPart } from '@/lib/study-context';

interface Props {
  section:    SectionKey;
  label:      string;
  breadcrumb: BreadcrumbPart[];
}

export default function ReadingProgress({ section, label, breadcrumb }: Props) {
  useEffect(() => {
    // saveLastUrl reads window.location.pathname + search — captures ?chapter= etc.
    saveLastUrl(section, label);
    saveBreadcrumb({ section, parts: breadcrumb });

    // Dispatch custom event so Navigation in same tab reacts immediately.
    // (The browser's 'storage' event only fires in OTHER tabs.)
    window.dispatchEvent(new Event('iqra:breadcrumb-updated'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, label]);

  return null;
}
