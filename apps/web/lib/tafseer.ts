// apps/web/lib/tafseer.ts
// Tafseer is a BOOK. Functions mirror lib/hadith.ts structure.
// Source: content/tafsir/db/{bookSlug}/{surahNumber}.json
// Format: { "ayahs": [ { "id": N, "text": "..." }, ... ] }

import path from 'path';
import fs   from 'fs';
import {
  CompiledTafseer, TafseerEntry, TafseerIndex,
  TafseerCollectionMeta, TAFSEER_COLLECTIONS, getTafseerById,
} from './tafseer-types';
import { loadSurahIndex } from './quran';

const REPO_ROOT = process.env.REPO_ROOT || path.join(process.cwd(), '..', '..');
const TAFSIR_DB = path.join(REPO_ROOT, 'content', 'tafsir', 'db');

// ── Per-process cache ─────────────────────────────────────────────
const _surahCache  = new Map<string, CompiledTafseer | null>();
const _indexCache  = new Map<string, TafseerIndex | null>();

// ── Internal: load raw new-format file ───────────────────────────

function loadRawFile(bookSlug: string, surahNumber: number): Array<{id:number;text:string}> | null {
  const filePath = path.join(TAFSIR_DB, bookSlug, `${surahNumber}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return raw.ayahs ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Load tafseer for one surah from one book.
 * Returns null if file doesn't exist.
 * Output shape is identical to legacy — TafseerEntry[] with fromAyah/toAyah.
 * All existing components (TafseerEntryCard, AyahCard) keep working.
 */
export function loadTafseer(
  surahNumber:  number,
  collectionId: string = 'en-tafisr-ibn-kathir'
): CompiledTafseer | null {
  const bookSlug  = getTafseerById(collectionId)?.id ?? collectionId;
  const cacheKey  = `${bookSlug}:${surahNumber}`;

  if (_surahCache.has(cacheKey)) return _surahCache.get(cacheKey)!;

  const ayahs = loadRawFile(bookSlug, surahNumber);
  if (!ayahs) { _surahCache.set(cacheKey, null); return null; }

  const meta = getTafseerById(bookSlug) ?? getTafseerById('en-tafisr-ibn-kathir')!;

  const entries: TafseerEntry[] = ayahs
    .filter(a => a.text?.trim())
    .map(a => ({
      fromAyah: a.id,
      toAyah:   a.id,
      ayahKeys: [`${surahNumber}:${a.id}`],
      text:     a.text.trim(),
    }));

  const compiled: CompiledTafseer = {
    surah:      surahNumber,
    collection: { id: meta.id, name: meta.name, author: meta.author, language: meta.language, lang: meta.lang },
    entryCount: entries.length,
    entries,
  };

  _surahCache.set(cacheKey, compiled);
  return compiled;
}

/**
 * Check whether a tafseer book has been downloaded.
 * Checks surah 1 exists (surah 1 = Al-Fatiha, always present if downloaded).
 */
export function isTafseerAvailable(bookSlug: string = 'en-tafisr-ibn-kathir'): boolean {
  const slug = getTafseerById(bookSlug)?.id ?? bookSlug;
  return fs.existsSync(path.join(TAFSIR_DB, slug, '1.json'));
}

// Keep old name working — used by TafseerLink and tafseer reader page
export const isTafseerCompiled = isTafseerAvailable;

/**
 * Load the chapter index for a tafseer book.
 * Returns one entry per surah (1–114) with entry count and availability.
 * Mirrors loadBook() in hadith.ts.
 */
export function loadTafseerBookIndex(
  bookSlug: string = 'en-tafisr-ibn-kathir'
): TafseerIndex | null {
  const slug = getTafseerById(bookSlug)?.id ?? bookSlug;

  if (_indexCache.has(slug)) return _indexCache.get(slug)!;

  const dirPath = path.join(TAFSIR_DB, slug);
  if (!fs.existsSync(dirPath)) { _indexCache.set(slug, null); return null; }

  const meta = getTafseerById(slug)!;

  // Use surah index for names/counts, check which files exist
  const surahIndex = loadSurahIndex();
  const surahs = (surahIndex?.surahs ?? []).map((s: any) => {
    const filePath = path.join(TAFSIR_DB, slug, `${s.surah}.json`);
    const exists   = fs.existsSync(filePath);
    return {
      surah:      s.surah,
      entryCount: exists ? -1 : 0, // -1 = available but not counted yet (lazy)
      nameEnglish: s.nameEnglish,
      nameArabic:  s.nameArabic,
      ayahCount:   s.ayahCount,
      available:   exists,
    };
  });

  const index: TafseerIndex = {
    collection:  { id: meta.id, name: meta.name, author: meta.author, language: meta.language, lang: meta.lang },
    totalSurahs: surahs.filter((s: any) => s.available).length,
    surahs,
  };

  _indexCache.set(slug, index);
  return index;
}

/**
 * Find the entry index that covers a specific ayah.
 * With the new format (one entry per ayah) this is a direct lookup.
 */
export function findEntryForAyah(tafseer: CompiledTafseer, ayahNumber: number): number {
  return tafseer.entries.findIndex(e => ayahNumber >= e.fromAyah && ayahNumber <= e.toAyah);
}

/**
 * All available (downloaded) tafseer collections.
 */
export function getAvailableTafseerBooks(): TafseerCollectionMeta[] {
  return TAFSEER_COLLECTIONS.filter(c => isTafseerAvailable(c.id));
}
