// apps/web/app/tafseer/search/search-logic.ts

import path from 'path';
import fs   from 'fs';
import {
  TafseerIndexEntry,
  TafseerSearchResult,
  TafseerSearchResponse,
} from '@/lib/tafseer-search-types';

const INDEX_PATH = path.join(
  process.env.REPO_ROOT || path.join(process.cwd(), '..', '..'),
  'content', 'tafsir', 'db', 'metadata', 'index-eng.json'
);

const LIMIT = 20;

let _cache: TafseerIndexEntry[] | null = null;

function loadIndex(): TafseerIndexEntry[] {
  if (_cache) return _cache;
  if (!fs.existsSync(INDEX_PATH)) return [];
  try {
    _cache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    return _cache!;
  } catch {
    return [];
  }
}

function scoreText(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower.includes(query.toLowerCase())) return 3;
  const matched = terms.filter(t => lower.includes(t)).length;
  if (matched === terms.length) return 2;
  if (matched > 0)              return matched / terms.length;
  return 0;
}

function parseReference(query: string): { surah: number; ayah: number | null } | null {
  const q = query.trim();
  const colonMatch = q.match(/^(\d{1,3})[:|](\d{1,3})$/);
  if (colonMatch) return { surah: parseInt(colonMatch[1], 10), ayah: parseInt(colonMatch[2], 10) };
  const surahMatch = q.match(/surah\s+(\d{1,3})(?:\s+(?:ayah|verse|aya)\s+(\d{1,3}))?/i);
  if (surahMatch) return {
    surah: parseInt(surahMatch[1], 10),
    ayah:  surahMatch[2] ? parseInt(surahMatch[2], 10) : null,
  };
  return null;
}

export default function searchTafseer(
  rawQuery: string,
  page:     number
): TafseerSearchResponse {
  const query = rawQuery.trim();
  if (query.length < 2) return { results: [], total: 0, query, page, limit: LIMIT };

  const index = loadIndex();
  if (index.length === 0) return { results: [], total: 0, query, page, limit: LIMIT };

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const ref   = parseReference(query);
  const scored: TafseerSearchResult[] = [];

  // Deduplicate: one result per surah:ayah (prefer ibn_kathir over jalalayn)
  const seen = new Map<string, number>(); // key → index in scored

  for (const entry of index) {
    let maxScore = 0;

    if (ref) {
      if (ref.surah === entry.s) {
        // Match if ayah falls within the entry's range
        const ayahMatch = ref.ayah === null ||
          (ref.ayah >= entry.a && ref.ayah <= (entry.az ?? entry.a));
        if (ayahMatch) maxScore = 4;
      }
    }

    if (maxScore < 4) {
      const txScore = scoreText(entry.tx, query, terms);
      if (txScore > maxScore) maxScore = txScore;
      const snScore = scoreText(entry.sn, query, terms) * 0.4;
      if (snScore > maxScore) maxScore = snScore;
    }

    if (maxScore > 0) {
      const key = `${entry.s}:${entry.a}`;
      const existing = seen.get(key);
      const result: TafseerSearchResult = {
        surah:     entry.s,
        ayah:      entry.a,
        ayahTo:    entry.az ?? entry.a,
        surahName: entry.sn,
        text:      entry.tx,
        edition:   entry.ed ?? 'jalalayn',
        score:     maxScore,
      };

      if (existing !== undefined) {
        // Replace if higher score, or if same score but ibn_kathir wins
        const prev = scored[existing];
        if (maxScore > prev.score ||
            (maxScore === prev.score && result.edition === 'ibn_kathir')) {
          scored[existing] = result;
        }
      } else {
        seen.set(key, scored.length);
        scored.push(result);
      }
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
