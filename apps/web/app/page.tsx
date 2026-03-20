import type { Metadata } from 'next';
import Link from 'next/link';
import { COLLECTIONS, GROUP_LABELS, GROUP_DESCRIPTIONS, GROUP_ORDER } from '@/lib/collections';
import { loadBook } from '@/lib/hadith';
import CollectionCard from '@/components/CollectionCard';

export const metadata: Metadata = {
  title: 'Hadith Collections | IQRA Digital',
  description: 'Browse authentic hadith from the Nine Books, other collections, and the Arba\'een forties.',
};

// Pre-load hadith counts for all collections
async function getCollectionCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const col of COLLECTIONS) {
    const book = loadBook(col.slug);
    if (book) counts[col.slug] = book.hadiths.length;
  }
  return counts;
}

export default async function HomePage() {
  const counts = await getCollectionCounts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

      {/* Hero */}
      <header className="text-center mb-16">
        <div
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: 'var(--font-amiri)',
            fontSize: '2.2rem',
            color: 'var(--gold)',
            lineHeight: '1.8',
            marginBottom: '6px',
          }}
        >
          بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div
          style={{
            fontFamily: 'var(--font-lora)',
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: 'var(--ink-muted)',
            marginBottom: '32px',
          }}
        >
          In the name of Allah, the Most Gracious, the Most Merciful
        </div>

        <h1
          className="page-heading"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', marginBottom: '14px' }}
        >
          Hadith Library
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-lora)',
            fontSize: '1.05rem',
            color: 'var(--ink-secondary)',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Browse and search{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>
            {Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString()}
          </span>{' '}
          hadith across{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>
            {COLLECTIONS.filter((c) => counts[c.slug] !== undefined).length}
          </span>{' '}
          collections.
        </p>

        {/* Quick search CTA */}
        <div className="mt-8">
          <Link
            href="/search"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--gold-border-strong)',
              color: 'var(--ink-secondary)',
              borderRadius: '12px',
              padding: '10px 20px',
              fontFamily: 'var(--font-lora)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search all hadith
          </Link>
        </div>
      </header>

      {/* Collection Groups */}
      {GROUP_ORDER.map((group) => {
        const groupCollections = COLLECTIONS.filter((c) => c.group === group);
        const importedCollections = groupCollections.filter((c) => counts[c.slug] !== undefined);

        return (
          <section key={group} className="mb-14">
            {/* Group header */}
            <div className="flex items-baseline gap-4 mb-6">
              <h2
                className="page-heading"
                style={{ fontSize: '1.6rem' }}
              >
                {GROUP_LABELS[group]}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-lora)',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: 'var(--ink-muted)',
                }}
              >
                {GROUP_DESCRIPTIONS[group]}
              </p>
            </div>

            {/* Collection grid */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {groupCollections.map((col) => {
                const isImported = counts[col.slug] !== undefined;
                if (!isImported) {
                  // Show placeholder for not-yet-imported collections
                  return (
                    <div
                      key={col.slug}
                      style={{
                        borderRadius: '12px',
                        border: '1px dashed var(--gold-border)',
                        padding: '20px',
                        opacity: 0.4,
                      }}
                    >
                      <div
                        dir="rtl"
                        lang="ar"
                        className="arabic-text"
                        style={{ fontSize: '1.2rem', marginBottom: '8px' }}
                      >
                        {col.arabicName}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-cormorant)',
                          fontSize: '1rem',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        {col.displayName}
                      </div>
                      <div
                        style={{
                          marginTop: '10px',
                          fontSize: '0.72rem',
                          color: 'var(--ink-muted)',
                          fontFamily: 'var(--font-lora)',
                          fontStyle: 'italic',
                        }}
                      >
                        Not yet imported
                      </div>
                    </div>
                  );
                }

                return (
                  <CollectionCard
                    key={col.slug}
                    collection={col}
                    hadithCount={counts[col.slug]}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Footer note */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid var(--gold-border)',
          textAlign: 'center',
          fontFamily: 'var(--font-lora)',
          fontStyle: 'italic',
          fontSize: '0.8rem',
          color: 'var(--ink-muted)',
          lineHeight: 1.7,
        }}
      >
        Content sourced from verified hadith collections. This platform is a digital library only —
        not a fatwa or ruling engine. Source provenance review is ongoing per{' '}
        <Link href="/docs/notice" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
          NOTICE.md
        </Link>
        .
      </footer>
    </div>
  );
}
