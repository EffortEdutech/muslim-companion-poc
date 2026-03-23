import Link from 'next/link';
import { isTafseerCompiled } from '@/lib/tafseer';

interface Props {
  surahNumber: number;
  ayahNumber?: number;
}

export default function TafseerLink({ surahNumber, ayahNumber }: Props) {
  const compiled = isTafseerCompiled('ibn_kathir');
  if (!compiled) return null;

  const href = ayahNumber
    ? `/tafseer/${surahNumber}?ayah=${ayahNumber}`
    : `/tafseer/${surahNumber}`;

  return (
    <Link
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '5px',
        fontFamily:     'var(--font-lora)',
        fontSize:       '0.8rem',
        color:          'var(--gold)',
        textDecoration: 'none',
        padding:        '4px 10px',
        borderRadius:   '7px',
        border:         '1px solid var(--gold-border)',
        background:     'var(--bg-card)',
        transition:     'border-color 0.15s',
        whiteSpace:     'nowrap',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      Tafseer
    </Link>
  );
}
