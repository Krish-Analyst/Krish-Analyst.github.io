// Rexyd offline support.
// Pages: network first (always fresh when online), cached copy when offline.
// Styles, scripts and images: served from cache, refreshed in the background.
const VERSION = 'rexyd-v8';
const PRECACHE = [
  "/",
  "/about/",
  "/articles/branding/",
  "/articles/ecommerce/",
  "/articles/gettingstarted/",
  "/articles/marketing/",
  "/articles/mistakes/",
  "/articles/operations/",
  "/articles/pricing/",
  "/articles/socialmedia/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/guides/",
  "/resources/",
  "/tools/discount-calculator/",
  "/tools/",
  "/tools/pricing-calculator/",
  "/tools/startup-cost-estimator/",
  "/shared.css?v=10",
  "/shared.js?v=9",
  "/search-index.json",
  "/fonts/plus-jakarta-sans-latin.woff2",
  "/favicon.png?v=7",
  "/apple-touch-icon.png?v=7",
  "/icons/icon-192.png",
  "/404.html"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // fonts, analytics etc. go straight to the network
  if (url.pathname.startsWith('/media/')) return;          // don't cache the video

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
