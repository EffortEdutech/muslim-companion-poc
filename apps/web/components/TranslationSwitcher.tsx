'use client';

import { useState, useEffect } from 'react';
import { TranslationKey, TRANSLATION_LABELS, TRANSLATION_KEYS } from '@/lib/quran-types';

const STORAGE_KEY = 'iqra:quran-translations';

export interface TranslationConfig {
  primary:   TranslationKey;
  secondary: TranslationKey | null;
  showTranslit: boolean;
}

const DEFAULT_CONFIG: TranslationConfig = {
  primary:      'en_sahih',
  secondary:    null,
  showTranslit: false,
};

interface Props {
  config: TranslationConfig;
  onChange: (config: TranslationConfig) => void;
}

export function useTranslationConfig(): [TranslationConfig, (c: TranslationConfig) => void] {
  const [config, setConfig] = useState<TranslationConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig(JSON.parse(raw));
    } catch {
      // use default
    }
  }, []);

  function update(c: TranslationConfig) {
    setConfig(c);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
  }

  return [config, update];
}

export default function TranslationSwitcher({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function setPrimary(key: TranslationKey) {
    onChange({ ...config, primary: key, secondary: config.secondary === key ? null : config.secondary });
    setOpen(false);
  }

  function toggleSecondary(key: TranslationKey) {
    onChange({ ...config, secondary: config.secondary === key ? null : key });
  }

  function toggleTranslit() {
    onChange({ ...config, showTranslit: !config.showTranslit });
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--gold-border)',
          borderRadius: '8px',
          padding: '5px 12px',
          fontFamily: 'var(--font-lora)',
          fontSize: '0.78rem',
          color: 'var(--ink-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'border-color 0.15s',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        {TRANSLATION_LABELS[config.primary]}
        <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 30 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 40,
            background: 'var(--bg-surface)',
            border: '1px solid var(--gold-border-strong)',
            borderRadius: '12px',
            padding: '10px',
            minWidth: '240px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}>

            {/* Primary translation */}
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', padding: '0 4px' }}>
              Primary translation
            </div>
            {TRANSLATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setPrimary(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: config.primary === key ? 'var(--gold-glow)' : 'none',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lora)',
                  fontSize: '0.85rem',
                  color: config.primary === key ? 'var(--gold)' : 'var(--ink-secondary)',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ width: '14px', color: 'var(--gold)', fontSize: '0.8rem' }}>
                  {config.primary === key ? '●' : '○'}
                </span>
                {TRANSLATION_LABELS[key]}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--gold-border)', margin: '8px 0' }} />

            {/* Secondary translation */}
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: '0.68rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', padding: '0 4px' }}>
              Show second translation
            </div>
            {TRANSLATION_KEYS.filter((k) => k !== config.primary).map((key) => (
              <button
                key={key}
                onClick={() => toggleSecondary(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: config.secondary === key ? 'var(--gold-glow)' : 'none',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lora)',
                  fontSize: '0.85rem',
                  color: config.secondary === key ? 'var(--gold)' : 'var(--ink-secondary)',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: '14px', color: 'var(--gold)', fontSize: '0.8rem' }}>
                  {config.secondary === key ? '☑' : '☐'}
                </span>
                {TRANSLATION_LABELS[key]}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--gold-border)', margin: '8px 0' }} />

            {/* Transliteration toggle */}
            <button
              onClick={toggleTranslit}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: config.showTranslit ? 'var(--gold-glow)' : 'none',
                border: 'none',
                borderRadius: '7px',
                padding: '7px 10px',
                cursor: 'pointer',
                fontFamily: 'var(--font-lora)',
                fontSize: '0.85rem',
                color: config.showTranslit ? 'var(--gold)' : 'var(--ink-secondary)',
                textAlign: 'left',
              }}
            >
              <span style={{ width: '14px', color: 'var(--gold)', fontSize: '0.8rem' }}>
                {config.showTranslit ? '☑' : '☐'}
              </span>
              Show transliteration
            </button>
          </div>
        </>
      )}
    </div>
  );
}
