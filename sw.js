// Service Worker — Coup 2 Pouce DELY DIAG
const CACHE = 'coup2pouce-v9';

self.addEventListener('install', function(e) {
  // Ne pas skipWaiting automatiquement : on attend que l'utilisateur confirme la mise à jour
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.add('./index.html');
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
});

// L'utilisateur clique "Actualiser" → le client envoie ce message
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(e) {
  // Réseau prioritaire, cache en fallback (mode hors-ligne)
  e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
});
