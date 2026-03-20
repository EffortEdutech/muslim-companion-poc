'use client';

import { CompiledSurah } from '@/lib/quran-types';
import { useTranslationConfig } from './TranslationSwitcher';
import TranslationSwitcher from './TranslationSwitcher';
import AyahCard from './AyahCard';

interface Props {
  surah: CompiledSurah;
}

export default function SurahReader({ surah }: Props) {
  const [config, setConfig] = useTranslationConfig();

  return (
    <>
      {/* Sticky toolbar */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--nav-height)',
          zIndex: 20,
          background: 'rgba(13,17,23,0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gold-border)',
          padding: '8px 0',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            {surah.metadata.ayahCount} ayahs
          </div>
          <TranslationSwitcher config={config} onChange={setConfig} />
        </div>
      </div>

      {/* Bismillah — shown for all surahs except At-Tawba (9) */}
      {surah.surah !== 9 && (
        <div
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: 'var(--font-amiri)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--gold)',
            textAlign: 'center',
            lineHeight: '2.2',
            marginBottom: '28px',
            padding: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--gold-border)',
            borderRadius: '12px',
          }}
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
      )}

      {/* Ayah list */}
      <div className="flex flex-col gap-5">
        {surah.ayahs.map((ayah) => (
          <AyahCard
            key={ayah.ayah}
            ayah={ayah}
            surahNumber={surah.surah}
            surahName={surah.metadata.nameEnglish}
            config={config}
          />
        ))}
      </div>
    </>
  );
}
