// apps/web/components/StudyFootstep.tsx
'use client';

// Floating pill at bottom-right — links to related content for current study subject.
// Does NOT push page content. Expands on click to show navigation options.
// Quran  → Tafseer | Hadith Search
// Tafseer → Read Quran | Hadith Search
// Hadith  → Read Quran | Read Tafseer (from last surah context)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  saveStudyContext,
  loadStudyContext,
  StudyContext,
  StudyContextType,
} from '@/lib/study-context';

interface Props {
  type:             StudyContextType;
  surah?:           number;
  ayah?:            number;
  surahName?:       string;
  surahNameAr?:     string;
  tafseerBookSlug?: string;
  hadithBookSlug?:  string;
  hadithBookTitle?: string;
  hadithId?:        number;
  url:              string;
}

interface NavLink {
  label:   string;
  href:    string;
  icon:    React.ReactNode;
  primary?: boolean;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconQuran = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconSearch = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StudyFootstep(props: Props) {
  const [open,      setOpen]      = useState(false);
  const [lastCtx,   setLastCtx]   = useState<StudyContext | null>(null);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    // Load previous context before overwriting (needed for Hadith page)
    const prev = loadStudyContext();
    if (prev && prev.type !== props.type) setLastCtx(prev);

    // Save current page
    saveStudyContext({
      type:             props.type,
      surah:            props.surah,
      ayah:             props.ayah,
      surahName:        props.surahName,
      surahNameAr:      props.surahNameAr,
      tafseerBookSlug:  props.tafseerBookSlug,
      hadithBookSlug:   props.hadithBookSlug,
      hadithBookTitle:  props.hadithBookTitle,
      hadithId:         props.hadithId,
      url:              props.url,
    });

    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build links ─────────────────────────────────────────────────────────────
  const links: NavLink[] = [];

  if (props.type === 'quran' && props.surah) {
    const slug = props.tafseerBookSlug || 'en-tafisr-ibn-kathir';
    const ayahParam = props.ayah ? `?ayah=${props.ayah}` : '';
    links.push({
      label:   'Tafseer',
      href:    `/tafseer/${slug}/${props.surah}${ayahParam}`,
      icon:    <IconQuran />,
      primary: true,
    });
    links.push({
      label: 'Hadith Search',
      href:  `/search?q=${encodeURIComponent(props.surahName || `surah ${props.surah}`)}&src=hadith`,
      icon:  <IconSearch />,
    });
  }

  if (props.type === 'tafseer' && props.surah) {
    const ayahParam = props.ayah ? `#ayah-${props.ayah}` : '';
    links.push({
      label:   'Read Quran',
      href:    `/quran/${props.surah}${ayahParam}`,
      icon:    <IconQuran />,
      primary: true,
    });
    links.push({
      label: 'Hadith Search',
      href:  `/search?q=${encodeURIComponent(props.surahName || `surah ${props.surah}`)}&src=hadith`,
      icon:  <IconSearch />,
    });
  }

  if (props.type === 'hadith') {
    // Use last Quran/Tafseer context if available
    const ctx = lastCtx;
    if (ctx?.surah) {
      const surahLabel = ctx.surahName || `Surah ${ctx.surah}`;
      links.push({
        label:   `Read Quran: ${surahLabel}`,
        href:    `/quran/${ctx.surah}`,
        icon:    <IconQuran />,
        primary: true,
      });
      const tSlug = ctx.tafseerBookSlug || 'en-tafisr-ibn-kathir';
      links.push({
        label: `Tafseer: ${surahLabel}`,
        href:  `/tafseer/${tSlug}/${ctx.surah}`,
        icon:  <IconQuran />,
      });
    }
  }

  // Don't render until mounted (avoids SSR mismatch) or if nothing to show
  if (!mounted || links.length === 0) return null;

  // Pill label — shows current subject
  const pillLabel = props.surahName
    ? `${props.surah}. ${props.surahName}`
    : props.hadithBookTitle
    ? props.hadithBookTitle
    : 'Study';

  return (
    <div style={{
      position:  'fixed',
      bottom:    '84px',   // above StickyBottomNav
      right:     '16px',
      zIndex:    45,
      display:   'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap:       '6px',
    }}>

      {/* Expanded link list — slides up above the pill */}
      {open && (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '5px',
          alignItems:    'flex-end',
          animation:     'footstep-fade-in 0.18s ease',
        }}>
          {links.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '7px',
                padding:        '7px 14px',
                borderRadius:   '20px',
                textDecoration: 'none',
                fontFamily:     'var(--font-lora)',
                fontSize:       '0.78rem',
                whiteSpace:     'nowrap',
                background:     link.primary
                  ? 'var(--gold)'
                  : 'var(--bg-surface)',
                color:          link.primary ? '#0d1117' : 'var(--ink-secondary)',
                border:         `1px solid ${link.primary ? 'var(--gold)' : 'var(--gold-border)'}`,
                boxShadow:      '0 2px 12px rgba(0,0,0,0.35)',
                fontWeight:     link.primary ? 600 : 400,
              }}
            >
              <span style={{ opacity: link.primary ? 1 : 0.7 }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Floating pill trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '7px',
          padding:      '8px 14px',
          borderRadius: '24px',
          border:       '1px solid var(--gold-border-strong)',
          background:   open ? 'var(--bg-surface)' : 'rgba(13,17,23,0.92)',
          backdropFilter: 'blur(12px)',
          color:        'var(--gold)',
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.78rem',
          fontWeight:   600,
          cursor:       'pointer',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.45)',
          transition:   'all 0.15s',
          whiteSpace:   'nowrap',
          maxWidth:     '200px',
        }}
      >
        <IconQuran />
        <span style={{
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          maxWidth:     '140px',
        }}>
          {pillLabel}
        </span>
        <IconChevron open={open} />
      </button>

      {/* Animation keyframe */}
      <style>{`
        @keyframes footstep-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
