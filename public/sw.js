// Service Worker สำหรับ FitCoach AI (PWA Cache & Offline Static)
const CACHE_NAME = "fitcoach-cache-v1";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

// 1. Lifecycle Install: Precache assets (skipWaiting)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Lifecycle Activate: Cleanup old caches (clients.claim)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Request: Bypass /api/* and /webhook/*
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ข้าม request ที่ไม่ใช่ GET
  if (req.method !== "GET") {
    return;
  }

  // ข้าม API และ LINE Webhook
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/webhook")) {
    return;
  }

  // ข้าม third-party requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // สำหรับ Navigation Request: Network-First พร้อม Offline Fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedIndex = await caches.match("/index.html");
          return cachedIndex || caches.match("/");
        })
    );
    return;
  }

  // สำหรับ Static assets (JS, CSS, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
