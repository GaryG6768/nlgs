/* NLGS FRIENDLY V18
   Adds a separate FRIENDLY GAME RESULTS tile to the HOME screen.
   The tile opens its own screen and shows ONLY completed Friendly Games.
   Loads V17 first so the existing Friendly finalisation/locking remains intact.
*/
(function(){
  function boot(){
    (function(){
      console.log('NLGS FRIENDLY HOME RESULTS V18 ACTIVE');

      function esc(v){
        return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      }

      function formatDate(v){
        try{return new Date(String(v)+'T12:00:00').toLocaleDateString('en-GB');}
        catch(e){return String(v||'');}
      }

      // V16's history card is no longer needed on the Friendly Game screen.
      function hideOldFriendlyHistory(){
        const old=document.getElementById('friendlyHistoryCard');
        if(old) old.style.display='none';
      }

      // V17's Results-tab tile is also no longer used.
      function hideOldV17ResultsTile(){
        const old=document.getElementById('friendlyResultsTile');
        if(old) old.style.display='none';
      }

      function addHomeTile(){
        if(document.getElementById('friendlyHomeResultsTile')) return true;

        const home=document.getElementById('home');
        if(!home) return false;

        const grid=home.querySelector('.grid2');
        if(!grid) return false;

        const tile=document.createElement('button');
        tile.id='friendlyHomeResultsTile';
        tile.className='tile';
        tile.type='button';
        tile.innerHTML=
          '⛳'+
          '<b>Friendly Game Results</b>'+
          '<span>Completed friendly games</span>';

        tile.onclick=function(){
          if(typeof show==='function') show('friendlyResults');
        };

        // Put it directly after the Friendly Game tile.
        const friendlyTile=Array.from(grid.querySelectorAll('.tile')).find(function(x){
          return /Friendly Game/i.test(x.textContent||'');
        });

        if(friendlyTile && friendlyTile.nextElementSibling){
          grid.insertBefore(tile,friendlyTile.nextElementSibling);
        }else{
          grid.appendChild(tile);
        }
        return true;
      }

      function addResultsScreen(){
        if(document.getElementById('friendlyResults')) return true;

        const main=document.querySelector('main');
        if(!main) return false;

        const section=document.createElement('section');
        section.id='friendlyResults';
        section.className='screen';
        section.innerHTML=
          '<div class="label">NLGS FRIENDLY GAMES</div>'+
          '<h2 style="margin:4px 0">Friendly Game Results</h2>'+
          '<div class="small" style="margin-bottom:12px">Completed Friendly Games only. Final scores are locked.</div>'+
          '<div id="friendlyResultsPageBody">'+
            '<div class="card"><div class="small">Loading Friendly Game results…</div></div>'+
          '</div>'+
          '<button class="btn secondary" style="margin-top:12px" onclick="show(\\'home\\')">← BACK TO HOME</button>';

        const nav=main.querySelector('nav');
        if(nav) main.insertBefore(section,nav);
        else main.appendChild(section);
        return true;
      }

      function normalisePlayers(row){
        let players=row?.players;
        try{if(typeof players==='string') players=JSON.parse(players);}catch(e){}
        return Array.isArray(players)?players:[];
      }

      async function loadFriendlyResultsPage(){
        addHomeTile();
        addResultsScreen();
        hideOldFriendlyHistory();
        hideOldV17ResultsTile();

        const body=document.getElementById('friendlyResultsPageBody');
        if(!body) return;

        body.innerHTML='<div class="card"><div class="small">Loading Friendly Game results…</div></div>';

        try{
          const r=await sb.rpc('list_completed_friendly_games');
          if(r.error) throw r.error;

          const rows=Array.isArray(r.data)?r.data:[];

          if(!rows.length){
            body.innerHTML=
              '<div class="card">'+
              '<div style="font-size:34px;text-align:center">⛳</div>'+
              '<h3 style="text-align:center;margin:8px 0">No completed Friendly Games yet</h3>'+
              '<div class="small" style="text-align:center">Completed Friendly Games will appear here.</div>'+
              '</div>';
            return;
          }

          body.innerHTML='';

          rows.forEach(function(row){
            const players=normalisePlayers(row);

            const card=document.createElement('div');
            card.className='card';
            card.style.marginBottom='12px';

            card.innerHTML=
              '<div class="row" style="align-items:flex-start">'+
                '<div style="min-width:0;flex:1">'+
                  '<h3 style="margin:0">'+esc(row.course_name||'Friendly Game')+'</h3>'+
                  '<div class="small" style="margin-top:5px">'+
                    esc(formatDate(row.game_date))+' • '+
                    esc(row.format||'Stableford')+' • '+
                    esc(row.tee_name||'Yellow')+
                  '</div>'+
                '</div>'+
                '<span class="pill">🔒 COMPLETE</span>'+
              '</div>'+
              '<div class="small" style="margin-top:8px">'+
                (players.length ? players.map(esc).join(' • ') : 'Players not listed')+
              '</div>'+
              '<button class="btn secondary" style="margin-top:12px">VIEW FINAL RESULTS</button>';

            const btn=card.querySelector('button');
            btn.onclick=function(){
              if(typeof window.NLGSopenCompletedFriendlyGame==='function'){
                window.NLGSopenCompletedFriendlyGame(row);
              }else{
                toast('Friendly results are still loading — please try again');
              }
            };

            body.appendChild(card);
          });
        }catch(e){
          console.error('Could not load Friendly Game results',e);
          body.innerHTML=
            '<div class="card">'+
            '<div class="small">Could not load Friendly Game results. Please try again.</div>'+
            '</div>';
        }
      }

      window.NLGSloadFriendlyHomeResults=loadFriendlyResultsPage;

      // Add the new Home tile and separate screen as soon as the app is built.
      function ensureUI(){
        addHomeTile();
        addResultsScreen();
        hideOldFriendlyHistory();
        hideOldV17ResultsTile();
      }

      const oldShow=window.show;
      window.show=function(id){
        if(typeof oldShow==='function') oldShow.apply(this,arguments);

        if(id==='friendly'){
          setTimeout(hideOldFriendlyHistory,80);
          setTimeout(hideOldFriendlyHistory,250);
        }

        if(id==='friendlyResults'){
          setTimeout(loadFriendlyResultsPage,100);
        }
      };

      window.addEventListener('load',function(){
        setTimeout(ensureUI,300);
        setTimeout(function(){
          if(document.getElementById('friendlyResults')?.classList.contains('active')){
            loadFriendlyResultsPage();
          }
        },700);
      });

      // The app sometimes rebuilds parts of the UI after loading.
      const observer=new MutationObserver(function(){
        ensureUI();
      });
      observer.observe(document.body,{childList:true,subtree:true});

      setTimeout(ensureUI,200);
      setTimeout(ensureUI,1000);
    })();
  }

  const hasV17 = !!document.querySelector('script[src*="nlgs-friendly-v17-patch.js"]') ||
                 !!window.NLGSloadFriendlyResults ||
                 !!window.NLGS_FRIENDLY_HISTORY_GAME;

  if(hasV17){
    boot();
  }else{
    const s=document.createElement('script');
    s.src='./nlgs-friendly-v17-patch.js';
    s.onload=boot;
    s.onerror=function(){console.error('NLGS V18 could not load V17.');};
    document.head.appendChild(s);
  }
})();
