/* Ayn Fleet: service worker (ships with app v52)
   Goal: after ONE successful visit the app works with no network at all —
   no reload, no spinner, no "you are offline" page. */

const CACHE = 'fleet-inspect-shell-v22';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-48.png'
];

// Precache the whole shell on install so the very first offline launch works.
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => {})   // one bad URL must not abort install
    ));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (err) {}
    }
    await self.clients.claim();
  })());
});

// Sent by the app when the user taps "Update now" on the update banner.
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// CACHE-FIRST for the page. Offline is the normal case on a worksite, so the
// app must open instantly from cache and never wait on a dead network. A fresh
// copy is fetched in the background; when it differs, the waiting worker (new
// CACHE name on your next deploy) raises the in-app update banner.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // never touch cross-origin

  const path = new URL(req.url).pathname;
  // Dashboards are online pages: always fetch them fresh, cache only as a fallback.
  if (/\/(dashboard|workshop)\.html$|\/dash[^/]*\.(css|js)$/.test(path)) {
    e.respondWith(fetch(req).then(async res => {
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || new Response('Offline', { status: 504 })));
    return;
  }
  // v50: only the app's own page is served from cache. Any other address on the
  // site (assetlinks.json, README) goes to the network untouched, and nothing but
  // a real HTML page may ever replace the cached app.
  const isApp = /\/(index\.html)?$/.test(path);
  if (req.mode === 'navigate' && !isApp) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = (await caches.match('./index.html', { ignoreSearch: true })) ||
                     (await caches.match('./', { ignoreSearch: true }));
      const network = fetch(req).then(async res => {
        if (res && res.ok && /text\/html/.test(res.headers.get('content-type') || '')) {
          const c = await caches.open(CACHE);
          c.put('./index.html', res.clone());
        }
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || new Response(
        '<!doctype html><meta charset=utf-8><title>Offline</title>' +
        '<body style="font-family:system-ui;padding:40px;text-align:center">' +
        '<h2>Not cached yet</h2><p>Open this app once with a connection, then it works offline.</p>',
        { headers: { 'content-type': 'text/html' }, status: 200 });
    })());
    return;
  }

  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
