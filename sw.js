// Service Worker — Coup 2 Pouce DELY DIAG
const CACHE = 'coup2pouce-v37';

// ─── Fichiers à mettre en cache pour le mode hors-ligne ───
const PRECACHE = [
  './',
  './index.html',
  './sign.html',
  './prescripteur.html',

  // JS principal
  './js/state.js',
  './js/app.js',
  './js/auth.js',
  './js/profil.js',
  './js/devis.js',
  './js/facture.js',
  './js/mission.js',
  './js/terrain.js',
  './js/mail.js',
  './js/pdf-generator.js',
  './js/carrez.js',
  './js/tarifs.js',
  './js/checklist.js',
  './js/certif.js',
  './js/cours.js',
  './js/glossaire.js',
  './js/astuces.js',
  './js/stats.js',
  './js/relances.js',
  './js/clients.js',
  './js/prescripteurs.js',
  './js/signature.js',
  './js/chatbot.js',
  './js/voice.js',
  './js/avatar.js',
  './js/dark-mode.js',
  './js/prenom.js',
  './js/search.js',
  './js/ocr-reader.js',
  './js/document-sender.js',
  './js/diagnostics-rules.js',
  './js/address-autocomplete.js',
  './js/agent.js',
  './js/agent-devis.js',
  './js/agent-factures.js',
  './js/feuille-visite-mission.js',

  // Data
  './data/modules.js',
  './data/storage.js',
  './data/company-profile.js',
  './data/checklist.js',
  './data/glossaire.js',
  './data/astuces.js',

  // Icônes
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-512-maskable.png'
];

// ─── Installation : mise en cache de tous les fichiers ───
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return Promise.allSettled(
        PRECACHE.map(function(url) {
          return cache.add(url).catch(function() {
            console.warn('[SW] Impossible de mettre en cache :', url);
          });
        })
      );
    })
  );
});

// ─── Activation : supprimer les anciens caches et prendre le contrôle ───
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── Message utilisateur (bouton "Actualiser") ───
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Stratégie fetch ─────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  if (
    url.indexOf('firestore.googleapis.com') !== -1 ||
    url.indexOf('googleapis.com') !== -1 ||
    url.indexOf('anthropic.com') !== -1 ||
    url.indexOf('resend.com') !== -1 ||
    url.indexOf('netlify/functions') !== -1 ||
    url.indexOf('/.netlify/') !== -1 ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
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

// ─── Clic notification ───
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var notifTag = e.notification.tag || '';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      if (cls.length > 0) {
        return cls[0].focus().then(function(client) {
          // Si c'est une notif de devis signé, demander à l'app d'ouvrir la section agent
          if (notifTag === 'coup2pouce-devis' && client && client.postMessage) {
            client.postMessage({ type: 'NOTIF_DEVIS_SIGNE' });
          }
          return client;
        });
      }
      // App pas ouverte : l'ouvrir sur la bonne section
      return clients.openWindow(notifTag === 'coup2pouce-devis' ? '/#agent' : '/');
    })
  );
});
