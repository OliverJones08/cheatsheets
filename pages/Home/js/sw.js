// Simple service worker for offline support
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('cheatsheets-v1').then(cache => {
      return cache.addAll([
        '/',
        '/pages/Home/views/home.html',
        '/pages/Home/css/home.css',
        '/pages/Home/js/home.js',
        // Add more assets as needed
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
