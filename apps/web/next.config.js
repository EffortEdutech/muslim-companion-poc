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
          { key: 'X-Content-Type-Options',  value: 'nosniff'        },
          { key: 'X-Frame-Options',          value: 'DENY'           },
          { key: 'X-XSS-Protection',         value: '1; mode=block'  },
        ],
      },
    ];
  },

  // ── Bundle content folder into Vercel deployment ─────────────────────────
  // Content lives at ../../content/ relative to apps/web/.
  // Without this, Vercel's file tracing misses all JSON files and every
  // reader page returns empty content.
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
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

  // ── REPO_ROOT for content path resolution ─────────────────────────────────
  // All lib/tafseer.ts, lib/hadith.ts, lib/quran.ts loaders use:
  //   process.env.REPO_ROOT || path.join(process.cwd(), '..', '..')
  // In Vercel Lambda, process.cwd() is the bundle root, so REPO_ROOT='.'
  // makes path.join('.', 'content', ...) resolve correctly.
  env: {
    REPO_ROOT: '.',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
