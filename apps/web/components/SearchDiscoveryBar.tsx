'use client';

// apps/web/components/SearchDiscoveryBar.tsx
// Shows ONLY the animated cross-reference counter.
// Source counts are already shown in the tabs — no duplication.

import { useEffect, useRef, useState } from 'react';

interface Props {
  crossRefCount: number;
}

export default function SearchDiscoveryBar({ crossRefCount }: Props) {
  const [count,   setCount]   = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || crossRefCount === 0) return;
    let start = 0;
    const duration  = 800;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * crossRefCount));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visible, crossRefCount]);

  if (crossRefCount === 0) return null;

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      background:   'rgba(200,168,75,0.06)',
      border:       '1px solid var(--gold-border)',
      borderRadius: '10px',
      padding:      '8px 14px',
      marginBottom: '16px',
      opacity:      visible ? 1 : 0,
      transform:    visible ? 'translateY(0)' : 'translateY(6px)',
      transition:   'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-lora)', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
        <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem' }}>{count}</span>
        {' '}Quran {count === 1 ? 'ayah has' : 'ayahs have'} related hadith in these results
      </span>
    </div>
  );
}
