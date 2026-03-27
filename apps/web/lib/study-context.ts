// apps/web/lib/study-context.ts
// Stores last visited URL per section (quran / tafseer / hadith).
// Navigation.tsx reads these to restore the last page when user clicks a nav link.
// StudyFootstep writes to these on every reader page visit.

const KEYS = {
  quran:   'iqra:last-quran',
  tafseer: 'iqra:last-tafseer',
  hadith:  'iqra:last-hadith',
} as const;

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SectionKey = keyof typeof KEYS;

interface StoredUrl {
  url:       string;
  label:     string;   // human-readable e.g. "Al-Baqarah" or "Bukhari"
  savedAt:   number;
}

function safeGet(key: string): StoredUrl | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data: StoredUrl = JSON.parse(raw);
    if (Date.now() - data.savedAt > MAX_AGE_MS) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function safeSet(key: string, value: StoredUrl): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Save the last visited URL for a section. Call from reader pages. */
export function saveLastUrl(section: SectionKey, url: string, label: string): void {
  safeSet(KEYS[section], { url, label, savedAt: Date.now() });
}

/** Load the last visited URL for a section. Returns null if none or expired. */
export function loadLastUrl(section: SectionKey): StoredUrl | null {
  return safeGet(KEYS[section]);
}

/** Clear the stored URL for a section (used by the reset pill). */
export function clearLastUrl(section: SectionKey): void {
  try { localStorage.removeItem(KEYS[section]); } catch {}
}
