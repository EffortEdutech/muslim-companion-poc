// ── Compiled tafseer types ─────────────────────────────────────────

export interface TafseerEntry {
  fromAyah: number;
  toAyah:   number;
  ayahKeys: string[];
  text:     string;   // may contain <b>, <i>, <br> HTML tags
}

export interface TafseerCollection {
  id:       string;
  name:     string;
  author:   string;
  language: string;
  lang:     string;
}

export interface CompiledTafseer {
  surah:      number;
  collection: TafseerCollection;
  entryCount: number;
  entries:    TafseerEntry[];
}

export interface TafseerIndexEntry {
  surah:      number;
  entryCount: number;
}

export interface TafseerIndex {
  collection:  TafseerCollection;
  totalSurahs: number;
  surahs:      TafseerIndexEntry[];
}

// ── Available collections registry ────────────────────────────────
// Add new entries here as more tafseers are compiled.

export interface TafseerCollectionMeta {
  id:          string;
  name:        string;
  arabicName:  string;
  author:      string;
  language:    string;
  lang:        string;
  description: string;
}

export const TAFSEER_COLLECTIONS: TafseerCollectionMeta[] = [
  {
    id:          'ibn_kathir',
    name:        'Tafsir Ibn Kathir',
    arabicName:  'تفسير ابن كثير',
    author:      'Ismail ibn Umar ibn Kathir',
    language:    'English',
    lang:        'en',
    description: 'One of the most comprehensive and widely-trusted classical tafseer works, renowned for its use of Quranic verses, hadith, and reports from the Companions to explain the meaning of the Quran.',
  },
];

export function getTafseerById(id: string): TafseerCollectionMeta | undefined {
  return TAFSEER_COLLECTIONS.find(t => t.id === id);
}
