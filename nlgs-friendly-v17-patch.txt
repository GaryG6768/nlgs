/* NLGS FRIENDLY V17
   Moves completed Friendly Game results out of the Friendly Game screen
   and gives them their own tile on the Results screen.
   Loads V16 first so the existing finalisation/locking behaviour remains intact.
*/
(function(){
  function boot(){
    (function(){
      console.log('NLGS FRIENDLY RESULTS V17 ACTIVE');

      function esc(v){
        return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      }

      function formatDate(v){
        try{return new Date(String(v)+'T12:00:00').toLocaleDateString('en-GB');}
        catch(e){return String(v||'');}
      }

      function hideOldFriendlyHistory(){
        const old=document.getElementById('friendlyHistoryCard');
        if(old) old.style.display='none';
      }

      function resultsTile(){
        let tile=document.getElementById('friendlyResultsTile');
        if(tile) return tile;

        const results=document.getElementById('results');
        if(!results) return null;

        tile=document.createElement('div');
        tile.id='friendlyResultsTile';
        tile.className='card';
        tile.style.marginBottom='14px';
        tile.innerHTML=
          '<div class="row" style="align-items:flex-start">'+
            '<div style="min-width:0;flex:1">'+
              '<h3 style="margin:0">⛳ FRIENDLY GAME RESULTS</h3>'+
              '<div class="small" style="margin-top:4px">Completed Friendly Games only</div>'+
            '</div>'+ 
            '<span class="pill">🔒 FINAL</span>'+ 
          '</div>'+ 
          '<div id="friendlyResultsBody" style="margin-top:10px">'+
            '<div class="small">Loading Friendly Game results…</div>'+
          '</div>';

        // Put the Friendly tile at the top of the Results page.
        results.insertBefore(tile,results.firstChild);
        return tile;
      }

      async function loadFriendlyResults(){
        hideOldFriendlyHistory();

        const tile=resultsTile();
        if(!tile) return;

        const body=document.getElementById('friendlyResultsBody');
        if(!body) return;
        body.innerHTML='<div class="small" style="padding:8px 0">Loading Friendly Game results…</div>';

        try{
          const r=await sb.rpc('list_completed_friendly_games');
          if(r.error) throw r.error;

          const rows=Array.isArray(r.data)?r.data:[];
          if(!rows.length){
            body.innerHTML='<div class="small" style="padding:8px 0">No completed Friendly Games yet.</div>';
            return;
          }

          body.innerHTML='';

          rows.forEach(function(row){
            let players=row.players;
            try{if(typeof players==='string')players=JSON.parse(players);}catch(e){}
            if(!Array.isArray(players))players=[];

            const item=document.createElement('div');
            item.className='card';
            item.style.cssText='margin:8px 0;background:#f8faf7;border:1px solid var(--line)';
            item.innerHTML=
              '<div class="row" style="align-items:flex-start">'+
                '<div style="min-width:0;flex:1">'+
                  '<b>'+esc(row.course_name||'Friendly Game')+'</b>'+ 
                  '<div class="small" style="margin-top:4px">'+
                    esc(formatDate(row.game_date))+' • '+esc(row.format||'Stableford')+
                    ' • '+esc(row.tee_name||'Yellow')+
                  '</div>'+ 
                  '<div class="small" style="margin-top:4px">'+
                    (players.length?players.map(esc).join(' • '):'Players not listed')+
                  '</div>'+ 
                '</div>'+ 
                '<span class="pill">🔒 COMPLETE</span>'+ 
              '</div>'+ 
              '<button class="btn secondary" style="margin-top:10px">VIEW FRIENDLY RESULTS</button>';

            item.querySelector('button').onclick=function(){
              if(typeof window.NLGSopenCompletedFriendlyGame==='function'){
                window.NLGSopenCompletedFriendlyGame(row);
              }else if(typeof window.NLGSloadFriendlyHistory==='function'){
                // Fallback if the V16 opener is not available yet.
                console.warn('Friendly result opener not ready');
              }
            };
            body.appendChild(item);
          });
        }catch(e){
          console.error('Could not load Friendly Game results',e);
          body.innerHTML='<div class="small" style="padding:8px 0">Could not load Friendly Game results. Please try again.</div>';
        }
      }

      window.NLGSloadFriendlyResults=loadFriendlyResults;

      const oldShow=window.show;
      window.show=function(id){
        if(typeof oldShow==='function') oldShow.apply(this,arguments);

        // Keep the old V16 history card out of the Friendly Game screen.
        if(id==='friendly'){
          setTimeout(hideOldFriendlyHistory,80);
          setTimeout(hideOldFriendlyHistory,250);
        }

        // Friendly results live on their own Results tile.
        if(id==='results'){
          setTimeout(loadFriendlyResults,120);
        }
      };

      window.addEventListener('load',function(){
        setTimeout(hideOldFriendlyHistory,500);
        setTimeout(function(){
          if(document.getElementById('results')?.classList.contains('active')) loadFriendlyResults();
        },700);
      });

      // Hide the old V16 card if another script rebuilds the Friendly screen.
      const observer=new MutationObserver(function(){
        hideOldFriendlyHistory();
      });
      observer.observe(document.body,{childList:true,subtree:true});
    })();
  }

  const hasV16 = !!document.querySelector('script[src*="nlgs-friendly-v16-patch.js"]') ||
                 !!window.NLGS_FRIENDLY_HISTORY_GAME ||
                 !!window.NLGSloadFriendlyHistory;
  if(hasV16){
    boot();
  }else{
    const s=document.createElement('script');
    s.src='./nlgs-friendly-v16-patch.js';
    s.onload=boot;
    s.onerror=function(){console.error('NLGS V17 could not load V16.');};
    document.head.appendChild(s);
  }
})();
