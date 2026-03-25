// apps/web/app/tafseer/page.tsx
// Tafseer index — lists all 6 books, mirrors /hadith (collections index).

import type { Metadata } from 'next';
import Link from 'next/link';
import { TAFSEER_COLLECTIONS, TafseerCollectionMeta } from '@/lib/tafseer-types';
import { isTafseerAvailable } from '@/lib/tafseer';

export const metadata: Metadata = {
  title: 'Tafseer | IQRA Digital',
  description: 'Read classical Tafseer from 6 scholarly editions for all 114 surahs.',
};

export default function TafseerIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <div dir="rtl" lang="ar" style={{
          fontFamily: 'var(--font-amiri)', fontSize: '2rem',
          color: 'var(--gold)', lineHeight: 1.8, marginBottom: '4px',
        }}>
          كتب التفسير
        </div>
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '8px' }}>
          Tafseer
        </h1>
        <p style={{
          fontFamily: 'var(--font-lora)', fontStyle: 'italic',
          fontSize: '0.88rem', color: 'var(--ink-muted)',
        }}>
          6 scholarly editions · English · Arabic · Urdu · 114 surahs each
        </p>
      </header>

      {/* Book cards — mirrors hadith collection cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {TAFSEER_COLLECTIONS.map(book => {
          const available = isTafseerAvailable(book.id);
          return (
            <TafseerBookCard
              key={book.id}
              book={book}
              available={available}
            />
          );
        })}
      </div>

      {/* Search shortcut */}
      <div style={{
        marginTop: '40px',
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--gold-border)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
            Search across all Tafseer editions
          </span>
        </div>
        <Link href="/search?src=tafseer" style={{
          fontFamily: 'var(--font-lora)', fontSize: '0.82rem',
          color: 'var(--gold)', textDecoration: 'none',
          padding: '5px 14px', border: '1px solid var(--gold-border)',
          borderRadius: '8px', background: 'var(--bg-card)',
          whiteSpace: 'nowrap',
        }}>
          Search Tafseer →
        </Link>
      </div>
    </div>
  );
}

function TafseerBookCard({
  book, available,
}: { book: TafseerCollectionMeta; available: boolean }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       `1px solid ${book.borderColor}`,
      borderLeft:   `4px solid ${book.accentColor}`,
      borderRadius: '12px',
      padding:      '18px 20px',
      opacity:      available ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>

        {/* Language badge */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
          background: book.bgColor, border: `1px solid ${book.borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-lora)', fontSize: '0.65rem',
          fontWeight: 600, color: book.accentColor, textAlign: 'center',
          lineHeight: 1.2,
        }}>
          {book.lang.toUpperCase()}
        </div>

        {/* Book info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: 'var(--font-lora)', fontSize: '1.05rem',
              fontWeight: 600, color: 'var(--ink-primary)', margin: 0,
            }}>
              {book.name}
            </h2>
            <span style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.68rem',
              color: book.accentColor, background: book.bgColor,
              border: `1px solid ${book.borderColor}`,
              borderRadius: '20px', padding: '1px 8px',
            }}>
              {book.level}
            </span>
            {!available && (
              <span style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.68rem',
                color: 'var(--ink-muted)', border: '1px solid var(--gold-border)',
                borderRadius: '20px', padding: '1px 8px',
              }}>
                Not downloaded
              </span>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-amiri)', fontSize: '0.95rem',
            color: 'var(--ink-muted)', marginBottom: '6px',
          }}>
            {book.arabicName}
          </div>
          <p style={{
            fontFamily: 'var(--font-lora)', fontStyle: 'italic',
            fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: 0,
          }}>
            {book.author}
          </p>
          <p style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.8rem',
            color: 'var(--ink-muted)', margin: '6px 0 0', lineHeight: 1.6,
          }}>
            {book.description}
          </p>
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {available ? (
            <Link href={`/tafseer/${book.id}`} style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.82rem',
              color: book.accentColor, textDecoration: 'none',
              padding: '7px 16px',
              border: `1px solid ${book.borderColor}`,
              borderRadius: '8px', background: book.bgColor,
              display: 'inline-block', whiteSpace: 'nowrap',
            }}>
              Read →
            </Link>
          ) : (
            <span style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.78rem',
              color: 'var(--ink-muted)', padding: '7px 16px',
              border: '1px solid var(--gold-border)', borderRadius: '8px',
              display: 'inline-block', whiteSpace: 'nowrap',
            }}>
              Download first
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
