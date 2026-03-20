'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, FormEvent } from 'react';

interface Props {
  defaultQuery?: string;
  autoFocus?:    boolean;
}

export default function QuranSearchBar({ defaultQuery = '', autoFocus = false }: Props) {
  const router      = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const navigate = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q.trim().length < 2) return;
      router.push(`/quran/search?q=${encodeURIComponent(q.trim())}`);
    }, 380);
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    navigate(val);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) return;
    router.push(`/quran/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', pointerEvents: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search in Arabic, English or Malay… or try 2:255"
          className="search-input"
          style={{ paddingLeft: '48px' }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search Quran"
          dir="auto"
        />
      </div>
      <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '8px' }}>
        Tip: search by surah:ayah reference (e.g. <span style={{ color: 'var(--gold)' }}>2:255</span>), Arabic text without diacritics, or English keyword
      </p>
    </form>
  );
}
