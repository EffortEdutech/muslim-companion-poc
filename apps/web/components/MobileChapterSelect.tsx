// apps/web/components/MobileChapterSelect.tsx
'use client';

import { useRouter } from 'next/navigation';

interface Chapter {
  id:      number;
  english: string;
}

interface Props {
  bookSlug:          string;
  chapters:          Chapter[];
  hadithCounts:      Record<number, number>;
  selectedChapterId: number | null;
}

export default function MobileChapterSelect({
  bookSlug, chapters, hadithCounts, selectedChapterId,
}: Props) {
  const router = useRouter();

  return (
    <div className="block sm:hidden" style={{ marginBottom: '16px' }}>
      <label style={{
        fontFamily:    'var(--font-lora)',
        fontSize:      '0.75rem',
        color:         'var(--ink-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        display:       'block',
        marginBottom:  '6px',
      }}>
        Chapter
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={selectedChapterId ?? ''}
          onChange={(e) => router.push(`/hadith/${bookSlug}?chapter=${e.target.value}`)}
          style={{
            width:              '100%',
            fontFamily:         'var(--font-lora)',
            fontSize:           '0.88rem',
            color:              'var(--ink)',
            background:         'var(--bg-card)',
            border:             '1px solid var(--gold-border)',
            borderRadius:       '10px',
            padding:            '10px 36px 10px 14px',
            cursor:             'pointer',
            appearance:         'none',
            WebkitAppearance:   'none',
            outline:            'none',
          }}
        >
          <option value="" disabled>Select a chapter…</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.english || `Chapter ${ch.id}`} ({hadithCounts[ch.id] ?? 0})
            </option>
          ))}
        </select>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="var(--gold)" strokeWidth="2"
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}
