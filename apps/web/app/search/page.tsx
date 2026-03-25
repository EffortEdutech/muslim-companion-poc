// apps/web/app/search/page.tsx
// Phase 2 complete — Quran + Tafseer + Hadith + cross-reference "Related Hadith"

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { SearchResponse } from '@/lib/types';
import { QuranSearchResult, QuranSearchResponse } from '@/lib/quran-search-types';
import { TafseerSearchResult, TafseerSearchResponse } from '@/lib/tafseer-search-types';
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
    title: q ? `"${q}" – Search | IQRA Digital` : 'Search | IQRA Digital',
    description: 'Search across Quran, Tafseer, and Hadith in Arabic, English, Malay, Indonesian, Urdu, French, and Spanish.',
  };
}

type Source = 'all' | 'hadith' | 'quran' | 'tafseer';

// ── Cross-reference loader (cached) ───────────────────────────────────────────
type CrossRef = Record<string, Array<{ bs: string; ib: number; bsh: string }>>;
let _crossRefCache: CrossRef | null = null;

function loadCrossRef(): CrossRef {
  if (_crossRefCache) return _crossRefCache;
  try {
    const p = path.join(
      process.env.REPO_ROOT || path.join(process.cwd(), '..', '..'),
      'content', 'quran', 'db', 'metadata', 'cross-ref.json'
    );
    if (fs.existsSync(p)) {
      _crossRefCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return _crossRefCache!;
    }
  } catch {}
  return {};
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', src = 'all', book = '', page: pageStr = '1' } = await searchParams;
  const query       = q.trim();
  const source: Source = (['hadith', 'quran', 'tafseer'] as const).includes(src as Source)
    ? src as Source : 'all';
  const currentPage = Math.max(1, parseInt(pageStr, 10));

  let hadithResponse:  SearchResponse        | null = null;
  let quranResponse:   QuranSearchResponse   | null = null;
  let tafseerResponse: TafseerSearchResponse | null = null;

  if (query.length >= 2) {
    const [h, qr, tr] = await Promise.all([
      (source === 'all' || source === 'hadith')
        ? import('./search-logic').then(m => m.default(query, book, currentPage))
        : Promise.resolve(null),
      (source === 'all' || source === 'quran')
        ? import('@/app/quran/search/search-logic').then(m => m.default(query, currentPage))
        : Promise.resolve(null),
      (source === 'all' || source === 'tafseer')
        ? import('@/app/tafseer/search/search-logic').then(m => m.default(query, currentPage))
        : Promise.resolve(null),
    ]);
    hadithResponse  = h;
    quranResponse   = qr;
    tafseerResponse = tr;
  }

  const crossRef       = loadCrossRef();
  const filterCollection = book ? getCollectionBySlug(book) : null;
  const hadithTotal    = hadithResponse?.total   ?? 0;
  const quranTotal     = quranResponse?.total    ?? 0;
  const tafseerTotal   = tafseerResponse?.total  ?? 0;
  const combinedTotal  = hadithTotal + quranTotal + tafseerTotal;
  const hadithPages    = hadithResponse  ? Math.ceil(hadithTotal  / hadithResponse.limit)  : 0;
  const quranPages     = quranResponse   ? Math.ceil(quranTotal   / quranResponse.limit)   : 0;
  const tafseerPages   = tafseerResponse ? Math.ceil(tafseerTotal / tafseerResponse.limit) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', marginBottom: '6px' }}>
          Search
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--ink-muted)', marginBottom: '20px' }}>
          Quran · Tafseer · Hadith · Arabic · English · Malay · Indonesian · Urdu · French · Spanish
        </p>

        <Suspense fallback={null}>
          <SearchBar defaultQuery={query} defaultBook={source === 'hadith' ? book : ''} autoFocus={!query} />
        </Suspense>

        {query.length >= 2 && (
          <div style={{ marginTop: '20px' }}>
            <Suspense fallback={null}>
              <UnifiedSearchTabs
                query={query} source={source} book={book}
                hadithTotal={hadithTotal} quranTotal={quranTotal} tafseerTotal={tafseerTotal}
              />
            </Suspense>
          </div>
        )}
      </header>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!query && (
        <div style={{ marginTop: '48px', textAlign: 'center', padding: '60px 20px' }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '2.2rem', color: 'var(--gold)', opacity: 0.45, marginBottom: '20px', lineHeight: 2 }}>
            ابحث في القرآن والتفسير والأحاديث
          </div>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
            Search Quran, Tafseer, and Hadith in Arabic or English. Use{' '}
            <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>2:255</span>{' '}
            to jump to a specific ayah, or{' '}
            <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>#33</span>{' '}
            for a hadith by number.
          </p>
          {/* Quick searches */}
          <div style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['mercy', 'patience', 'prayer', 'knowledge', '2:255', 'الإخلاص'].map(term => (
              <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--gold)',
                border: '1px solid var(--gold-border)', borderRadius: '20px', padding: '4px 14px',
                textDecoration: 'none', background: 'var(--bg-card)',
              }}>
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── No results ─────────────────────────────────────────────────────── */}
      {query.length >= 2 && combinedTotal === 0 && (
        <div style={{ marginTop: '48px', textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            No results found for <strong style={{ color: 'var(--gold)' }}>&ldquo;{query}&rdquo;</strong>
          </p>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
            Try a different spelling, a shorter phrase, or search in Arabic.
          </p>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {query.length >= 2 && combinedTotal > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* QURAN */}
          {quranResponse && quranResponse.results.length > 0 && (source === 'all' || source === 'quran') && (
            <section>
              {source === 'all' && (
                <SectionHeading label="Quran" count={quranTotal}
                  href={`/search?q=${encodeURIComponent(query)}&src=quran`} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quranResponse.results.map(r => (
                  <QuranResultCard
                    key={`${r.surah}:${r.ayah}`}
                    result={r} query={query}
                    relatedHadith={crossRef[`${r.surah}:${r.ayah}`] || []}
                  />
                ))}
              </div>
              {source === 'quran' && quranPages > 1 && (
                <PaginationBar page={currentPage} totalPages={quranPages} query={query} src="quran" />
              )}
            </section>
          )}

          {/* TAFSEER */}
          {tafseerResponse && tafseerResponse.results.length > 0 && (source === 'all' || source === 'tafseer') && (
            <section>
              {source === 'all' && (
                <SectionHeading label="Tafseer" count={tafseerTotal}
                  href={`/search?q=${encodeURIComponent(query)}&src=tafseer`} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tafseerResponse.results.map(r => (
                  <TafseerResultCard key={`t:${r.surah}:${r.ayah}`} result={r} query={query} />
                ))}
              </div>
              {source === 'tafseer' && tafseerPages > 1 && (
                <PaginationBar page={currentPage} totalPages={tafseerPages} query={query} src="tafseer" />
              )}
            </section>
          )}

          {/* HADITH */}
          {hadithResponse && hadithResponse.results.length > 0 && (source === 'all' || source === 'hadith') && (
            <section>
              {source === 'all' && (
                <SectionHeading label="Hadith" count={hadithTotal}
                  href={`/search?q=${encodeURIComponent(query)}&src=hadith`} />
              )}
              {filterCollection && (
                <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '12px' }}>
                  Filtered: {filterCollection.displayName}
                  <Link href={`/search?q=${encodeURIComponent(query)}&src=hadith`}
                    style={{ color: 'var(--gold)', marginLeft: '8px', fontSize: '0.8rem' }}>
                    Clear
                  </Link>
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {hadithResponse.results.map(r => (
                  <HadithCard
                    key={`${r.bookSlug}-${r.hadith.id}-${r.hadith.idInBook}`}
                    hadith={r.hadith}
                    bookSlug={r.bookSlug}
                    bookTitle={r.bookTitle}
                    chapterTitle={r.chapterTitle}
                    showReference={true}
                    showBookmark={true}
                    highlight={query}
                  />
                ))}
              </div>
              {source === 'hadith' && hadithPages > 1 && (
                <PaginationBar page={currentPage} totalPages={hadithPages} query={query} src="hadith" book={book} />
              )}
            </section>
          )}

        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeading({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
      <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
        {label}
      </h2>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        {count.toLocaleString()} result{count !== 1 ? 's' : ''}
      </span>
      {count > 20 && (
        <Link href={href} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--gold)', marginLeft: 'auto', textDecoration: 'none' }}>
          See all →
        </Link>
      )}
    </div>
  );
}

function highlightText(text: string, query: string): string {
  if (!text || !query) return text || '';
  const terms = query.trim().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return text;
  const pattern = new RegExp(
    `(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  return text.replace(pattern, '<mark style="background:rgba(200,168,75,0.25);color:inherit;border-radius:2px;padding:0 1px;">$1</mark>');
}

function QuranResultCard({
  result, query, relatedHadith,
}: {
  result: QuranSearchResult;
  query: string;
  relatedHadith: Array<{ bs: string; ib: number; bsh: string }>;
}) {
  const highlighted = highlightText(result.en_sahih || result.en_yusufali || '', query);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--gold-border)',
      borderRadius: '10px', padding: '16px 18px',
    }}>
      {/* Reference row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <Link href={`/quran/${result.surah}?ayah=${result.ayah}`} style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: '#0d1117',
            background: 'var(--gold)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
          }}>
            {result.surahName} {result.surah}:{result.ayah}
          </span>
        </Link>

        {/* Cross-reference badge */}
        {relatedHadith.length > 0 && (
          <Link
            href={`/search?q=${encodeURIComponent(`${result.surah}:${result.ayah}`)}&src=hadith`}
            style={{ textDecoration: 'none' }}
          >
            <span style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.7rem', color: 'var(--gold)',
              border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(200,168,75,0.06)', cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: '4px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {relatedHadith.length} related hadith
            </span>
          </Link>
        )}
      </div>

      {/* Arabic */}
      {result.arabic && (
        <Link href={`/quran/${result.surah}?ayah=${result.ayah}`} style={{ textDecoration: 'none' }}>
          <p dir="rtl" lang="ar" style={{
            fontFamily: 'var(--font-amiri)', fontSize: '1.25rem', color: 'var(--ink-primary)',
            lineHeight: 2, marginBottom: '8px', margin: '0 0 8px',
          }}>
            {result.arabic}
          </p>
        </Link>
      )}

      {/* Translation */}
      {highlighted && (
        <Link href={`/quran/${result.surah}?ayah=${result.ayah}`} style={{ textDecoration: 'none' }}>
          <p
            style={{ fontFamily: 'var(--font-lora)', fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: 1.65, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </Link>
      )}

      {/* Related hadith preview (top 3) */}
      {relatedHadith.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--gold-border)' }}>
          <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.72rem', color: 'var(--ink-muted)', marginBottom: '6px' }}>
            Related Hadith:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {relatedHadith.slice(0, 3).map((ref, i) => (
              <Link
                key={i}
                href={`/hadith/${ref.bs}?page=1#${ref.ib}`}
                style={{
                  fontFamily: 'var(--font-lora)', fontSize: '0.72rem', color: 'var(--gold)',
                  border: '1px solid var(--gold-border)', borderRadius: '6px',
                  padding: '2px 8px', textDecoration: 'none', background: 'var(--bg-surface)',
                }}
              >
                {ref.bsh} #{ref.ib}
              </Link>
            ))}
            {relatedHadith.length > 3 && (
              <Link
                href={`/search?q=${encodeURIComponent(`${result.surah}:${result.ayah}`)}&src=hadith`}
                style={{
                  fontFamily: 'var(--font-lora)', fontSize: '0.72rem', color: 'var(--ink-muted)',
                  border: '1px solid var(--gold-border)', borderRadius: '6px',
                  padding: '2px 8px', textDecoration: 'none', background: 'var(--bg-surface)',
                }}
              >
                +{relatedHadith.length - 3} more →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TafseerResultCard({ result, query }: { result: TafseerSearchResult; query: string }) {
  const highlighted = highlightText(result.text, query);
  return (
    <Link href={`/tafseer/${result.surah}?ayah=${result.ayah}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--gold-border)',
        borderRadius: '10px', padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: '#0d1117',
            background: 'var(--gold)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
          }}>
            {result.surahName} {result.surah}:{result.ayah}
          </span>
          <span style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.7rem', color: 'var(--ink-muted)',
            border: '1px solid var(--gold-border)', padding: '1px 7px', borderRadius: '20px',
          }}>
            Tafseer · Al-Jalalayn
          </span>
        </div>
        <p
          style={{ fontFamily: 'var(--font-lora)', fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: 1.65, margin: 0 }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </Link>
  );
}

function PaginationBar({
  page, totalPages, query, src, book = '',
}: { page: number; totalPages: number; query: string; src: string; book?: string }) {
  const bookParam = book ? `&book=${book}` : '';
  const base      = `/search?q=${encodeURIComponent(query)}&src=${src}${bookParam}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
      {page > 1 && (
        <Link href={`${base}&page=${page - 1}`} style={{
          fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)',
          textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--gold-border)', borderRadius: '6px',
        }}>← Previous</Link>
      )}
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={`${base}&page=${page + 1}`} style={{
          fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)',
          textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--gold-border)', borderRadius: '6px',
        }}>Next →</Link>
      )}
    </div>
  );
}
