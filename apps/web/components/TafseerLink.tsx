'use client';

// apps/web/components/TafseerLink.tsx
// Receives `available` as a prop from the server page.
// No fs usage — safe in client components.

import Link from 'next/link';

const DEFAULT_BOOK = 'en-tafisr-ibn-kathir';

interface Props {
  surahNumber: number;
  ayahNumber?: number;
  bookSlug?:   string;
  available?:  boolean;  // passed from server — defaults true so link shows
}

export default function TafseerLink({
  surahNumber,
  ayahNumber,
  bookSlug  = DEFAULT_BOOK,
  available = true,
}: Props) {
  if (!available) return null;

  const href = ayahNumber
    ? `/tafseer/${bookSlug}/${surahNumber}?ayah=${ayahNumber}`
    : `/tafseer/${bookSlug}/${surahNumber}`;

  return (
    <Link
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '5px',
        fontFamily:     'var(--font-lora)',
        fontSize:       '0.8rem',
        color:          'var(--gold)',
        textDecoration: 'none',
        padding:        '4px 10px',
        borderRadius:   '7px',
        border:         '1px solid var(--gold-border)',
        background:     'var(--bg-card)',
        transition:     'border-color 0.15s',
        whiteSpace:     'nowrap',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      Tafseer
    </Link>
  );
}
