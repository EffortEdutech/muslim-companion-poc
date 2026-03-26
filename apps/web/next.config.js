// apps/web/next.config.js
const path = require('path');

// Monorepo root — two levels above apps/web/
const MONOREPO_ROOT = path.join(__dirname, '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {

  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff'       },
        { key: 'X-Frame-Options',         value: 'DENY'          },
        { key: 'X-XSS-Protection',        value: '1; mode=block' },
      ],
    }];
  },

  experimental: {
    // Set tracing root to the monorepo root so content/ files are found.
    // Paths in outputFileTracingIncludes are relative to this root.
    outputFileTracingRoot: MONOREPO_ROOT,
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

  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
