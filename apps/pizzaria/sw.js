const CACHE_NAME = "yulipe-pizzaria-v2";
const APP_SHELL = [
  "./acesso/index.html",
  "./cliente-login/index.html",
  "./cliente/index.html",
  "./admin/index.html",
  "./cozinha/index.html",
  "./entregador/index.html",
  "./pwa.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if ((url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.port === "3000") return;

  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => (
      caches.match(event.request).then(cached => (
        cached || caches.match("./acesso/index.html")
      ))
    ))
  );
});
