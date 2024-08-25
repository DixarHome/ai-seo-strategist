self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('/index.html')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => caches.match(event.request))
        );
    }
});
