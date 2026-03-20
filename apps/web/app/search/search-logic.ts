import path from 'path';
import fs from 'fs';
import { Book, SearchResult, SearchResponse } from '@/lib/types';
import { COLLECTIONS, getCollectionBySlug } from '@/lib/collections';

const DB_BASE = path.join(process.cwd(), '..', '..', 'content', 'hadith', 'db');
const SEARCH_LIMIT = 20;

// ── Arabic Normalization ──────────────────────────────────────────
/**
 * Strips tashkeel (harakat/diacritics) and normalises common Arabic letter
 * variants so that queries without diacritics match fully-vowelled text.
 *
 * Users can now type:   الاعمال بالنية
 * And still match:      الْاَعْمَالُ بِالنِّیَّةِ
 */
function normalizeArabic(text: string): string {
  return text
    // Remove tashkeel: fathatan → wavy hamza below (U+064B–U+065F) + high hamza (U+0670)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel (kashida, U+0640)
    .replace(/\u0640/g, '')
    // Alef variants → bare alef (ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Alef maqsura (ى) → ya (ي)
    .replace(/\u0649/g, '\u064A')
    // Taa marbuta (ة) → ha (ه) — optional but helps with inflection matching
    .replace(/\u0629/g, '\u0647')
    // Hamza above/below waw (ؤ) → waw (و)
    .replace(/\u0624/g, '\u0648')
    // Hamza above ya (ئ) → ya (ي)
    .replace(/\u0626/g, '\u064A')
    .trim();
}

// ── English Scoring ───────────────────────────────────────────────
/**
 * Score 0–3:
 *   3 = exact phrase match (case-insensitive)
 *   2 = all query terms present
 *   1 = partial term match (weighted by coverage)
 *   0 = no match
 */
function scoreEnglish(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower.includes(query.toLowerCase())) return 3;
  const matches = terms.filter((t) => lower.includes(t));
  if (matches.length === terms.length) return 2;
  if (matches.length > 0) return matches.length / terms.length;
  return 0;
}

// ── Arabic Scoring ────────────────────────────────────────────────
/**
 * Normalise both sides before comparing so diacritic-free queries work.
 */
function scoreArabic(arabic: string, rawQuery: string): number {
  if (!arabic || !rawQuery) return 0;
  const normText  = normalizeArabic(arabic);
  const normQuery = normalizeArabic(rawQuery);
  if (!normQuery) return 0;
  // Exact normalised substring match
  if (normText.includes(normQuery)) return 3;
  // Word-level partial match
  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const matches = queryWords.filter((w) => normText.includes(w));
  if (matches.length === queryWords.length) return 2;
  if (matches.length > 0) return matches.length / queryWords.length;
  return 0;
}

// ── Reference Scoring ─────────────────────────────────────────────
/**
 * Detect reference queries like "bukhari 42", "#33", "hadith 1".
 * Returns the target idInBook if matched, else null.
 */
function parseReferenceQuery(query: string): number | null {
  const trimmed = query.trim();
  // "#42" or "hadith 42" or just "42" (pure number)
  const numMatch = trimmed.match(/^#?(\d+)$/) ?? trimmed.match(/hadith\s+(\d+)/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

// ── Main Search ───────────────────────────────────────────────────

export default async function searchHadith(
  rawQuery: string,
  bookSlug: string,
  page: number
): Promise<SearchResponse> {
  const query = rawQuery.trim();

  if (query.length < 2) {
    return { results: [], total: 0, query, page, limit: SEARCH_LIMIT };
  }

  // Terms for multi-word English matching
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  // Reference query shortcut (e.g. "#33" → find hadith with idInBook 33)
  const refNum = parseReferenceQuery(query);

  const collectionsToSearch = bookSlug
    ? [getCollectionBySlug(bookSlug)].filter(Boolean)
    : COLLECTIONS;

  const allResults: SearchResult[] = [];

  for (const col of collectionsToSearch) {
    if (!col) continue;

    const filePath = path.join(DB_BASE, 'by_book', col.group, col.filename);
    if (!fs.existsSync(filePath)) continue;

    let book: Book;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      book = JSON.parse(raw) as Book;
    } catch {
      continue;
    }

    const chapterMap = new Map(book.chapters.map((c) => [c.id, c]));

    for (const hadith of book.hadiths) {
      let maxScore = 0;

      // Reference number exact match — score 4 (highest priority)
      if (refNum !== null && hadith.idInBook === refNum) {
        maxScore = 4;
      }

      // Arabic text
      const arScore = scoreArabic(hadith.arabic, query);
      if (arScore > maxScore) maxScore = arScore;

      // English translation
      const enScore = scoreEnglish(hadith.english.text, query, terms);
      if (enScore > maxScore) maxScore = enScore;

      // Narrator field
      if (hadith.english.narrator) {
        const nScore = scoreEnglish(hadith.english.narrator, query, terms);
        if (nScore > maxScore) maxScore = nScore;
      }

      // Chapter title (lower weight — context match, not hadith content)
      const chapter = chapterMap.get(hadith.chapterId);
      if (chapter?.english) {
        const cScore = scoreEnglish(chapter.english, query, terms) * 0.4;
        if (cScore > maxScore) maxScore = cScore;
      }

      if (maxScore > 0) {
        allResults.push({
          hadith,
          bookSlug: col.slug,
          bookTitle: col.displayName,
          bookArabicTitle: col.arabicName,
          chapterTitle: chapter?.english || '',
          score: maxScore,
        });
      }
    }
  }

  // Sort descending by score, then by idInBook for stable ordering
  allResults.sort((a, b) => b.score - a.score || a.hadith.idInBook - b.hadith.idInBook);

  const total = allResults.length;
  const offset = (page - 1) * SEARCH_LIMIT;
  const results = allResults.slice(offset, offset + SEARCH_LIMIT);

  return { results, total, query, page, limit: SEARCH_LIMIT };
}
