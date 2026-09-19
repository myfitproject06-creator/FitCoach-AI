// Service Worker สำหรับ FitCoach AI (PWA แบบเบา)
// จัดการแคชเฉพาะไฟล์ static และหน้าเว็บหลัก โดยไม่ง้อเน็ตเวิร์กเมื่อออฟไลน์
const CACHE_NAME = "fitcoach-cache-v1";

// รายการไฟล์ตั้งต้นที่ต้องแคชล่วงหน้า
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

// 1. ขั้นตอน Install: แคชไฟล์หลัก และข้ามการรอ (skipWaiting) ทันทีเพื่ออัปเดตเวอร์ชันใหม่
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // แคชไฟล์เริ่มต้นอย่างปลอดภัย
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. ขั้นตอน Activate: ลบแคชเวอร์ชันเก่าออกอัตโนมัติ และเข้าควบคุมหน้าเว็บทันที (clients.claim)
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

// 3. จัดการ Fetch Request:
// ข้อกำหนดสำคัญ: ห้ามแคชและห้ามดักคำขอ /api/* และ /webhook/* เด็ดขาด
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ข้ามคำขอที่ไม่ใช่ GET (เช่น POST, PUT, DELETE)
  if (req.method !== "GET") {
    return;
  }

  // ห้ามแคชและห้ามดัก API และ LINE Webhook เด็ดขาด ปล่อยให้ส่งตรงไปที่เซิร์ฟเวอร์
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/webhook")) {
    return;
  }

  // ถ้าเป็นโดเมนภายนอก (Third-party) ปล่อยให้เน็ตเวิร์กจัดการตามปกติ
  if (url.origin !== self.location.origin) {
    return;
  }

  // สำหรับหน้าหลัก (Navigation Request): ใช้กลยุทธ์ Network-First เพื่อให้ได้เวอร์ชันล่าสุดเสมอ ถ้าเน็ตหลุดจึงดึงจากแคช
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

  // สำหรับไฟล์ Static (JS, CSS, รูปภาพ, ฟอนต์): ใช้ Cache-First พร้อมอัปเดตแคชในเบื้องหลัง (Stale-While-Revalidate)
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
