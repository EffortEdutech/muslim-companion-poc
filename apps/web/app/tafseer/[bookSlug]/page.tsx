// apps/web/app/tafseer/[bookSlug]/page.tsx
// Surah browser for one tafseer edition.
// Mirrors /hadith/[bookSlug] — list of chapters (surahs) to browse.

import type { Metadata } from 'next';
import { notFound }      from 'next/navigation';
import Link              from 'next/link';
import { getTafseerById }        from '@/lib/tafseer-types';
import { loadTafseerBookIndex, isTafseerAvailable } from '@/lib/tafseer';

interface PageProps {
  params: Promise<{ bookSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = getTafseerById(bookSlug);
  if (!book) return {};
  return {
    title: `${book.name} | Tafseer | IQRA Digital`,
    description: `Browse all 114 surahs of ${book.name} by ${book.author}.`,
  };
}

export default async function TafseerBookPage({ params }: PageProps) {
  const { bookSlug } = await params;

  const book = getTafseerById(bookSlug);
  if (!book) notFound();

  const available = isTafseerAvailable(book.id);

  if (!available) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '16px' }}>⚠</div>
        <h1 className="page-heading" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
          Edition Not Downloaded
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--ink)' }}>{book.name}</strong> has not been downloaded yet.
        </p>
        <code style={{
          display: 'block', fontFamily: 'monospace', fontSize: '0.88rem',
          color: 'var(--gold)', background: 'var(--bg-card)',
          padding: '10px 20px', borderRadius: '8px',
          border: '1px solid var(--gold-border)', marginBottom: '24px',
        }}>
          node scripts/tafsir/download-tafsir.js --edition={book.id}
        </code>
        <Link href="/tafseer" style={{
          color: 'var(--gold)', fontFamily: 'var(--font-lora)', textDecoration: 'none',
        }}>
          ← Back to Tafseer
        </Link>
      </div>
    );
  }

  const index = loadTafseerBookIndex(book.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href="/tafseer" style={{
          fontFamily: 'var(--font-lora)', fontSize: '0.82rem',
          color: 'var(--ink-muted)', textDecoration: 'none',
        }}>
          Tafseer
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
          {book.name}
        </span>
      </nav>

      {/* Book header */}
      <header style={{ marginBottom: '36px' }}>
        <div dir={book.lang === 'ar' || book.lang === 'ur' ? 'rtl' : 'ltr'} lang={book.lang}
          style={{
            fontFamily:   'var(--font-amiri)',
            fontSize:     '2rem',
            color:        book.accentColor,
            lineHeight:   1.8,
            marginBottom: '6px',
          }}>
          {book.arabicName}
        </div>
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '6px' }}>
          {book.name}
        </h1>
        <p style={{
          fontFamily: 'var(--font-lora)', fontStyle: 'italic',
          color: 'var(--ink-secondary)', fontSize: '0.92rem', marginBottom: '12px',
        }}>
          {book.author}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.78rem',
            color: book.accentColor, background: book.bgColor,
            border: `1px solid ${book.borderColor}`,
            borderRadius: '20px', padding: '3px 12px',
          }}>
            {book.language}
          </span>
          <span style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.78rem',
            color: book.accentColor, background: book.bgColor,
            border: `1px solid ${book.borderColor}`,
            borderRadius: '20px', padding: '3px 12px',
          }}>
            {book.level}
          </span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {index?.totalSurahs ?? 114} surahs
          </span>
        </div>
      </header>

      {/* Surah sidebar list */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '2px',
      }}>
        {(index?.surahs ?? []).map((s: any) => (
          <Link
            key={s.surah}
            href={`/tafseer/${book.id}/${s.surah}`}
            className="tafseer-surah-card-link"
            style={{ textDecoration: 'none', opacity: s.available === false ? 0.4 : 1 }}
          >
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              background:   'var(--bg-card)',
              border:       `1px solid ${book.borderColor}`,
              borderRadius: '10px',
              padding:      '11px 14px',
              transition:   'border-color 0.15s, background 0.15s',
            }}>
              {/* Number */}
              <span style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: book.bgColor, border: `1px solid ${book.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-lora)', fontSize: '0.72rem',
                fontWeight: 600, color: book.accentColor,
              }}>
                {s.surah}
              </span>

              {/* Names */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-amiri)', fontSize: '0.95rem',
                  color: 'var(--ink-primary)', direction: 'rtl', textAlign: 'right',
                  lineHeight: 1.4,
                }}>
                  {s.nameArabic}
                </div>
                <div style={{
                  fontFamily: 'var(--font-lora)', fontSize: '0.75rem',
                  color: 'var(--ink-secondary)', marginTop: '1px',
                }}>
                  {s.nameEnglish}
                </div>
              </div>

              {/* Ayah count */}
              <span style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.65rem',
                color: 'var(--ink-muted)', flexShrink: 0,
              }}>
                {s.ayahCount}v
              </span>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .tafseer-surah-row:hover {
          background: var(--bg-hover) !important;
          border-left-color: var(--gold) !important;
        }
        .tafseer-surah-row:hover span:first-of-type {
          color: var(--gold) !important;
        }
      `}</style>

    </div>
  );
}
