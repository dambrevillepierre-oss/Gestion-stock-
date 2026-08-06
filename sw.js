// Service worker pour Gestion Stock
// IMPORTANT : le nom du cache inclut une version. Change CACHE_VERSION
// à chaque mise à jour importante pour forcer les téléphones à récupérer
// la dernière version au lieu de rester bloqués sur une ancienne copie en cache.
const CACHE_VERSION = "v2";
const CACHE_NAME = "gestion-stock-" + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Active immédiatement le nouveau service worker sans attendre
  // la fermeture de tous les onglets ouverts.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Pour index.html (et toute navigation de page), on privilégie TOUJOURS
  // le réseau en premier. C'est ce qui a manqué avant : l'ancien service
  // worker servait une copie en cache périmée même après une mise à jour
  // du code, et l'app restait bloquée sur un ancien comportement.
  if (req.mode === "navigate" || req.url.endsWith("index.html") || req.url.endsWith("/")) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Pour le reste (icônes, manifest) : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
