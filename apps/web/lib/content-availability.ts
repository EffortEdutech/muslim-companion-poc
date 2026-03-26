// apps/web/lib/content-availability.ts
// Scans the content folder on disk and returns what is actually present.
// Used by all pages to show/hide features based on real availability.
// Works on localhost (full DB) and Vercel (limited DB) automatically.

import path from 'path';
import fs   from 'fs';

const REPO_ROOT = process.env.REPO_ROOT || path.join(process.cwd(), '..', '..');
const CONTENT   = path.join(REPO_ROOT, 'content');

// ── Cache — scanned once per server process ───────────────────────────────────
let _cache: ContentAvailability | null = null;

export interface TafseerEditionStatus {
  slug:      string;
  name:      string;
  language:  string;
  available: boolean;
  surahCount: number;   // 0 if not available
}

export interface HadithBookStatus {
  slug:     string;
  folder:   string;
  available: boolean;
}

export interface ContentAvailability {
  // Quran
  quranCompiled:    boolean;
  quranSurahCount:  number;
  quranSearchIndex: boolean;

  // Hadith
  hadithSearchIndex: boolean;
  hadithBooks:       HadithBookStatus[];
  hadithBookCount:   number;  // how many are available

  // Tafseer
  tafseerEditions: TafseerEditionStatus[];
  tafseerAvailableCount: number;

  // Summary
  isFullDatabase: boolean;  // true if we have everything
  isMinimalDatabase: boolean; // true if we have at least quran + some hadith
}

// All editions we support — scanner checks which are present
const ALL_TAFSEER_EDITIONS = [
  { slug: 'en-tafisr-ibn-kathir',      name: 'Tafsir Ibn Kathir',   language: 'English' },
  { slug: 'en-al-jalalayn',            name: 'Al-Jalalayn',         language: 'English' },
  { slug: 'en-tafsir-maarif-ul-quran', name: 'Maarif-ul-Quran',     language: 'English' },
  { slug: 'ar-tafsir-ibn-kathir',      name: 'تفسير ابن كثير',     language: 'Arabic'  },
  { slug: 'ar-tafsir-muyassar',        name: 'التفسير الميسر',     language: 'Arabic'  },
  { slug: 'ur-tafseer-ibn-e-kaseer',   name: 'تفسیر ابن کثیر',    language: 'Urdu'    },
];

const ALL_HADITH_BOOKS = [
  { slug: 'bukhari',          folder: 'by_book/the_9_books/bukhari'  },
  { slug: 'muslim',           folder: 'by_book/the_9_books/muslim'   },
  { slug: 'abudawud',         folder: 'by_book/the_9_books/abudawud' },
  { slug: 'tirmidhi',         folder: 'by_book/the_9_books/tirmidhi' },
  { slug: 'nasai',            folder: 'by_book/the_9_books/nasai'    },
  { slug: 'ibnmajah',         folder: 'by_book/the_9_books/ibnmajah' },
  { slug: 'malik',            folder: 'by_book/the_9_books/malik'    },
  { slug: 'ahmed',            folder: 'by_book/the_9_books/ahmad'    },
  { slug: 'darimi',           folder: 'by_book/the_9_books/darimi'   },
  { slug: 'riyad_assalihin',  folder: 'by_book/other_books'          },
  { slug: 'nawawi40',         folder: 'by_book/forties/nawawi40'     },
];

function countFiles(dir: string, ext: string): number {
  try {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith(ext)).length;
  } catch {
    return 0;
  }
}

function fileExists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

export function scanContentAvailability(): ContentAvailability {
  if (_cache) return _cache;

  const quranCompiled  = path.join(CONTENT, 'quran', 'db', 'compiled');
  const quranMeta      = path.join(CONTENT, 'quran', 'db', 'metadata');
  const hadithBase     = path.join(CONTENT, 'hadith', 'db');
  const tafsirBase     = path.join(CONTENT, 'tafsir', 'db');

  // ── Quran ─────────────────────────────────────────────────────────────────
  const quranSurahCount  = countFiles(quranCompiled, '.json');
  const quranSearchIndex = fileExists(path.join(quranMeta, 'search-index.json'));

  // ── Hadith ────────────────────────────────────────────────────────────────
  const hadithSearchIndex = fileExists(
    path.join(hadithBase, 'metadata', 'hadith-search-index.json')
  );
  const hadithBooks: HadithBookStatus[] = ALL_HADITH_BOOKS.map(b => ({
    slug:      b.slug,
    folder:    b.folder,
    available: countFiles(path.join(hadithBase, b.folder), '.json') > 0,
  }));
  const hadithBookCount = hadithBooks.filter(b => b.available).length;

  // ── Tafseer ───────────────────────────────────────────────────────────────
  const tafseerEditions: TafseerEditionStatus[] = ALL_TAFSEER_EDITIONS.map(e => {
    const editionDir = path.join(tafsirBase, e.slug);
    const count      = countFiles(editionDir, '.json');
    return {
      slug:       e.slug,
      name:       e.name,
      language:   e.language,
      available:  count > 0,
      surahCount: count,
    };
  });
  const tafseerAvailableCount = tafseerEditions.filter(e => e.available).length;

  // ── Summary ───────────────────────────────────────────────────────────────
  const isFullDatabase    = quranSurahCount >= 114 && hadithBookCount >= 9 && tafseerAvailableCount >= 4;
  const isMinimalDatabase = quranSurahCount >= 114 && hadithBookCount >= 1;

  _cache = {
    quranCompiled:    quranSurahCount > 0,
    quranSurahCount,
    quranSearchIndex,
    hadithSearchIndex,
    hadithBooks,
    hadithBookCount,
    tafseerEditions,
    tafseerAvailableCount,
    isFullDatabase,
    isMinimalDatabase,
  };

  return _cache;
}

// ── Convenience helpers used by individual pages ──────────────────────────────

export function isTafseerEditionAvailable(slug: string): boolean {
  const av = scanContentAvailability();
  return av.tafseerEditions.find(e => e.slug === slug)?.available ?? false;
}

export function getAvailableTafseerEditions(): TafseerEditionStatus[] {
  return scanContentAvailability().tafseerEditions.filter(e => e.available);
}

export function isHadithSearchAvailable(): boolean {
  return scanContentAvailability().hadithSearchIndex;
}

export function isQuranSearchAvailable(): boolean {
  return scanContentAvailability().quranSearchIndex;
}
