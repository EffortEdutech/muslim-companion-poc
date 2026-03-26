// apps/web/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff'       },
          { key: 'X-Frame-Options',         value: 'DENY'          },
          { key: 'X-XSS-Protection',        value: '1; mode=block' },
        ],
      },
    ];
  },

  // ── REPO_ROOT ─────────────────────────────────────────────────────────────
  // DO NOT set REPO_ROOT here — it would override the fallback for local dev.
  // Set REPO_ROOT=. in Vercel dashboard Environment Variables only.
  // Local dev uses the fallback: path.join(process.cwd(), '..', '..')

  // ── File tracing root (monorepo) ──────────────────────────────────────────
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  experimental: {
    outputFileTracingIncludes: {
      '/**': [
        '../../content/quran/db/compiled/**',
        '../../content/quran/db/metadata/**',
        '../../content/hadith/db/by_book/**',
        '../../content/hadith/db/metadata/**',
        '../../content/tafsir/db/**',
      ],
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
