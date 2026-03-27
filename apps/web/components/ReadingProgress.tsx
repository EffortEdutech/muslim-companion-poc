// apps/web/components/ReadingProgress.tsx
'use client';

// Invisible component — renders nothing, saves reading position silently.
// Drop into any reader page. No UI, no pill, no button.
//
// On mount it:
//   1. Saves current URL to localStorage so Navigation restores it next visit
//   2. Saves breadcrumb parts so Navigation can show context in the top bar
//
// This replaces StudyFootstep. Remove <StudyFootstep> from pages and add
// <ReadingProgress> instead — same props pattern, zero visual output.

import { useEffect } from 'react';
import { saveLastUrl, saveBreadcrumb, SectionKey } from '@/lib/study-context';

interface Props {
  section:      SectionKey;
  url:          string;    // full path e.g. /quran/18
  label:        string;    // short name e.g. "Al-Kahf"
  breadcrumb:   string[];  // e.g. ["Quran", "Al-Kahf"] or ["Tafseer", "Ibn Kathir", "Al-Kahf"]
}

export default function ReadingProgress({
  section, url, label, breadcrumb,
}: Props) {
  useEffect(() => {
    saveLastUrl(section, url, label);
    saveBreadcrumb({ section, parts: breadcrumb });
  }, [section, url, label]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;  // renders nothing
}
