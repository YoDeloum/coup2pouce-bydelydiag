// Service Worker — Coup 2 Pouce DELY DIAG
const CACHE = 'coup2pouce-v13';

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

// ─── Notifications push ───
self.addEventListener('push', function(e) {
  var data = { title: '✍️ Coup 2 Pouce', body: 'Nouvelle notification' };
  try { data = e.data.json(); } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon  || '/assets/icons/icon-192.png',
      badge:    data.badge || '/assets/icons/icon-192.png',
      tag:      data.tag   || 'coup2pouce-notif',
      renotify: true
    })
  );
});

// Clic sur la notification → ouvre l'app sur l'onglet Devis
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      if (cls.length > 0) { return cls[0].focus(); }
      return clients.openWindow('/#devis');
    })
  );
});
