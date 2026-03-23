'use client';

import Link from 'next/link';

interface Props {
  query:       string;
  source:      'all' | 'hadith' | 'quran';
  book:        string;
  hadithTotal: number;
  quranTotal:  number;
}

export default function UnifiedSearchTabs({
  query, source, book, hadithTotal, quranTotal,
}: Props) {
  const combined = hadithTotal + quranTotal;

  const tabs: { key: 'all' | 'hadith' | 'quran'; label: string; count: number; href: string }[] = [
    {
      key:   'all',
      label: 'All',
      count: combined,
      href:  `/search?q=${encodeURIComponent(query)}`,
    },
    {
      key:   'quran',
      label: 'Quran',
      count: quranTotal,
      href:  `/search?q=${encodeURIComponent(query)}&src=quran`,
    },
    {
      key:   'hadith',
      label: 'Hadith',
      count: hadithTotal,
      href:  book
        ? `/search?q=${encodeURIComponent(query)}&src=hadith&book=${book}`
        : `/search?q=${encodeURIComponent(query)}&src=hadith`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        background: 'var(--bg-card)',
        borderRadius: '10px',
        border: '1px solid var(--gold-border)',
        width: 'fit-content',
      }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = source === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={active}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '6px 14px',
              borderRadius:   '7px',
              fontFamily:     'var(--font-lora)',
              fontSize:       '0.85rem',
              fontWeight:     active ? 600 : 400,
              color:          active ? '#0d1117' : 'var(--ink-secondary)',
              background:     active ? 'var(--gold)' : 'transparent',
              textDecoration: 'none',
              transition:     'all 0.15s',
              whiteSpace:     'nowrap',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  fontSize:      '0.7rem',
                  fontWeight:    active ? 600 : 400,
                  padding:       '1px 6px',
                  borderRadius:  '20px',
                  background:    active
                    ? 'rgba(13,17,23,0.18)'
                    : 'rgba(200,168,75,0.12)',
                  color:         active ? '#0d1117' : 'var(--gold)',
                  border:        active ? 'none' : '1px solid var(--gold-border)',
                  minWidth:      '22px',
                  textAlign:     'center',
                }}
              >
                {tab.count > 9999
                  ? `${Math.round(tab.count / 1000)}k`
                  : tab.count.toLocaleString()}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
