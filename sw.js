self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('softcoin-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/server.js',
        '/favicon.ico',
        '/softcoin.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
