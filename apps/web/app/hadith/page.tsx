import type { Metadata } from 'next';
import Link from 'next/link';
import { COLLECTIONS, GROUP_LABELS, GROUP_DESCRIPTIONS, GROUP_ORDER, getCollectionsByGroup } from '@/lib/collections';
import { loadBook } from '@/lib/hadith';
import CollectionCard from '@/components/CollectionCard';
import type { CollectionGroup } from '@/lib/types';
import ReadingProgress from '@/components/ReadingProgress';

export const metadata: Metadata = {
  title: 'Hadith Collections | IQRA Digital',
  description: 'Browse authentic hadith from the Nine Books, other collections, and the Arba\'een forties.',
};

async function getCollectionCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const col of COLLECTIONS) {
    const book = loadBook(col.slug);
    if (book) counts[col.slug] = book.hadiths.length;
  }
  return counts;
}

export default async function HadithPage() {
  const counts = await getCollectionCounts();
  const totalHadiths = Object.values(counts).reduce((a, b) => a + b, 0);
  const importedCount = Object.keys(counts).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <ReadingProgress
        section="hadith"
        label="Hadith"
        breadcrumb={[
          { label: 'Hadith', href: null },
        ]}
      />

      {/* Header */}
      <header className="text-center mb-14">
        <h1 className="page-heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '10px' }}>
          Hadith Library
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontSize: '1rem', color: 'var(--ink-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Browse and search{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{totalHadiths.toLocaleString()}</span>{' '}
          hadith across{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{importedCount}</span>{' '}
          collections.
        </p>
        <div style={{ marginTop: '16px' }}>
          <Link
            href="/search?src=hadith"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--gold-border-strong)', color: 'var(--ink-secondary)', borderRadius: '12px', padding: '9px 18px', fontFamily: 'var(--font-lora)', fontSize: '0.88rem', textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search all hadith
          </Link>
        </div>
      </header>

      {/* Collection groups */}
      {GROUP_ORDER.map((group: CollectionGroup) => {
        const groupCollections = getCollectionsByGroup(group);
        return (
          <section key={group} className="mb-14">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="page-heading" style={{ fontSize: '1.5rem' }}>{GROUP_LABELS[group]}</h2>
              <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                {GROUP_DESCRIPTIONS[group]}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {groupCollections.map((col) => {
                const isImported = counts[col.slug] !== undefined;
                if (!isImported) {
                  return (
                    <div key={col.slug} style={{ borderRadius: '12px', border: '1px dashed var(--gold-border)', padding: '20px', opacity: 0.4 }}>
                      <div dir="rtl" lang="ar" className="arabic-text" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{col.arabicName}</div>
                      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'var(--ink-secondary)' }}>{col.displayName}</div>
                      <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>Not yet imported</div>
                    </div>
                  );
                }
                return <CollectionCard key={col.slug} collection={col} hadithCount={counts[col.slug]} />;
              })}
            </div>
          </section>
        );
      })}

      <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--gold-border)', textAlign: 'center', fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        Content sourced from verified hadith collections. This platform is a digital library only — not a fatwa or ruling engine.
      </footer>
    </div>
  );
}
