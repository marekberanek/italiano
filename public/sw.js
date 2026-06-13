/* eslint-disable no-restricted-globals */
/**
 * Service worker template — placeholders are replaced by scripts/build-web-pwa.mjs.
 * Placeholders BUILD_ID, PRECACHE_URLS, CONTENT_BUNDLE_IDS are replaced at build time.
 */

const BUILD_ID = "__BUILD_ID__";
const CACHE_SHELL = `italiano-shell-${BUILD_ID}`;
const CACHE_CONTENT = `italiano-content-${BUILD_ID}`;

const PRECACHE_URLS = __PRECACHE_URLS__;
const CONTENT_BUNDLE_IDS = __CONTENT_BUNDLE_IDS__;

const SHELL_PATHS = new Set(["/", "/index.html"]);

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAsset(url) {
  const p = url.pathname;
  return (
    p.startsWith("/_expo/") ||
    p.startsWith("/assets/") ||
    p.startsWith("/icons/") ||
    p === "/manifest.json" ||
    p === "/favicon.ico" ||
    /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i.test(p)
  );
}

function isContentApi(url) {
  return url.pathname.startsWith("/api/content-");
}

function isDynamicApi(url) {
  return url.pathname.startsWith("/api/");
}

async function precacheUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch {
        // Skip unreachable assets during install (e.g. offline build host).
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const contentUrls = CONTENT_BUNDLE_IDS.map(
        (id) => `/api/content-bundle?bundle=${encodeURIComponent(id)}`,
      );
      await precacheUrls(CACHE_SHELL, PRECACHE_URLS);
      await precacheUrls(CACHE_CONTENT, contentUrls);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("italiano-") && k !== CACHE_SHELL && k !== CACHE_CONTENT)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_SHELL);
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(CACHE_SHELL);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return cached ?? new Response("", { status: 504 });
        }
      })(),
    );
    return;
  }

  if (isContentApi(url)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(CACHE_CONTENT);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  if (isDynamicApi(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (SHELL_PATHS.has(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
  }
});
