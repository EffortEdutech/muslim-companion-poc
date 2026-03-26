// apps/web/next.config.js
const path = require('path');

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
    // __dirname = apps/web — restricts tracing to ONLY files under apps/web/.
    // This prevents double-bundling of ../../content/ at the monorepo root.
    // The cp in buildCommand puts content/ inside apps/web/ before next build runs,
    // so apps/web/content/ gets traced and bundled into the Lambda.
    // REPO_ROOT='.' (set in Vercel dashboard) makes the runtime resolve
    // path.join('.', 'content') = apps/web/content/ which exists in the Lambda.
    outputFileTracingRoot: path.join(__dirname),
  },

  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
