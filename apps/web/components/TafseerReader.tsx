'use client';

// apps/web/components/TafseerReader.tsx
//
// Two modes:
//   SPLIT    (default) — all entries visible, side nav jumps + highlights, scroll spy
//   ACCORDION          — one entry open at a time, others collapsed to ref badge
//
// Mobile: floating pill (bottom-left) → opens full-screen drawer with ayah list

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { flushSync } from 'react-dom';
import { TafseerEntry } from '@/lib/tafseer-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  entries:    TafseerEntry[];
  surah:      number;
  bookName:   string;
  targetAyah: number | null;   // deep-link from ?ayah=N
}

type Mode = 'split' | 'accordion';

// ─── Sanitise tafseer HTML (same logic as TafseerEntryCard) ──────────────────

function sanitize(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TafseerReader({ entries, surah, bookName, targetAyah }: Props) {
  const [mode,        setMode]        = useState<Mode>('split');
  const [activeAyah,  setActiveAyah]  = useState<number>(targetAyah ?? (entries[0]?.fromAyah ?? 1));
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  // Refs for scroll + IntersectionObserver
  const mainRef      = useRef<HTMLDivElement>(null);
  const navRef       = useRef<HTMLDivElement>(null);
  const observerRef  = useRef<IntersectionObserver | null>(null);
  const suppressRef  = useRef(false); // suppress scroll spy during programmatic scroll

  // ── Scroll spy (split mode only) ─────────────────────────────────────────
  const setupScrollSpy = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (mode !== 'split') return;

    const io = new IntersectionObserver(
      (records) => {
        if (suppressRef.current) return;
        // Pick the entry closest to top of viewport
        const visible = records
          .filter(r => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id; // entry-N
          const n  = parseInt(id.replace('entry-', ''), 10);
          if (!isNaN(n)) setActiveAyah(n);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    document.querySelectorAll('[data-tafseer-entry]').forEach(el => io.observe(el));
    observerRef.current = io;
  }, [mode]);

  useEffect(() => {
    setupScrollSpy();
    return () => observerRef.current?.disconnect();
  }, [setupScrollSpy, entries]);

  // ── Jump to entry ─────────────────────────────────────────────────────────
  function jumpTo(ayah: number) {
    setDrawerOpen(false);
    suppressRef.current = true;

    // ── Phase 1: collapse synchronously ────────────────────────────────────
    // flushSync commits the collapse to DOM before we read any positions.
    // padding transition is removed so layout settles instantly.
    flushSync(() => setActiveAyah(-1));

    // ── Phase 2: measure target position AFTER collapse ─────────────────────
    // If the previously-active entry was ABOVE the target, collapsing it
    // shifted the target upward. We measure AFTER collapse so we get the
    // correct post-collapse position.
    const el = document.getElementById(`entry-${ayah}`);
    if (el) {
      // NAV_OFFSET: sticky top nav + mode toggle bar
      const NAV_OFFSET = 88;
      const rect = el.getBoundingClientRect();
      // How far the entry header currently is from where we want it
      const delta = rect.top - NAV_OFFSET;
      window.scrollBy({ top: delta, behavior: 'instant' });
    }

    // ── Phase 3: expand target — grows downward from pinned header ──────────
    setActiveAyah(ayah);
    setTimeout(() => { suppressRef.current = false; }, 100);

    // Keep side nav item centred
    const navItem = document.getElementById(`nav-${ayah}`);
    if (navItem && navRef.current) {
      const navTop  = navRef.current.getBoundingClientRect().top;
      const itemTop = navItem.getBoundingClientRect().top;
      const offset  = itemTop - navTop - navRef.current.clientHeight / 2 + navItem.clientHeight / 2;
      navRef.current.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }

  // ── Deep-link on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (targetAyah) {
      setTimeout(() => jumpTo(targetAyah), 200);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Nav item label (shows range if entry covers multiple ayahs) ───────────
  function navLabel(e: TafseerEntry): string {
    return e.fromAyah === e.toAyah
      ? String(e.fromAyah)
      : `${e.fromAyah}–${e.toAyah}`;
  }

  const NAV_WIDTH = 148;

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Mode toggle + entry count ─────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '20px',
        gap:            '10px',
      }}>
        <span style={{
          fontFamily: 'var(--font-lora)',
          fontSize:   '0.8rem',
          color:      'var(--ink-muted)',
        }}>
          {entries.length} entries · {bookName}
        </span>

        <div style={{
          display:      'flex',
          alignItems:   'center',
          background:   'var(--bg-card)',
          border:       '1px solid var(--gold-border)',
          borderRadius: '20px',
          padding:      '3px',
          gap:          '2px',
        }}>
          {(['split', 'accordion'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding:      '4px 12px',
                borderRadius: '16px',
                border:       'none',
                background:   mode === m ? 'var(--gold)' : 'transparent',
                color:        mode === m ? '#0d1117' : 'var(--ink-muted)',
                fontFamily:   'var(--font-lora)',
                fontSize:     '0.75rem',
                fontWeight:   mode === m ? 600 : 400,
                cursor:       'pointer',
                transition:   'all 0.15s',
                whiteSpace:   'nowrap',
              }}
            >
              {m === 'split' ? 'All entries' : 'Focus mode'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split panel layout ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* ── Side nav (desktop only — hidden on mobile) ─────────────────── */}
        <aside
          style={{
            width:      `${NAV_WIDTH}px`,
            flexShrink: 0,
            position:   'sticky',
            top:        'calc(var(--nav-height) + 16px)',
            maxHeight:  'calc(100vh - var(--nav-height) - 48px)',
            display:    'flex',
            flexDirection: 'column',
          }}
          className="tafseer-sidenav"
        >
          {/* Nav header */}
          <div style={{
            fontFamily:    'var(--font-lora)',
            fontSize:      '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color:         'var(--ink-muted)',
            padding:       '0 4px 8px',
            borderBottom:  '1px solid var(--gold-border)',
            marginBottom:  '6px',
            flexShrink:    0,
          }}>
            Ayahs
          </div>

          {/* Nav items — scrollable */}
          <div
            ref={navRef}
            style={{
              overflowY:  'auto',
              flex:       1,
              scrollbarWidth: 'none',
            }}
          >
            {entries.map(e => {
              const isActive = activeAyah >= e.fromAyah && activeAyah <= e.toAyah;
              return (
                <button
                  key={e.fromAyah}
                  id={`nav-${e.fromAyah}`}
                  onClick={() => jumpTo(e.fromAyah)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '7px',
                    width:        '100%',
                    padding:      '5px 8px',
                    borderRadius: '7px',
                    border:       'none',
                    background:   isActive ? 'rgba(200,168,75,0.12)' : 'transparent',
                    cursor:       'pointer',
                    transition:   'all 0.15s',
                    textAlign:    'left',
                  }}
                >
                  {/* Gold bar indicator */}
                  <div style={{
                    width:        '3px',
                    height:       '16px',
                    borderRadius: '2px',
                    background:   isActive ? 'var(--gold)' : 'transparent',
                    flexShrink:   0,
                    transition:   'background 0.2s',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-lora)',
                    fontSize:   '0.78rem',
                    fontWeight: isActive ? 600 : 400,
                    color:      isActive ? 'var(--gold)' : 'var(--ink-muted)',
                    transition: 'all 0.15s',
                  }}>
                    {navLabel(e)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main reading area ─────────────────────────────────────────────── */}
        <div
          ref={mainRef}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {entries.map(e => (
            <TafseerEntryBlock
              key={e.fromAyah}
              entry={e}
              surah={surah}
              isActive={activeAyah >= e.fromAyah && activeAyah <= e.toAyah}
              mode={mode}
              onActivate={() => jumpTo(e.fromAyah)}
              onCollapse={() => setActiveAyah(-1)}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile: floating pill ─────────────────────────────────────────── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="tafseer-mobile-pill"
        style={{
          position:   'fixed',
          bottom:     '80px',
          left:       '16px',
          zIndex:     50,
          display:    'none', // shown via CSS media query below
          alignItems: 'center',
          gap:        '7px',
          background: 'var(--bg-surface)',
          border:     '1px solid var(--gold-border-strong)',
          borderRadius:'24px',
          padding:    '8px 14px',
          boxShadow:  '0 4px 20px rgba(0,0,0,0.5)',
          cursor:     'pointer',
          fontFamily: 'var(--font-lora)',
          fontSize:   '0.82rem',
          color:      'var(--gold)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        Ayah {activeAyah}
        <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>▴</span>
      </button>

      {/* ── Mobile: full-screen drawer ────────────────────────────────────── */}
      {drawerOpen && (
        <div
          style={{
            position:   'fixed',
            inset:      0,
            zIndex:     100,
            background: 'rgba(5,8,15,0.85)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              position:   'absolute',
              left:       0,
              right:      0,
              bottom:     0,
              background: 'var(--bg-surface)',
              borderTop:  '1px solid var(--gold-border-strong)',
              borderRadius:'16px 16px 0 0',
              padding:    '16px 0 32px',
              maxHeight:  '75vh',
              overflowY:  'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer handle */}
            <div style={{
              width: '36px', height: '4px', borderRadius: '2px',
              background: 'var(--gold-border)', margin: '0 auto 16px',
            }} />

            {/* Drawer header */}
            <div style={{
              fontFamily:    'var(--font-lora)',
              fontSize:      '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color:         'var(--ink-muted)',
              padding:       '0 20px 12px',
              borderBottom:  '1px solid var(--gold-border)',
              marginBottom:  '8px',
            }}>
              Jump to ayah
            </div>

            {/* Drawer items */}
            {entries.map(e => {
              const isActive = activeAyah >= e.fromAyah && activeAyah <= e.toAyah;
              return (
                <button
                  key={e.fromAyah}
                  onClick={() => jumpTo(e.fromAyah)}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '12px',
                    width:      '100%',
                    padding:    '12px 20px',
                    border:     'none',
                    background: isActive ? 'rgba(200,168,75,0.10)' : 'transparent',
                    cursor:     'pointer',
                    textAlign:  'left',
                    borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-lora)',
                    fontSize:   '0.92rem',
                    fontWeight: isActive ? 600 : 400,
                    color:      isActive ? 'var(--gold)' : 'var(--ink-secondary)',
                  }}>
                    {surah}:{navLabel(e)}
                  </span>
                  {e.text && (
                    <span style={{
                      fontFamily: 'var(--font-lora)',
                      fontSize:   '0.75rem',
                      color:      'var(--ink-muted)',
                      flex:       1,
                      overflow:   'hidden',
                      textOverflow:'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {e.text.replace(/<[^>]+>/g, '').slice(0, 60)}…
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 640px) {
          .tafseer-sidenav { display: none !important; }
          .tafseer-mobile-pill { display: flex !important; }
        }
        .tafseer-sidenav::-webkit-scrollbar { width: 3px; }
        .tafseer-sidenav::-webkit-scrollbar-thumb { background: var(--gold-border); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Individual entry block ───────────────────────────────────────────────────

interface EntryBlockProps {
  entry:       TafseerEntry;
  surah:       number;
  isActive:    boolean;
  mode:        Mode;
  onActivate:  () => void;
  onCollapse?: () => void;  // accordion: collapse active entry
}

const COLLAPSE_THRESHOLD = 800;

function TafseerEntryBlock({ entry, surah, isActive, mode, onActivate, onCollapse }: EntryBlockProps) {
  const isLong      = entry.text.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(true); // always start expanded

  // In split mode: long entries have their own expand toggle
  // In accordion mode: entry is fully shown when active, collapsed when not

  // Split: show content when expanded (starts true, toggled by Show less)
  // Accordion: only show when active
  const showFull = mode === 'accordion' ? isActive : expanded;

  const isSingle = entry.fromAyah === entry.toAyah;

  return (
    <article
      id={`entry-${entry.fromAyah}`}
      data-tafseer-entry="true"
      onClick={mode === 'accordion' ? (isActive ? onCollapse : onActivate) : undefined}
      style={{
        background:      'var(--bg-card)',
        border:          `1px solid ${isActive ? 'var(--gold)' : 'var(--gold-border)'}`,
        borderLeft:      `3px solid ${isActive ? 'var(--gold)' : 'var(--gold-border)'}`,
        borderRadius:    '12px',
        padding:         mode === 'accordion' && !isActive ? '12px 16px' : '20px 22px',
        scrollMarginTop: 'calc(var(--nav-height) + 80px)',
        transition:      'border-color 0.25s, background 0.15s',
        cursor:          mode === 'accordion' ? 'pointer' : 'default',
      }}
    >
      {/* ── Entry header ─────────────────────────────────────────────────── */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        marginBottom:  showFull ? '14px' : 0,
        flexWrap:      'wrap',
      }}>
        {/* Ayah reference badge */}
        <div style={{
          background:   isActive ? 'var(--gold)' : 'rgba(200,168,75,0.10)',
          border:       `1px solid ${isActive ? 'var(--gold)' : 'var(--gold-border-strong)'}`,
          borderRadius: '7px',
          padding:      '3px 10px',
          fontFamily:   'var(--font-lora)',
          fontSize:     '0.72rem',
          fontWeight:   600,
          color:        isActive ? '#0d1117' : 'var(--gold)',
          flexShrink:   0,
          transition:   'all 0.2s',
        }}>
          {surah}:{entry.fromAyah}
          {!isSingle && `–${entry.toAyah}`}
        </div>

        {/* Ayah label */}
        <span style={{
          fontFamily: 'var(--font-lora)',
          fontSize:   '0.75rem',
          color:      'var(--ink-muted)',
          fontStyle:  'italic',
        }}>
          {isSingle ? `Ayah ${entry.fromAyah}` : `Ayahs ${entry.fromAyah}–${entry.toAyah}`}
        </span>

        {/* Accordion: show preview text when collapsed */}
        {mode === 'accordion' && !isActive && entry.text && (
          <span style={{
            fontFamily:   'var(--font-lora)',
            fontSize:     '0.78rem',
            color:        'var(--ink-muted)',
            flex:         1,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {entry.text.replace(/<[^>]+>/g, '').slice(0, 80)}…
          </span>
        )}

        {/* Accordion expand arrow */}
        {mode === 'accordion' && (
          <span style={{
            marginLeft:  'auto',
            color:       'var(--ink-muted)',
            fontSize:    '0.75rem',
            flexShrink:  0,
            transition:  'transform 0.2s',
            transform:   isActive ? 'rotate(180deg)' : 'none',
          }}>
            ▾
          </span>
        )}
      </div>

      {/* ── Entry text ───────────────────────────────────────────────────── */}
      {showFull && (
        <>
          <div style={{
            maxHeight:  'none',
            overflow:   'visible',
            position:   'relative',
          }}>
            <div
              className="tafseer-text"
              dangerouslySetInnerHTML={{ __html: sanitize(entry.text) }}
              style={{
                fontFamily: 'var(--font-lora)',
                fontSize:   '0.95rem',
                lineHeight: '1.85',
                color:      'var(--ink)',
              }}
            />

            {/* No collapse fade in split mode */}
          </div>

          {/* Split mode: expand/collapse toggle for long entries */}
          {mode === 'split' && isLong && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                marginTop:    '12px',
                background:   'none',
                border:       '1px solid var(--gold-border)',
                borderRadius: '8px',
                padding:      '5px 14px',
                fontFamily:   'var(--font-lora)',
                fontSize:     '0.8rem',
                color:        'var(--gold)',
                cursor:       'pointer',
                transition:   'all 0.15s',
              }}
            >
              {expanded ? 'Show less ↑' : 'Read full tafseer ↓'}
            </button>
          )}
        </>
      )}
    </article>
  );
}
