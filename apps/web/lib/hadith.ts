// apps/web/lib/hadith.ts
import path from 'path';
import fs from 'fs';
import { Book, Hadith, Chapter } from './types';
import { getCollectionBySlug } from './collections';

// Use REPO_ROOT env — same pattern as lib/quran.ts and lib/tafseer.ts
// REPO_ROOT='.' on Vercel → resolves to /var/task/apps/web/content/hadith/db
// Not set locally → resolves ../../ from apps/web to monorepo root
const REPO_ROOT = process.env.REPO_ROOT || path.join(process.cwd(), '..', '..');
const DB_BASE   = path.join(REPO_ROOT, 'content', 'hadith', 'db');

export function getByBookPath(group: string, filename: string): string {
  return path.join(DB_BASE, 'by_book', group, filename);
}

export function loadBook(slug: string): Book | null {
  const collection = getCollectionBySlug(slug);
  if (!collection) return null;
  try {
    const filePath = getByBookPath(collection.group, collection.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`[hadith] File not found: ${filePath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Book;
  } catch (err) {
    console.error(`[hadith] Failed to load book "${slug}":`, err);
    return null;
  }
}

export function loadBookShell(slug: string): Omit<Book, 'hadiths'> | null {
  const book = loadBook(slug);
  if (!book) return null;
  const { hadiths: _, ...shell } = book;
  return shell;
}

export function getHadithsByChapter(book: Book, chapterId: number): Hadith[] {
  return book.hadiths.filter((h) => h.chapterId === chapterId);
}

export function getChapterById(book: Book, chapterId: number): Chapter | undefined {
  return book.chapters.find((c) => c.id === chapterId);
}

export function getPaginatedHadiths(
  book: Book,
  chapterId: number | null,
  page: number,
  limit: number
): { hadiths: Hadith[]; total: number } {
  const source = chapterId !== null
    ? book.hadiths.filter((h) => h.chapterId === chapterId)
    : book.hadiths;
  const total   = source.length;
  const hadiths = source.slice((page - 1) * limit, page * limit);
  return { hadiths, total };
}

export function checkDbAccess(): { ok: boolean; base: string; exists: boolean } {
  return { ok: fs.existsSync(DB_BASE), base: DB_BASE, exists: fs.existsSync(DB_BASE) };
}
