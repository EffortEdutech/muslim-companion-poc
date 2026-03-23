import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { SearchResponse } from '@/lib/types';
import { QuranSearchResult, QuranSearchResponse } from '@/lib/quran-search-types';
import { getCollectionBySlug } from '@/lib/collections';
import HadithCard from '@/components/HadithCard';
import SearchBar from '@/components/SearchBar';
import UnifiedSearchTabs from '@/components/UnifiedSearchTabs';

interface PageProps {
  searchParams: Promise<{
    q?:    string;
    src?:  string;
    book?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search | IQRA Digital` : 'Search | IQRA Digital',
    description: 'Search across hadith collections and the Holy Quran in Arabic, English, and Malay.',
  };
}

type Source = 'all' | 'hadith' | 'quran';

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', src = 'all', book = '', page: pageStr = '1' } = await searchParams;
  const query       = q.trim();
  const source: Source = (src === 'hadith' || src === 'quran') ? src : 'all';
  const currentPage = Math.max(1, parseInt(pageStr, 10));

  let hadithResponse: SearchResponse | null = null;
  let quranResponse:  QuranSearchResponse | null = null;

  if (query.length >= 2) {
    const [h, qr] = await Promise.all([
      (source === 'all' || source === 'hadith')
        ? import('./search-logic').then(m => m.default(query, book, currentPage))
        : Promise.resolve(null),
      (source === 'all' || source === 'quran')
        ? import('@/app/quran/search/search-logic').then(m => m.default(query, currentPage))
        : Promise.resolve(null),
    ]);
    hadithResponse = h;
    quranResponse  = qr;
  }

  const filterCollection = book ? getCollectionBySlug(book) : null;
  const hadithTotal      = hadithResponse?.total ?? 0;
  const quranTotal       = quranResponse?.total  ?? 0;
  const combinedTotal    = hadithTotal + quranTotal;
  const hadithPages      = hadithResponse ? Math.ceil(hadithTotal / hadithResponse.limit) : 0;
  const quranPages       = quranResponse  ? Math.ceil(quranTotal  / quranResponse.limit)  : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      <header className="mb-8">
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', marginBottom: '6px' }}>
          Search
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--ink-muted)', marginBottom: '20px' }}>
          Hadith collections · Holy Quran · Arabic · English · Malay
        </p>

        <Suspense fallback={null}>
          <SearchBar defaultQuery={query} defaultBook={source === 'hadith' ? book : ''} autoFocus={!query} />
        </Suspense>

        {query.length >= 2 && (
          <div style={{ marginTop: '20px' }}>
            <Suspense fallback={null}>
              <UnifiedSearchTabs query={query} source={source} book={book} hadithTotal={hadithTotal} quranTotal={quranTotal} />
            </Suspense>
          </div>
        )}
      </header>

      {/* Empty state */}
      {!query && (
        <div style={{ marginTop: '48px', textAlign: 'center', padding: '60px 20px' }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '2.2rem', color: 'var(--gold)', opacity: 0.45, marginBottom: '20px', lineHeight: 2 }}>
            ابحث في الأحاديث والقرآن
          </div>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.7 }}>
            Search hadith and Quran in Arabic or English. Use{' '}
            <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>2:255</span>{' '}
            to jump to a specific ayah, or{' '}
            <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>#33</span>{' '}
            for a hadith by number.
          </p>
        </div>
      )}

      {/* Results */}
      {query.length >= 2 && (hadithResponse || quranResponse) && (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              {combinedTotal === 0
                ? <>No results for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></>
                : source === 'all'
                ? <><strong style={{ color: 'var(--gold)' }}>{combinedTotal.toLocaleString()}</strong> result{combinedTotal !== 1 ? 's' : ''} for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></>
                : source === 'hadith'
                ? <><strong style={{ color: 'var(--gold)' }}>{hadithTotal.toLocaleString()}</strong> hadith result{hadithTotal !== 1 ? 's' : ''} for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong>{filterCollection && <> in <strong style={{ color: 'var(--ink)' }}>{filterCollection.displayName}</strong></>}</>
                : <><strong style={{ color: 'var(--gold)' }}>{quranTotal.toLocaleString()}</strong> Quran result{quranTotal !== 1 ? 's' : ''} for <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></>
              }
            </div>
            {book && source === 'hadith' && (
              <Link href={`/search?q=${encodeURIComponent(query)}&src=hadith`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
                ✕ Remove filter
              </Link>
            )}
          </div>

          {/* Zero results */}
          {combinedTotal === 0 && (
            <div style={{ padding: '32px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--gold-border)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.92rem', marginBottom: '14px', lineHeight: 1.7 }}>
                No results found. Try without diacritics, a different keyword, or a reference like <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>2:255</span>.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none' }}>Browse hadith →</Link>
                <Link href="/quran" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none' }}>Browse Quran →</Link>
              </div>
            </div>
          )}

          {/* QURAN results */}
          {quranResponse && quranResponse.results.length > 0 && (
            <section style={{ marginBottom: source === 'all' && (hadithResponse?.results.length ?? 0) > 0 ? '44px' : '0' }}>
              {source === 'all' && (
                <SectionHeading label="Quran" labelAr="القرآن الكريم" count={quranTotal} allHref={`/search?q=${encodeURIComponent(query)}&src=quran`} />
              )}
              <div className="flex flex-col gap-5">
                {quranResponse.results.map((result, idx) => (
                  <AyahResultCard key={`q-${result.surah}-${result.ayah}-${idx}`} result={result} query={query} />
                ))}
              </div>
              {source === 'quran' && quranPages > 1 && (
                <PaginationRow currentPage={currentPage} totalPages={quranPages} buildUrl={(p) => buildUrl(query, 'quran', '', p)} />
              )}
              {source === 'all' && quranTotal > quranResponse.results.length && (
                <SeeAllLink href={`/search?q=${encodeURIComponent(query)}&src=quran`} count={quranTotal} label="Quran results" />
              )}
            </section>
          )}

          {/* HADITH results */}
          {hadithResponse && hadithResponse.results.length > 0 && (
            <section>
              {source === 'all' && (
                <SectionHeading label="Hadith" labelAr="الحديث" count={hadithTotal} allHref={`/search?q=${encodeURIComponent(query)}&src=hadith`} />
              )}
              <div className="flex flex-col gap-5">
                {hadithResponse.results.map((result, idx) => (
                  <HadithCard
                    key={`h-${result.bookSlug}-${result.hadith.id}-${idx}`}
                    hadith={result.hadith}
                    bookSlug={result.bookSlug}
                    bookTitle={result.bookTitle}
                    chapterTitle={result.chapterTitle}
                    showReference={true}
                    showBookmark={true}
                    highlight={query}
                  />
                ))}
              </div>
              {source === 'hadith' && hadithPages > 1 && (
                <PaginationRow currentPage={currentPage} totalPages={hadithPages} buildUrl={(p) => buildUrl(query, 'hadith', book, p)} />
              )}
              {source === 'all' && hadithTotal > hadithResponse.results.length && (
                <SeeAllLink href={`/search?q=${encodeURIComponent(query)}&src=hadith`} count={hadithTotal} label="hadith results" />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────
function SectionHeading({ label, labelAr, count, allHref }: { label: string; labelAr: string; count: number; allHref: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--gold-border)', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <h2 className="page-heading" style={{ fontSize: '1.2rem' }}>{label}</h2>
        <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1rem', color: 'var(--gold)' }}>{labelAr}</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{count.toLocaleString()} result{count !== 1 ? 's' : ''}</span>
      </div>
      <Link href={allHref} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none' }}>See all →</Link>
    </div>
  );
}

// ── See all link ───────────────────────────────────────────────────
function SeeAllLink({ href, count, label }: { href: string; count: number; label: string }) {
  return (
    <div style={{ marginTop: '16px', textAlign: 'center' }}>
      <Link href={href} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none', padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--gold-border)', background: 'var(--bg-card)' }}>
        See all {count.toLocaleString()} {label} →
      </Link>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────
function PaginationRow({ currentPage, totalPages, buildUrl }: { currentPage: number; totalPages: number; buildUrl: (p: number) => string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--gold-border)' }}>
      {currentPage > 1 && <PageLink href={buildUrl(currentPage - 1)} label="← Previous" />}
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + Math.max(1, currentPage - 3);
        if (p > totalPages) return null;
        return <PageLink key={p} href={buildUrl(p)} label={String(p)} active={p === currentPage} />;
      })}
      {currentPage < totalPages && <PageLink href={buildUrl(currentPage + 1)} label="Next →" />}
    </div>
  );
}

function PageLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: active ? '#0d1117' : 'var(--gold)', textDecoration: 'none', padding: '7px 13px', borderRadius: '8px', border: '1px solid var(--gold-border)', background: active ? 'var(--gold)' : 'var(--bg-card)', fontWeight: active ? 600 : 400 }}>
      {label}
    </Link>
  );
}

function buildUrl(query: string, src: string, book: string, page: number): string {
  const p = new URLSearchParams({ q: query, src });
  if (book) p.set('book', book);
  if (page > 1) p.set('page', String(page));
  return `/search?${p.toString()}`;
}

// ── Quran ayah result card ─────────────────────────────────────────
function AyahResultCard({ result, query }: { result: QuranSearchResult; query: string }) {
  const toAr = (n: number) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  return (
    <article className="hadith-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
        <div style={{ background: 'rgba(200,168,75,0.10)', border: '1px solid var(--gold-border-strong)', borderRadius: '8px', padding: '4px 10px', flexShrink: 0, fontFamily: 'var(--font-lora)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)' }}>
          {result.surah}:{result.ayah}
        </div>
        <Link href={`/quran/${result.surah}#ayah-${result.ayah}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-secondary)', textDecoration: 'none', marginTop: '4px', textAlign: 'right' }}>
          {result.surahName} →
        </Link>
      </div>
      <div dir="rtl" lang="ar" className="arabic-text" style={{ fontSize: 'var(--reader-ar-size, 1.65rem)', lineHeight: '2.6', marginBottom: '4px' }}>
        {result.arabic}
        <span style={{ fontSize: '0.75em', color: 'var(--gold)', marginRight: '6px', opacity: 0.6 }}>﴿{toAr(result.ayah)}﴾</span>
      </div>
      <div className="gold-divider" />
      <p style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--reader-en-size, 0.97rem)', lineHeight: '1.78', color: 'var(--ink)' }}>
        {hlText(result.en_sahih, query)}
      </p>
      <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: 'calc(var(--reader-en-size, 0.97rem) * 0.92)', lineHeight: '1.7', color: 'var(--ink-secondary)', marginTop: '8px' }}>
        {hlText(result.ms_basmeih, query)}
      </p>
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span className="badge-group" style={{ fontSize: '0.65rem' }}>Quran</span>
        <Link href={`/quran/${result.surah}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>{result.surahName}</Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.73rem' }}>·</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--ink-muted)' }}>Ayah {result.ayah}</span>
      </div>
    </article>
  );
}

function hlText(text: string, query: string): React.ReactNode {
  if (!text || !query || query.length < 2) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return text;
  const re    = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(re);
  return <>{parts.map((p, i) => re.test(p) ? <mark key={i} style={{ background: 'rgba(200,168,75,0.22)', color: 'var(--gold-light)', borderRadius: '2px', padding: '0 2px' }}>{p}</mark> : p)}</>;
}
