'use client';

// apps/web/components/TafseerEditionSwitcher.tsx
// Lets the user pick which tafseer edition shows inline in the Quran reader.
// Saves preference to localStorage AND updates the URL (?tafseer=slug)
// so the server reloads the correct edition on navigation.
// Mirrors the TranslationSwitcher pattern exactly.

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const TAFSEER_PREF_KEY    = 'iqra:tafseer-edition';
export const DEFAULT_TAFSEER_SLUG = 'en-tafisr-ibn-kathir';

// Editions available inline in the Quran reader
// (only the 3 English + short editions — long Arabic full text is for the tafseer reader)
const INLINE_EDITIONS = [
  { slug: 'en-tafisr-ibn-kathir',    name: 'Ibn Kathir',       lang: 'EN', level: 'Intermediate' },
  { slug: 'en-al-jalalayn',          name: 'Al-Jalalayn',      lang: 'EN', level: 'Beginner'      },
  { slug: 'en-tafsir-maarif-ul-quran', name: 'Maarif-ul-Quran', lang: 'EN', level: 'Intermediate' },
  { slug: 'ar-tafsir-muyassar',      name: 'التفسير الميسر',   lang: 'AR', level: 'Beginner'      },
  { slug: 'ur-tafseer-ibn-e-kaseer', name: 'تفسیر ابن کثیر',  lang: 'UR', level: 'Intermediate'  },
  { slug: 'ar-tafsir-ibn-kathir',    name: 'ابن كثير عربي',   lang: 'AR', level: 'Advanced'      },
] as const;

interface Props {
  currentSlug: string;   // current edition from server (URL param or default)
}

export default function TafseerEditionSwitcher({ currentSlug }: Props) {
  const [open, setOpen]   = useState(false);
  const router            = useRouter();
  const pathname          = usePathname();

  const current = INLINE_EDITIONS.find(e => e.slug === currentSlug) ?? INLINE_EDITIONS[0];

  function pickEdition(slug: string) {
    // Save preference
    try { localStorage.setItem(TAFSEER_PREF_KEY, slug); } catch {}
    // Update URL so server loads the new edition
    const url = `${pathname}?tafseer=${slug}`;
    router.replace(url, { scroll: false });
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        title="Change tafseer edition"
        style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--gold-border)',
          borderRadius: '8px',
          padding:      '5px 10px',
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.75rem',
          color:        'var(--ink-secondary)',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          '5px',
          transition:   'border-color 0.15s',
          whiteSpace:   'nowrap',
        }}
      >
        {/* Book icon */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        {current.name}
        <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 30 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div style={{
            position:    'absolute',
            top:         'calc(100% + 6px)',
            right:       0,
            zIndex:      40,
            background:  'var(--bg-surface)',
            border:      '1px solid var(--gold-border-strong)',
            borderRadius:'12px',
            padding:     '10px',
            minWidth:    '230px',
            boxShadow:   '0 12px 36px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              fontFamily:    'var(--font-lora)',
              fontSize:      '0.68rem',
              color:         'var(--ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom:  '6px',
              padding:       '0 4px',
            }}>
              Tafseer edition
            </div>

            {INLINE_EDITIONS.map(ed => {
              const active = ed.slug === currentSlug;
              return (
                <button
                  key={ed.slug}
                  onClick={() => pickEdition(ed.slug)}
                  style={{
                    width:      '100%',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '8px',
                    background: active ? 'var(--gold-glow)' : 'none',
                    border:     'none',
                    borderRadius:'7px',
                    padding:    '7px 10px',
                    cursor:     'pointer',
                    textAlign:  'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ color: 'var(--gold)', fontSize: '0.8rem', width: '14px' }}>
                    {active ? '●' : '○'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-lora)',
                    fontSize:   '0.85rem',
                    color:      active ? 'var(--gold)' : 'var(--ink-secondary)',
                    flex:       1,
                  }}>
                    {ed.name}
                  </span>
                  <span style={{
                    fontFamily:   'var(--font-lora)',
                    fontSize:     '0.65rem',
                    color:        'var(--ink-muted)',
                    border:       '1px solid var(--gold-border)',
                    borderRadius: '4px',
                    padding:      '1px 5px',
                    flexShrink:   0,
                  }}>
                    {ed.lang}
                  </span>
                </button>
              );
            })}

            {/* Divider + link to full tafseer reader */}
            <div style={{ height: '1px', background: 'var(--gold-border)', margin: '8px 0' }} />
            <a
              href={`/tafseer/${currentSlug}`}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '6px 10px',
                fontFamily:     'var(--font-lora)',
                fontSize:       '0.78rem',
                color:          'var(--gold)',
                textDecoration: 'none',
                borderRadius:   '7px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 0 1h7"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Full Tafseer Reader →
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// ── Hook: read saved edition preference ───────────────────────────────────────
// Used by the quran page to pick the default edition on first load.
// Returns the slug or null (server will use URL param or default).

export function useSavedTafseerEdition(): string {
  try {
    return localStorage.getItem(TAFSEER_PREF_KEY) ?? DEFAULT_TAFSEER_SLUG;
  } catch {
    return DEFAULT_TAFSEER_SLUG;
  }
}
