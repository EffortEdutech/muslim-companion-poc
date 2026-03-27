// apps/web/components/Navigation.tsx
'use client';

// TOP BAR  — Logo (ilm-mate) · Breadcrumb · Search
// DESKTOP  — Top bar also shows Quran/Tafseer/Hadith/Search/Bookmarks links
// MOBILE   — Fixed bottom tab bar (flex sm:hidden — NOT inline display:flex)
//
// FIX: inline style had display:'flex' overriding sm:hidden.
//      Removed display from style object, className="flex sm:hidden" now controls visibility.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { loadLastUrl, loadBreadcrumb, BreadcrumbState, SectionKey } from '@/lib/study-context';

export default function Navigation() {
  const pathname = usePathname();
  const router   = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState('');
  const [crumb,      setCrumb]      = useState<BreadcrumbState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCrumb(loadBreadcrumb());
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery('');
  }

  function goToSection(section: SectionKey, homeUrl: string) {
    const saved = loadLastUrl(section);
    router.push(saved?.url ?? homeUrl);
  }

  const isActive = (base: string) => {
    if (base === '/quran')     return pathname === '/quran' || (pathname.startsWith('/quran') && pathname !== '/quran/search');
    if (base === '/hadith')    return pathname.startsWith('/hadith');
    if (base === '/tafseer')   return pathname.startsWith('/tafseer');
    if (base === '/search')    return pathname.startsWith('/search');
    if (base === '/bookmarks') return pathname.startsWith('/bookmarks');
    return pathname === base || pathname.startsWith(base + '/');
  };

  const onReaderPage = isActive('/quran') || isActive('/tafseer') || isActive('/hadith');
  const showCrumb = crumb && onReaderPage;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          height:     'var(--nav-height)',
          background: 'rgba(13,17,23,0.95)',
          borderBottom: '1px solid var(--gold-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center gap-4">

          {/* Logo — "ilm-mate" */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-amiri)', fontSize: '1.35rem', color: 'var(--gold)', lineHeight: 1 }} dir="rtl" lang="ar">إقرأ</span>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              ilm<span style={{ color: 'var(--gold)' }}>-</span>mate
            </span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            <button onClick={() => goToSection('quran',   '/quran')}   className={`nav-link ${isActive('/quran')   ? 'active' : ''}`}>Quran</button>
            <button onClick={() => goToSection('tafseer', '/tafseer')} className={`nav-link ${isActive('/tafseer') ? 'active' : ''}`}>Tafseer</button>
            <button onClick={() => goToSection('hadith',  '/hadith')}  className={`nav-link ${isActive('/hadith')  ? 'active' : ''}`}>Hadith</button>
            <Link   href="/search"    className={`nav-link ${isActive('/search')    ? 'active' : ''}`}>Search</Link>
            <Link   href="/bookmarks" className={`nav-link ${isActive('/bookmarks') ? 'active' : ''}`}>Bookmarks</Link>
          </div>

          {/* Breadcrumb — centre of top bar on reader pages */}
          {showCrumb && crumb ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '5px',
              overflow: 'hidden', fontFamily: 'var(--font-lora)',
              fontSize: '0.75rem', color: 'var(--ink-muted)', minWidth: 0,
            }}>
              {crumb.parts.map((part, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  {i > 0 && <span style={{ opacity: 0.4, flexShrink: 0 }}>›</span>}
                  <span style={{
                    color:        i === crumb.parts.length - 1 ? 'var(--gold)' : 'var(--ink-muted)',
                    fontWeight:   i === crumb.parts.length - 1 ? 600 : 400,
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {part}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--gold-border)',
              color: 'var(--ink-muted)', borderRadius: '8px', padding: '6px 12px',
              fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-lora)', flexShrink: 0,
            }}
            aria-label="Open search"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search…</span>
            <span className="hidden sm:inline" style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(200,168,75,0.1)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>⌘K</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────
           KEY FIX: className="flex sm:hidden" — NO display in style object.
           Inline display:'flex' was overriding sm:hidden. Now Tailwind controls it. ── */}
      <div
        className="flex sm:hidden"
        style={{
          position:   'fixed',
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     50,
          background: 'rgba(13,17,23,0.97)',
          borderTop:  '1px solid var(--gold-border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          height:     '60px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <MobileTab label="Quran"     active={isActive('/quran')}     onClick={() => goToSection('quran',   '/quran')}   icon={<IconBook />} />
        <MobileTab label="Tafseer"   active={isActive('/tafseer')}   onClick={() => goToSection('tafseer', '/tafseer')} icon={<IconScroll />} />
        <MobileTab label="Hadith"    active={isActive('/hadith')}    onClick={() => goToSection('hadith',  '/hadith')}  icon={<IconHadith />} />
        <MobileTab label="Search"    active={isActive('/search')}    href="/search"    icon={<IconSearch />} />
        <MobileTab label="Bookmarks" active={isActive('/bookmarks')} href="/bookmarks" icon={<IconBookmark />} />
      </div>

      {/* ── Search modal ─────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          style={{ background: 'rgba(5,8,15,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div style={{ width: '100%', maxWidth: '620px', background: 'var(--bg-surface)', border: '1px solid var(--gold-border-strong)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
                <SearchIcon style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Quran, Tafseer or Hadith…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '1.05rem', color: 'var(--ink)', fontFamily: 'var(--font-lora)' }}
                />
                {query && <button type="button" onClick={() => setQuery('')} style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
              </div>
              <div style={{ borderTop: '1px solid var(--gold-border)', padding: '9px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Arabic &amp; English · try 2:255 for ayah · #33 for hadith</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Esc to close</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Mobile tab ───────────────────────────────────────────────────────────────

function MobileTab({ label, active, onClick, href, icon }: {
  label: string; active: boolean; onClick?: () => void; href?: string; icon: React.ReactNode;
}) {
  const s: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '3px',
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
    color: active ? 'var(--gold)' : 'var(--ink-muted)',
    fontFamily: 'var(--font-lora)', fontSize: '0.58rem',
    fontWeight: active ? 600 : 400,
    textDecoration: 'none', transition: 'color 0.15s', position: 'relative',
  };
  const content = (
    <>
      {active && <div style={{ position: 'absolute', top: 0, left: '22%', right: '22%', height: '2px', background: 'var(--gold)', borderRadius: '0 0 2px 2px' }} />}
      <span style={{ opacity: active ? 1 : 0.55 }}>{icon}</span>
      <span>{label}</span>
    </>
  );
  if (href) return <Link href={href} style={s}>{content}</Link>;
  return <button onClick={onClick} style={s}>{content}</button>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBook     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconScroll   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconHadith   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconSearch   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconBookmark = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z"/></svg>;
const SearchIcon   = ({ style }: { style?: React.CSSProperties }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
