// apps/web/components/ReadingProgress.tsx
'use client';

// Invisible — renders nothing. Saves reading position + breadcrumb silently.

import { useEffect, useMemo } from 'react';
import {
  saveLastUrl,
  saveBreadcrumb,
  SectionKey,
  BreadcrumbPart,
} from '@/lib/study-context';

interface Props {
  section:    SectionKey;
  label:      string;
  breadcrumb: BreadcrumbPart[];
}

export default function ReadingProgress({ section, label, breadcrumb }: Props) {
  const breadcrumbKey = useMemo(() => JSON.stringify(breadcrumb), [breadcrumb]);

  useEffect(() => {
    saveLastUrl(section, label);
    saveBreadcrumb({ section, parts: breadcrumb });

    // Same-tab updates need a custom event because the browser's `storage`
    // event only fires in other tabs.
    window.dispatchEvent(new Event('iqra:breadcrumb-updated'));
  }, [section, label, breadcrumbKey, breadcrumb]);

  return null;
}
