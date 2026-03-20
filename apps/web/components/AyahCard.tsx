'use client';

import { useState, useEffect } from 'react';
import { Ayah, TranslationKey } from '@/lib/quran-types';
import { TranslationConfig } from './TranslationSwitcher';
import { isBookmarked, toggleBookmark } from '@/lib/reader-store';

interface Props {
  ayah:        Ayah;
  surahNumber: number;
  surahName:   string;
  config:      TranslationConfig;
}

export default function AyahCard({ ayah, surahNumber, surahName, config }: Props) {
  const bookmarkId = `quran-${surahNumber}-${ayah.ayah}`;
  const [saved, setSaved]   = useState(false);
  const [pulse, setPulse]   = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(`quran-${surahNumber}`, ayah.ayah));
  }, [surahNumber, ayah.ayah]);

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    const next = toggleBookmark({
      idInBook:    ayah.ayah,
      bookSlug:    `quran-${surahNumber}`,
      bookTitle:   `Surah ${surahName} (${surahNumber})`,
      arabicText:  ayah.arabic,
      englishText: ayah.translations[config.primary],
    });
    setSaved(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
  }

  const primaryText   = ayah.translations[config.primary];
  const secondaryText = config.secondary ? ayah.translations[config.secondary] : null;

  return (
    <article
      id={`ayah-${ayah.ayah}`}
      className="hadith-card"
      style={{ scrollMarginTop: 'calc(var(--nav-height) + 16px)' }}
    >
      {/* Top row: number + bookmark */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(200,168,75,0.10)', border: '1px solid var(--gold-border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-lora)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)',
        }}>
          {ayah.ayah}
        </div>

        <button
          onClick={handleBookmark}
          title={saved ? 'Remove bookmark' : 'Bookmark this ayah'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 6px', borderRadius: '6px',
            color: saved ? 'var(--gold)' : 'var(--ink-muted)',
            transition: 'color 0.2s, transform 0.15s',
            transform: pulse ? 'scale(1.35)' : 'scale(1)',
          }}
        >
          {saved ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
            </svg>
          )}
        </button>
      </div>

      {/* Arabic */}
      <div
        dir="rtl"
        lang="ar"
        className="arabic-text"
        style={{ fontSize: 'var(--reader-ar-size, 1.8rem)', lineHeight: '2.8', marginBottom: '4px' }}
      >
        {ayah.arabic}
        {/* Ayah number ornament */}
        <span style={{ fontSize: '0.8em', color: 'var(--gold)', marginRight: '6px', opacity: 0.7 }}>
          ﴿{toArabicNumeral(ayah.ayah)}﴾
        </span>
      </div>

      {/* Transliteration */}
      {config.showTranslit && ayah.transliteration && (
        <p style={{
          fontFamily: 'var(--font-lora)', fontStyle: 'italic',
          fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '10px', lineHeight: 1.7,
        }}>
          {ayah.transliteration}
        </p>
      )}

      <div className="gold-divider" />

      {/* Primary translation */}
      <p style={{
        fontFamily: 'var(--font-lora)',
        fontSize: 'var(--reader-en-size, 1rem)',
        lineHeight: '1.8', color: 'var(--ink)',
      }}>
        {primaryText}
      </p>

      {/* Secondary translation */}
      {secondaryText && (
        <>
          <div style={{ height: '1px', background: 'var(--gold-border)', margin: '12px 0', opacity: 0.5 }} />
          <p style={{
            fontFamily: 'var(--font-lora)', fontStyle: 'italic',
            fontSize: 'calc(var(--reader-en-size, 1rem) * 0.93)',
            lineHeight: '1.75', color: 'var(--ink-secondary)',
          }}>
            {secondaryText}
          </p>
        </>
      )}

      {/* Reference */}
      <div style={{
        marginTop: '14px', paddingTop: '10px',
        borderTop: '1px solid var(--gold-border)',
        display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--gold)', fontWeight: 500 }}>
          Surah {surahNumber}
        </span>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.73rem' }}>·</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
          Ayah {ayah.ayah}
        </span>
      </div>
    </article>
  );
}

// Convert Western numerals to Arabic-Indic numerals for ornament
function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}
