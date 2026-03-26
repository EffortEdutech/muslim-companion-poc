// apps/web/app/tafseer/page.tsx
// Tafseer index — lists all editions, shows real availability from disk scan.

import type { Metadata } from 'next';
import Link from 'next/link';
import { TAFSEER_COLLECTIONS, TafseerCollectionMeta } from '@/lib/tafseer-types';
import { scanContentAvailability } from '@/lib/content-availability';

export const metadata: Metadata = {
  title: 'Tafseer | IQRA Digital',
  description: 'Read classical Tafseer from scholarly editions for all 114 surahs.',
};

export default function TafseerIndexPage() {
  const av = scanContentAvailability();

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
          {av.tafseerAvailableCount} of {TAFSEER_COLLECTIONS.length} editions available
          · {av.tafseerEditions.filter(e => e.available).reduce((sum, e) => sum + e.surahCount, 0).toLocaleString()} surah files
        </p>
      </header>

      {/* Edition cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {TAFSEER_COLLECTIONS.map(book => {
          const status = av.tafseerEditions.find(e => e.slug === book.id);
          const available = status?.available ?? false;
          const surahCount = status?.surahCount ?? 0;
          return (
            <TafseerBookCard
              key={book.id}
              book={book}
              available={available}
              surahCount={surahCount}
            />
          );
        })}
      </div>

      {/* Search shortcut */}
      <div style={{
        marginTop: '40px', padding: '16px 20px',
        background: 'var(--bg-card)', border: '1px solid var(--gold-border)',
        borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.88rem', color: 'var(--ink-secondary)', flex: 1 }}>
          Search across all available Tafseer editions
        </span>
        <Link href="/search?src=tafseer" style={{
          fontFamily: 'var(--font-lora)', fontSize: '0.82rem',
          color: 'var(--gold)', textDecoration: 'none',
          padding: '5px 14px', border: '1px solid var(--gold-border)',
          borderRadius: '8px', background: 'var(--bg-card)', whiteSpace: 'nowrap',
        }}>
          Search Tafseer →
        </Link>
      </div>
    </div>
  );
}

function TafseerBookCard({
  book, available, surahCount,
}: { book: TafseerCollectionMeta; available: boolean; surahCount: number }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${available ? book.borderColor : 'var(--gold-border)'}`,
      borderLeft: `4px solid ${available ? book.accentColor : 'var(--gold-border)'}`,
      borderRadius: '12px', padding: '18px 20px',
      opacity: available ? 1 : 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>

        {/* Language badge */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
          background: available ? book.bgColor : 'var(--bg-hover)',
          border: `1px solid ${available ? book.borderColor : 'var(--gold-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-lora)', fontSize: '0.65rem',
          fontWeight: 600, color: available ? book.accentColor : 'var(--ink-muted)',
          textAlign: 'center', lineHeight: 1.2,
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
              color: available ? book.accentColor : 'var(--ink-muted)',
              background: available ? book.bgColor : 'var(--bg-hover)',
              border: `1px solid ${available ? book.borderColor : 'var(--gold-border)'}`,
              borderRadius: '20px', padding: '1px 8px',
            }}>
              {book.level}
            </span>
            {available ? (
              <span style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.68rem',
                color: '#085041', background: '#E1F5EE',
                border: '1px solid #9FE1CB', borderRadius: '20px', padding: '1px 8px',
              }}>
                {surahCount} surahs
              </span>
            ) : (
              <span style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.68rem',
                color: 'var(--ink-muted)', border: '1px solid var(--gold-border)',
                borderRadius: '20px', padding: '1px 8px',
              }}>
                Not downloaded
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-amiri)', fontSize: '0.95rem', color: 'var(--ink-muted)', marginBottom: '4px' }}>
            {book.arabicName}
          </div>
          <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0 0 4px' }}>
            {book.author}
          </p>
          <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)', margin: 0, lineHeight: 1.6 }}>
            {book.description}
          </p>
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {available ? (
            <Link href={`/tafseer/${book.id}`} style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.82rem',
              color: book.accentColor, textDecoration: 'none',
              padding: '7px 16px', border: `1px solid ${book.borderColor}`,
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
              Not available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
