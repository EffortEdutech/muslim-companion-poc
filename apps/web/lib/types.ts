// Matches the exact JSON schema from content/hadith/db/

export interface HadithEnglish {
  narrator: string;
  text: string;
}

export interface Hadith {
  id: number;
  idInBook: number;
  chapterId: number;
  bookId: number;
  arabic: string;
  english: HadithEnglish;
}

export interface Chapter {
  id: number;
  bookId: number;
  arabic: string;
  english: string;
}

export interface BookMetadataLang {
  title: string;
  author: string;
  introduction: string;
}

export interface BookMetadata {
  id: number;
  length: number;
  arabic: BookMetadataLang;
  english: BookMetadataLang;
}

// Schema for by_book/ files (e.g. shahwaliullah40.json)
export interface Book {
  id: number;
  metadata: BookMetadata;
  chapters: Chapter[];
  hadiths: Hadith[];
}

// Schema for by_chapter/ files (e.g. all.json)
export interface ChapterFile {
  metadata: Omit<BookMetadata, 'id'>;
  hadiths: Hadith[];
  chapter: Chapter;
}

export type CollectionGroup = 'the_9_books' | 'other_books' | 'forties';

export interface CollectionInfo {
  slug: string;
  filename: string;
  group: CollectionGroup;
  displayName: string;
  arabicName: string;
  author: string;
  shortName: string;
}

export interface SearchResult {
  hadith: Hadith;
  bookSlug: string;
  bookTitle: string;
  bookArabicTitle: string;
  chapterTitle: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  page: number;
  limit: number;
}
