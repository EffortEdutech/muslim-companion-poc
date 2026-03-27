// apps/web/lib/study-context.ts
// Silently saves last visited URL and page label per section.
// Navigation reads these to restore last position when user taps a nav tab.
// Also stores current breadcrumb so Navigation can display it in the top bar.

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
  label:   string;   // e.g. "Al-Baqarah" or "Sahih al-Bukhari"
  savedAt: number;
}

export interface BreadcrumbState {
  section: SectionKey;
  parts:   string[];  // e.g. ["Quran", "Al-Baqarah"] or ["Tafseer", "Ibn Kathir", "Al-Fatiha"]
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function set(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Last position (for nav restoration) ──────────────────────────────────────

/** Called from ReadingProgress on every reader page. */
export function saveLastUrl(
  section: SectionKey,
  url:     string,
  label:   string,
): void {
  set(KEYS[section], { url, label, savedAt: Date.now() } satisfies StoredPosition);
}

/** Called from Navigation when user taps a section tab. */
export function loadLastUrl(section: SectionKey): StoredPosition | null {
  const data = get<StoredPosition>(KEYS[section]);
  if (!data) return null;
  if (Date.now() - data.savedAt > MAX_AGE_MS) {
    try { localStorage.removeItem(KEYS[section]); } catch {}
    return null;
  }
  return data;
}

// ── Breadcrumb (for top nav display) ─────────────────────────────────────────

/** Called from ReadingProgress on every reader page. */
export function saveBreadcrumb(state: BreadcrumbState): void {
  set(KEYS.breadcrumb, state);
}

/** Called from Navigation to show context in the top bar. */
export function loadBreadcrumb(): BreadcrumbState | null {
  return get<BreadcrumbState>(KEYS.breadcrumb);
}
