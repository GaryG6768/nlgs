
const CACHE = 'nlgs-shell-v3-scroll-fix';

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

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(async response => {
          const type = response.headers.get('content-type') || '';

          if (!type.includes('text/html')) return response;

          const html = await response.text();

          const fix = `
<script>
/* NLGS competition scoring scroll fix.
   The scoring screen must never call scrollIntoView automatically.
   Users control the page position with their finger. */
(function(){
  try {
    const originalScrollIntoView =
      Element.prototype.scrollIntoView;

    Element.prototype.scrollIntoView = function(){
      const scoring =
        document.getElementById('competitionScoringNLGS');

      if (
        scoring &&
        (this === scoring || scoring.contains(this))
      ) {
        return;
      }

      return originalScrollIntoView.apply(this, arguments);
    };
  } catch(e) {}
})();
</script>`;

          return new Response(
            html.replace('</body>', fix + '</body>'),
            {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            }
          );
        })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => response)
      .catch(() => caches.match(req))
  );
});
