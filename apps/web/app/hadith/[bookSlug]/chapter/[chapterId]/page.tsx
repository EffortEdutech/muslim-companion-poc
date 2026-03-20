import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadBook, getHadithsByChapter, getChapterById } from '@/lib/hadith';
import { getCollectionBySlug } from '@/lib/collections';
import HadithCard from '@/components/HadithCard';

interface PageProps {
  params: Promise<{ bookSlug: string; chapterId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookSlug, chapterId } = await params;
  const collection = getCollectionBySlug(bookSlug);
  if (!collection) return {};
  const book = loadBook(bookSlug);
  const chapter = book ? getChapterById(book, parseInt(chapterId, 10)) : null;
  return {
    title: `${chapter?.english || `Chapter ${chapterId}`} — ${collection.displayName} | IQRA Digital`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookSlug, chapterId: chapterIdStr } = await params;
  const chapterId = parseInt(chapterIdStr, 10);

  const collection = getCollectionBySlug(bookSlug);
  if (!collection) notFound();

  const book = loadBook(bookSlug);
  if (!book) notFound();

  const chapter = getChapterById(book, chapterId);
  if (!chapter) notFound();

  const hadiths = getHadithsByChapter(book, chapterId);

  // Prev/next chapter navigation
  const chapterIndex = book.chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = chapterIndex > 0 ? book.chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < book.chapters.length - 1 ? book.chapters[chapterIndex + 1] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          Collections
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <Link
          href={`/hadith/${bookSlug}`}
          style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)', textDecoration: 'none' }}
        >
          {collection.shortName}
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink)' }}>
          {chapter.english || `Chapter ${chapterId}`}
        </span>
      </nav>

      {/* Chapter header */}
      <header className="mb-8">
        {chapter.arabic && (
          <div
            dir="rtl"
            lang="ar"
            className="arabic-text"
            style={{ fontSize: '1.4rem', marginBottom: '8px', display: 'block' }}
          >
            {chapter.arabic}
          </div>
        )}
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: '8px' }}>
          {chapter.english || `Chapter ${chapterId}`}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={`/hadith/${bookSlug}`}
            style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none' }}
          >
            {collection.displayName}
          </Link>
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>
            {hadiths.length} hadith{hadiths.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Hadiths */}
      <div className="flex flex-col gap-5">
        {hadiths.map((hadith) => (
          <HadithCard
            key={hadith.id}
            hadith={hadith}
            bookSlug={bookSlug}
            bookTitle={collection.displayName}
            chapterTitle={chapter.english}
            showReference={false}
          />
        ))}
      </div>

      {/* Chapter navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid var(--gold-border)',
          gap: '16px',
        }}
      >
        {prevChapter ? (
          <Link
            href={`/hadith/${bookSlug}/chapter/${prevChapter.id}`}
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: '0.85rem',
              color: 'var(--gold)',
              textDecoration: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--gold-border)',
              background: 'var(--bg-card)',
              maxWidth: '45%',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>← Previous</div>
            <div>{prevChapter.english || `Chapter ${prevChapter.id}`}</div>
          </Link>
        ) : (
          <div />
        )}

        {nextChapter && (
          <Link
            href={`/hadith/${bookSlug}/chapter/${nextChapter.id}`}
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: '0.85rem',
              color: 'var(--gold)',
              textDecoration: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--gold-border)',
              background: 'var(--bg-card)',
              textAlign: 'right',
              maxWidth: '45%',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>Next →</div>
            <div>{nextChapter.english || `Chapter ${nextChapter.id}`}</div>
          </Link>
        )}
      </div>
    </div>
  );
}
