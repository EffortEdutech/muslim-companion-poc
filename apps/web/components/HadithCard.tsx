import { Hadith } from '@/lib/types';
import Link from 'next/link';
import BookmarkButton from './BookmarkButton';

interface Props {
  hadith: Hadith;
  bookSlug?: string;
  bookTitle?: string;
  chapterTitle?: string;
  showReference?: boolean;
  showBookmark?: boolean;
  highlight?: string;
}

export default function HadithCard({
  hadith,
  bookSlug,
  bookTitle,
  chapterTitle,
  showReference = false,
  showBookmark = false,
  highlight,
}: Props) {
  const hasNarrator = hadith.english.narrator?.trim() !== '';

  return (
    <article className="hadith-card group">

      {/* Top row: number badge + optional chapter label + bookmark button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>

        {/* Number badge */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(200,168,75,0.10)',
            border: '1px solid var(--gold-border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-lora)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--gold)',
          }}
        >
          {hadith.idInBook}
        </div>

        {/* Chapter label (center) */}
        {chapterTitle && (
          <span
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: '0.7rem',
              color: 'var(--ink-muted)',
              marginTop: '10px',
              flex: 1,
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {chapterTitle}
          </span>
        )}

        {/* Bookmark button — client island */}
        {showBookmark && bookSlug && (
          <BookmarkButton
            idInBook={hadith.idInBook}
            bookSlug={bookSlug}
            bookTitle={bookTitle ?? ''}
            arabicText={hadith.arabic}
            englishText={hadith.english.text}
          />
        )}
      </div>

      {/* Arabic text — uses CSS variable so font size controls work */}
      <div
        dir="rtl"
        lang="ar"
        className="arabic-text"
        style={{
          fontSize: 'var(--reader-ar-size, 1.6rem)',
          lineHeight: '2.5',
          marginBottom: '4px',
          padding: '4px 0',
        }}
      >
        {hadith.arabic}
      </div>

      {/* Gold divider */}
      <div className="gold-divider" />

      {/* Narrator */}
      {hasNarrator && (
        <p
          style={{
            fontFamily: 'var(--font-lora)',
            fontStyle: 'italic',
            fontSize: '0.88rem',
            color: 'var(--gold)',
            marginBottom: '10px',
            opacity: 0.9,
          }}
        >
          {hadith.english.narrator}
        </p>
      )}

      {/* English translation — uses CSS variable */}
      <p
        style={{
          fontFamily: 'var(--font-lora)',
          fontSize: 'var(--reader-en-size, 1rem)',
          lineHeight: '1.78',
          color: 'var(--ink)',
        }}
      >
        {highlight
          ? highlightTerms(hadith.english.text, highlight)
          : hadith.english.text}
      </p>

      {/* Reference footer */}
      {showReference && bookTitle && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--gold-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          {bookSlug ? (
            <Link
              href={`/hadith/${bookSlug}`}
              style={{ fontFamily: 'var(--font-lora)', fontSize: '0.76rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
            >
              {bookTitle}
            </Link>
          ) : (
            <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.76rem', color: 'var(--gold)' }}>
              {bookTitle}
            </span>
          )}

          {chapterTitle && (
            <>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.76rem' }}>·</span>
              <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                {chapterTitle}
              </span>
            </>
          )}

          <span style={{ color: 'var(--ink-muted)', fontSize: '0.76rem' }}>·</span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
            Hadith #{hadith.idInBook}
          </span>
        </div>
      )}
    </article>
  );
}

// ── Highlight matching terms in translated text ───────────────────
function highlightTerms(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: 'rgba(200,168,75,0.22)',
              color: 'var(--gold-light)',
              borderRadius: '2px',
              padding: '0 2px',
            }}
          >
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}
