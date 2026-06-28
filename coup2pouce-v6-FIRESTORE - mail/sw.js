// Service Worker — Coup 2 Pouce DELY DIAG
const CACHE = 'coup2pouce-v5';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Pass-through : pas de cache agressif, réseau prioritaire
  e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
});
