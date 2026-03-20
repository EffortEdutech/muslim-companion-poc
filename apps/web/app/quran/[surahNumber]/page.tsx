import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadSurah, getSurahNavigation } from '@/lib/quran';
import SurahReader from '@/components/SurahReader';
import ReaderControls from '@/components/ReaderControls';

interface PageProps {
  params: Promise<{ surahNumber: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { surahNumber } = await params;
  const n = parseInt(surahNumber, 10);
  const surah = loadSurah(n);
  if (!surah) return { title: 'Quran | IQRA Digital' };
  return {
    title: `${surah.metadata.nameEnglish} — Surah ${n} | IQRA Digital`,
    description: `Read Surah ${surah.metadata.nameEnglish} (${surah.metadata.meaning}) — ${surah.metadata.ayahCount} ayahs, ${surah.metadata.revelation}.`,
  };
}

export default async function SurahPage({ params }: PageProps) {
  const { surahNumber: raw } = await params;
  const n = parseInt(raw, 10);

  if (isNaN(n) || n < 1 || n > 114) notFound();

  const surah = loadSurah(n);
  const nav   = getSurahNavigation(n);

  if (!surah) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '16px' }}>⚠</div>
        <h1 className="page-heading" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
          Surah Not Compiled Yet
        </h1>
        <p style={{ color: 'var(--ink-secondary)', fontFamily: 'var(--font-lora)', marginBottom: '20px' }}>
          Run the compile script to generate the Quran content files.
        </p>
        <code style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--gold)', background: 'var(--bg-card)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--gold-border)', marginBottom: '24px' }}>
          node scripts/quran/compile-surahs.js
        </code>
        <Link href="/quran" style={{ color: 'var(--gold)', fontFamily: 'var(--font-lora)', textDecoration: 'none' }}>
          ← Back to Quran
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          Home
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <Link href="/quran" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          Quran
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
          {surah.metadata.nameEnglish}
        </span>
      </nav>

      {/* Surah header */}
      <header className="mb-8 text-center">
        <div dir="rtl" lang="ar" style={{
          fontFamily: 'var(--font-amiri)', fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--ink-arabic)', lineHeight: '1.7', marginBottom: '8px',
        }}>
          {surah.metadata.nameArabic}
        </div>
        <h1 className="page-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '4px' }}>
          {surah.metadata.nameEnglish}
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--ink-secondary)', marginBottom: '12px' }}>
          {surah.metadata.meaning}
        </p>

        {/* Meta badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge-group">{surah.metadata.revelation}</span>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            {surah.metadata.ayahCount} ayahs
          </span>
          {surah.metadata.juz && (
            <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Juz {surah.metadata.juz}
            </span>
          )}
          {surah.metadata.wordCount && (
            <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              {surah.metadata.wordCount.toLocaleString()} words
            </span>
          )}
        </div>

        {/* Themes */}
        {surah.metadata.themes.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {surah.metadata.themes.map((t) => (
              <span key={t} style={{
                fontFamily: 'var(--font-lora)', fontSize: '0.7rem', color: 'var(--ink-muted)',
                padding: '2px 8px', borderRadius: '20px',
                background: 'var(--bg-card)', border: '1px solid var(--gold-border)',
                textTransform: 'capitalize',
              }}>
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Reader (client shell) */}
      <SurahReader surah={surah} />

      {/* Prev / Next surah nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '48px', paddingTop: '24px',
        borderTop: '1px solid var(--gold-border)', gap: '16px',
      }}>
        {nav.prev ? (
          <Link href={`/quran/${nav.prev}`} style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)',
            textDecoration: 'none', padding: '10px 16px', borderRadius: '8px',
            border: '1px solid var(--gold-border)', background: 'var(--bg-card)', maxWidth: '45%',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>← Previous</div>
            <div>Surah {nav.prev}</div>
          </Link>
        ) : <div />}

        {nav.next && (
          <Link href={`/quran/${nav.next}`} style={{
            fontFamily: 'var(--font-lora)', fontSize: '0.85rem', color: 'var(--gold)',
            textDecoration: 'none', padding: '10px 16px', borderRadius: '8px',
            border: '1px solid var(--gold-border)', background: 'var(--bg-card)',
            textAlign: 'right', maxWidth: '45%',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>Next →</div>
            <div>Surah {nav.next}</div>
          </Link>
        )}
      </div>

      {/* Reading controls */}
      <ReaderControls
        bookSlug={`quran-${n}`}
        chapterId={null}
        page={1}
        rangeStart={1}
        rangeEnd={surah.metadata.ayahCount}
        total={surah.metadata.ayahCount}
      />
    </div>
  );
}
