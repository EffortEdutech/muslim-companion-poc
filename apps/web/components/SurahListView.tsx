'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SurahIndexEntry } from '@/lib/quran-types';

interface Props {
  surahs: SurahIndexEntry[];
}

export default function SurahListView({ surahs }: Props) {
  // 'number' = flat 1–114 grid (DEFAULT)
  // 'revelation' = Meccan group then Medinan group, both sorted by surah number
  const [mode, setMode] = useState<'number' | 'revelation'>('number');

  const sorted  = [...surahs].sort((a, b) => a.surah - b.surah);
  const meccan  = sorted.filter(s => s.revelation === 'Meccan');
  const medinan = sorted.filter(s => s.revelation === 'Medinan');

  return (
    <div>
      {/* ── Toggle row ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          {surahs.length} surahs · {surahs.reduce((t, s) => t + s.ayahCount, 0).toLocaleString()} ayahs
        </p>

        {/* Toggle pill */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          <button
            onClick={() => setMode('number')}
            style={{
              padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-lora)', fontSize: '0.84rem',
              background: mode === 'number' ? 'var(--gold)' : 'transparent',
              color:      mode === 'number' ? '#0d1117'    : 'var(--ink-secondary)',
              fontWeight: mode === 'number' ? 600 : 400,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            Surah 1–114
          </button>
          <button
            onClick={() => setMode('revelation')}
            style={{
              padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-lora)', fontSize: '0.84rem',
              background: mode === 'revelation' ? 'var(--gold)' : 'transparent',
              color:      mode === 'revelation' ? '#0d1117'    : 'var(--ink-secondary)',
              fontWeight: mode === 'revelation' ? 600 : 400,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            Meccan · Medinan
          </button>
        </div>
      </div>

      {/* ── Flat 1–114 grid ────────────────────────────────────── */}
      {mode === 'number' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {sorted.map(s => <SurahCard key={s.surah} surah={s} />)}
        </div>
      )}

      {/* ── Meccan then Medinan (both sorted by surah number) ──── */}
      {mode === 'revelation' && (
        <>
          <section style={{ marginBottom: '48px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <h2 className="page-heading" style={{ fontSize: '1.4rem' }}>Meccan Surahs</h2>
                <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.1rem', color: 'var(--gold)' }}>السور المكية</span>
                <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{meccan.length} surahs · sorted by surah number</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {meccan.map(s => <SurahCard key={s.surah} surah={s} />)}
            </div>
          </section>

          <section>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <h2 className="page-heading" style={{ fontSize: '1.4rem' }}>Medinan Surahs</h2>
                <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.1rem', color: 'var(--gold)' }}>السور المدنية</span>
                <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{medinan.length} surahs · sorted by surah number</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {medinan.map(s => <SurahCard key={s.surah} surah={s} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SurahCard({ surah: s }: { surah: SurahIndexEntry }) {
  return (
    <Link href={`/quran/${s.surah}`} style={{ textDecoration: 'none' }} className="collection-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'rgba(200,168,75,0.10)', border: '1px solid var(--gold-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-lora)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)' }}>
          {s.surah}
        </div>
        <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.4rem', color: 'var(--ink-arabic)', lineHeight: '1.7' }}>
          {s.nameArabic}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>{s.nameEnglish}</div>
      <div style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--ink-secondary)', marginBottom: '12px' }}>{s.meaning}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <span className="badge-group" style={{ fontSize: '0.65rem' }}>{s.revelation}</span>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
          {s.ayahCount} ayahs{s.juz ? ` · Juz ${s.juz}` : ''}
        </span>
        <span style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>→</span>
      </div>
    </Link>
  );
}
