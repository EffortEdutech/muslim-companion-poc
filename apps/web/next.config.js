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

  // ── No outputFileTracing overrides needed ─────────────────────────────────
  // On Vercel: build command copies content/ into apps/web/content/
  //   REPO_ROOT=. → path.join('.', 'content', ...) resolves correctly
  // On localhost: REPO_ROOT not set → fallback path.join(cwd, '..', '..')
  //   resolves to monorepo root where content/ lives

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
