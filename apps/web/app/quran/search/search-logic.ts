import path from 'path';
import fs from 'fs';
import {
  SearchIndexEntry,
  QuranSearchResult,
  QuranSearchResponse,
} from '@/lib/quran-search-types';

const INDEX_PATH = path.join(
  process.cwd(), '..', '..', 'content', 'quran', 'db', 'metadata', 'search-index.json'
);

const LIMIT = 20;

// ── Cached index — loaded once per server process ─────────────────
let _cache: SearchIndexEntry[] | null = null;

function loadIndex(): SearchIndexEntry[] {
  if (_cache) return _cache;
  if (!fs.existsSync(INDEX_PATH)) return [];
  try {
    _cache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    return _cache!;
  } catch {
    return [];
  }
}

// ── Arabic normalisation ──────────────────────────────────────────
// Strips tashkeel so diacritic-free queries match fully-vowelled text.

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')   // tashkeel / harakat
    .replace(/\u0640/g, '')                    // tatweel (kashida)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')  // alef variants → ا
    .replace(/\u0649/g, '\u064A')              // alef maqsura → ي
    .replace(/\u0629/g, '\u0647')              // taa marbuta → ه
    .replace(/\u0624/g, '\u0648')              // hamza on waw → و
    .replace(/\u0626/g, '\u064A')              // hamza on ya → ي
    .trim();
}

// ── Scoring helpers ───────────────────────────────────────────────

function scoreText(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower.includes(query.toLowerCase())) return 3;
  const matched = terms.filter(t => lower.includes(t)).length;
  if (matched === terms.length) return 2;
  if (matched > 0) return matched / terms.length;
  return 0;
}

function scoreArabic(arabic: string, rawQuery: string): number {
  if (!arabic || !rawQuery) return 0;
  const normText  = normalizeArabic(arabic);
  const normQuery = normalizeArabic(rawQuery);
  if (!normQuery) return 0;
  if (normText.includes(normQuery)) return 3;
  const words   = normQuery.split(/\s+/).filter(Boolean);
  const matched = words.filter(w => normText.includes(w)).length;
  if (matched === words.length) return 2;
  if (matched > 0) return matched / words.length;
  return 0;
}

// Detect reference patterns: "2:255", "2|255", "surah 2 ayah 255"
function parseReference(query: string): { surah: number; ayah: number | null } | null {
  const q = query.trim();

  // "2:255" or "2|255"
  const colonMatch = q.match(/^(\d{1,3})[:|](\d{1,3})$/);
  if (colonMatch) {
    return { surah: parseInt(colonMatch[1], 10), ayah: parseInt(colonMatch[2], 10) };
  }

  // "surah 2" or "surah 2 ayah 3"
  const surahMatch = q.match(/surah\s+(\d{1,3})(?:\s+(?:ayah|verse|aya)\s+(\d{1,3}))?/i);
  if (surahMatch) {
    return {
      surah: parseInt(surahMatch[1], 10),
      ayah:  surahMatch[2] ? parseInt(surahMatch[2], 10) : null,
    };
  }

  return null;
}

// ── Main search ───────────────────────────────────────────────────

export default function searchQuran(
  rawQuery: string,
  page: number
): QuranSearchResponse {
  const query = rawQuery.trim();

  if (query.length < 2) {
    return { results: [], total: 0, query, page, limit: LIMIT };
  }

  const index = loadIndex();
  if (index.length === 0) {
    return { results: [], total: 0, query, page, limit: LIMIT };
  }

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const ref   = parseReference(query);
  const scored: QuranSearchResult[] = [];

  for (const entry of index) {
    let maxScore = 0;

    // Reference lookup — highest priority (score 4)
    if (ref) {
      if (ref.surah === entry.s) {
        if (ref.ayah === null || ref.ayah === entry.a) {
          maxScore = 4;
        }
      }
    }

    if (maxScore < 4) {
      // Arabic — normalised matching
      const arScore = scoreArabic(entry.ar, query);
      if (arScore > maxScore) maxScore = arScore;

      // English translations
      const saScore = scoreText(entry.sa, query, terms);
      if (saScore > maxScore) maxScore = saScore;

      const yuScore = scoreText(entry.yu, query, terms);
      if (yuScore > maxScore) maxScore = yuScore;

      // Malay
      const msScore = scoreText(entry.ms, query, terms);
      if (msScore > maxScore) maxScore = msScore;

      // Surah name (lower weight — partial match only)
      const snScore = scoreText(entry.sn, query, terms) * 0.4;
      if (snScore > maxScore) maxScore = snScore;
    }

    if (maxScore > 0) {
      scored.push({
        surah:       entry.s,
        ayah:        entry.a,
        surahName:   entry.sn,
        arabic:      entry.ar,
        en_sahih:    entry.sa,
        en_yusufali: entry.yu,
        ms_basmeih:  entry.ms,
        score:       maxScore,
      });
    }
  }

  // Sort: score desc, then surah asc, then ayah asc
  scored.sort((a, b) =>
    b.score - a.score ||
    a.surah - b.surah ||
    a.ayah  - b.ayah
  );

  const total   = scored.length;
  const offset  = (page - 1) * LIMIT;
  const results = scored.slice(offset, offset + LIMIT);

  return { results, total, query, page, limit: LIMIT };
}
