'use client';

import { useEffect } from 'react';
import { getReaderPrefs, applyFontSize } from '@/lib/reader-store';

/**
 * Applies the user's saved font size preference on mount.
 * Placed in the root layout to run on every page.
 */
export default function ReaderPrefsInit() {
  useEffect(() => {
    const prefs = getReaderPrefs();
    applyFontSize(prefs.fontSize);
  }, []);

  return null;
}
