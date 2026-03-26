'use client';

// apps/web/components/SearchPersist.tsx
// Saves the current search query+source to localStorage.
// On return to /search with no query, restores the last search automatically.
// Also renders a "New Search" button to clear and start fresh.

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'iqra:last-search';

interface SavedSearch {
  q:    string;
  src:  string;
  book: string;
  savedAt: number;
}

interface Props {
  // Current search state from server (empty strings = no active search)
  query:  string;
  source: string;
  book:   string;
  // If true, no query in URL — attempt restore
  shouldRestore: boolean;
}

export default function SearchPersist({ query, source, book, shouldRestore }: Props) {
  const router  = useRouter();
  const hasRun  = useRef(false);

  // Save whenever we have an active search
  useEffect(() => {
    if (query.trim().length >= 2) {
      const saved: SavedSearch = {
        q:       query.trim(),
        src:     source || 'all',
        book:    book   || '',
        savedAt: Date.now(),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch {}
    }
  }, [query, source, book]);

  // Restore once on mount if no query in URL
  useEffect(() => {
    if (!shouldRestore || hasRun.current) return;
    hasRun.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: SavedSearch = JSON.parse(raw);
      if (!saved.q || saved.q.trim().length < 2) return;

      // Build restore URL
      const params = new URLSearchParams();
      params.set('q', saved.q);
      if (saved.src && saved.src !== 'all') params.set('src', saved.src);
      if (saved.book) params.set('book', saved.book);

      router.replace(`/search?${params.toString()}`);
    } catch {}
  }, [shouldRestore, router]);

  return null; // renders nothing — side-effect only
}

// ── New Search button — shown when there is an active search ─────────────────

interface NewSearchButtonProps {
  visible: boolean;
}

export function NewSearchButton({ visible }: NewSearchButtonProps) {
  const router = useRouter();

  if (!visible) return null;

  function handleClear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    router.push('/search');
  }

  return (
    <button
      onClick={handleClear}
      title="Clear search and start fresh"
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        background:   'none',
        border:       '1px solid var(--gold-border)',
        borderRadius: '8px',
        padding:      '5px 12px',
        fontFamily:   'var(--font-lora)',
        fontSize:     '0.78rem',
        color:        'var(--ink-muted)',
        cursor:       'pointer',
        transition:   'all 0.15s',
        whiteSpace:   'nowrap',
        flexShrink:   0,
      }}
    >
      {/* X icon */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6"  y1="6" x2="18" y2="18"/>
      </svg>
      New search
    </button>
  );
}
