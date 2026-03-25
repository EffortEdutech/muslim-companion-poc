// apps/web/app/quran/search/search-logic.ts
// UPDATED: Now searches 7 languages (added Indonesian, Urdu, French, Spanish)
// Same scoring pattern, backwards compatible with existing index structure.

import path from 'path';
import fs   from 'fs';
import {
  SearchIndexEntry,
  QuranSearchResult,
  QuranSearchResponse,
} from '@/lib/quran-search-types';

const INDEX_PATH = path.join(
  process.env.REPO_ROOT || path.join(process.cwd(), '..', '..'),
  'content', 'quran', 'db', 'metadata', 'search-index.json'
);

const LIMIT = 20;

// ── Cached index ──────────────────────────────────────────────────────────────
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

// ── Arabic normalisation ──────────────────────────────────────────────────────
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .trim();
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreText(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower.includes(query.toLowerCase())) return 3;
  const matched = terms.filter(t => lower.includes(t)).length;
  if (matched === terms.length) return 2;
  if (matched > 0)              return matched / terms.length;
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
  if (matched > 0)              return matched / words.length;
  return 0;
}

function parseReference(query: string): { surah: number; ayah: number | null } | null {
  const q = query.trim();
  const colonMatch = q.match(/^(\d{1,3})[:|](\d{1,3})$/);
  if (colonMatch) {
    return { surah: parseInt(colonMatch[1], 10), ayah: parseInt(colonMatch[2], 10) };
  }
  const surahMatch = q.match(/surah\s+(\d{1,3})(?:\s+(?:ayah|verse|aya)\s+(\d{1,3}))?/i);
  if (surahMatch) {
    return {
      surah: parseInt(surahMatch[1], 10),
      ayah:  surahMatch[2] ? parseInt(surahMatch[2], 10) : null,
    };
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function searchQuran(
  rawQuery: string,
  page:     number
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

    if (ref) {
      if (ref.surah === entry.s && (ref.ayah === null || ref.ayah === entry.a)) {
        maxScore = 4;
      }
    }

    if (maxScore < 4) {
      // Arabic
      const arScore = scoreArabic(entry.ar, query);
      if (arScore > maxScore) maxScore = arScore;

      // English — Sahih International
      const saScore = scoreText(entry.sa, query, terms);
      if (saScore > maxScore) maxScore = saScore;

      // English — Yusuf Ali
      const yuScore = scoreText(entry.yu, query, terms);
      if (yuScore > maxScore) maxScore = yuScore;

      // Malay (Basmeih)
      const msScore = scoreText(entry.ms, query, terms);
      if (msScore > maxScore) maxScore = msScore;

      // Indonesian — NEW
      const idScore = scoreText((entry as any).id, query, terms);
      if (idScore > maxScore) maxScore = idScore;

      // Urdu — NEW
      const urScore = scoreText((entry as any).ur, query, terms);
      if (urScore > maxScore) maxScore = urScore;

      // French — NEW
      const frScore = scoreText((entry as any).fr, query, terms);
      if (frScore > maxScore) maxScore = frScore;

      // Spanish — NEW
      const esScore = scoreText((entry as any).es, query, terms);
      if (esScore > maxScore) maxScore = esScore;

      // Surah name (lower weight)
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
