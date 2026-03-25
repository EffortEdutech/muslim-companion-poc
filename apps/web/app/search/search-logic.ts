// apps/web/app/search/search-logic.ts
// UPDATED Phase 2: reads from pre-built flat hadith index for fast search.
// Falls back to per-file reading if the index doesn't exist yet.

import path from 'path';
import fs   from 'fs';
import { SearchResult, SearchResponse } from '@/lib/types';
import { COLLECTIONS, getCollectionBySlug } from '@/lib/collections';

const REPO_ROOT    = process.env.REPO_ROOT || path.join(process.cwd(), '..', '..');
const DB_BASE      = path.join(REPO_ROOT, 'content', 'hadith', 'db');
const INDEX_PATH   = path.join(DB_BASE, 'metadata', 'hadith-search-index.json');
const SEARCH_LIMIT = 20;

// ── Flat index entry (from build-search-index.js) ────────────────────────────
interface FlatHadith {
  _id: number;
  ib:  number;   // idInBook
  bs:  string;   // bookSlug
  bsh: string;   // short book name
  ct:  string;   // chapter title
  ar:  string;   // arabic text
  en:  string;   // english text
  na:  string;   // narrator
}

// ── Index cache — loaded once per server process ──────────────────────────────
let _indexCache: FlatHadith[] | null = null;
let _usingIndex = false;

function loadFlatIndex(): FlatHadith[] | null {
  if (_indexCache !== null) return _indexCache;
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    _indexCache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    _usingIndex = true;
    return _indexCache;
  } catch {
    return null;
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
function scoreEnglish(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower.includes(query.toLowerCase())) return 3;
  const matches = terms.filter(t => lower.includes(t));
  if (matches.length === terms.length) return 2;
  if (matches.length > 0) return matches.length / terms.length;
  return 0;
}

function scoreArabic(arabic: string, rawQuery: string): number {
  if (!arabic || !rawQuery) return 0;
  const normText  = normalizeArabic(arabic);
  const normQuery = normalizeArabic(rawQuery);
  if (!normQuery) return 0;
  if (normText.includes(normQuery)) return 3;
  const words   = normQuery.split(/\s+/).filter(Boolean);
  const matched = words.filter(w => normText.includes(w));
  if (matched.length === words.length) return 2;
  if (matched.length > 0) return matched.length / words.length;
  return 0;
}

