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
    // outputFileTracingRoot = apps/web/ (__dirname).
    // vercel.json buildCommand runs "cp -r ../../content ." first,
    // so apps/web/content/ exists when next build runs.
    // outputFileTracingIncludes paths are relative to outputFileTracingRoot.
    // Together these three ensure content/ is bundled into every Lambda.
    outputFileTracingRoot: __dirname,
    outputFileTracingIncludes: {
      '/**': [
        './content/**/*',
      ],
    },
  },

  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
