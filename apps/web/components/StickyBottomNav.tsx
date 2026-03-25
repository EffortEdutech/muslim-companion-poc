'use client';

// apps/web/components/StickyBottomNav.tsx
// UPDATED: tafseer mode now accepts optional bookSlug for /tafseer/[bookSlug]/[n] routes.

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Props {
  surahNumber: number;
  surahName:   string;
  surahNameAr: string;
  prev:        number | null;
  next:        number | null;
  mode:        'quran' | 'tafseer';
  bookSlug?:   string;  // required when mode === 'tafseer'
}

export default function StickyBottomNav({
  surahNumber, surahName, surahNameAr, prev, next, mode, bookSlug,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 280); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Build base path depending on mode
  const base = mode === 'tafseer'
    ? `/tafseer/${bookSlug ?? 'en-tafisr-ibn-kathir'}`
    : '/quran';

  return (
    <div style={{
      position:   'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      transform:  visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.25s ease',
      background: 'rgba(13, 17, 23, 0.96)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop:  '1px solid var(--gold-border)',
    }}>
      <div style={{
        maxWidth: '42rem', margin: '0 auto', padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>

        {/* Prev */}
        {prev ? (
          <Link href={`${base}/${prev}`} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'var(--font-lora)', fontSize: '0.8rem',
            color: 'var(--gold)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: '8px',
            border: '1px solid var(--gold-border)', background: 'var(--bg-card)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }} title={`Surah ${prev}`}>
            ← {prev}
          </Link>
        ) : (
          <div style={{ width: '52px' }} />
        )}

        {/* Centre — breadcrumb */}
        <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', fontFamily: 'var(--font-lora)', fontSize: '0.72rem',
            color: 'var(--ink-muted)', flexWrap: 'wrap',
          }}>
            <Link href="/quran" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Quran</Link>
            <span>›</span>
            <Link href={`/quran/${surahNumber}`} style={{
              color: mode === 'tafseer' ? 'var(--ink-muted)' : 'var(--ink-secondary)',
              textDecoration: 'none',
            }}>
              {surahNumber}. {surahName}
            </Link>
            {mode === 'tafseer' && (
              <>
                <span>›</span>
                <span style={{ color: 'var(--ink-secondary)' }}>Tafseer</span>
              </>
            )}
          </div>
          <div dir="rtl" lang="ar" style={{
            fontFamily: 'var(--font-amiri)', fontSize: '1rem',
            color: 'var(--gold)', lineHeight: 1.6,
          }}>
            {surahNameAr}
          </div>
        </div>

        {/* Next */}
        {next ? (
          <Link href={`${base}/${next}`} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'var(--font-lora)', fontSize: '0.8rem',
            color: 'var(--gold)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: '8px',
            border: '1px solid var(--gold-border)', background: 'var(--bg-card)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }} title={`Surah ${next}`}>
            {next} →
          </Link>
        ) : (
          <div style={{ width: '52px' }} />
        )}

      </div>
    </div>
  );
}
