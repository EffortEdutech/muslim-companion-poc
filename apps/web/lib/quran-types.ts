// ── Quran types — matches compiled surah schema exactly ──────────

export interface AyahTranslations {
  en_sahih:    string;
  en_yusufali: string;
  ms_basmeih:  string;
}

export interface Ayah {
  ayah:            number;
  arabic:          string;
  transliteration: string;
  translations:    AyahTranslations;
}

export interface SurahMeta {
  nameArabic:      string;
  nameEnglish:     string;
  nameTranslit:    string;
  meaning:         string;
  revelation:      'Meccan' | 'Medinan' | string;
  revelationOrder: number | null;
  period:          string;
  ayahCount:       number;
  wordCount:       number | null;
  letterCount:     number | null;
  juz:             string | number | null;
  pageStart:       number | null;
  themes:          string[];
  otherNames:      string[];
  significance:    string;
}

export interface CompiledSurah {
  surah:    number;
  metadata: SurahMeta;
  ayahs:    Ayah[];
}

export interface SurahIndexEntry {
  surah:        number;
  nameArabic:   string;
  nameEnglish:  string;
  nameTranslit: string;
  meaning:      string;
  revelation:   string;
  ayahCount:    number;
  juz:          string | number | null;
  pageStart:    number | null;
}

export interface SurahIndex {
  metadata: { totalSurahs: number; totalAyahs: number };
  surahs:   SurahIndexEntry[];
}

export type TranslationKey = keyof AyahTranslations;

export const TRANSLATION_LABELS: Record<TranslationKey, string> = {
  en_sahih:    'Sahih International',
  en_yusufali: 'Yusuf Ali',
  ms_basmeih:  'Basmeih (Malay)',
};

export const TRANSLATION_KEYS: TranslationKey[] = [
  'en_sahih',
  'en_yusufali',
  'ms_basmeih',
];
