// apps/web/lib/study-context.ts
// Saves last visited URL + breadcrumb per section.
// Navigation reads these to restore last position and show context in top bar.

const KEYS = {
  quran:      'iqra:last-quran',
  tafseer:    'iqra:last-tafseer',
  hadith:     'iqra:last-hadith',
  breadcrumb: 'iqra:breadcrumb',
} as const;

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SectionKey = 'quran' | 'tafseer' | 'hadith';

export interface StoredPosition {
  url:     string;
  label:   string;
  savedAt: number;
}

export interface BreadcrumbPart {
  label: string;
  href:  string | null;  // null = current page (not a link)
}

export interface BreadcrumbState {
  section: SectionKey;
  parts:   BreadcrumbPart[];
}

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * Save last visited URL for a section.
 * Reads window.location directly so ?chapter= and other query params are included.
 * NOT the prop — the prop is server-rendered and never has the current query string.
 */
export function saveLastUrl(section: SectionKey, label: string): void {
  if (typeof window === 'undefined') return;
  const url = window.location.pathname + window.location.search;
  safeSet(KEYS[section], { url, label, savedAt: Date.now() } satisfies StoredPosition);
}

/** Load last visited URL for a section. */
export function loadLastUrl(section: SectionKey): StoredPosition | null {
  const data = get<StoredPosition>(KEYS[section]);
  if (!data) return null;
  if (Date.now() - data.savedAt > MAX_AGE_MS) {
    try { localStorage.removeItem(KEYS[section]); } catch {}
    return null;
  }
  return data;
}

/** Save breadcrumb state for top bar display. */
export function saveBreadcrumb(state: BreadcrumbState): void {
  safeSet(KEYS.breadcrumb, state);
}

/** Load breadcrumb state for top bar display. */
export function loadBreadcrumb(): BreadcrumbState | null {
  return get<BreadcrumbState>(KEYS.breadcrumb);
}
