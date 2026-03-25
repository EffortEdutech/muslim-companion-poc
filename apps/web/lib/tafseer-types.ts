// apps/web/lib/tafseer-types.ts
// Tafseer is a BOOK — structured and presented like Hadith.
// Each edition is a book with 114 chapters (surahs).

// ── Per-ayah entry shape ───────────────────────────────────────────
// This is what each ayah entry looks like once loaded.
// fromAyah === toAyah === ayah number (one entry per ayah).

export interface TafseerEntry {
  fromAyah: number;
  toAyah:   number;
  ayahKeys: string[];
  text:     string;
}

// ── Collection metadata ────────────────────────────────────────────

export interface TafseerCollection {
  id:       string;
  name:     string;
  author:   string;
  language: string;
  lang:     string;
}

// ── Compiled tafseer for one surah (runtime shape) ─────────────────

export interface CompiledTafseer {
  surah:      number;
  collection: TafseerCollection;
  entryCount: number;
  entries:    TafseerEntry[];
}

// ── Index entry ────────────────────────────────────────────────────

export interface TafseerIndexEntry {
  surah:      number;
  entryCount: number;
}

export interface TafseerIndex {
  collection:  TafseerCollection;
  totalSurahs: number;
  surahs:      TafseerIndexEntry[];
}

// ── Book-level metadata (shown on index + book pages) ─────────────

export interface TafseerCollectionMeta {
  id:          string;   // folder slug: content/tafsir/db/{id}/
  name:        string;
  arabicName:  string;
  author:      string;
  language:    'English' | 'Arabic' | 'Urdu';
  lang:        string;
  level:       'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  accentColor: string;
  bgColor:     string;
  borderColor: string;
}

export const TAFSEER_COLLECTIONS: TafseerCollectionMeta[] = [
  {
    id:          'en-tafisr-ibn-kathir',
    name:        'Tafsir Ibn Kathir',
    arabicName:  'تفسير ابن كثير',
    author:      'Hafiz Ibn Kathir',
    language:    'English',
    lang:        'en',
    level:       'Intermediate',
    description: 'The most widely-referenced classical tafseer. Uses Quranic verses, authentic hadith, and reports from the Companions to explain the meaning of each ayah.',
    accentColor: '#1D9E75',
    bgColor:     '#E1F5EE',
    borderColor: '#9FE1CB',
  },
  {
    id:          'en-al-jalalayn',
    name:        'Al-Jalalayn',
    arabicName:  'تفسير الجلالين',
    author:      'Jalal al-Din al-Mahalli & al-Suyuti',
    language:    'English',
    lang:        'en',
    level:       'Beginner',
    description: 'A concise classical tafseer written by two scholars. Clear, brief explanations — ideal for daily reading and students beginning their study of tafseer.',
    accentColor: '#185FA5',
    bgColor:     '#E6F1FB',
    borderColor: '#B5D4F4',
  },
  {
    id:          'en-tafsir-maarif-ul-quran',
    name:        'Maarif-ul-Quran',
    arabicName:  'معارف القرآن',
    author:      'Mufti Muhammad Shafi',
    language:    'English',
    lang:        'en',
    level:       'Intermediate',
    description: 'A comprehensive tafseer covering linguistic analysis, fiqh rulings, and contextual explanations. Written in accessible modern English for the contemporary reader.',
    accentColor: '#854F0B',
    bgColor:     '#FAEEDA',
    borderColor: '#FAC775',
  },
  {
    id:          'ar-tafsir-ibn-kathir',
    name:        'تفسير ابن كثير',
    arabicName:  'تفسير ابن كثير',
    author:      'الحافظ ابن كثير',
    language:    'Arabic',
    lang:        'ar',
    level:       'Advanced',
    description: 'النسخة العربية الكاملة من تفسير ابن كثير — من أشهر كتب التفسير وأوثقها، يعتمد على القرآن والسنة وأقوال الصحابة والتابعين.',
    accentColor: '#3B6D11',
    bgColor:     '#EAF3DE',
    borderColor: '#C0DD97',
  },
  {
    id:          'ar-tafsir-muyassar',
    name:        'التفسير الميسر',
    arabicName:  'التفسير الميسر',
    author:      'مجمع الملك فهد',
    language:    'Arabic',
    lang:        'ar',
    level:       'Beginner',
    description: 'تفسير موجز وميسر صادر عن مجمع الملك فهد لطباعة المصحف الشريف — مناسب للقراءة اليومية والفهم السريع لمعاني القرآن الكريم.',
    accentColor: '#534AB7',
    bgColor:     '#EEEDFE',
    borderColor: '#CECBF6',
  },
  {
    id:          'ur-tafseer-ibn-e-kaseer',
    name:        'تفسیر ابن کثیر',
    arabicName:  'تفسیر ابن کثیر',
    author:      'حافظ ابن کثیر',
    language:    'Urdu',
    lang:        'ur',
    level:       'Intermediate',
    description: 'اردو زبان میں تفسیر ابن کثیر کا مکمل ترجمہ — برصغیر کے مسلمانوں کے لیے ایک قابل اعتماد اور مستند تفسیر۔',
    accentColor: '#993C1D',
    bgColor:     '#FAECE7',
    borderColor: '#F5C4B3',
  },
];

// Lookup by id (also accepts old legacy IDs)
const ALIASES: Record<string, string> = {
  'ibn_kathir':         'en-tafisr-ibn-kathir',
  'al_jalalayn':        'en-al-jalalayn',
  'maarif_ul_quran':    'en-tafsir-maarif-ul-quran',
  'ar_ibn_kathir':      'ar-tafsir-ibn-kathir',
  'ar_muyassar':        'ar-tafsir-muyassar',
  'ur_ibn_kathir':      'ur-tafseer-ibn-e-kaseer',
};

export function getTafseerById(id: string): TafseerCollectionMeta | undefined {
  return TAFSEER_COLLECTIONS.find(t => t.id === (ALIASES[id] ?? id));
}

export function getDefaultTafseer(): TafseerCollectionMeta {
  return TAFSEER_COLLECTIONS[0]; // en-tafisr-ibn-kathir
}
