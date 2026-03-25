// apps/web/lib/tafseer-search-types.ts
// Types for the Tafseer search index and results
// Mirrors the pattern from quran-search-types.ts

/**
 * One entry in content/tafsir/db/metadata/index-eng.json
 * Compact keys to keep index file small.
 */
export interface TafseerIndexEntry {
  s:  number;  // surah number
  a:  number;  // ayah number
  sn: string;  // surah name (English)
  tx: string;  // tafseer text snippet (≤ 350 chars)
}

/** One result returned from the search logic */
export interface TafseerSearchResult {
  surah:     number;
  ayah:      number;
  surahName: string;
  text:      string;   // snippet
  score:     number;
}

/** Full response from searchTafseer() */
export interface TafseerSearchResponse {
  results: TafseerSearchResult[];
  total:   number;
  query:   string;
  page:    number;
  limit:   number;
}
