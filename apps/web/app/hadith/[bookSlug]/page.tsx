import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadBook } from '@/lib/hadith';
import { getCollectionBySlug } from '@/lib/collections';
import HadithCard from '@/components/HadithCard';
import ReaderControls from '@/components/ReaderControls';

interface PageProps {
  params: Promise<{ bookSlug: string }>;
  searchParams: Promise<{ chapter?: string; page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookSlug } = await params;
  const collection = getCollectionBySlug(bookSlug);
  if (!collection) return {};
  return {
    title: `${collection.displayName} | IQRA Digital`,
    description: `Browse the hadith of ${collection.displayName} by ${collection.author}.`,
  };
}

const HADITHS_PER_PAGE = 50;

export default async function BookPage({ params, searchParams }: PageProps) {
  const { bookSlug } = await params;
  const { chapter: chapterParam, page: pageParam } = await searchParams;

  const collection = getCollectionBySlug(bookSlug);
  if (!collection) notFound();

  const book = loadBook(bookSlug);
  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '16px' }}>⚠</div>
        <h1 className="page-heading" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
          Collection Not Yet Imported
        </h1>
        <p style={{ color: 'var(--ink-secondary)', fontFamily: 'var(--font-lora)' }}>
          The file for <strong style={{ color: 'var(--ink)' }}>{collection.displayName}</strong> has not been
          imported yet. Copy the JSON file into <code>content/hadith/db/by_book/{collection.group}/</code>.
        </p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--gold)', fontFamily: 'var(--font-lora)', textDecoration: 'none' }}>
          ← Back to collections
        </Link>
      </div>
    );
  }

  const isSingleChapter = book.chapters.length <= 1;
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));

  const selectedChapterId = chapterParam !== undefined
    ? parseInt(chapterParam, 10)
    : isSingleChapter
    ? (book.chapters[0]?.id ?? 0)
    : null;

  const filteredHadiths = selectedChapterId !== null
    ? book.hadiths.filter((h) => h.chapterId === selectedChapterId)
    : book.hadiths;

  const totalHadiths = filteredHadiths.length;
  const totalPages = Math.ceil(totalHadiths / HADITHS_PER_PAGE);
  const pagedHadiths = filteredHadiths.slice(
    (currentPage - 1) * HADITHS_PER_PAGE,
    currentPage * HADITHS_PER_PAGE
  );

  const rangeStart = totalHadiths === 0 ? 0 : (currentPage - 1) * HADITHS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * HADITHS_PER_PAGE, totalHadiths);

  const currentChapter = selectedChapterId !== null
    ? book.chapters.find((c) => c.id === selectedChapterId)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '28px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          Collections
        </Link>
        <span style={{ color: 'var(--ink-muted)', margin: '0 8px', fontSize: '0.85rem' }}>›</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
          {collection.displayName}
        </span>
      </nav>

      {/* Book header */}
      <header className="mb-10">
        <div dir="rtl" lang="ar" className="arabic-text" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}>
          {collection.arabicName}
        </div>
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '6px' }}>
          {collection.displayName}
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', color: 'var(--ink-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>
          {collection.author}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="badge-group">{collection.group.replace(/_/g, ' ')}</span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {book.hadiths.length.toLocaleString()} hadiths
          </span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
          </span>
          <Link href={`/search?book=${bookSlug}`} style={{ marginLeft: 'auto', fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search this collection
          </Link>
        </div>

        {book.metadata.english.introduction && (
          <div style={{ marginTop: '20px', padding: '16px 20px', borderLeft: '3px solid var(--gold)', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0', fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: 1.7 }}>
            {book.metadata.english.introduction}
          </div>
        )}
      </header>

      {/* Layout */}
      <div className={`flex gap-8 ${!isSingleChapter ? 'items-start' : ''}`}>

        {/* Chapter sidebar */}
        {!isSingleChapter && (
          <aside style={{ width: '240px', flexShrink: 0, position: 'sticky', top: 'calc(var(--nav-height) + 16px)', maxHeight: 'calc(100vh - var(--nav-height) - 32px)', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Chapters
            </h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {book.chapters.map((ch) => {
                const isActive = selectedChapterId === ch.id;
                const count = book.hadiths.filter((h) => h.chapterId === ch.id).length;
                return (
                  <Link key={ch.id} href={`/hadith/${bookSlug}?chapter=${ch.id}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', padding: '7px 10px', borderRadius: '8px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', background: isActive ? 'var(--gold-glow)' : 'transparent', color: isActive ? 'var(--gold)' : 'var(--ink-secondary)', borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent', transition: 'all 0.15s' }}>
                    <span style={{ flex: 1, lineHeight: 1.4 }}>{ch.english || `Chapter ${ch.id}`}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', flexShrink: 0 }}>{count}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Chapter heading */}
          {currentChapter && !isSingleChapter && (
            <div className="mb-6">
              <h2 className="page-heading" style={{ fontSize: '1.3rem', marginBottom: '4px' }}>
                {currentChapter.english}
              </h2>
              {currentChapter.arabic && (
                <div dir="rtl" lang="ar" className="arabic-text" style={{ fontSize: '1.1rem' }}>
                  {currentChapter.arabic}
                </div>
              )}
            </div>
          )}

          {/* Select chapter prompt */}
          {!isSingleChapter && selectedChapterId === null && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
              <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '1rem' }}>
                Select a chapter from the sidebar to begin reading.
              </p>
            </div>
          )}

          {/* Hadiths */}
          {(isSingleChapter || selectedChapterId !== null) && (
            <>
              <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '16px' }}>
                {totalHadiths > HADITHS_PER_PAGE
                  ? `Showing ${rangeStart}–${rangeEnd} of ${totalHadiths.toLocaleString()} hadiths`
                  : `${totalHadiths} hadith${totalHadiths !== 1 ? 's' : ''}`}
              </div>

              <div className="flex flex-col gap-5">
                {pagedHadiths.map((hadith) => {
                  const chapter = book.chapters.find((c) => c.id === hadith.chapterId);
                  return (
                    <HadithCard
                      key={hadith.id}
                      hadith={hadith}
                      bookSlug={bookSlug}
                      bookTitle={collection.displayName}
                      chapterTitle={!isSingleChapter ? chapter?.english : undefined}
                      showReference={false}
                      showBookmark={true}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                  {currentPage > 1 && (
                    <PageLink href={buildPageUrl(bookSlug, selectedChapterId, currentPage - 1)} label="← Previous" />
                  )}
                  <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--ink-secondary)', padding: '8px 16px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <PageLink href={buildPageUrl(bookSlug, selectedChapterId, currentPage + 1)} label="Next →" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reading progress + font size controls (client island) */}
      {(isSingleChapter || selectedChapterId !== null) && totalHadiths > 0 && (
        <ReaderControls
          bookSlug={bookSlug}
          chapterId={selectedChapterId}
          page={currentPage}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={totalHadiths}
        />
      )}
    </div>
  );
}

function buildPageUrl(slug: string, chapterId: number | null, page: number): string {
  const p = new URLSearchParams();
  if (chapterId !== null) p.set('chapter', String(chapterId));
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  return `/hadith/${slug}${qs ? `?${qs}` : ''}`;
}

function PageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--gold-border)', background: 'var(--bg-card)' }}>
      {label}
    </Link>
  );
}
