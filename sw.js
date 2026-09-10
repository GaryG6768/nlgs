const CACHE = 'nlgs-shell-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('nlgs-shell-') && key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // Always get the latest HTML from the network.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Normal network-first handling for other files.
  event.respondWith(
    fetch(req)
      .then(response => response)
      .catch(() => caches.match(req))
  );
});
