// apps/web/components/search/SearchResults.tsx
'use client';

// Persisted UI state for Search page:
// - remembers which section branch was open
// - remembers which result cards were expanded
// - keyed by exact search identity (query + source + book + page)

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface QuranResult {
  surah:     number;
  ayah:      number;
  surahName: string;
  arabic:    string;
  en_sahih:  string;
  score:     number;
  juz?:      number;
}

export interface TafseerResult {
  surah:     number;
  ayah:      number;
  ayahTo:    number;
  surahName: string;
  text:      string;
  edition:   string;
  score:     number;
}

export interface HadithResult {
  hadith: {
    id:        number;
    idInBook:  number;
    chapterId: number;
    bookId:    number;
    arabic:    string;
    english:   { narrator: string; text: string };
  };
  bookSlug:        string;
  bookTitle:       string;
  bookArabicTitle: string;
  chapterTitle:    string;
  score:           number;
}

export interface CrossRefHadith {
  bs:  string;
  ib:  number;
  bsh: string;
  text?:     string;
  narrator?: string;
  arabic?:   string;
}

interface Props {
  query:          string;
  quranResults:   QuranResult[];
  tafseerResults: TafseerResult[];
  hadithResults:  HadithResult[];
  crossRef:       Record<string, CrossRefHadith[]>;
  quranTotal:     number;
  tafseerTotal:   number;
  hadithTotal:    number;
  currentPage:    number;
  quranPages:     number;
  tafseerPages:   number;
  hadithPages:    number;
  source:         'all' | 'quran' | 'tafseer' | 'hadith';
  book:           string;
}

interface SavedSearchUiState {
  openSections: string[];
  openItems:    string[];
  savedAt:      number;
}

function makeStorageKey(query: string, source: string, book: string, page: number): string {
  return `iqra:search-ui:${query}::${source}::${book}::${page}`;
}

