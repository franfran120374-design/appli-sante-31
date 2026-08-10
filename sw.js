/* Service worker : met tout en cache pour que l'appli marche sans connexion.
   Changer VERSION a chaque mise a jour des donnees pour forcer le rafraichissement. */
var VERSION = "sante31-v3";
var FICHIERS = [
  "./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./data/langues.json", "./data/villes.json", "./data/structures-31.json",
  "./i18n/fr.json", "./i18n/en.json", "./i18n/ar.json",
  "./i18n/fa.json", "./i18n/uk.json", "./i18n/ru.json",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copie = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copie); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
