import path from 'path';
import fs from 'fs';
import { Book, Hadith, Chapter } from './types';
import { getCollectionBySlug } from './collections';

// When Next.js runs from apps/web, process.cwd() = apps/web
// Content is at ../../content/hadith/db relative to apps/web
const DB_BASE = path.join(process.cwd(), '..', '..', 'content', 'hadith', 'db');

export function getByBookPath(group: string, filename: string): string {
  return path.join(DB_BASE, 'by_book', group, filename);
}

/**
 * Load a full book JSON by its slug (e.g. "shahwaliullah40").
 * Returns null if file not found or parse fails.
 */
export function loadBook(slug: string): Book | null {
  const collection = getCollectionBySlug(slug);
  if (!collection) return null;

  try {
    const filePath = getByBookPath(collection.group, collection.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`[hadith] File not found: ${filePath}`);
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Book;
  } catch (err) {
    console.error(`[hadith] Failed to load book "${slug}":`, err);
    return null;
  }
}

/**
 * Load only the metadata + chapters for a book (without all hadiths).
 * Useful for rendering navigation without loading thousands of hadiths.
 */
export function loadBookShell(slug: string): Omit<Book, 'hadiths'> | null {
  const book = loadBook(slug);
  if (!book) return null;
  const { hadiths: _, ...shell } = book;
  return shell;
}

/**
 * Get hadiths for a specific chapter.
 */
export function getHadithsByChapter(book: Book, chapterId: number): Hadith[] {
  return book.hadiths.filter((h) => h.chapterId === chapterId);
}

/**
 * Get a chapter by id from a book.
 */
export function getChapterById(book: Book, chapterId: number): Chapter | undefined {
  return book.chapters.find((c) => c.id === chapterId);
}

/**
 * Get paginated hadiths from a book (for large collections).
 */
export function getPaginatedHadiths(
  book: Book,
  chapterId: number | null,
  page: number,
  limit: number
): { hadiths: Hadith[]; total: number } {
  const source = chapterId !== null
    ? book.hadiths.filter((h) => h.chapterId === chapterId)
    : book.hadiths;

  const total = source.length;
  const start = (page - 1) * limit;
  const hadiths = source.slice(start, start + limit);

  return { hadiths, total };
}

/**
 * Check if the content DB directory is accessible.
 * Used for healthcheck / diagnostics.
 */
export function checkDbAccess(): { ok: boolean; base: string; exists: boolean } {
  return {
    ok: fs.existsSync(DB_BASE),
    base: DB_BASE,
    exists: fs.existsSync(DB_BASE),
  };
}
