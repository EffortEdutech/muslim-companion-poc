import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadTafseer, isTafseerCompiled, findEntryForAyah } from '@/lib/tafseer';
import { loadSurah } from '@/lib/quran';
import { getTafseerById } from '@/lib/tafseer-types';
import TafseerEntryCard from '@/components/TafseerEntryCard';
import StickyBottomNav from '@/components/StickyBottomNav';

interface PageProps {
  params:       Promise<{ surahNumber: string }>;
  searchParams: Promise<{ ayah?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { surahNumber } = await params;
  const n = parseInt(surahNumber, 10);
  const surah = loadSurah(n);
  if (!surah) return { title: 'Tafseer | IQRA Digital' };
  return {
    title: `Tafseer of ${surah.metadata.nameEnglish} — Surah ${n} | IQRA Digital`,
    description: `Read Tafsir Ibn Kathir for Surah ${surah.metadata.nameEnglish} (${surah.metadata.meaning}).`,
  };
}

const COLLECTION_ID = 'ibn_kathir';

export default async function TafseerPage({ params, searchParams }: PageProps) {
  const { surahNumber: raw } = await params;
  const { ayah: ayahParam }  = await searchParams;

  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 1 || n > 114) notFound();

  const collection = getTafseerById(COLLECTION_ID);

  // Load tafseer + surah data in parallel
  const [tafseer, surah] = await Promise.all([
    Promise.resolve(loadTafseer(n, COLLECTION_ID)),
    Promise.resolve(loadSurah(n)),
  ]);

  const compiled = isTafseerCompiled(COLLECTION_ID);

  // Prev / next navigation
  const prev = n > 1   ? n - 1 : null;
  const next = n < 114 ? n + 1 : null;

  // Which entry is the deep-link target (from ?ayah=N)
  const targetAyah   = ayahParam ? parseInt(ayahParam, 10) : null;
  const targetIndex  = (tafseer && targetAyah)
    ? findEntryForAyah(tafseer, targetAyah)
    : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" style={{ paddingBottom: '80px' }}>

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <Link href="/quran" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>Quran</Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        {surah && (
          <>
            <Link href={`/quran/${n}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
              {surah.metadata.nameEnglish}
            </Link>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
          </>
        )}
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>Tafseer</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        {/* Surah names */}
        {surah && (
          <div style={{ marginBottom: '16px' }}>
            <div
              dir="rtl" lang="ar"
              style={{ fontFamily: 'var(--font-amiri)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: 'var(--ink-arabic)', lineHeight: '1.7', marginBottom: '6px' }}
            >
              {surah.metadata.nameArabic}
            </div>
            <h1 className="page-heading" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: '4px' }}>
              {surah.metadata.nameEnglish}
            </h1>
            <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--ink-secondary)', marginBottom: '12px' }}>
              {surah.metadata.meaning}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge-group">{surah.metadata.revelation}</span>
              <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                {surah.metadata.ayahCount} ayahs
              </span>
            </div>
          </div>
        )}

        {/* Collection info bar */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            gap:          '12px',
            padding:      '12px 16px',
            background:   'var(--bg-card)',
            border:       '1px solid var(--gold-border)',
            borderRadius: '10px',
            flexWrap:     'wrap',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)' }}>
              {collection?.name ?? 'Tafsir Ibn Kathir'}
            </div>
            <div style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
              {collection?.author}
            </div>
          </div>

          {tafseer && (
            <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              {tafseer.entryCount} entr{tafseer.entryCount === 1 ? 'y' : 'ies'}
            </span>
          )}

          {/* Link to Quran reader */}
          <Link
            href={`/quran/${n}`}
            style={{
              fontFamily:     'var(--font-lora)',
              fontSize:       '0.8rem',
              color:          'var(--gold)',
              textDecoration: 'none',
              display:        'flex',
              alignItems:     'center',
              gap:            '5px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Read Quran
          </Link>
        </div>
      </header>

      {/* Not compiled state */}
      {!compiled && (
        <div style={{ padding: '36px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '14px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '12px', lineHeight: 1.7 }}>
            Tafseer not yet compiled. Place the source file and run:
          </p>
          <code style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--gold)', background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--gold-border)', marginBottom: '12px' }}>
            node scripts/tafseer/compile-tafseer.js
          </code>
          <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            Source file: <code style={{ fontFamily: 'monospace' }}>content/tafseer/source/en_ibn_kathir.json</code>
          </p>
        </div>
      )}

      {/* Compiled but surah missing */}
      {compiled && !tafseer && (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '12px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
            No tafseer entries found for this surah in the compiled data.
          </p>
        </div>
      )}

      {/* Tafseer entries */}
      {tafseer && tafseer.entries.length > 0 && (
        <>
          {/* Collection description */}
          {collection?.description && n === 1 && (
            <div
              style={{
                padding:      '14px 18px',
                borderLeft:   '3px solid var(--gold)',
                background:   'var(--bg-card)',
                borderRadius: '0 8px 8px 0',
                marginBottom: '24px',
                fontFamily:   'var(--font-lora)',
                fontStyle:    'italic',
                fontSize:     '0.88rem',
                color:        'var(--ink-secondary)',
                lineHeight:   1.7,
              }}
            >
              {collection.description}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {tafseer.entries.map((entry, idx) => (
              <TafseerEntryCard
                key={`${entry.fromAyah}-${idx}`}
                entry={entry}
                surah={n}
                isTarget={idx === targetIndex}
              />
            ))}
          </div>
        </>
      )}

      {/* Prev / Next surah navigation */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginTop:      '48px',
          paddingTop:     '24px',
          borderTop:      '1px solid var(--gold-border)',
          gap:            '16px',
        }}
      >
        {prev ? (
          <NavLink href={`/tafseer/${prev}`} label="← Previous" sub={`Surah ${prev}`} />
        ) : <div />}

        {next && (
          <NavLink href={`/tafseer/${next}`} label="Next →" sub={`Surah ${next}`} align="right" />
        )}
      </div>

      {/* Sticky bottom nav */}
      {surah && (
        <StickyBottomNav
          surahNumber={n}
          surahName={surah.metadata.nameEnglish}
          surahNameAr={surah.metadata.nameArabic}
          prev={prev}
          next={next}
          mode="tafseer"
        />
      )}

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function NavLink({ href, label, sub, align = 'left' }: {
  href: string; label: string; sub: string; align?: 'left' | 'right';
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily:     'var(--font-lora)',
        fontSize:       '0.85rem',
        color:          'var(--gold)',
        textDecoration: 'none',
        padding:        '10px 16px',
        borderRadius:   '8px',
        border:         '1px solid var(--gold-border)',
        background:     'var(--bg-card)',
        textAlign:      align,
        maxWidth:       '45%',
      }}
    >
      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>{label}</div>
      <div>{sub}</div>
    </Link>
  );
}
