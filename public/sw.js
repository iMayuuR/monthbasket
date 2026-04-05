// Service Worker for PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('grocery-list-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/favicon.svg',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'grocery-list-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
