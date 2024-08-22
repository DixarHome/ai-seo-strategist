// Listen to the install event
self.addEventListener('install', function(event) {
    // Skip the waiting phase, so the service worker activates immediately
    self.skipWaiting();
});

// Listen to the activate event
self.addEventListener('activate', function(event) {
    // Claim any clients immediately, so the service worker becomes active without reloading
    event.waitUntil(self.clients.claim());
});

// Listen to the fetch event
self.addEventListener('fetch', function(event) {
    // Simply pass the request through to the network without caching
    event.respondWith(fetch(event.request));
});
