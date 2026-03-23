// ── Cache names ── bump version here to force full cache refresh ──
const CACHE_NAME   = 'iqra-digital-v2';
const STATIC_CACHE = 'iqra-static-v2';

const PRECACHE = ['/', '/search', '/bookmarks', '/quran', '/manifest.json'];

// ── Install ───────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — delete ALL old caches ─────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Next.js content-hashed static chunks — cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        // Clone BEFORE any consumption
        if (res.ok) await cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // Skip other Next.js internals
  if (url.pathname.startsWith('/_next/')) return;

  // API routes — always network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Pages — network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(async (res) => {
        if (res.ok) {
          // Clone IMMEDIATELY before any async gap
          const clone = res.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(e.request, clone);
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
