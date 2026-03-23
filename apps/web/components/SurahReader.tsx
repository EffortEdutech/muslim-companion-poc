'use client';

import { useMemo } from 'react';
import { CompiledSurah } from '@/lib/quran-types';
import { TafseerEntry } from '@/lib/tafseer-types';
import { useTranslationConfig } from './TranslationSwitcher';
import TranslationSwitcher from './TranslationSwitcher';
import AyahCard from './AyahCard';

interface Props {
  surah:          CompiledSurah;
  tafseerEntries: TafseerEntry[];
}

export default function SurahReader({ surah, tafseerEntries }: Props) {
  const [config, setConfig] = useTranslationConfig();

  const tafseerMap = useMemo(() => {
    const map = new Map<number, TafseerEntry>();
    for (const entry of tafseerEntries) {
      for (let a = entry.fromAyah; a <= entry.toAyah; a++) map.set(a, entry);
    }
    return map;
  }, [tafseerEntries]);

  // Surah 1 (Al-Fatiha): ayah 1 IS the bismillah — no separate decorative header
  // Surah 9 (At-Tawba): no bismillah
  // All others: show bismillah header (compile script already stripped it from ayah 1)
  const showBismillah = surah.surah !== 1 && surah.surah !== 9;

  return (
    <>
      {/* Sticky translation toolbar */}
      <div style={{ position: 'sticky', top: 'var(--nav-height)', zIndex: 20, background: 'rgba(13,17,23,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--gold-border)', padding: '8px 0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            {surah.metadata.ayahCount} ayahs
          </div>
          <TranslationSwitcher config={config} onChange={setConfig} />
        </div>
      </div>

      {/* Decorative bismillah — surahs 2–114 except At-Tawba */}
      {showBismillah && (
        <div dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--gold)', textAlign: 'center', lineHeight: '2.2', marginBottom: '28px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: '12px' }}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
      )}

      {/* Ayah list — arabic text in compiled JSON is already clean */}
      <div className="flex flex-col gap-5">
        {surah.ayahs.map((ayah) => (
          <AyahCard
            key={ayah.ayah}
            ayah={ayah}
            surahNumber={surah.surah}
            surahName={surah.metadata.nameEnglish}
            config={config}
            tafseerEntry={tafseerMap.get(ayah.ayah) ?? null}
          />
        ))}
      </div>
    </>
  );
}
