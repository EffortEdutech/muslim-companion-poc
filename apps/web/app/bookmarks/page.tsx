'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookmarks, removeBookmark, Bookmark } from '@/lib/reader-store';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setReady(true);
  }, []);

  function handleRemove(b: Bookmark) {
    removeBookmark(b.bookSlug, b.idInBook);
    setBookmarks((prev) => prev.filter((x) => x.id !== b.id));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <header className="mb-8">
        <nav style={{ marginBottom: '20px' }}>
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}
          >
            Collections
          </Link>
          <span style={{ color: 'var(--ink-muted)', margin: '0 8px', fontSize: '0.82rem' }}>›</span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
            Bookmarks
          </span>
        </nav>

        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '6px' }}>
          Bookmarks
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          {ready && bookmarks.length > 0
            ? `${bookmarks.length} saved hadith`
            : 'Your saved hadiths'}
        </p>
      </header>

      {/* Loading */}
      {!ready && (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)' }}>
          Loading…
        </div>
      )}

      {/* Empty state */}
      {ready && bookmarks.length === 0 && (
        <div
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--gold-border)',
            borderRadius: '14px',
          }}
        >
          <div
            style={{
              marginBottom: '16px',
              color: 'var(--gold)',
              opacity: 0.35,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-lora)',
              color: 'var(--ink-secondary)',
              fontSize: '0.95rem',
              marginBottom: '20px',
              lineHeight: 1.7,
            }}
          >
            No bookmarks yet.
            <br />
            Tap the bookmark icon on any hadith to save it here.
          </p>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: '0.88rem',
              color: 'var(--gold)',
              textDecoration: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid var(--gold-border)',
              background: 'var(--bg-hover)',
            }}
          >
            Browse collections →
          </Link>
        </div>
      )}

      {/* Bookmark list */}
      {ready && bookmarks.length > 0 && (
        <div className="flex flex-col gap-4">
          {bookmarks.map((b) => (
            <article
              key={b.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--gold-border)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemove(b)}
                title="Remove bookmark"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gold)',
                  padding: '4px',
                  borderRadius: '5px',
                  transition: 'opacity 0.15s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
                </svg>
              </button>

              {/* Arabic */}
              <div
                dir="rtl"
                lang="ar"
                className="arabic-text"
                style={{
                  fontSize: 'var(--reader-ar-size, 1.5rem)',
                  paddingRight: '28px',
                  marginBottom: '4px',
                }}
              >
                {b.arabicText}
              </div>

              <div className="gold-divider" />

              {/* English */}
              <p style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--reader-en-size, 0.95rem)', lineHeight: '1.75', color: 'var(--ink)' }}>
                {b.englishText}
              </p>

              {/* Reference footer */}
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--gold-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href={`/hadith/${b.bookSlug}`}
                  style={{ fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {b.bookTitle}
                </Link>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>·</span>
                <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  Hadith #{b.idInBook}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-lora)', fontSize: '0.7rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  Saved {new Date(b.addedAt).toLocaleDateString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
