// apps/web/components/StudyFootstep.tsx
'use client';

// Tiny floating pill — bottom-right of reader pages.
// Clicking it returns to the section home (/quran, /tafseer, /hadith).
// The home page itself writes the correct breadcrumb + saved home URL.

import { useRouter } from 'next/navigation';
import { SectionKey } from '@/lib/study-context';

interface Props {
  section: SectionKey; // 'quran' | 'tafseer' | 'hadith'
  homeUrl: string;     // section home e.g. /quran /tafseer /hadith
}

export default function StudyFootstep({ section, homeUrl }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(homeUrl)}
      title={`Go to ${section} home`}
      style={{
        position:        'fixed',
        bottom:          '84px',
        right:           '16px',
        zIndex:          45,
        display:         'flex',
        alignItems:      'center',
        gap:             '6px',
        padding:         '6px 12px',
        borderRadius:    '20px',
        border:          '1px solid var(--gold-border)',
        background:      'rgba(13,17,23,0.92)',
        backdropFilter:  'blur(12px)',
        color:           'var(--ink-muted)',
        fontFamily:      'var(--font-lora)',
        fontSize:        '0.72rem',
        cursor:          'pointer',
        boxShadow:       '0 2px 12px rgba(0,0,0,0.4)',
        transition:      'all 0.15s',
        whiteSpace:      'nowrap',
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>

      <span
        style={{
          color:       'var(--gold)',
          fontWeight:  600,
          textTransform: 'capitalize',
        }}
      >
        {section}
      </span>
    </button>
  );
}
