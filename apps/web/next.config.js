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

  // ── File tracing root — points to the monorepo root ──────────────────────
  // This tells Next.js to trace files relative to the monorepo root,
  // not relative to apps/web.
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  experimental: {
    // Paths here are RELATIVE TO outputFileTracingRoot (the monorepo root).
    // Do NOT use ../../ — that would go above the monorepo root and find nothing.
    outputFileTracingIncludes: {
      '/**': [
        'content/quran/db/compiled/**',
        'content/quran/db/metadata/**',
        'content/hadith/db/by_book/**',
        'content/hadith/db/metadata/**',
        'content/tafsir/db/en-tafisr-ibn-kathir/**',
        'content/tafsir/db/en-al-jalalayn/**',
        'content/tafsir/db/metadata/**',
      ],
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
