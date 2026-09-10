// Bridge Point — Service Worker (Production Hardened v4)
// DO NOT cache API or auth endpoints.
const CACHE_NAME = "bridgepoint-v4";
const OFFLINE_URL = "/offline.html";

// Only cache same-origin static assets.
// API requests go to a different origin (FastAPI) and must NEVER be intercepted.

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  // Activate immediately — replace stale SW without requiring a page reload.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Take control of all open pages immediately so the new SW is in effect.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ── Rule 1: Never touch cross-origin requests (FastAPI backend, CDN, etc.)
  // The backend lives on a different origin. Returning here (no respondWith)
  // tells the browser to perform the fetch itself without any SW involvement.
  if (url.origin !== self.location.origin) {
    return;
  }

  // ── Rule 2: Never cache or intercept same-origin /api/* routes.
  // These are Next.js API routes (if any) — fall through to network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // ── Rule 3: Navigation requests — network first, offline fallback.
  // Use redirect: 'manual' so a server-issued 3xx is returned as-is to the
  // browser rather than followed by the SW (which can produce opaque responses
  // that mask the real redirect destination and break auth flows).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { redirect: "manual" })
        .then((res) => {
          // Pass redirect responses straight to the browser — it will follow them.
          if (res.type === "opaqueredirect") return res;
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // ── Rule 4: Static assets — stale-while-revalidate for same-origin.
  // Only match GET requests for known static extensions.
  if (
    req.method === "GET" &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.match(/\.(svg|png|ico|webp|woff2?|css|js)$/))
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        });
        return cached || network;
      })
    );
  }

  // All other same-origin requests: no respondWith → browser handles normally.
});
