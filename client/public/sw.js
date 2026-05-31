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

  // Only cache content-hashed build assets (/assets/*) and a small allowlist of
  // root icons. We intentionally do NOT match by file extension, because in dev
  // Vite serves source modules (e.g. /src/index.css, /@vite/*) that must never be
  // cached or HMR breaks. Hashed /assets/ paths only exist in production builds.
  const ROOT_ASSET_ALLOWLIST = ["/icon-192.png", "/icon-512.png", "/favicon.ico"];
  const isStaticAsset =
    url.pathname.startsWith("/assets/") || ROOT_ASSET_ALLOWLIST.includes(url.pathname);
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

// --- Web Push ---
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "BakerIQ", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "BakerIQ";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Only allow same-origin navigation. Resolve the payload URL against our
  // origin and fall back to /dashboard if it points anywhere else.
  let targetUrl = "/dashboard";
  const raw = event.notification.data && event.notification.data.url;
  if (raw) {
    try {
      const resolved = new URL(raw, self.location.origin);
      if (resolved.origin === self.location.origin) {
        targetUrl = resolved.pathname + resolved.search + resolved.hash;
      }
    } catch (err) {
      // Malformed URL — keep the default.
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch (err) {
              // navigate can fail across origins/states — ignore.
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
