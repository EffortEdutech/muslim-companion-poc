// ── Storage keys ─────────────────────────────────────────────────
const KEYS = {
  BOOKMARKS: 'iqra:bookmarks',
  PROGRESS:  'iqra:progress',
  PREFS:     'iqra:prefs',
} as const;

// ── Types ─────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;          // `${bookSlug}-${idInBook}` — unique key
  idInBook: number;    // hadith number within the book (for display)
  bookSlug: string;
  bookTitle: string;
  arabicText: string;
  englishText: string;
  addedAt: number;     // Unix ms timestamp
}

export interface ReadingProgress {
  bookSlug: string;
  chapterId: number | null;
  page: number;
  lastVisited: number;
}

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ReaderPrefs {
  fontSize: FontSize;
}

const DEFAULT_PREFS: ReaderPrefs = { fontSize: 'md' };

// ── CSS values for each font size ──────────────────────────────────

export const ARABIC_FONT_SIZES: Record<FontSize, string> = {
  sm: '1.3rem',
  md: '1.6rem',
  lg: '1.9rem',
  xl: '2.3rem',
};

export const ENGLISH_FONT_SIZES: Record<FontSize, string> = {
  sm: '0.88rem',
  md: '1rem',
  lg: '1.1rem',
  xl: '1.2rem',
};

// ── Safe localStorage helpers ──────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

// ── Bookmarks API ──────────────────────────────────────────────────

export function getBookmarks(): Bookmark[] {
  return safeGet<Bookmark[]>(KEYS.BOOKMARKS, []);
}

export function isBookmarked(bookSlug: string, idInBook: number): boolean {
  const key = `${bookSlug}-${idInBook}`;
  return getBookmarks().some((b) => b.id === key);
}

export function addBookmark(data: Omit<Bookmark, 'id' | 'addedAt'>): void {
  const id = `${data.bookSlug}-${data.idInBook}`;
  const rest = getBookmarks().filter((b) => b.id !== id);
  safeSet(KEYS.BOOKMARKS, [{ ...data, id, addedAt: Date.now() }, ...rest]);
}

export function removeBookmark(bookSlug: string, idInBook: number): void {
  const id = `${bookSlug}-${idInBook}`;
  safeSet(KEYS.BOOKMARKS, getBookmarks().filter((b) => b.id !== id));
}

/** Toggles bookmark. Returns true if now bookmarked, false if removed. */
export function toggleBookmark(data: Omit<Bookmark, 'id' | 'addedAt'>): boolean {
  if (isBookmarked(data.bookSlug, data.idInBook)) {
    removeBookmark(data.bookSlug, data.idInBook);
    return false;
  }
  addBookmark(data);
  return true;
}

// ── Reading Progress API ───────────────────────────────────────────

export function getProgress(bookSlug: string): ReadingProgress | null {
  const all = safeGet<Record<string, ReadingProgress>>(KEYS.PROGRESS, {});
  return all[bookSlug] ?? null;
}

export function saveProgress(progress: ReadingProgress): void {
  const all = safeGet<Record<string, ReadingProgress>>(KEYS.PROGRESS, {});
  safeSet(KEYS.PROGRESS, { ...all, [progress.bookSlug]: progress });
}

// ── Reader Preferences API ─────────────────────────────────────────

export function getReaderPrefs(): ReaderPrefs {
  return safeGet<ReaderPrefs>(KEYS.PREFS, DEFAULT_PREFS);
}

export function saveReaderPrefs(prefs: ReaderPrefs): void {
  safeSet(KEYS.PREFS, prefs);
}

/** Applies font size as CSS custom properties on <html>. */
export function applyFontSize(size: FontSize): void {
  document.documentElement.style.setProperty('--reader-ar-size', ARABIC_FONT_SIZES[size]);
  document.documentElement.style.setProperty('--reader-en-size', ENGLISH_FONT_SIZES[size]);
}
