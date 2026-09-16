const CACHE = 'nlgs-shell-v5-scoring-boundary';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('nlgs-shell-') &&
            key !== CACHE
          )
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

          const type =
            response.headers.get('content-type') || '';

          if (!type.includes('text/html')) {
            return response;
          }

          const html = await response.text();

          const fix = `
<script>
/* NLGS scoring scroll fix v5 */

(function(){

  function scoringTop(){

    const s =
      document.getElementById(
        'competitionScoringNLGS'
      );

    if(
      !s ||
      !s.classList.contains('active')
    ){
      return null;
    }

    const header =
      document.querySelector('.top');

    const headerHeight =
      header ? header.offsetHeight : 0;

    return Math.max(
      0,
      s.getBoundingClientRect().top +
      window.scrollY -
      headerHeight
    );
  }


  function goToScoringTop(){

    const y = scoringTop();

    if(y === null) return;

    window.scrollTo({
      top: y,
      left: 0,
      behavior: 'auto'
    });
  }


  /*
   * Stop the user dragging above the
   * Competition Scoring section.
   *
   * The old code only stopped this at
   * scrollY = 0, which allowed the large
   * blank area above scoring.
   */

  let startY = 0;

  document.addEventListener(
    'touchstart',
    function(e){

      if(
        e.touches &&
        e.touches.length
      ){

        startY =
          e.touches[0].clientY;
      }

    },
    {passive:true}
  );


  document.addEventListener(
    'touchmove',
    function(e){

      const s =
        document.getElementById(
          'competitionScoringNLGS'
        );

      if(
        !s ||
        !s.classList.contains('active') ||
        !e.touches ||
        !e.touches.length
      ){
        return;
      }

      const y =
        e.touches[0].clientY;

      const pullingDown =
        y - startY > 8;

      const minY =
        scoringTop();

      if(
        pullingDown &&
        minY !== null &&
        window.scrollY <= minY + 1
      ){

        e.preventDefault();
      }

    },
    {passive:false}
  );


  /*
   * Keep the correct position when
   * Competition Scoring is opened.
   */

  function install(){

    let lastActive = false;

    const observer =
      new MutationObserver(
        function(){

          const s =
            document.getElementById(
              'competitionScoringNLGS'
            );

          const active =
            !!(
              s &&
              s.classList.contains('active')
            );

          if(
            active &&
            !lastActive
          ){

            setTimeout(
              goToScoringTop,
              60
            );

            setTimeout(
              goToScoringTop,
              250
            );
          }

          lastActive = active;

        }
      );


    observer.observe(
      document.documentElement,
      {
        subtree:true,
        attributes:true,
        attributeFilter:['class']
      }
    );


    /*
     * Keep the existing working
     * Hole 1 / Hole 2 / Hole 3 etc.
     * behaviour.
     */

    let tries = 0;

    const wrap = function(){

      if(
        typeof window.csSelectHole ===
        'function' &&
        !window.csSelectHole.__nlgsV5
      ){

        const original =
          window.csSelectHole;


        function wrapped(holeNo){

          const result =
            original.apply(
              this,
              arguments
            );


          setTimeout(
            goToScoringTop,
            30
          );

          setTimeout(
            goToScoringTop,
            180
          );


          return result;
        }


        wrapped.__nlgsV5 = true;

        window.csSelectHole =
          wrapped;

        return;
      }


      if(++tries < 100){

        setTimeout(
          wrap,
          50
        );
      }

    };


    wrap();

  }


  if(
    document.readyState ===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      install,
      {once:true}
    );

  }else{

    install();

  }

})();
</script>`;

          return new Response(
            html.replace(
              '</body>',
              fix + '</body>'
            ),
            {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            }
          );

        })
        .catch(() =>
          caches.match('./index.html')
        )
    );

    return;
  }


  event.respondWith(
    fetch(req)
      .then(response => response)
      .catch(() =>
        caches.match(req)
      )
  );
});
