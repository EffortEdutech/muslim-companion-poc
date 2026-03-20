import path from 'path';
import fs from 'fs';
import { CompiledSurah, SurahIndex } from './quran-types';

const DB_BASE = path.join(process.cwd(), '..', '..', 'content', 'quran', 'db');
const COMPILED = path.join(DB_BASE, 'compiled');
const META     = path.join(DB_BASE, 'metadata');

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Load a single compiled surah by number (1–114).
 * Returns null if not compiled yet.
 */
export function loadSurah(surahNumber: number): CompiledSurah | null {
  const filePath = path.join(COMPILED, `${pad(surahNumber)}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CompiledSurah;
  } catch {
    return null;
  }
}

/**
 * Load the lightweight surah index (for the browse page).
 * Does NOT load all 6,236 ayahs — just names and metadata.
 */
export function loadSurahIndex(): SurahIndex | null {
  const filePath = path.join(META, 'surah-index.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SurahIndex;
  } catch {
    return null;
  }
}

/**
 * Get prev/next surah numbers for navigation.
 */
export function getSurahNavigation(n: number): {
  prev: number | null;
  next: number | null;
} {
  return {
    prev: n > 1   ? n - 1 : null,
    next: n < 114 ? n + 1 : null,
  };
}

/**
 * Check if compiled files are present.
 */
export function isQuranCompiled(): boolean {
  return fs.existsSync(path.join(COMPILED, '001.json'));
}
