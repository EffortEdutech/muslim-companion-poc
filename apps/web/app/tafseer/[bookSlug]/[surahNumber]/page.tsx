// apps/web/app/tafseer/[bookSlug]/[surahNumber]/page.tsx
// Tafseer surah reader — uses TafseerReader for split/accordion experience.

import type { Metadata }  from 'next';
import { notFound }       from 'next/navigation';
import Link               from 'next/link';
import { loadTafseer, findEntryForAyah, isTafseerAvailable } from '@/lib/tafseer';
import { loadSurah, loadSurahIndex }                         from '@/lib/quran';
import { getTafseerById }                                    from '@/lib/tafseer-types';
import TafseerReader      from '@/components/TafseerReader';
import StickyBottomNav    from '@/components/StickyBottomNav';
import StudyFootstep      from '@/components/StudyFootstep';

interface PageProps {
  params:       Promise<{ bookSlug: string; surahNumber: string }>;
  searchParams: Promise<{ ayah?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookSlug, surahNumber } = await params;
  const n     = parseInt(surahNumber, 10);
  const book  = getTafseerById(bookSlug);
  const surah = loadSurah(n);
  if (!book || !surah) return { title: 'Tafseer | IQRA Digital' };
  return {
    title:       `${surah.metadata.nameEnglish} — ${book.name} | Tafseer | IQRA Digital`,
    description: `Read ${book.name} tafseer for Surah ${surah.metadata.nameEnglish}.`,
  };
}

export default async function TafseerSurahPage({ params, searchParams }: PageProps) {
  const { bookSlug, surahNumber: raw } = await params;
  const { ayah: ayahParam }            = await searchParams;

  const n    = parseInt(raw, 10);
  if (isNaN(n) || n < 1 || n > 114) notFound();

  const book = getTafseerById(bookSlug);
  if (!book) notFound();
  if (!isTafseerAvailable(book.id)) notFound();

  const [tafseer, surah] = await Promise.all([
    Promise.resolve(loadTafseer(n, book.id)),
    Promise.resolve(loadSurah(n)),
  ]);

  const prev = n > 1   ? n - 1 : null;
  const next = n < 114 ? n + 1 : null;

  const targetAyah = ayahParam ? parseInt(ayahParam, 10) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10" style={{ paddingBottom: '100px' }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav style={{
        marginBottom: '24px',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        flexWrap:     'wrap',
      }}>
        <Link href="/tafseer" style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          Tafseer
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <Link href={`/tafseer/${book.id}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none' }}>
          {book.name}
        </Link>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>›</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
          {surah ? `${n}. ${surah.metadata.nameEnglish}` : `Surah ${n}`}
        </span>
      </nav>

      {/* ── Study footstep ───────────────────────────────────────────────── */}
      <StudyFootstep
        type="tafseer"
        surah={n}
        surahName={surah?.metadata.nameEnglish}
        surahNameAr={surah?.metadata.nameArabic}
        tafseerBookSlug={book.id}
        url={`/tafseer/${book.id}/${n}`}
      />

      {/* ── Surah header ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

          <div>
            {surah && (
              <>
                <div dir="rtl" lang="ar" style={{
                  fontFamily: 'var(--font-amiri)',
                  fontSize:   'clamp(1.8rem, 4vw, 2.6rem)',
                  color:      'var(--gold)',
                  lineHeight: 1.6,
                  marginBottom: '4px',
                }}>
                  {surah.metadata.nameArabic}
                </div>
                <h1 className="page-heading" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: '6px' }}>
                  {surah.metadata.nameEnglish}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-lora)',
                    fontStyle:  'italic',
                    fontSize:   '0.85rem',
                    color:      'var(--ink-muted)',
                  }}>
                    {surah.metadata.meaning}
                  </span>
                  <span style={{ color: 'var(--gold-border)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                    {surah.metadata.ayahCount} ayahs · {surah.metadata.revelation}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Edition tag + Quran reader link */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{
              fontFamily:   'var(--font-lora)',
              fontSize:     '0.78rem',
              color:        book.accentColor,
              background:   book.bgColor,
              border:       `1px solid ${book.borderColor}`,
              borderRadius: '20px',
              padding:      '3px 14px',
              whiteSpace:   'nowrap',
            }}>
              {book.name}
            </span>
            <Link href={`/quran/${n}`} style={{
              fontFamily:     'var(--font-lora)',
              fontSize:       '0.78rem',
              color:          'var(--gold)',
              textDecoration: 'none',
              display:        'flex',
              alignItems:     'center',
              gap:            '4px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Read Quran →
            </Link>
          </div>
        </div>
      </header>

      {/* ── No tafseer ───────────────────────────────────────────────────── */}
      {(!tafseer || tafseer.entries.length === 0) && (
        <div style={{
          padding:      '40px 24px',
          textAlign:    'center',
          background:   'var(--bg-card)',
          border:       '1px solid var(--gold-border)',
          borderRadius: '14px',
        }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            No tafseer entries found for this surah in {book.name}.
          </p>
        </div>
      )}

      {/* ── Tafseer reader ───────────────────────────────────────────────── */}
      {tafseer && tafseer.entries.length > 0 && (
        <TafseerReader
          entries={tafseer.entries}
          surah={n}
          bookName={book.name}
          targetAyah={targetAyah}
        />
      )}

      {/* ── Surah navigation ─────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        marginTop:      '56px',
        paddingTop:     '24px',
        borderTop:      '1px solid var(--gold-border)',
        gap:            '16px',
      }}>
        {prev ? (
          <NavLink href={`/tafseer/${book.id}/${prev}`} label="← Previous" sub={`Surah ${prev}`} />
        ) : <div />}
        {next && (
          <NavLink href={`/tafseer/${book.id}/${next}`} label="Next →" sub={`Surah ${next}`} align="right" />
        )}
      </div>

      {/* ── Sticky bottom nav ────────────────────────────────────────────── */}
      {surah && (
        <StickyBottomNav
          surahNumber={n}
          surahName={surah.metadata.nameEnglish}
          surahNameAr={surah.metadata.nameArabic}
          prev={prev}
          next={next}
          mode="tafseer"
          bookSlug={book.id}
        />
      )}
    </div>
  );
}

function NavLink({ href, label, sub, align = 'left' }: {
  href: string; label: string; sub: string; align?: 'left' | 'right';
}) {
  return (
    <Link href={href} style={{
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
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '3px' }}>{label}</div>
      <div>{sub}</div>
    </Link>
  );
}
