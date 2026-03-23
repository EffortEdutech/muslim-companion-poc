import path from 'path';
import fs from 'fs';
import { CompiledTafseer, TafseerIndex } from './tafseer-types';

const DB_BASE = path.join(process.cwd(), '..', '..', 'content', 'tafseer', 'db', 'compiled');

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Load compiled tafseer for a specific surah + collection.
 * Returns null if not compiled yet.
 */
export function loadTafseer(
  surahNumber: number,
  collectionId: string = 'ibn_kathir'
): CompiledTafseer | null {
  const filePath = path.join(DB_BASE, collectionId, `${pad(surahNumber)}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CompiledTafseer;
  } catch {
    return null;
  }
}

/**
 * Load the tafseer index for a collection.
 * Used to know which surahs have tafseer available.
 */
export function loadTafseerIndex(
  collectionId: string = 'ibn_kathir'
): TafseerIndex | null {
  const filePath = path.join(DB_BASE, collectionId, 'index.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TafseerIndex;
  } catch {
    return null;
  }
}

/**
 * Check if tafseer is compiled for a collection.
 */
export function isTafseerCompiled(collectionId: string = 'ibn_kathir'): boolean {
  return fs.existsSync(path.join(DB_BASE, collectionId, '001.json'));
}

/**
 * Find the tafseer entry that covers a specific ayah.
 * Used for cross-linking from the Quran reader to a specific entry.
 */
export function findEntryForAyah(
  tafseer: CompiledTafseer,
  ayahNumber: number
): number {
  return tafseer.entries.findIndex(
    e => ayahNumber >= e.fromAyah && ayahNumber <= e.toAyah
  );
}