export default function SearchResults({
  query, quranResults, tafseerResults, hadithResults, crossRef,
  quranTotal, tafseerTotal, hadithTotal,
  currentPage, quranPages, tafseerPages, hadithPages,
  source, book,
}: Props) {
  const storageKey = useMemo(
    () => makeStorageKey(query, source, book, currentPage),
    [query, source, book, currentPage]
  );

  const defaultOpenSections = useMemo(() => {
    const sections: string[] = [];
    if (quranResults.length > 0 && (source === 'all' || source === 'quran')) sections.push('quran');
    if (tafseerResults.length > 0 && (source === 'all' || source === 'tafseer')) sections.push('tafseer');
    if (hadithResults.length > 0 && (source === 'all' || source === 'hadith')) sections.push('hadith');
    return sections;
  }, [quranResults.length, tafseerResults.length, hadithResults.length, source]);

  const [openSections, setOpenSections] = useState<string[]>(defaultOpenSections);
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    let restored = false;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as SavedSearchUiState;
        if (Array.isArray(saved.openSections)) setOpenSections(saved.openSections);
        else setOpenSections(defaultOpenSections);

        if (Array.isArray(saved.openItems)) setOpenItems(saved.openItems);
        else setOpenItems([]);

        restored = true;
      }
    } catch {}

    if (!restored) {
      setOpenSections(defaultOpenSections);
      setOpenItems([]);
    }
  }, [storageKey, defaultOpenSections]);

  useEffect(() => {
    try {
      const saved: SavedSearchUiState = {
        openSections,
        openItems,
        savedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {}
  }, [storageKey, openSections, openItems]);

  function toggleSection(key: string) {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleItem(itemId: string) {
    setOpenItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%', overflowX: 'hidden' }}>
      {quranResults.length > 0 && (source === 'all' || source === 'quran') && (
        <Section
          id="quran"
          label="Quran"
          count={quranTotal}
          color="#1D9E75"
          bg="#E1F5EE"
          border="#9FE1CB"
          isOpen={openSections.includes('quran')}
          onToggle={() => toggleSection('quran')}
        >
          {quranResults.map((r) => {
            const itemId = `q-${r.surah}-${r.ayah}`;
            return (
              <QuranItem
                key={itemId}
                isOpen={openItems.includes(itemId)}
                onToggle={() => toggleItem(itemId)}
                result={r}
                query={query}
                related={crossRef[`${r.surah}:${r.ayah}`] || []}
              />
            );
          })}
          {source === 'quran' && quranPages > 1 && (
            <PaginationBar page={currentPage} total={quranPages} query={query} src="quran" />
          )}
        </Section>
      )}

      {tafseerResults.length > 0 && (source === 'all' || source === 'tafseer') && (
        <Section
          id="tafseer"
          label="Tafseer"
          count={tafseerTotal}
          color="#854F0B"
          bg="#FAEEDA"
          border="#FAC775"
          isOpen={openSections.includes('tafseer')}
          onToggle={() => toggleSection('tafseer')}
        >
          {tafseerResults.map((r) => {
            const itemId = `t-${r.surah}-${r.ayah}-${r.ayahTo}`;
            return (
              <TafseerItem
                key={itemId}
                isOpen={openItems.includes(itemId)}
                onToggle={() => toggleItem(itemId)}
                result={r}
                query={query}
              />
            );
          })}
          {source === 'tafseer' && tafseerPages > 1 && (
            <PaginationBar page={currentPage} total={tafseerPages} query={query} src="tafseer" />
          )}
        </Section>
      )}

      {hadithResults.length > 0 && (source === 'all' || source === 'hadith') && (
        <Section
          id="hadith"
          label="Hadith"
          count={hadithTotal}
          color="#993C1D"
          bg="#FAECE7"
          border="#F5C4B3"
          isOpen={openSections.includes('hadith')}
          onToggle={() => toggleSection('hadith')}
        >
          {hadithResults.map((r) => {
            const itemId = `h-${r.bookSlug}-${r.hadith.idInBook}`;
            return (
              <HadithItem
                key={itemId}
                isOpen={openItems.includes(itemId)}
                onToggle={() => toggleItem(itemId)}
                result={r}
                query={query}
              />
            );
          })}
          {source === 'hadith' && hadithPages > 1 && (
            <PaginationBar page={currentPage} total={hadithPages} query={query} src="hadith" book={book} />
          )}
        </Section>
      )}
    </div>
  );
}

function Section({
  label, count, color, bg, border, isOpen, onToggle, children,
}: {
  label: string; count: number;
  color: string; bg: string; border: string;
  isOpen: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      border:       `1px solid ${border}`,
      borderRadius: '12px',
      overflow:     'hidden',
      background:   'var(--bg-card)',
      maxWidth:     '100%',
    }}>
      <button
        onClick={onToggle}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          padding:        '12px 16px',
          background:     isOpen ? color : 'transparent',
          border:         'none',
          cursor:         'pointer',
          textAlign:      'left',
          borderBottom:   isOpen ? `1px solid ${border}` : 'none',
          transition:     'background 0.2s',
          maxWidth:       '100%',
        }}
      >
        <div style={{ width: '3px', height: '18px', background: color, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-lora)',
          fontSize:   '0.95rem',
          fontWeight: 600,
          color:      isOpen ? '#ffffff' : 'var(--ink-primary)',
          flex:       1,
          minWidth:   0,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.72rem',
          fontWeight:   600,
          color:        color,
          background:   isOpen ? 'rgba(255,255,255,0.9)' : bg,
          border:       `1px solid ${isOpen ? 'rgba(255,255,255,0.6)' : border}`,
          borderRadius: '20px',
          padding:      '2px 10px',
          minWidth:     '28px',
          textAlign:    'center',
          flexShrink:   0,
        }}>
          {count.toLocaleString()}
        </span>
        <ChevronIcon open={isOpen} color={isOpen ? '#ffffff' : undefined} />
      </button>

      {isOpen && (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ResultItem({
  header, children, isOpen, onToggle,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      border:       '1px solid var(--gold-border)',
      borderRadius: '9px',
      overflow:     'hidden',
      background:   'var(--bg-surface, var(--bg-card))',
      maxWidth:     '100%',
    }}>
      <button
        onClick={onToggle}
        style={{
          width:      '100%',
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          padding:    '10px 14px',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          textAlign:  'left',
          borderBottom: isOpen ? '1px solid var(--gold-border)' : 'none',
          maxWidth:   '100%',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
        <ChevronIcon open={isOpen} size={14} />
      </button>

      {isOpen && (
        <div style={{ padding: '14px 16px', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function QuranItem({
  result, query, related, isOpen, onToggle,
}: {
  result: QuranResult;
  query: string;
  related: CrossRefHadith[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const highlightedEn = applyHighlight(result.en_sahih, query, 'rgba(200,168,75,0.25)');
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)' }}>
        {result.surahName} · {result.surah}:{result.ayah}
      </span>
      {result.juz && (
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: 'var(--ink-muted)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '1px 7px' }}>
          Juz {result.juz}
        </span>
      )}
      <RelevanceDots score={result.score} color="#1D9E75" />
      {related.length > 0 && (
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: '#0F6E56', background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '1px 7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <LinkIconSmall />
          {related.length} hadith
        </span>
      )}
    </div>
  );

  return (
    <ResultItem header={header} isOpen={isOpen} onToggle={onToggle}>
      <p dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.5rem', color: 'var(--ink-primary)', lineHeight: 2.1, textAlign: 'right', marginBottom: '10px' }}>
        {result.arabic}
      </p>
      <div style={{ height: '1px', background: 'var(--gold-border)', opacity: 0.5, marginBottom: '10px' }} />
      <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.92rem', color: 'var(--ink-secondary)', lineHeight: 1.75, marginBottom: '14px' }} dangerouslySetInnerHTML={{ __html: highlightedEn }} />
      <Link href={`/quran/${result.surah}#ayah-${result.ayah}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        Read in Quran reader →
      </Link>
      {related.length > 0 && (
        <CrossRefSection related={related} surah={result.surah} ayah={result.ayah} query={query} />
      )}
    </ResultItem>
  );
}

function TafseerItem({
  result, query, isOpen, onToggle,
}: {
  result: TafseerResult;
  query: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const highlighted = applyHighlight(result.text, query, 'rgba(186,117,23,0.2)');
  const ayahRef = (result.ayahTo && result.ayahTo > result.ayah)
    ? `${result.surah}:${result.ayah}–${result.ayahTo}`
    : `${result.surah}:${result.ayah}`;
  const editionLabel = result.edition === 'ibn_kathir' ? 'Ibn Kathir' : 'Al-Jalalayn';

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)' }}>
        {result.surahName} · {ayahRef}
      </span>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: 'var(--ink-muted)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '1px 7px' }}>
        {editionLabel}
      </span>
      <RelevanceDots score={result.score} color="#BA7517" />
    </div>
  );

  return (
    <ResultItem header={header} isOpen={isOpen} onToggle={onToggle}>
      <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.91rem', color: 'var(--ink-secondary)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: highlighted }} />
      <Link href={`/tafseer/en-tafisr-ibn-kathir/${result.surah}?ayah=${result.ayah}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none' }}>
        Read full Tafseer →
      </Link>
    </ResultItem>
  );
}

function HadithItem({
  result, query, isOpen, onToggle,
}: {
  result: HadithResult;
  query: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { hadith, bookSlug, bookTitle, chapterTitle, score } = result;
  const highlighted = applyHighlight(hadith.english?.text || '', query, 'rgba(216,90,48,0.18)');

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)' }}>
        {bookTitle} #{hadith.idInBook}
      </span>
      {chapterTitle && (
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: 'var(--ink-muted)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '1px 7px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chapterTitle}
        </span>
      )}
      <RelevanceDots score={score} color="#D85A30" />
    </div>
  );

  return (
    <ResultItem header={header} isOpen={isOpen} onToggle={onToggle}>
      {hadith.arabic && (
        <>
          <p dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.35rem', color: 'var(--ink-primary)', lineHeight: 2, textAlign: 'right', marginBottom: '8px' }}>
            {hadith.arabic}
          </p>
          <div style={{ height: '1px', background: 'var(--gold-border)', opacity: 0.4, marginBottom: '8px' }} />
        </>
      )}

      {hadith.english?.narrator?.trim() && (
        <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)', fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.5 }}>
          {hadith.english.narrator}
        </p>
      )}

      <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.91rem', color: 'var(--ink-secondary)', lineHeight: 1.75, marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: highlighted }} />

      <Link href={`/hadith/${bookSlug}?page=${Math.ceil(hadith.idInBook/50)}#hadith-${hadith.idInBook}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none' }}>
        Browse {bookTitle} →
      </Link>
    </ResultItem>
  );
}

function CrossRefSection({
  related, surah, ayah, query,
}: {
  related: CrossRefHadith[];
  surah: number; ayah: number;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? related : related.slice(0, 2);

  return (
    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--gold-border)', maxWidth: '100%', overflowX: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px', fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: 'var(--ink-muted)', maxWidth: '100%' }}
      >
        <LinkIconSmall />
        <span style={{ fontWeight: 500, color: 'var(--ink-secondary)' }}>
          {related.length} Related Hadith
        </span>
        <span style={{ color: 'var(--gold)', fontSize: '0.68rem' }}>
          {expanded ? '↑ collapse' : '↓ show all'}
        </span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
        {shown.map((ref, i) => (
          <CrossRefHadithCard key={i} ref_={ref} query={query} />
        ))}
      </div>

      <Link
        href={`/search?q=${encodeURIComponent(`${surah}:${ayah}`)}&src=hadith`}
        style={{ display: 'inline-block', marginTop: '8px', fontFamily: 'var(--font-lora)', fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}
      >
        Search all hadith for {surah}:{ayah} →
      </Link>
    </div>
  );
}

function CrossRefHadithCard({ ref_, query }: { ref_: CrossRefHadith; query: string }) {
  const highlighted = ref_.text
    ? applyHighlight(ref_.text, query, 'rgba(200,168,75,0.2)')
    : null;

  return (
    <div style={{ background: 'rgba(200,168,75,0.04)', border: '1px solid var(--gold-border)', borderLeft: '2px solid #D85A30', borderRadius: '8px', padding: '10px 12px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: ref_.text ? '7px' : '0', maxWidth: '100%', flexWrap: 'wrap' }}>
        <Link href={`/hadith/${ref_.bs}?page=${Math.ceil(ref_.ib/50)}#hadith-${ref_.ib}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.72rem', fontWeight: 600, color: '#993C1D', background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: '6px', padding: '1px 7px' }}>
            {ref_.bsh} #{ref_.ib}
          </span>
        </Link>
      </div>

      {ref_.narrator?.trim() && (
        <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.75rem', color: 'var(--ink-muted)', fontStyle: 'italic', marginBottom: '4px', lineHeight: 1.4 }}>
          {ref_.narrator}
        </p>
      )}

      {highlighted ? (
        <p style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.65, margin: 0, overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: highlighted }} />
      ) : (
        <Link href={`/hadith/${ref_.bs}?page=${Math.ceil(ref_.ib/50)}#hadith-${ref_.ib}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none' }}>
          Read hadith #{ref_.ib} in {ref_.bsh} →
        </Link>
      )}
    </div>
  );
}

function PaginationBar({ page, total, query, src, book = '' }: {
  page: number; total: number; query: string; src: string; book?: string;
}) {
  const base = `/search?q=${encodeURIComponent(query)}&src=${src}${book ? `&book=${book}` : ''}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0 4px', flexWrap: 'wrap' }}>
      {page > 1 && (
        <Link href={`${base}&page=${page - 1}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--gold-border)', borderRadius: '7px' }}>← Previous</Link>
      )}
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        {page} / {total}
      </span>
      {page < total && (
        <Link href={`${base}&page=${page + 1}`} style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--gold-border)', borderRadius: '7px' }}>Next →</Link>
      )}
    </div>
  );
}

function RelevanceDots({ score, color }: { score: number; color: string }) {
  const filled = Math.round((score / 4) * 5);
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }} title={`Relevance ${filled}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i < filled ? color : 'var(--gold-border)', display: 'inline-block' }} />
      ))}
    </span>
  );
}

function ChevronIcon({ open, size = 16, color }: { open: boolean; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: color || 'var(--ink-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function LinkIconSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function applyHighlight(text: string, query: string, markBg: string): string {
  if (!text || !query || query.length < 2) return text || '';
  const terms   = query.trim().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return text;
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.replace(pattern,
    `<mark style="background:${markBg};color:inherit;border-radius:2px;padding:0 2px;">$1</mark>`
  );
}
