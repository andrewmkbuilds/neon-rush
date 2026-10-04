// NEON RUSH service worker — offline-first app shell caching.
// Strategy:
//  - Navigation (HTML): network-first, fall back to cached shell when offline.
//  - Same-origin static assets (hashed JS/CSS): stale-while-revalidate.
//  - Google Fonts: stale-while-revalidate (so fonts work offline after first load).
//  - Base44 API / other cross-origin: never cached (network only).
// Updates do not call skipWaiting, so a new SW only takes over once no tab is
// mid-session — an active run is never interrupted by an update.
const CACHE = "neon-rush-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cross-origin: only help with web fonts; leave API calls and everything else
  // to the network (don't intercept).
  if (!sameOrigin) {
    if (url.hostname.includes("fonts.g")) {
      event.respondWith(
        caches.open(CACHE).then(async (c) => {
          const cached = await c.match(req);
          const network = fetch(req).then((res) => {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      );
    }
    return;
  }

  // Navigation requests: network-first, fall back to cached app shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate (immutable hashed names).
  event.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(req);
      const network = fetch(req).then((res) => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
