// Search index entry — short keys to keep file size compact
export interface SearchIndexEntry {
  s:  number;   // surah number
  a:  number;   // ayah number
  sn: string;   // surah name (English)
  ar: string;   // Arabic text
  sa: string;   // Sahih International
  yu: string;   // Yusuf Ali
  ms: string;   // Basmeih (Malay)
}

export interface QuranSearchResult {
  surah:      number;
  ayah:       number;
  surahName:  string;
  arabic:     string;
  en_sahih:   string;
  en_yusufali:string;
  ms_basmeih: string;
  score:      number;
}

export interface QuranSearchResponse {
  results: QuranSearchResult[];
  total:   number;
  query:   string;
  page:    number;
  limit:   number;
}
