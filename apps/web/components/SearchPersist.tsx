'use client';

// apps/web/components/SearchPersist.tsx
// Search tab memory:
// - restore the last exact search URL (query/src/book/page)
// - intentionally do NOT store a hash anchor for Search
// Search last-viewed position is restored by SearchScrollRestore using scrollY,
// which is more reliable for Search than hash-anchor tracking.

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveLastUrl } from '@/lib/study-context';

const STORAGE_KEY = 'iqra:last-search';

interface SavedSearch {
  q:       string;
  src:     string;
  book:    string;
  page:    string;
  url:     string;
  savedAt: number;
}

interface Props {
  query: string;
  source: string;
  book: string;
  shouldRestore: boolean;
  page?: string;
}

export default function SearchPersist({ query, source, book, shouldRestore, page = '1' }: Props) {
  const router  = useRouter();
  const hasRun  = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (query.trim().length < 2) return;

    const cleanQuery = query.trim();
    const exactUrl = `${window.location.pathname}${window.location.search}`;

    const saved: SavedSearch = {
      q:       cleanQuery,
      src:     source || 'all',
      book:    book   || '',
      page:    page   || '1',
      url:     exactUrl,
      savedAt: Date.now(),
    };

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch {}
    saveLastUrl('search', `Search: ${cleanQuery}`, exactUrl);
  }, [query, source, book, page]);

  useEffect(() => {
    if (!shouldRestore || hasRun.current) return;
    hasRun.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved: SavedSearch = JSON.parse(raw);
      if (!saved.q || saved.q.trim().length < 2) return;

      if (saved.url) {
        router.replace(saved.url);
        return;
      }

      const params = new URLSearchParams();
      params.set('q', saved.q);
      if (saved.src && saved.src !== 'all') params.set('src', saved.src);
      if (saved.book) params.set('book', saved.book);
      if (saved.page && saved.page !== '1') params.set('page', saved.page);

      router.replace(`/search?${params.toString()}`);
    } catch {}
  }, [shouldRestore, router]);

  return null;
}

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
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6"  y1="6" x2="18" y2="18"/>
      </svg>
      New search
    </button>
  );
}
