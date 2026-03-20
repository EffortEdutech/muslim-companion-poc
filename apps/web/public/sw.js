const CACHE_NAME = 'iqra-digital-v1';
const STATIC_CACHE = 'iqra-static-v1';

// Pages to precache on install
const PRECACHE = ['/', '/search', '/bookmarks', '/manifest.json'];

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clear old caches ──────────────────────────────────
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

// ── Fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Next.js static chunks — content-hashed filenames, cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // Skip other Next.js internals (RSC payloads, HMR, data fetching)
  if (url.pathname.startsWith('/_next/')) return;

  // API routes — network only (search must be live)
  if (url.pathname.startsWith('/api/')) return;

  // Pages — network first, fall back to cache for offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
