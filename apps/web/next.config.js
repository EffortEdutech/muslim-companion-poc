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

  // ── File tracing ──────────────────────────────────────────────────────────
  // After "cp -r ../../content ." in vercel.json buildCommand,
  // content lands at apps/web/content/ — i.e. INSIDE __dirname.
  // So outputFileTracingRoot = __dirname (apps/web), not the monorepo root.
  // Paths in outputFileTracingIncludes are relative to that root.
  outputFileTracingRoot: __dirname,

  experimental: {
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
