import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import searchQuran from './search-logic';
import { QuranSearchResult } from '@/lib/quran-search-types';
import { TRANSLATION_LABELS, TranslationKey } from '@/lib/quran-types';
import QuranSearchBar from '@/components/QuranSearchBar';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Quran Search | IQRA Digital` : 'Search Quran | IQRA Digital',
    description: 'Search across the Holy Quran in Arabic, English and Malay.',
  };
}

const DISPLAY_TRANSLATIONS: TranslationKey[] = ['en_sahih', 'ms_basmeih'];

export default async function QuranSearchPage({ searchParams }: PageProps) {
  const { q = '', page: pageStr = '1' } = await searchParams;
  const query       = q.trim();
  const currentPage = Math.max(1, parseInt(pageStr, 10));

  const response = query.length >= 2
    ? searchQuran(query, currentPage)
    : null;

  const totalPages = response
    ? Math.ceil(response.total / response.limit)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <header className="mb-8">
        <nav style={{ marginBottom: '18px' }}>
          <Link href="/quran" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>Quran</Link>
          <span style={{ color: 'var(--ink-muted)', margin: '0 8px', fontSize: '0.82rem' }}>›</span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>Search</span>
        </nav>

        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '6px' }}>
          Search the Quran
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '24px' }}>
          Arabic · Sahih International · Yusuf Ali · Basmeih (Malay)
        </p>

        <Suspense fallback={null}>
          <QuranSearchBar defaultQuery={query} autoFocus={!query} />
        </Suspense>
      </header>

      {/* Empty state */}
      {!query && (
        <div style={{ textAlign: 'center', padding: '56px 20px' }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '2rem', color: 'var(--gold)', opacity: 0.35, lineHeight: 2, marginBottom: '16px' }}>
            ابحث في القرآن الكريم
          </div>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.7 }}>
            Search in Arabic (with or without diacritics), English, or Malay.
            Use <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>2:255</span> format to jump straight to an ayah.
          </p>
        </div>
      )}

      {/* Results */}
      {response && (
        <>
          {/* Summary row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
              {response.total === 0
                ? <>No results for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></>
                : <><strong style={{ color: 'var(--gold)' }}>{response.total.toLocaleString()}</strong> result{response.total !== 1 ? 's' : ''} for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></>
              }
            </p>
            {response.total > 0 && totalPages > 1 && (
              <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* No results */}
          {response.total === 0 && (
            <div style={{ padding: '32px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--gold-border)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: 1.7 }}>
                No ayahs matched. Try without diacritics, a different keyword, or a surah:ayah reference.
              </p>
              <Link href="/quran" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none' }}>
                Browse all surahs →
              </Link>
            </div>
          )}

          {/* Result cards */}
          {response.results.length > 0 && (
            <div className="flex flex-col gap-5">
              {response.results.map((result, idx) => (
                <AyahResult
                  key={`${result.surah}-${result.ayah}-${idx}`}
                  result={result}
                  query={query}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--gold-border)' }}>
              {currentPage > 1 && (
                <PageLink href={buildUrl(query, currentPage - 1)} label="← Previous" />
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + Math.max(1, currentPage - 3);
                if (p > totalPages) return null;
                return <PageLink key={p} href={buildUrl(query, p)} label={String(p)} active={p === currentPage} />;
              })}
              {currentPage < totalPages && (
                <PageLink href={buildUrl(query, currentPage + 1)} label="Next →" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Ayah result card ───────────────────────────────────────────────

function AyahResult({ result, query }: { result: QuranSearchResult; query: string }) {
  return (
    <article className="hadith-card">

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
        {/* Surah:Ayah badge */}
        <div style={{
          background: 'rgba(200,168,75,0.10)', border: '1px solid var(--gold-border-strong)',
          borderRadius: '8px', padding: '4px 10px', flexShrink: 0,
          fontFamily: 'var(--font-lora)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)',
        }}>
          {result.surah}:{result.ayah}
        </div>

        {/* Surah name */}
        <Link
          href={`/quran/${result.surah}#ayah-${result.ayah}`}
          style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-secondary)', textDecoration: 'none', marginTop: '4px', textAlign: 'right' }}
        >
          {result.surahName} →
        </Link>
      </div>

      {/* Arabic */}
      <div dir="rtl" lang="ar" className="arabic-text" style={{ fontSize: 'var(--reader-ar-size, 1.7rem)', lineHeight: '2.7', marginBottom: '4px' }}>
        {highlightArabic(result.arabic, query)}
        <span style={{ fontSize: '0.75em', color: 'var(--gold)', marginRight: '6px', opacity: 0.6 }}>
          ﴿{toArabicNumeral(result.ayah)}﴾
        </span>
      </div>

      <div className="gold-divider" />

      {/* Sahih International */}
      <p style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--reader-en-size, 0.97rem)', lineHeight: '1.78', color: 'var(--ink)', marginBottom: '4px' }}>
        {highlight(result.en_sahih, query)}
      </p>

      {/* Malay */}
      <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: 'calc(var(--reader-en-size, 0.97rem) * 0.92)', lineHeight: '1.7', color: 'var(--ink-secondary)', marginTop: '8px' }}>
        {highlight(result.ms_basmeih, query)}
      </p>

      {/* Reference footer */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href={`/quran/${result.surah}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
          Surah {result.surahName}
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.73rem' }}>·</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
          Ayah {result.ayah}
        </span>
      </div>
    </article>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function buildUrl(query: string, page: number): string {
  const p = new URLSearchParams({ q: query });
  if (page > 1) p.set('page', String(page));
  return `/quran/search?${p.toString()}`;
}

function PageLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      fontFamily: 'var(--font-lora)', fontSize: '0.85rem',
      color: active ? '#0d1117' : 'var(--gold)', textDecoration: 'none',
      padding: '7px 13px', borderRadius: '8px',
      border: '1px solid var(--gold-border)',
      background: active ? 'var(--gold)' : 'var(--bg-card)',
      fontWeight: active ? 600 : 400,
    }}>
      {label}
    </Link>
  );
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return text;
  const re    = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p)
          ? <mark key={i} style={{ background: 'rgba(200,168,75,0.22)', color: 'var(--gold-light)', borderRadius: '2px', padding: '0 2px' }}>{p}</mark>
          : p
      )}
    </>
  );
}

function highlightArabic(text: string, query: string): React.ReactNode {
  // Only attempt Arabic highlighting if query looks Arabic
  if (!query || !/[\u0600-\u06FF]/.test(query)) return text;
  return highlight(text, query);
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}
