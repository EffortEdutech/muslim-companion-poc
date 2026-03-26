// apps/web/lib/content-availability.ts
// Scans the content folder on disk and returns what is actually present.
// Uses path.resolve() for absolute paths — required for Vercel Lambda runtime.

import path from 'path';
import fs   from 'fs';

// path.resolve() converts relative REPO_ROOT to absolute path.
// REPO_ROOT='.' on Vercel → resolves to process.cwd() (Lambda root = /var/task/)
// REPO_ROOT not set on localhost → resolves ../../ from apps/web/ to monorepo root
const REPO_ROOT = path.resolve(
  process.env.REPO_ROOT ?? path.join(process.cwd(), '..', '..')
);
const CONTENT = path.join(REPO_ROOT, 'content');

let _cache: ContentAvailability | null = null;

export interface TafseerEditionStatus {
  slug:       string;
  name:       string;
  language:   string;
  available:  boolean;
  surahCount: number;
}

export interface HadithBookStatus {
  slug:      string;
  folder:    string;
  available: boolean;
}

export interface ContentAvailability {
  quranCompiled:         boolean;
  quranSurahCount:       number;
  quranSearchIndex:      boolean;
  hadithSearchIndex:     boolean;
  hadithBooks:           HadithBookStatus[];
  hadithBookCount:       number;
  tafseerEditions:       TafseerEditionStatus[];
  tafseerAvailableCount: number;
  isFullDatabase:        boolean;
  isMinimalDatabase:     boolean;
  // Debug info — helps diagnose Vercel path issues
  _debug?: {
    repoRoot:    string;
    contentDir:  string;
    cwd:         string;
    contentExists: boolean;
  };
}

const ALL_TAFSEER_EDITIONS = [
  { slug: 'en-tafisr-ibn-kathir',      name: 'Tafsir Ibn Kathir',   language: 'English' },
  { slug: 'en-al-jalalayn',            name: 'Al-Jalalayn',         language: 'English' },
  { slug: 'en-tafsir-maarif-ul-quran', name: 'Maarif-ul-Quran',     language: 'English' },
  { slug: 'ar-tafsir-ibn-kathir',      name: 'تفسير ابن كثير',     language: 'Arabic'  },
  { slug: 'ar-tafsir-muyassar',        name: 'التفسير الميسر',     language: 'Arabic'  },
  { slug: 'ur-tafseer-ibn-e-kaseer',   name: 'تفسیر ابن کثیر',    language: 'Urdu'    },
];

const ALL_HADITH_BOOKS = [
  { slug: 'bukhari',   folder: 'by_book/the_9_books/bukhari'  },
  { slug: 'muslim',    folder: 'by_book/the_9_books/muslim'   },
  { slug: 'abudawud',  folder: 'by_book/the_9_books/abudawud' },
  { slug: 'tirmidhi',  folder: 'by_book/the_9_books/tirmidhi' },
  { slug: 'nasai',     folder: 'by_book/the_9_books/nasai'    },
  { slug: 'ibnmajah',  folder: 'by_book/the_9_books/ibnmajah' },
  { slug: 'malik',     folder: 'by_book/the_9_books/malik'    },
  { slug: 'ahmed',     folder: 'by_book/the_9_books/ahmad'    },
  { slug: 'darimi',    folder: 'by_book/the_9_books/darimi'   },
  { slug: 'nawawi40',  folder: 'by_book/forties/nawawi40'     },
];

function countJsonFiles(dir: string): number {
  try {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).length;
  } catch { return 0; }
}

function exists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

export function scanContentAvailability(): ContentAvailability {
  if (_cache) return _cache;

  const quranCompiled  = path.join(CONTENT, 'quran', 'db', 'compiled');
  const quranMeta      = path.join(CONTENT, 'quran', 'db', 'metadata');
  const hadithBase     = path.join(CONTENT, 'hadith', 'db');
  const tafsirBase     = path.join(CONTENT, 'tafsir', 'db');

  const quranSurahCount  = countJsonFiles(quranCompiled);
  const quranSearchIndex = exists(path.join(quranMeta, 'search-index.json'));
  const hadithSearchIndex = exists(
    path.join(hadithBase, 'metadata', 'hadith-search-index.json')
  );

  const hadithBooks: HadithBookStatus[] = ALL_HADITH_BOOKS.map(b => ({
    slug:      b.slug,
    folder:    b.folder,
    available: countJsonFiles(path.join(hadithBase, b.folder)) > 0,
  }));
  const hadithBookCount = hadithBooks.filter(b => b.available).length;

  const tafseerEditions: TafseerEditionStatus[] = ALL_TAFSEER_EDITIONS.map(e => {
    const count = countJsonFiles(path.join(tafsirBase, e.slug));
    return { ...e, available: count > 0, surahCount: count };
  });
  const tafseerAvailableCount = tafseerEditions.filter(e => e.available).length;

  _cache = {
    quranCompiled:         quranSurahCount > 0,
    quranSurahCount,
    quranSearchIndex,
    hadithSearchIndex,
    hadithBooks,
    hadithBookCount,
    tafseerEditions,
    tafseerAvailableCount,
    isFullDatabase:    quranSurahCount >= 114 && hadithBookCount >= 9 && tafseerAvailableCount >= 4,
    isMinimalDatabase: quranSurahCount >= 114 && hadithBookCount >= 1,
    _debug: {
      repoRoot:      REPO_ROOT,
      contentDir:    CONTENT,
      cwd:           process.cwd(),
      contentExists: exists(CONTENT),
    },
  };

  return _cache;
}

export function isTafseerEditionAvailable(slug: string): boolean {
  return scanContentAvailability().tafseerEditions.find(e => e.slug === slug)?.available ?? false;
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
