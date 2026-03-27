import type { Metadata } from 'next';
import Link from 'next/link';
import { loadSurahIndex, isQuranCompiled } from '@/lib/quran';
import SurahListView from '@/components/SurahListView';
import ReadingProgress from '@/components/ReadingProgress';

export const metadata: Metadata = {
  title: 'Quran | IQRA Digital',
  description: 'Browse all 114 surahs of the Holy Quran with Arabic text, transliteration, and multiple translations.',
};

export default async function QuranPage() {
  const compiled = isQuranCompiled();
  const index    = compiled ? loadSurahIndex() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <ReadingProgress
        section="quran"
        label="Quran"
        breadcrumb={[
          { label: 'Quran', href: null },
        ]}
      />

      {/* Hero */}
      <header className="text-center mb-10">
        <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '2.4rem', color: 'var(--gold)', lineHeight: '1.8', marginBottom: '4px' }}>
          بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '24px' }}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </div>

        <h1 className="page-heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '10px' }}>
          The Holy Quran
        </h1>
        <div style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--ink-muted)', marginBottom: '16px' }}>
          Sahih International · Yusuf Ali · Basmeih (Malay)
        </div>

        {/* Search CTA */}
        <Link
          href="/quran/search"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-card)', border: '1px solid var(--gold-border-strong)',
            color: 'var(--ink-secondary)', borderRadius: '12px', padding: '9px 18px',
            fontFamily: 'var(--font-lora)', fontSize: '0.88rem', textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Search the Quran
        </Link>
      </header>

      {/* Not compiled */}
      {!compiled && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '14px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '12px', lineHeight: 1.7 }}>
            Quran content not yet compiled. Run the compile script first:
          </p>
          <code style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--gold)', background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
            node scripts/quran/compile-surahs.js
          </code>
        </div>
      )}

      {/* Surah list — client component handles the toggle */}
      {index && <SurahListView surahs={index.surahs} />}
    </div>
  );
}
