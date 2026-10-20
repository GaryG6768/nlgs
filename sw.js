const CACHE = 'nlgs-shell-v7-offline-startup';

// Pre-cache the app shell so the installed app can start without internet.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of ['./', './index.html']) {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response && response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
          await cache.put(url, response.clone());
        }
      } catch (_) { /* A later online visit can populate the cache. */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('nlgs-shell-') && key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(req, { cache: 'no-store' });
        const type = response.headers.get('content-type') || '';
        if (!response.ok || !type.includes('text/html')) return response;

        const html = await response.text();
        // Preserve the existing NLGS scoring-screen scroll fix.
        const fix = `<script>
(function(){
  function scoringTop(){
    const s=document.getElementById('competitionScoringNLGS');
    if(!s||!s.classList.contains('active')) return null;
    const h=document.querySelector('.top');
    return Math.max(0,s.getBoundingClientRect().top+window.scrollY-(h?h.offsetHeight:0));
  }
  function goToScoringTop(){const y=scoringTop();if(y!==null)window.scrollTo({top:y,left:0,behavior:'auto'});}
  let startY=0;
  document.addEventListener('touchstart',e=>{if(e.touches&&e.touches.length)startY=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',e=>{
    const s=document.getElementById('competitionScoringNLGS');
    if(!s||!s.classList.contains('active')||!e.touches||!e.touches.length)return;
    if(e.touches[0].clientY-startY>8&&scoringTop()!==null&&window.scrollY<=scoringTop()+1)e.preventDefault();
  },{passive:false});
  function install(){
    let lastActive=false;
    new MutationObserver(()=>{
      const s=document.getElementById('competitionScoringNLGS');
      const active=!!(s&&s.classList.contains('active'));
      if(active&&!lastActive){setTimeout(goToScoringTop,60);setTimeout(goToScoringTop,250);}
      lastActive=active;
    }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
    let tries=0;
    const wrap=()=>{
      if(typeof window.csSelectHole==='function'&&!window.csSelectHole.__nlgsV5){
        const original=window.csSelectHole;
        function wrapped(){const result=original.apply(this,arguments);setTimeout(goToScoringTop,30);setTimeout(goToScoringTop,180);return result;}
        wrapped.__nlgsV5=true;window.csSelectHole=wrapped;return;
      }
      if(++tries<100)setTimeout(wrap,50);
    };
    wrap();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
</script>`;
        const patched = new Response(html.replace('</body>', fix + '</body>'), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        // Cache the actual patched page at the requested URL and app-shell URLs.
        await cache.put(req, patched.clone());
        await cache.put('./index.html', patched.clone());
        await cache.put('./', patched.clone());
        return patched;
      } catch (_) {
        return (await cache.match(req)) || (await cache.match('./')) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req);
      if (response && response.ok && new URL(req.url).origin === self.location.origin) {
        cache.put(req, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await cache.match(req);
      if (cached) return cached;
      throw error;
    }
  })());
});
