// apps/web/lib/study-context.ts
// Saves the user's current study context to localStorage.
// Shared between Quran, Tafseer, and Hadith pages so they can show
// contextual navigation links to related content.

const STORAGE_KEY    = 'iqra:study-context';
const SEARCH_KEY     = 'iqra:last-search';  // written by SearchPersist
const MAX_AGE_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudyContextType = 'quran' | 'tafseer' | 'hadith';

export interface StudyContext {
  type:            StudyContextType;
  // Quran / Tafseer context
  surah?:          number;
  ayah?:           number;
  surahName?:      string;
  surahNameAr?:    string;
  tafseerBookSlug?: string;
  // Hadith context
  hadithBookSlug?:  string;
  hadithBookTitle?: string;
  hadithId?:        number;
  // Metadata
  url:             string;   // full path for "go back" link
  savedAt:         number;
}

export interface LastSearch {
  q:    string;
  src:  string;
  book: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function saveStudyContext(ctx: Omit<StudyContext, 'savedAt'>): void {
  safeSet(STORAGE_KEY, { ...ctx, savedAt: Date.now() });
}

export function loadStudyContext(): StudyContext | null {
  const ctx = safeGet<StudyContext>(STORAGE_KEY);
  if (!ctx) return null;
  if (Date.now() - ctx.savedAt > MAX_AGE_MS) return null;
  return ctx;
}

export function loadLastSearch(): LastSearch | null {
  return safeGet<LastSearch>(SEARCH_KEY);
}

export function clearStudyContext(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
