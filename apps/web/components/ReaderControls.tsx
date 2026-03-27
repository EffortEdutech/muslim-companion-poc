// apps/web/components/ReaderControls.tsx
'use client';

// Minimal floating font-size control — single "Aa" icon, expands on tap.
// Progress is saved silently in background — NOT shown in UI.
// Bookmark shortcut kept inside the expanded panel.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getReaderPrefs, saveReaderPrefs, applyFontSize, saveProgress, FontSize,
} from '@/lib/reader-store';

interface Props {
  bookSlug:     string;
  chapterId:    number | null;
  page:         number;
  rangeStart:   number;
  rangeEnd:     number;
  total:        number;
  bottomOffset?: number;
}

const SIZES: { key: FontSize; label: string }[] = [
  { key: 'sm', label: 'A'  },
  { key: 'md', label: 'A'  },
  { key: 'lg', label: 'A'  },
  { key: 'xl', label: 'A'  },
];

const SIZE_PX: Record<FontSize, number> = { sm: 10, md: 13, lg: 16, xl: 20 };

export default function ReaderControls({
  bookSlug, chapterId, page, rangeStart, rangeEnd, total, bottomOffset = 24,
}: Props) {
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [open,     setOpen]     = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefs = getReaderPrefs();
    setFontSize(prefs.fontSize);
    applyFontSize(prefs.fontSize);
    saveProgress({ bookSlug, chapterId, page, lastVisited: Date.now() });
    setMounted(true);
  }, [bookSlug, chapterId, page]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function pickSize(size: FontSize) {
    setFontSize(size);
    applyFontSize(size);
    saveReaderPrefs({ fontSize: size });
  }

  if (!mounted) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position:  'fixed',
        bottom:    `${bottomOffset}px`,
        left:      '16px',   // left side — away from StudyFootstep on right
        zIndex:    44,
        display:   'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap:       '6px',
      }}
    >
      {/* Expanded panel */}
      {open && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '4px',
          padding:      '5px 8px',
          background:   'rgba(13,17,23,0.95)',
          backdropFilter: 'blur(12px)',
          border:       '1px solid var(--gold-border)',
          borderRadius: '20px',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.45)',
          animation:    'rc-fadein 0.15s ease',
        }}>
          {SIZES.map(({ key }) => (
            <button
              key={key}
              onClick={() => pickSize(key)}
              style={{
                background:  fontSize === key ? 'var(--gold)' : 'none',
                border:      'none',
                borderRadius:'12px',
                cursor:      'pointer',
                padding:     '3px 7px',
                color:       fontSize === key ? '#0d1117' : 'var(--ink-muted)',
                fontFamily:  'var(--font-lora)',
                fontSize:    `${SIZE_PX[key]}px`,
                fontWeight:  fontSize === key ? 700 : 400,
                lineHeight:  1.4,
                transition:  'all 0.12s',
              }}
            >
              A
            </button>
          ))}
          <div style={{ width:'1px', height:'16px', background:'var(--gold-border)', margin:'0 4px' }} />
          <Link
            href="/bookmarks"
            onClick={() => setOpen(false)}
            title="Bookmarks"
            style={{ display:'flex', alignItems:'center', padding:'3px 5px', color:'var(--ink-muted)', textDecoration:'none' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z"/>
            </svg>
          </Link>
        </div>
      )}

      {/* Trigger — tiny Aa pill */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Font size"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '3px',
          padding:      '5px 10px',
          borderRadius: '20px',
          border:       '1px solid var(--gold-border)',
          background:   open ? 'var(--gold)' : 'rgba(13,17,23,0.88)',
          backdropFilter: 'blur(10px)',
          color:        open ? '#0d1117' : 'var(--ink-muted)',
          cursor:       'pointer',
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.72rem',
          fontWeight:   600,
          boxShadow:    '0 2px 10px rgba(0,0,0,0.35)',
          transition:   'all 0.15s',
          letterSpacing:'0.03em',
        }}
      >
        Aa
      </button>

      <style>{`
        @keyframes rc-fadein {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}