function parseReferenceQuery(query: string): number | null {
  const q = query.trim();
  const hashMatch = q.match(/^#(\d+)$/);
  if (hashMatch) return parseInt(hashMatch[1], 10);
  const hadithMatch = q.match(/^hadith\s+(\d+)$/i);
  if (hadithMatch) return parseInt(hadithMatch[1], 10);
  return null;
}

// ── Fast search against pre-built flat index ──────────────────────────────────
function searchFlatIndex(
  query: string,
  bookSlug: string,
  page: number,
  flatIndex: FlatHadith[]
): SearchResponse {
  const terms  = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const refNum = parseReferenceQuery(query);

  // Filter to requested book if specified
  const source = bookSlug
    ? flatIndex.filter(h => h.bs === bookSlug)
    : flatIndex;

  const allResults: SearchResult[] = [];

  for (const h of source) {
    let maxScore = 0;

    if (refNum !== null && h.ib === refNum) {
      maxScore = 4;
    }

    if (maxScore < 4) {
      const enScore = scoreEnglish(h.en, query, terms);
      if (enScore > maxScore) maxScore = enScore;

      if (h.na) {
        const naScore = scoreEnglish(h.na, query, terms);
        if (naScore > maxScore) maxScore = naScore;
      }

      const arScore = scoreArabic(h.ar, query);
      if (arScore > maxScore) maxScore = arScore;

      if (h.ct) {
        const ctScore = scoreEnglish(h.ct, query, terms) * 0.4;
        if (ctScore > maxScore) maxScore = ctScore;
      }

      // Book name match — helps with "riyad" type queries
      const bshScore = scoreEnglish(h.bsh, query, terms) * 0.3;
      if (bshScore > maxScore) maxScore = bshScore;
    }

    if (maxScore > 0) {
      // Reconstruct the SearchResult shape that HadithCard expects
      const col = getCollectionBySlug(h.bs);
      allResults.push({
        hadith: {
          id:        h._id,
          idInBook:  h.ib,
          chapterId: 0,       // not in flat index — chapter title stored separately
          bookId:    0,
          arabic:    h.ar,
          english:   { narrator: h.na, text: h.en },
        },
        bookSlug:       h.bs,
        bookTitle:      col?.displayName || h.bsh,
        bookArabicTitle: col?.arabicName || '',
        chapterTitle:   h.ct,
        score:          maxScore,
      });
    }
  }

  allResults.sort((a, b) => b.score - a.score || a.hadith.idInBook - b.hadith.idInBook);

  const total   = allResults.length;
  const offset  = (page - 1) * SEARCH_LIMIT;
  const results = allResults.slice(offset, offset + SEARCH_LIMIT);

  return { results, total, query, page, limit: SEARCH_LIMIT };
}

// ── Fallback: per-file search (original behaviour) ────────────────────────────
function searchPerFile(
  query: string,
  bookSlug: string,
  page: number
): SearchResponse {
  const terms  = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const refNum = parseReferenceQuery(query);

  const collectionsToSearch = bookSlug
    ? [getCollectionBySlug(bookSlug)].filter(Boolean)
    : COLLECTIONS;

  const allResults: SearchResult[] = [];

  for (const col of collectionsToSearch) {
    if (!col) continue;
    const filePath = path.join(DB_BASE, 'by_book', col.group, col.filename);
    if (!fs.existsSync(filePath)) continue;

    let book: any;
    try { book = JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { continue; }

    const chapterMap = new Map((book.chapters || []).map((c: any) => [c.id, c]));

    for (const hadith of (book.hadiths || [])) {
      let maxScore = 0;

      if (refNum !== null && hadith.idInBook === refNum) maxScore = 4;

      if (maxScore < 4) {
        const arScore = scoreArabic(hadith.arabic, query);
        if (arScore > maxScore) maxScore = arScore;

        const enScore = scoreEnglish(hadith.english?.text || '', query, terms);
        if (enScore > maxScore) maxScore = enScore;

        if (hadith.english?.narrator) {
          const nScore = scoreEnglish(hadith.english.narrator, query, terms);
          if (nScore > maxScore) maxScore = nScore;
        }

        const chapter = chapterMap.get(hadith.chapterId);
        if (chapter?.english) {
          const cScore = scoreEnglish(chapter.english, query, terms) * 0.4;
          if (cScore > maxScore) maxScore = cScore;
        }
      }

      if (maxScore > 0) {
        const chapter = chapterMap.get(hadith.chapterId);
        allResults.push({
          hadith,
          bookSlug:       col.slug,
          bookTitle:      col.displayName,
          bookArabicTitle: col.arabicName,
          chapterTitle:   chapter?.english || '',
          score:          maxScore,
        });
      }
    }
  }

  allResults.sort((a, b) => b.score - a.score || a.hadith.idInBook - b.hadith.idInBook);

  const total   = allResults.length;
  const offset  = (page - 1) * SEARCH_LIMIT;
  const results = allResults.slice(offset, offset + SEARCH_LIMIT);

  return { results, total, query, page, limit: SEARCH_LIMIT };
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function searchHadith(
  rawQuery: string,
  bookSlug: string,
  page:     number
): SearchResponse {
  const query = rawQuery.trim();

  if (query.length < 2) {
    return { results: [], total: 0, query, page, limit: SEARCH_LIMIT };
  }

  // Try fast flat-index path first
  const flatIndex = loadFlatIndex();
  if (flatIndex && flatIndex.length > 0) {
    return searchFlatIndex(query, bookSlug, page, flatIndex);
  }

  // Fallback to per-file reading (works without pre-built index)
  return searchPerFile(query, bookSlug, page);
}
