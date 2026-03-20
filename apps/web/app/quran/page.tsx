import type { Metadata } from 'next';
import Link from 'next/link';
import { loadSurahIndex, isQuranCompiled } from '@/lib/quran';
import { SurahIndexEntry } from '@/lib/quran-types';

export const metadata: Metadata = {
  title: 'Quran | IQRA Digital',
  description: 'Browse all 114 surahs of the Holy Quran with Arabic text, transliteration, and multiple translations.',
};

export default async function QuranPage() {
  const compiled = isQuranCompiled();
  const index    = compiled ? loadSurahIndex() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

      {/* Hero */}
      <header className="text-center mb-14">
        <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '2.4rem', color: 'var(--gold)', lineHeight: '1.8', marginBottom: '4px' }}>
          بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '28px' }}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </div>

        <h1 className="page-heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '10px' }}>
          The Holy Quran
        </h1>
        <p style={{ fontFamily: 'var(--font-lora)', fontSize: '1rem', color: 'var(--ink-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          {index
            ? <>114 surahs · <span style={{ color: 'var(--gold)' }}>{index.metadata.totalAyahs.toLocaleString()}</span> ayahs</>
            : '114 surahs of the Holy Quran'}
        </p>
        <div style={{ marginTop: '8px', fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          Sahih International · Yusuf Ali · Basmeih (Malay)
        </div>

        {/* Search CTA */}
        <div style={{ marginTop: '20px' }}>
          <Link
            href="/quran/search"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--gold-border-strong)',
              color: 'var(--ink-secondary)', borderRadius: '12px', padding: '10px 20px',
              fontFamily: 'var(--font-lora)', fontSize: '0.9rem', textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search the Quran
          </Link>
        </div>
      </header>

      {/* Not compiled */}
      {!compiled && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '14px', marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--font-lora)', color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '12px', lineHeight: 1.7 }}>
            Quran content not yet compiled. Run the compile script first:
          </p>
          <code style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--gold)', background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
            node scripts/quran/compile-surahs.js
          </code>
        </div>
      )}

      {/* Surah grid */}
      {index && (
        <>
          <SurahGroup
            label="Meccan Surahs" labelAr="السور المكية"
            description="Revealed before the Hijra — faith, monotheism, the hereafter"
            surahs={index.surahs.filter(s => s.revelation === 'Meccan')}
          />
          <SurahGroup
            label="Medinan Surahs" labelAr="السور المدنية"
            description="Revealed after the Hijra — legislation, community, detailed guidance"
            surahs={index.surahs.filter(s => s.revelation === 'Medinan')}
          />
          {index.surahs.some(s => s.revelation !== 'Meccan' && s.revelation !== 'Medinan') && (
            <SurahGroup label="Other" labelAr="" description=""
              surahs={index.surahs.filter(s => s.revelation !== 'Meccan' && s.revelation !== 'Medinan')}
            />
          )}
        </>
      )}
    </div>
  );
}

function SurahGroup({ label, labelAr, description, surahs }: {
  label: string; labelAr: string; description: string; surahs: SurahIndexEntry[];
}) {
  if (!surahs.length) return null;
  return (
    <section className="mb-14">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h2 className="page-heading" style={{ fontSize: '1.5rem' }}>{label}</h2>
          {labelAr && <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.2rem', color: 'var(--gold)' }}>{labelAr}</span>}
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{surahs.length} surahs</span>
        </div>
        {description && <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '4px' }}>{description}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
        {surahs.map(s => <SurahCard key={s.surah} surah={s} />)}
      </div>
    </section>
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
