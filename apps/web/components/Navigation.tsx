'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, FormEvent } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery('');
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav
        style={{
          height: 'var(--nav-height)',
          background: 'rgba(13,17,23,0.92)',
          borderBottom: '1px solid var(--gold-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.35rem', color: 'var(--gold)', lineHeight: 1 }} dir="rtl" lang="ar">
              إقرأ
            </span>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              IQRA Digital
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Collections
            </Link>
            <Link href="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>
              Search
            </Link>
            <Link href="/bookmarks" className={`nav-link ${isActive('/bookmarks') ? 'active' : ''}`}>
              Bookmarks
            </Link>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--gold-border)',
              color: 'var(--ink-muted)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-lora)',
            }}
            aria-label="Open search"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search hadith…</span>
            <span
              className="hidden sm:inline"
              style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(200,168,75,0.1)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
            >
              ⌘K
            </span>
          </button>
        </div>
      </nav>

      {/* Search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          style={{ background: 'rgba(5,8,15,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--gold-border-strong)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
                <SearchIcon style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search in Arabic or English…"
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.05rem',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-lora)',
                  }}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    ✕
                  </button>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--gold-border)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                  Enter to search · Arabic & English · Try "#33" for hadith by number
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Esc to close</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
