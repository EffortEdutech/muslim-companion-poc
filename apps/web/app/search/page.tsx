import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { SearchResponse } from '@/lib/types';
import { getCollectionBySlug } from '@/lib/collections';
import HadithCard from '@/components/HadithCard';
import SearchBar from '@/components/SearchBar';

interface PageProps {
  searchParams: Promise<{ q?: string; book?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search | IQRA Digital` : 'Search Hadith | IQRA Digital',
    description: 'Search across all hadith collections in Arabic and English.',
  };
}

async function fetchSearchResults(
  query: string,
  book: string,
  page: number
): Promise<SearchResponse> {
  // Server-side: call the search API logic directly
  // We import here to avoid circular imports
  const { default: searchHandler } = await import('./search-logic');
  return searchHandler(query, book, page);
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', book = '', page: pageStr = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr, 10));
  const trimmedQuery = q.trim();

  let response: SearchResponse | null = null;
  if (trimmedQuery.length >= 2) {
    response = await fetchSearchResults(trimmedQuery, book, currentPage);
  }

  const filterCollection = book ? getCollectionBySlug(book) : null;
  const totalPages = response
    ? Math.ceil(response.total / response.limit)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Page header */}
      <header className="mb-8">
        <h1
          className="page-heading"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', marginBottom: '6px' }}
        >
          Search Hadith
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-lora)',
            fontStyle: 'italic',
            fontSize: '0.88rem',
            color: 'var(--ink-muted)',
            marginBottom: '24px',
          }}
        >
          Search by Arabic text, English translation, narrator, or collection reference.
        </p>

        <Suspense fallback={null}>
          <SearchBar
            defaultQuery={trimmedQuery}
            defaultBook={book}
            autoFocus={!trimmedQuery}
          />
        </Suspense>
      </header>

      {/* No query state */}
      {!trimmedQuery && (
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <div
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: 'var(--font-amiri)',
              fontSize: '2rem',
              color: 'var(--gold)',
              opacity: 0.5,
              marginBottom: '20px',
              lineHeight: 2,
            }}
          >
            ابحث في الأحاديث
          </div>
          <p
            style={{
              fontFamily: 'var(--font-lora)',
              color: 'var(--ink-muted)',
              fontSize: '0.95rem',
              maxWidth: '380px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Enter a word or phrase above. You can search in English or Arabic across all
            imported collections, or filter to a single collection.
          </p>
        </div>
      )}

      {/* Query too short */}
      {trimmedQuery && trimmedQuery.length < 2 && (
        <p
          style={{
            fontFamily: 'var(--font-lora)',
            color: 'var(--ink-muted)',
            fontSize: '0.9rem',
            marginTop: '24px',
          }}
        >
          Please enter at least 2 characters to search.
        </p>
      )}

      {/* Results */}
      {response && (
        <>
          {/* Results summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-lora)',
                fontSize: '0.88rem',
                color: 'var(--ink-secondary)',
              }}
            >
              {response.total === 0 ? (
                <>No results for <strong style={{ color: 'var(--ink)' }}>&ldquo;{trimmedQuery}&rdquo;</strong></>
              ) : (
                <>
                  <strong style={{ color: 'var(--gold)' }}>
                    {response.total.toLocaleString()}
                  </strong>{' '}
                  result{response.total !== 1 ? 's' : ''} for{' '}
                  <strong style={{ color: 'var(--ink)' }}>&ldquo;{trimmedQuery}&rdquo;</strong>
                  {filterCollection && (
                    <>
                      {' '}in{' '}
                      <strong style={{ color: 'var(--ink)' }}>{filterCollection.displayName}</strong>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Clear filter link */}
            {book && (
              <Link
                href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                style={{
                  fontFamily: 'var(--font-lora)',
                  fontSize: '0.8rem',
                  color: 'var(--ink-muted)',
                  textDecoration: 'none',
                }}
              >
                ✕ Remove filter
              </Link>
            )}
          </div>

          {/* Zero results guidance */}
          {response.total === 0 && (
            <div
              style={{
                padding: '32px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--gold-border)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--ink-secondary)',
                  fontSize: '0.92rem',
                  marginBottom: '12px',
                  lineHeight: 1.7,
                }}
              >
                No hadith matched your search. Try a different term, or check
                that the relevant collections have been imported.
              </p>
              <Link
                href="/"
                style={{
                  fontFamily: 'var(--font-lora)',
                  fontSize: '0.85rem',
                  color: 'var(--gold)',
                  textDecoration: 'none',
                }}
              >
                Browse collections →
              </Link>
            </div>
          )}

          {/* Result list */}
          {response.results.length > 0 && (
            <div className="flex flex-col gap-5">
              {response.results.map((result, idx) => (
                <HadithCard
                  key={`${result.bookSlug}-${result.hadith.id}-${idx}`}
                  hadith={result.hadith}
                  bookSlug={result.bookSlug}
                  bookTitle={result.bookTitle}
                  chapterTitle={result.chapterTitle}
                  showReference={true}
                  highlight={trimmedQuery}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '40px',
                paddingTop: '24px',
                borderTop: '1px solid var(--gold-border)',
              }}
            >
              {currentPage > 1 && (
                <SearchPageLink
                  href={buildSearchUrl(trimmedQuery, book, currentPage - 1)}
                  label="← Previous"
                />
              )}

              {/* Page numbers (show ±2 around current) */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + Math.max(1, currentPage - 3);
                if (p > totalPages) return null;
                return (
                  <SearchPageLink
                    key={p}
                    href={buildSearchUrl(trimmedQuery, book, p)}
                    label={String(p)}
                    active={p === currentPage}
                  />
                );
              })}

              {currentPage < totalPages && (
                <SearchPageLink
                  href={buildSearchUrl(trimmedQuery, book, currentPage + 1)}
                  label="Next →"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function buildSearchUrl(query: string, book: string, page: number): string {
  const params = new URLSearchParams();
  params.set('q', query);
  if (book) params.set('book', book);
  if (page > 1) params.set('page', String(page));
  return `/search?${params.toString()}`;
}

function SearchPageLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-lora)',
        fontSize: '0.85rem',
        color: active ? '#0d1117' : 'var(--gold)',
        textDecoration: 'none',
        padding: '7px 13px',
        borderRadius: '8px',
        border: '1px solid var(--gold-border)',
        background: active ? 'var(--gold)' : 'var(--bg-card)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  );
}
