/* NLGS FRIENDLY V16
   Loads V15 first, then adds completed Friendly Game history.
*/
(function(){
  function boot(){
    (function(){
      console.log('NLGS FRIENDLY HISTORY V16 ACTIVE');
    
      function esc(v){
        return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      }
    
      function completedRoundCard(){
        let card=document.getElementById('friendlyHistoryCard');
        if(card)return card;
    
        const start=document.getElementById('friendlyStartBtn');
        if(!start)return null;
    
        card=document.createElement('div');
        card.id='friendlyHistoryCard';
        card.className='card';
        card.style.marginTop='14px';
        card.innerHTML=
          '<div class="row">'+
            '<div><h3 style="margin:0">FRIENDLY GAME HISTORY</h3>'+
            '<div class="small" style="margin-top:4px">Completed rounds are saved here for all players to view.</div></div>'+
            '<span class="pill">🔒 FINAL</span>'+
          '</div>'+
          '<div id="friendlyHistoryBody" style="margin-top:10px"><div class="small">Loading completed rounds…</div></div>';
    
        start.parentNode.insertBefore(card,start);
        return card;
      }
    
      function normaliseGame(row){
        let players=row.players;
        let playerData=row.player_data;
        let holeData=row.hole_data;
        let scores=row.scores;
    
        try{if(typeof players==='string')players=JSON.parse(players);}catch(e){}
        try{if(typeof playerData==='string')playerData=JSON.parse(playerData);}catch(e){}
        try{if(typeof holeData==='string')holeData=JSON.parse(holeData);}catch(e){}
        try{if(typeof scores==='string')scores=JSON.parse(scores);}catch(e){}
    
        return {
          dbId:row.id,
          date:row.game_date,
          courseId:row.course_id,
          teeId:row.tee_id,
          course:row.course_name||'Golf Course',
          tee:row.tee_name||'Yellow',
          format:row.format||'Stableford',
          allowance:String(row.allowance??100)+'%',
          courseRating:Number(row.course_rating)||0,
          slope:Number(row.slope_rating)||0,
          par:Number(row.par)||72,
          players:Array.isArray(players)?players:[],
          playerData:Array.isArray(playerData)?playerData:[],
          holeData:Array.isArray(holeData)?holeData:[],
          scores:scores&&typeof scores==='object'?scores:{},
          include3s5s:!!row.include_3s5s,
          status:'complete',
          currentHole:1,
          currentPlayer:0
        };
      }
    
      function showHistoryMessage(msg){
        const body=document.getElementById('friendlyHistoryBody');
        if(body)body.innerHTML='<div class="small" style="padding:8px 0">'+msg+'</div>';
      }
    
      function formatDate(v){
        try{return new Date(String(v)+'T12:00:00').toLocaleDateString('en-GB');}
        catch(e){return String(v||'');}
      }
    
      async function loadCompletedFriendlyGames(){
        const card=completedRoundCard();
        if(!card)return;
        const body=document.getElementById('friendlyHistoryBody');
        if(!body)return;
    
        body.innerHTML='<div class="small" style="padding:8px 0">Loading completed rounds…</div>';
    
        try{
          const r=await sb.rpc('list_completed_friendly_games');
          if(r.error)throw r.error;
    
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
              '<button class="btn secondary" style="margin-top:10px">VIEW FINAL RESULTS</button>';
    
            item.querySelector('button').onclick=function(){
              openCompletedFriendlyGame(row);
            };
            body.appendChild(item);
          });
        }catch(e){
          console.error('Could not load Friendly Game history',e);
          body.innerHTML='<div class="small" style="padding:8px 0">Could not load completed games. Please try again.</div>';
        }
      }
    
      function openCompletedFriendlyGame(row){
        const game=normaliseGame(row);
    
        try{
          window.friendlyRound=game;
          localStorage.setItem('nlgsFriendlyRound',JSON.stringify(game));
          sessionStorage.setItem('nlgsLastFriendlyRound',JSON.stringify(game));
        }catch(e){
          console.error('Could not store completed Friendly Game',e);
        }
    
        // Tell the V15 lock layer that this is a completed round.
        if(typeof window.multiStatus!=='undefined') window.multiStatus={game_status:'complete'};
        window.NLGS_FRIENDLY_HISTORY_GAME=game;
    
        try{
          if(typeof finishFriendlyRound==='function'){
            finishFriendlyRound();
          }else{
            show('friendlySummary');
          }
        }catch(e){
          console.error('Could not open Friendly Game result',e);
          if(typeof show==='function')show('friendlySummary');
        }
      }
    
      window.NLGSloadFriendlyHistory=loadCompletedFriendlyGames;
      window.NLGSopenCompletedFriendlyGame=openCompletedFriendlyGame;
    
      // Load the history whenever the Friendly Game screen is opened.
      const oldShow=window.show;
      window.show=function(id){
        if(typeof oldShow==='function')oldShow.apply(this,arguments);
        if(id==='friendly'){
          setTimeout(loadCompletedFriendlyGames,120);
        }
      };
    
      // Also load once the page has finished initialising.
      window.addEventListener('load',function(){
        setTimeout(loadCompletedFriendlyGames,700);
      });
    
      // If another patch rebuilds the Friendly page, recreate the history card.
      const observer=new MutationObserver(function(){
        if(document.getElementById('friendly')?.classList.contains('active') &&
           !document.getElementById('friendlyHistoryCard')){
          setTimeout(loadCompletedFriendlyGames,50);
        }
      });
      observer.observe(document.body,{childList:true,subtree:true});
    })();
  }

  const hasV15 = !!document.querySelector('script[src*="nlgs-friendly-v15-patch.js"]') ||
                 !!window.NLGS_FRIENDLY_DB_VERSION;
  if(hasV15){
    boot();
  }else{
    const s=document.createElement('script');
    s.src='./nlgs-friendly-v15-patch.js';
    s.onload=boot;
    s.onerror=function(){ console.error('NLGS V16 could not load V15.'); };
    document.head.appendChild(s);
  }
})();
