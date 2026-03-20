'use client';

import { useState, useEffect } from 'react';
import { isBookmarked, toggleBookmark } from '@/lib/reader-store';

interface Props {
  idInBook: number;
  bookSlug: string;
  bookTitle: string;
  arabicText: string;
  englishText: string;
}

export default function BookmarkButton({
  idInBook,
  bookSlug,
  bookTitle,
  arabicText,
  englishText,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Read from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setSaved(isBookmarked(bookSlug, idInBook));
  }, [bookSlug, idInBook]);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const next = toggleBookmark({ idInBook, bookSlug, bookTitle, arabicText, englishText });
    setSaved(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
  }

  return (
    <button
      onClick={handleToggle}
      title={saved ? 'Remove bookmark' : 'Bookmark this hadith'}
      aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: '6px',
        color: saved ? 'var(--gold)' : 'var(--ink-muted)',
        transition: 'color 0.2s, transform 0.15s',
        transform: pulse ? 'scale(1.35)' : 'scale(1)',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {saved ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
        </svg>
      )}
    </button>
  );
}
