// apps/web/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Security headers (existing) ───────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff'       },
          { key: 'X-Frame-Options',          value: 'DENY'          },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
        ],
      },
    ];
  },

  // ── REPO_ROOT for content path resolution ─────────────────────────────────
  env: {
    REPO_ROOT: '.',
  },

  // ── outputFileTracingRoot at TOP LEVEL (Next.js 14 requirement) ───────────
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  // ── outputFileTracingIncludes inside experimental (Next.js 14 requirement) ─
  experimental: {
    outputFileTracingIncludes: {
      '/**': [
        '../../content/quran/db/compiled/**',
        '../../content/quran/db/metadata/**',
        '../../content/hadith/db/by_book/**',
        '../../content/hadith/db/metadata/**',
        '../../content/tafsir/db/en-tafisr-ibn-kathir/**',
        '../../content/tafsir/db/en-al-jalalayn/**',
        '../../content/tafsir/db/metadata/**',
      ],
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
