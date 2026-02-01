const CACHE_NAME = 'syllabiq-v2'; // Increment version to bust old cache
const urlsToCache = [
    '/',
    '/manifest.json',
    '/globe.svg'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

const url = event.request.url;

// 1. Skip Supabase, Next.js internal calls, and other non-cacheable stuff
if (
    url.includes('supabase.co') ||
    url.includes('/_next/') ||
    url.includes('/api/') ||
    event.request.method !== 'GET'
) {
    // Network-Only for these
    return;
}

// 2. Cache-First with Network Fallback for Static Assets (CSS, JS, Images, Icons)
event.respondWith(
    caches.match(event.request)
        .then((response) => {
            return response || fetch(event.request);
        })
);
});
