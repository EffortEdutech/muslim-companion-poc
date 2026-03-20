import Link from 'next/link';
import { CollectionInfo } from '@/lib/types';

interface Props {
  collection: CollectionInfo;
  hadithCount?: number;
}

const GROUP_BADGE_LABELS: Record<string, string> = {
  the_9_books: 'The Nine',
  other_books: 'Collection',
  forties: "Arba'een",
};

export default function CollectionCard({ collection, hadithCount }: Props) {
  return (
    <Link href={`/hadith/${collection.slug}`} className="collection-card" style={{ textDecoration: 'none' }}>
      {/* Arabic title */}
      <div
        dir="rtl"
        lang="ar"
        className="arabic-text"
        style={{
          fontSize: '1.45rem',
          lineHeight: '1.9',
          marginBottom: '10px',
          display: 'block',
        }}
      >
        {collection.arabicName}
      </div>

      {/* English title */}
      <div
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '4px',
          letterSpacing: '-0.01em',
        }}
      >
        {collection.displayName}
      </div>

      {/* Author */}
      <div
        style={{
          fontFamily: 'var(--font-lora)',
          fontStyle: 'italic',
          fontSize: '0.82rem',
          color: 'var(--ink-secondary)',
          marginBottom: '14px',
        }}
      >
        {collection.author}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="badge-group">
          {GROUP_BADGE_LABELS[collection.group] || collection.group}
        </span>

        {hadithCount !== undefined && (
          <span
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: '0.78rem',
              color: 'var(--ink-muted)',
            }}
          >
            {hadithCount.toLocaleString()} hadiths
          </span>
        )}

        <span
          style={{
            color: 'var(--gold)',
            fontSize: '1rem',
            lineHeight: 1,
          }}
          aria-hidden
        >
          →
        </span>
      </div>
    </Link>
  );
}
