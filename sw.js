const CACHE_NAME = "markethunters-v4-20260331-1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./stock.html",
  "./economic-detail.html",
  "./privacy.html",
  "./terms.html",
  "./about.html",
  "./contact.html",
  "./manifest.webmanifest",
  "./assets/logo.svg",
  "./assets/og-card.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // API는 항상 네트워크 우선, 캐시하지 않음
  if (url.pathname.startsWith("/api/") || url.hostname === "api.markethunters.kr") {
    event.respondWith(fetch(req));
    return;
  }

  // 페이지 이동은 network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // JS/CSS는 network-first
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 이미지/아이콘만 cache-first
  if ([".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico"].some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
