// apps/web/lib/quran.ts
import path from 'path';
import fs from 'fs';
import { CompiledSurah, SurahIndex } from './quran-types';

// Use REPO_ROOT env (set to '.' on Vercel) — same pattern as lib/tafseer.ts
// and lib/hadith.ts so all loaders resolve content consistently.
const REPO_ROOT = process.env.REPO_ROOT || path.join(process.cwd(), '..', '..');
const DB_BASE   = path.join(REPO_ROOT, 'content', 'quran', 'db');
const COMPILED  = path.join(DB_BASE, 'compiled');
const META      = path.join(DB_BASE, 'metadata');

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
