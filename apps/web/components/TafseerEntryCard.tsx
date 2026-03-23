'use client';

import { useState } from 'react';
import { TafseerEntry } from '@/lib/tafseer-types';

interface Props {
  entry:    TafseerEntry;
  surah:    number;
  isTarget: boolean;   // true when deep-linked from the reader
}

// Threshold in characters — entries longer than this get a "Show more" toggle
const COLLAPSE_THRESHOLD = 800;

export default function TafseerEntryCard({ entry, surah, isTarget }: Props) {
  const isLong = entry.text.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLong || isTarget);

  const isSingleAyah = entry.fromAyah === entry.toAyah;
  const ayahLabel    = isSingleAyah
    ? `Ayah ${entry.fromAyah}`
    : `Ayahs ${entry.fromAyah}–${entry.toAyah}`;

  return (
    <article
      id={`entry-${entry.fromAyah}`}
      style={{
        background:   'var(--bg-card)',
        border:       `1px solid ${isTarget ? 'var(--gold-border-strong)' : 'var(--gold-border)'}`,
        borderRadius: '12px',
        padding:      '20px 22px',
        scrollMarginTop: 'calc(var(--nav-height) + 20px)',
        transition:   'border-color 0.2s',
      }}
    >
      {/* Ayah reference badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{
          background:   'rgba(200,168,75,0.10)',
          border:       '1px solid var(--gold-border-strong)',
          borderRadius: '8px',
          padding:      '3px 10px',
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.72rem',
          fontWeight:   600,
          color:        'var(--gold)',
          flexShrink:   0,
        }}>
          {surah}:{entry.fromAyah}
          {!isSingleAyah && `–${entry.toAyah}`}
        </div>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          {ayahLabel}
        </span>
      </div>

      {/* Tafseer text — rendered as HTML (source contains <b>, <i>, etc.) */}
      <div
        style={{
          maxHeight:  expanded ? 'none' : '200px',
          overflow:   expanded ? 'visible' : 'hidden',
          position:   'relative',
        }}
      >
        <div
          className="tafseer-text"
          dangerouslySetInnerHTML={{ __html: sanitize(entry.text) }}
          style={{
            fontFamily: 'var(--font-lora)',
            fontSize:   '0.96rem',
            lineHeight: '1.82',
            color:      'var(--ink)',
          }}
        />

        {/* Fade mask when collapsed */}
        {!expanded && isLong && (
          <div style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            height:     '60px',
            background: 'linear-gradient(transparent, var(--bg-card))',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Expand / collapse button */}
      {isLong && (
        <button
          onClick={() => setExpanded(p => !p)}
          style={{
            marginTop:  '12px',
            background: 'none',
            border:     '1px solid var(--gold-border)',
            borderRadius: '8px',
            padding:    '5px 14px',
            fontFamily: 'var(--font-lora)',
            fontSize:   '0.8rem',
            color:      'var(--gold)',
            cursor:     'pointer',
            transition: 'all 0.15s',
          }}
        >
          {expanded ? 'Show less ↑' : 'Read full tafseer ↓'}
        </button>
      )}
    </article>
  );
}

/**
 * Light sanitization — allow only safe formatting tags from the source.
 * QUL tafseer text uses <b>, <i>, <br>, <p>, <h1>-<h6> for structure.
 * Strip anything else to prevent XSS.
 */
function sanitize(html: string): string {
  return html
    // Remove script / style / dangerous tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    // Normalise Arabic-English section headings (often wrapped in <b> or standalone)
    .trim();
}
