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

  experimental: {
    // outputFileTracingRoot MUST be inside experimental in Next.js 14.
    // Setting it at top level is silently ignored (unrecognized key warning).
    // __dirname = apps/web/ — limits file tracing to THIS directory only.
    // This prevents Next.js from also bundling the original content/ at repo
    // root, which was causing 361 MB functions (double-bundling).
    outputFileTracingRoot: __dirname,

    // These paths are relative to outputFileTracingRoot (apps/web/).
    // After "cp -r ../../content ." in buildCommand, content lands at
    // apps/web/content/ — exactly where these paths point.
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
