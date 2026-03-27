// apps/web/components/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { COLLECTIONS } from '@/lib/collections';

interface Props {
  defaultQuery?: string;
  defaultBook?:  string;
  autoFocus?:    boolean;
}

export default function SearchBar({ defaultQuery = '', defaultBook = '', autoFocus = false }: Props) {
  const router      = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [book,  setBook]  = useState(defaultBook);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input when defaultQuery changes externally (e.g. SearchPersist restore)
  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    setBook(defaultBook);
  }, [defaultBook]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const navigate = useCallback(
    (q: string, b: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (q.trim().length < 2) return;
        const params = new URLSearchParams();
        params.set('q', q.trim());
        if (b) params.set('book', b);
        router.push(`/search?${params.toString()}`);
      }, 400);
    },
    [router]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const params = new URLSearchParams();
    params.set('q', query.trim());
    if (book) params.set('book', book);
    router.push(`/search?${params.toString()}`);
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    navigate(val, book);
  }

  function handleBookChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setBook(val);
    if (query.trim().length >= 2) navigate(query, val);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Main search input */}
        <div className="relative flex-1">
          <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search Quran, Tafseer, Hadith in Arabic or English…"
            className="search-input"
            style={{ paddingLeft: '48px' }}
            autoComplete="off"
            spellCheck={false}
            dir="auto"
          />
        </div>

        {/* Book filter — only shown when source is hadith */}
        <select
          value={book}
          onChange={handleBookChange}
          className="search-select"
          style={{
            fontFamily:   'var(--font-lora)',
            fontSize:     '0.88rem',
            background:   'var(--bg-card)',
            border:       '1px solid var(--gold-border)',
            borderRadius: '10px',
            color:        'var(--ink-secondary)',
            padding:      '0 14px',
            minWidth:     '160px',
            height:       '48px',
            cursor:       'pointer',
          }}
        >
          <option value="">All collections</option>
          {COLLECTIONS.map((c) => (
            <option key={c.slug} value={c.slug}>{c.shortName}</option>
          ))}
        </select>
      </div>
    </form>
  );
}
