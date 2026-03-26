// apps/web/app/search/page.tsx
// Server component — fetches all data, enriches cross-refs with hadith text,
// passes everything to the SearchResults client accordion component.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import path from 'path';
import fs   from 'fs';
import Link from 'next/link';

import { SearchResponse }                        from '@/lib/types';
import { QuranSearchResponse }                   from '@/lib/quran-search-types';
import { TafseerSearchResponse }                 from '@/lib/tafseer-search-types';
import { getCollectionBySlug }                   from '@/lib/collections';
import SearchBar                                 from '@/components/SearchBar';
import UnifiedSearchTabs                         from '@/components/UnifiedSearchTabs';
import SearchDiscoveryBar                        from '@/components/SearchDiscoveryBar';
import SearchResults, { CrossRefHadith }         from '@/components/search/SearchResults';
import SearchPersist, { NewSearchButton } from '@/components/SearchPersist';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    q?: string; src?: string; book?: string; page?: string;
  }>;
}

type Source   = 'all' | 'hadith' | 'quran' | 'tafseer';
type RawCrossRef = Record<string, Array<{ bs: string; ib: number; bsh: string }>>;

// ─── Cross-ref + hadith text loader ──────────────────────────────────────────

let _crossRefCache: RawCrossRef | null = null;

function loadRawCrossRef(): RawCrossRef {
  if (_crossRefCache) return _crossRefCache;
  try {
    const p = path.join(
      process.env.REPO_ROOT || path.join(process.cwd(), '..', '..'),
      'content', 'quran', 'db', 'metadata', 'cross-ref.json'
    );
    if (fs.existsSync(p)) _crossRefCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {}
  return _crossRefCache || {};
}

// Load the flat hadith index for text lookup (used to populate cross-ref detail)
let _hadithIndexCache: Array<{_id:number;ib:number;bs:string;bsh:string;ct:string;ar:string;en:string;na:string}> | null = null;

function loadHadithIndex() {
  if (_hadithIndexCache !== null) return _hadithIndexCache;
  try {
    const p = path.join(
      process.env.REPO_ROOT || path.join(process.cwd(), '..', '..'),
      'content', 'hadith', 'db', 'metadata', 'hadith-search-index.json'
    );
    if (fs.existsSync(p)) {
      _hadithIndexCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return _hadithIndexCache!;
    }
  } catch {}
  return [];
}

// Build enriched cross-ref: look up actual text for each referenced hadith
function buildEnrichedCrossRef(
  rawCrossRef: RawCrossRef,
  relevantAyahs: string[]
): Record<string, CrossRefHadith[]> {
  const hadithIndex = loadHadithIndex();

  // Build lookup: "bookSlug:idInBook" → hadith entry
  const lookup = new Map<string, {en:string;na:string;ar:string}>();
  for (const h of hadithIndex) {
    lookup.set(`${h.bs}:${h.ib}`, { en: h.en, na: h.na, ar: h.ar });
  }

  const result: Record<string, CrossRefHadith[]> = {};

  for (const ayah of relevantAyahs) {
    const refs = rawCrossRef[ayah];
    if (!refs || refs.length === 0) continue;

    result[ayah] = refs.map(ref => {
      const detail = lookup.get(`${ref.bs}:${ref.ib}`);
      return {
        bs:       ref.bs,
        ib:       ref.ib,
        bsh:      ref.bsh,
        text:     detail?.en     || '',
        narrator: detail?.na     || '',
        arabic:   detail?.ar     || '',
      };
    });
  }

  return result;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title:       q ? `"${q}" – Search | IQRA Digital` : 'Search | IQRA Digital',
    description: 'Search across Quran, Tafseer, and Hadith. Discover connections between sacred texts.',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', src = 'all', book = '', page: pageStr = '1' } = await searchParams;
  const query       = q.trim();
  const source: Source = (['hadith', 'quran', 'tafseer'] as const).includes(src as 'hadith' | 'quran' | 'tafseer')
    ? src as 'hadith' | 'quran' | 'tafseer' : 'all';
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

  const hadithTotal  = hadithResponse?.total  ?? 0;
  const quranTotal   = quranResponse?.total   ?? 0;
  const tafseerTotal = tafseerResponse?.total ?? 0;
  const combinedTotal = hadithTotal + quranTotal + tafseerTotal;

  const hadithPages  = hadithResponse  ? Math.ceil(hadithTotal  / hadithResponse.limit)  : 0;
  const quranPages   = quranResponse   ? Math.ceil(quranTotal   / quranResponse.limit)   : 0;
  const tafseerPages = tafseerResponse ? Math.ceil(tafseerTotal / tafseerResponse.limit) : 0;

  // Build enriched cross-ref only for ayahs in current Quran results
  const rawCrossRef  = loadRawCrossRef();
  const ayahKeys     = (quranResponse?.results || []).map(r => `${r.surah}:${r.ayah}`);
  const enrichedCrossRef = buildEnrichedCrossRef(rawCrossRef, ayahKeys);
  const crossRefCount    = ayahKeys.filter(k => (enrichedCrossRef[k] || []).length > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mb-6">
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', marginBottom: '4px' }}>
          Search
        </h1>
        <p style={{
          fontFamily: 'var(--font-lora)', fontStyle: 'italic',
          fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '20px',
        }}>
          Quran · Tafseer · Hadith · Arabic · English · Malay · Urdu
        </p>

        <Suspense fallback={null}>
          <SearchPersist
            query={query}
            source={source}
            book={book}
            shouldRestore={!query}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <SearchBar
                defaultQuery={query}
                defaultBook={source === 'hadith' ? book : ''}
                autoFocus={!query}
              />
            </div>
            <NewSearchButton visible={query.length >= 2} />
          </div>
        </Suspense>

        {/* Tabs — show source counts, no duplication */}
        {query.length >= 2 && (
          <div style={{ marginTop: '16px' }}>
            <Suspense fallback={null}>
              <UnifiedSearchTabs
                query={query} source={source} book={book}
                hadithTotal={hadithTotal} quranTotal={quranTotal} tafseerTotal={tafseerTotal}
              />
            </Suspense>
          </div>
        )}
      </header>

      {/* ── Discovery bar — cross-ref counter only ─────────────────── */}
      {query.length >= 2 && crossRefCount > 0 && (
        <Suspense fallback={null}>
          <SearchDiscoveryBar crossRefCount={crossRefCount} />
        </Suspense>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!query && <EmptyState />}

      {/* ── No results ──────────────────────────────────────────────── */}
      {query.length >= 2 && combinedTotal === 0 && (
        <div style={{ marginTop: '40px', textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            No results for <strong style={{ color: 'var(--gold)' }}>&ldquo;{query}&rdquo;</strong>
          </p>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
            Try a shorter phrase, different spelling, or search in Arabic.
          </p>
        </div>
      )}

      {/* ── Results — two-level accordion ───────────────────────────── */}
      {query.length >= 2 && combinedTotal > 0 && (
        <SearchResults
          query={query}
          quranResults={quranResponse?.results   || []}
          tafseerResults={tafseerResponse?.results || []}
          hadithResults={hadithResponse?.results  || []}
          crossRef={enrichedCrossRef}
          quranTotal={quranTotal}
          tafseerTotal={tafseerTotal}
          hadithTotal={hadithTotal}
          currentPage={currentPage}
          quranPages={quranPages}
          tafseerPages={tafseerPages}
          hadithPages={hadithPages}
          source={source}
          book={book}
        />
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const QUICK = ['mercy', 'patience', 'prayer', 'knowledge', '2:255', 'الإخلاص', 'tawbah'];
  return (
    <div style={{ marginTop: '48px', textAlign: 'center', padding: '48px 20px' }}>
      <div dir="rtl" lang="ar" style={{
        fontFamily: 'var(--font-amiri)', fontSize: '2.2rem',
        color: 'var(--gold)', opacity: 0.4, lineHeight: 2, marginBottom: '16px',
      }}>
        ابحث في القرآن والتفسير والأحاديث
      </div>
      <p style={{
        fontFamily: 'var(--font-lora)', color: 'var(--ink-muted)',
        fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.7,
      }}>
        Search Quran, Tafseer, and Hadith in Arabic or English.{' '}
        Use <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>2:255</span> to jump
        to a specific ayah, or{' '}
        <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>#33</span> for a hadith by number.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {QUICK.map(term => (
          <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--gold)',
              border: '1px solid var(--gold-border)', borderRadius: '20px',
              padding: '5px 14px', background: 'var(--bg-card)', display: 'inline-block',
            }}>
              {term}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
