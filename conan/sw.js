// Service Worker — مكتبة أفلام كونان (GG Gaming)
// تخزين مؤقت بسيط للهيكل الأساسي + صفحة عدم اتصال
const CACHE_NAME = 'gg-conan-cache-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => { /* تجاهل أي ملف غير موجود */ }))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // طلبات التنقل (فتح صفحة) — جرّب الشبكة، وإن فشلت اعرض صفحة عدم الاتصال
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // باقي الملفات الثابتة من نفس الموقع: شبكة أولاً ثم تخزين مؤقت كاحتياط
    if (req.method === 'GET' && new URL(req.url).origin === self.location.origin) {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => { });
                    return res;
                })
                .catch(() => caches.match(req))
        );
    }
    // طلبات الفيديو/السيرفرات الخارجية (mega, drive, pegasus...) تُترك للشبكة مباشرة بدون تخزين مؤقت
});
