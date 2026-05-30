// BakerIQ service worker — conservative caching.
// Caches ONLY static hashed build assets and icons.
// Never caches HTML navigations, /api responses, or any authenticated/user data,
// so logins, quotes, requests, and Stripe always hit the network fresh.

const CACHE = "bakeriq-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // Never intercept navigations (HTML) — always network so deploys/auth stay fresh.
  if (req.mode === "navigate") return;

  // Never cache API or auth traffic.
  if (url.pathname.startsWith("/api")) return;

  // Only cache static, content-hashed build assets and icons/fonts.
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico)$/i.test(url.pathname);
  if (!isStaticAsset) return;

  // Cache-first for immutable static assets.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type === "basic") {
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    })()
  );
});
