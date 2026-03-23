'use client';

import { useState, useEffect } from 'react';
import { Ayah } from '@/lib/quran-types';
import { TranslationConfig } from './TranslationSwitcher';
import { isBookmarked, toggleBookmark } from '@/lib/reader-store';
import { TafseerEntry } from '@/lib/tafseer-types';

interface Props {
  ayah:          Ayah;
  surahNumber:   number;
  surahName:     string;
  config:        TranslationConfig;
  tafseerEntry?: TafseerEntry | null;
}

export default function AyahCard({ ayah, surahNumber, surahName, config, tafseerEntry }: Props) {
  const [saved, setSaved]             = useState(false);
  const [pulse, setPulse]             = useState(false);
  const [tafseerOpen, setTafseerOpen] = useState(false);

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
  const hasTafseer    = !!tafseerEntry;

  return (
    <article
      id={`ayah-${ayah.ayah}`}
      className="hadith-card"
      style={{ scrollMarginTop: 'calc(var(--nav-height) + 16px)' }}
    >
      {/* Top row: number + controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(200,168,75,0.10)', border: '1px solid var(--gold-border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-lora)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)',
        }}>
          {ayah.ayah}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          {/* Tafseer toggle */}
          {hasTafseer && (
            <button
              onClick={() => setTafseerOpen(p => !p)}
              title={tafseerOpen ? 'Hide tafseer' : 'Show tafseer'}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: tafseerOpen ? 'var(--gold-glow)' : 'none',
                border: `1px solid ${tafseerOpen ? 'var(--gold-border-strong)' : 'var(--gold-border)'}`,
                borderRadius: '7px', padding: '3px 9px', cursor: 'pointer',
                fontFamily: 'var(--font-lora)', fontSize: '0.72rem',
                color: tafseerOpen ? 'var(--gold)' : 'var(--ink-muted)',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Tafseer
              <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{tafseerOpen ? '▲' : '▼'}</span>
            </button>
          )}

          {/* Bookmark */}
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
      </div>

      {/* Arabic */}
      <div dir="rtl" lang="ar" className="arabic-text"
        style={{ fontSize: 'var(--reader-ar-size, 1.8rem)', lineHeight: '2.8', marginBottom: '4px' }}>
        {ayah.arabic}
        <span style={{ fontSize: '0.8em', color: 'var(--gold)', marginRight: '6px', opacity: 0.7 }}>
          ﴿{toArabicNumeral(ayah.ayah)}﴾
        </span>
      </div>

      {/* Transliteration */}
      {config.showTranslit && ayah.transliteration && (
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '10px', lineHeight: 1.7 }}>
          {ayah.transliteration}
        </p>
      )}

      <div className="gold-divider" />

      {/* Primary translation */}
      <p style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--reader-en-size, 1rem)', lineHeight: '1.78', color: 'var(--ink)' }}>
        {primaryText}
      </p>

      {/* Secondary translation */}
      {secondaryText && (
        <>
          <div style={{ height: '1px', background: 'var(--gold-border)', margin: '12px 0', opacity: 0.5 }} />
          <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: 'calc(var(--reader-en-size, 1rem) * 0.93)', lineHeight: '1.75', color: 'var(--ink-secondary)' }}>
            {secondaryText}
          </p>
        </>
      )}

      {/* Inline Tafseer */}
      {hasTafseer && tafseerOpen && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gold-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '-0.01em' }}>
              Tafsir Ibn Kathir
            </span>
            {tafseerEntry!.fromAyah !== tafseerEntry!.toAyah && (
              <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.7rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                (covers ayahs {tafseerEntry!.fromAyah}–{tafseerEntry!.toAyah})
              </span>
            )}
          </div>
          <div
            className="tafseer-text"
            dangerouslySetInnerHTML={{ __html: sanitizeTafseer(tafseerEntry!.text) }}
            style={{ fontFamily: 'var(--font-lora)', fontSize: '0.93rem', lineHeight: '1.82', color: 'var(--ink)' }}
          />
        </div>
      )}

      {/* Reference footer */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--gold)', fontWeight: 500 }}>Surah {surahNumber}</span>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.73rem' }}>·</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.73rem', color: 'var(--ink-muted)' }}>Ayah {ayah.ayah}</span>
      </div>
    </article>
  );
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function sanitizeTafseer(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
