import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Book, SearchResult } from '@/lib/types';
import { COLLECTIONS, getCollectionBySlug } from '@/lib/collections';

const DB_BASE = path.join(process.cwd(), '..', '..', 'content', 'hadith', 'db');

const SEARCH_LIMIT = 20;

/**
 * Score a text field against the search query.
 * Returns 0 (no match) to 3 (exact phrase match).
 */
function scoreText(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lower.includes(lowerQuery)) return 3; // exact phrase match — highest
  const matchCount = terms.filter((t) => lower.includes(t)).length;
  if (matchCount === terms.length) return 2; // all words present
  if (matchCount > 0) return 1 * (matchCount / terms.length); // partial
  return 0;
}

/**
 * Score Arabic text — only exact substring match (RTL, no tokenization).
 */
function scoreArabic(arabic: string, query: string): number {
  if (!arabic || !query) return 0;
  return arabic.includes(query) ? 3 : 0;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q')?.trim() || '';
  const bookSlug = searchParams.get('book')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // Minimum query length
  if (rawQuery.length < 2) {
    return NextResponse.json({
      results: [],
      total: 0,
      query: rawQuery,
      page,
      limit: SEARCH_LIMIT,
    });
  }

  // Split into lowercase terms for multi-word matching
  const terms = rawQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  // Determine which collections to search
  const collectionsToSearch = bookSlug
    ? [getCollectionBySlug(bookSlug)].filter(Boolean)
    : COLLECTIONS;

  const allResults: SearchResult[] = [];

  for (const col of collectionsToSearch) {
    if (!col) continue;

    const filePath = path.join(DB_BASE, 'by_book', col.group, col.filename);

    if (!fs.existsSync(filePath)) {
      // File not yet imported — skip silently
      continue;
    }

    let book: Book;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      book = JSON.parse(raw) as Book;
    } catch {
      continue;
    }

    // Build chapter lookup map for this book
    const chapterMap = new Map(book.chapters.map((c) => [c.id, c]));

    for (const hadith of book.hadiths) {
      let maxScore = 0;

      // Score English translation
      const enScore = scoreText(hadith.english.text, rawQuery, terms);
      if (enScore > maxScore) maxScore = enScore;

      // Score narrator field
      if (hadith.english.narrator) {
        const narratorScore = scoreText(hadith.english.narrator, rawQuery, terms);
        if (narratorScore > maxScore) maxScore = narratorScore;
      }

      // Score Arabic text
      const arScore = scoreArabic(hadith.arabic, rawQuery);
      if (arScore > maxScore) maxScore = arScore;

      // Score book + chapter reference (e.g. "bukhari 1" or chapter title)
      const chapter = chapterMap.get(hadith.chapterId);
      if (chapter) {
        const chapScore = scoreText(chapter.english, rawQuery, terms);
        if (chapScore > 0 && chapScore * 0.5 > maxScore) maxScore = chapScore * 0.5;
      }
      const bookTitleScore = scoreText(col.displayName, rawQuery, terms);
      if (bookTitleScore > 0 && bookTitleScore * 0.5 > maxScore) maxScore = bookTitleScore * 0.5;

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

  // Sort by score descending
  allResults.sort((a, b) => b.score - a.score);

  const total = allResults.length;
  const offset = (page - 1) * SEARCH_LIMIT;
  const paginated = allResults.slice(offset, offset + SEARCH_LIMIT);

  return NextResponse.json({
    results: paginated,
    total,
    query: rawQuery,
    page,
    limit: SEARCH_LIMIT,
  });
}
