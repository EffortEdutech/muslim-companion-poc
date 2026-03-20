'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getReaderPrefs,
  saveReaderPrefs,
  applyFontSize,
  saveProgress,
  FontSize,
} from '@/lib/reader-store';

interface Props {
  bookSlug: string;
  chapterId: number | null;
  page: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
}

const SIZES: { key: FontSize; px: number }[] = [
  { key: 'sm', px: 11 },
  { key: 'md', px: 13 },
  { key: 'lg', px: 16 },
  { key: 'xl', px: 19 },
];

export default function ReaderControls({
  bookSlug, chapterId, page, rangeStart, rangeEnd, total,
}: Props) {
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const prefs = getReaderPrefs();
    setFontSize(prefs.fontSize);
    applyFontSize(prefs.fontSize);

    // Persist reading progress
    saveProgress({ bookSlug, chapterId, page, lastVisited: Date.now() });

    setMounted(true);
  }, [bookSlug, chapterId, page]);

  function pickSize(size: FontSize) {
    setFontSize(size);
    applyFontSize(size);
    saveReaderPrefs({ fontSize: size });
  }

  const pct = total > 0 ? Math.round((rangeEnd / total) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '20px',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        pointerEvents: mounted ? 'auto' : 'none',
      }}
    >
      {/* Progress pill */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--gold-border)',
          borderRadius: '20px',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-lora)',
          fontSize: '0.7rem',
          color: 'var(--ink-muted)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ color: 'var(--ink-secondary)' }}>{rangeStart}–{rangeEnd}</span>
        <span style={{ opacity: 0.4 }}>of</span>
        <span>{total}</span>
        <span
          style={{
            display: 'inline-block',
            width: '40px',
            height: '3px',
            background: 'var(--gold-border)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginLeft: '4px',
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${pct}%`,
              background: 'var(--gold)',
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }}
          />
        </span>
        <span style={{ color: 'var(--gold)', minWidth: '28px', textAlign: 'right' }}>{pct}%</span>
      </div>

      {/* Controls bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--gold-border)',
          borderRadius: '12px',
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Label */}
        <span
          style={{
            fontFamily: 'var(--font-lora)',
            fontSize: '0.65rem',
            color: 'var(--ink-muted)',
            paddingRight: '7px',
            borderRight: '1px solid var(--gold-border)',
            marginRight: '4px',
            letterSpacing: '0.04em',
          }}
        >
          Aa
        </span>

        {/* Size buttons */}
        {SIZES.map(({ key, px }) => (
          <button
            key={key}
            onClick={() => pickSize(key)}
            title={`Font size ${key}`}
            style={{
              background: fontSize === key ? 'var(--gold-glow)' : 'none',
              border: fontSize === key ? '1px solid var(--gold-border-strong)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '3px 8px',
              color: fontSize === key ? 'var(--gold)' : 'var(--ink-muted)',
              fontFamily: 'var(--font-lora)',
              fontSize: `${px}px`,
              fontWeight: fontSize === key ? 600 : 400,
              lineHeight: 1.6,
              transition: 'all 0.15s',
            }}
          >
            A
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--gold-border)', margin: '0 5px' }} />

        {/* Bookmarks shortcut */}
        <Link
          href="/bookmarks"
          title="Your bookmarks"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '3px 6px',
            borderRadius: '6px',
            color: 'var(--ink-muted)',
            transition: 'color 0.15s',
            textDecoration: 'none',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
