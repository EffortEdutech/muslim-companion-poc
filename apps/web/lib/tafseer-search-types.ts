// apps/web/lib/tafseer-search-types.ts

/**
 * One entry in content/tafsir/db/metadata/index-eng.json
 * Compact keys to keep index file small.
 *
 * Each entry corresponds to one ayah from al-Jalalayn OR one entry from
 * Ibn Kathir. Ibn Kathir entries may cover multiple ayahs — fromAyah to toAyah.
 */
export interface TafseerIndexEntry {
  s:   number;  // surah number
  a:   number;  // fromAyah (start of range)
  az:  number;  // toAyah   (end of range — same as a for single-ayah entries)
  sn:  string;  // surah name (English)
  tx:  string;  // tafseer text snippet (≤ 350 chars, HTML stripped)
  ed:  string;  // edition: 'jalalayn' | 'ibn_kathir'
}

/** One result returned from the search logic */
export interface TafseerSearchResult {
  surah:     number;
  ayah:      number;  // fromAyah
  ayahTo:    number;  // toAyah (same as ayah for single-ayah entries)
  surahName: string;
  text:      string;  // snippet
  edition:   string;  // 'jalalayn' | 'ibn_kathir'
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
