/* NLGS Handicap Tracker v3
   Automatic import of completed NLGS competition rounds AND completed Friendly Games.
   Rules:
   - Current form = average of best 8 differentials from last 20 rounds.
   - Demonstrated ability = best differential from last 15 rounds.
   - Ability limit = demonstrated ability + 5.
   - NLGS Handicap = lower of current form and ability limit.
*/
(function(){
  'use strict';

  const KEY='nlgsHandicapTrackerV3';
  const OLD_KEY_V2='nlgsHandicapTrackerV2';
  const OLD_KEY_V1='nlgsHandicapTrackerV1';

  function getMember(){
    try{return JSON.parse(sessionStorage.getItem('nlgsMember')||'null');}
    catch(e){return null;}
  }

  function memberKey(){
    const m=getMember();
    return String((m&&m.id)||((m&&m.full_name)||'').trim()||'unknown').trim();
  }

  function getAll(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}
    catch(e){return {};}
  }

  function saveAll(d){localStorage.setItem(KEY,JSON.stringify(d));}

  function getRounds(){
    const d=getAll(), k=memberKey();
    const r=Array.isArray(d[k])?d[k]:[];
    return r.map(x=>{
      if(typeof x==='number') return {diff:x,source:'manual'};
      return x;
    }).filter(x=>x&&Number.isFinite(Number(x.diff)))
      .map(x=>({...x,diff:Number(x.diff)}));
  }

  function saveRounds(r){
    const d=getAll();
    d[memberKey()]=r;
    saveAll(d);
  }

  function fmt(n){return Number.isFinite(n)?n.toFixed(1):'—';}

  function addStyles(){
    if(document.getElementById('nlgsHandicapTrackerStylesV3'))return;
    const s=document.createElement('style');
    s.id='nlgsHandicapTrackerStylesV3';
    s.textContent='.nlgs-hcp-stat{background:#f8faf7;border-radius:12px;padding:12px}.nlgs-hcp-stat b{display:block;font-size:21px;color:var(--green);margin-top:4px}';
    document.head.appendChild(s);
  }

  function buildSection(){
    if(document.getElementById('handicapTracker'))return;

    const section=document.createElement('section');
    section.id='handicapTracker';
    section.className='screen';

    section.innerHTML=`
      <div class="hero">
        <div class="sub">NLGS HANDICAP</div>
        <h1>Handicap Tracker</h1>
        <p>Ability-based NLGS handicap</p>
      </div>

      <div class="card">
        <div class="label">PLAYER</div>
        <div class="big" id="nlgsHcpPlayer" style="margin-top:5px">—</div>
        <div class="small">This tracker is tied automatically to the logged-in NLGS member.</div>
      </div>

      <div class="card">
        <div class="label">CURRENT NLGS HANDICAP</div>
        <div class="grid2" style="margin-top:10px">
          <div class="nlgs-hcp-stat"><span class="small">Best 8 of last 20</span><b id="nlgsHcpForm">—</b></div>
          <div class="nlgs-hcp-stat"><span class="small">Best last 15</span><b id="nlgsHcpAbility">—</b></div>
          <div class="nlgs-hcp-stat"><span class="small">Ability limit (+5)</span><b id="nlgsHcpLimit">—</b></div>
          <div class="nlgs-hcp-stat"><span class="small">NLGS Handicap</span><b id="nlgsHcpValue">—</b></div>
        </div>
      </div>

      <div class="card">
        <div class="label">NLGS ROUND SYNC</div>
        <div class="small" style="line-height:1.5;margin-top:8px">
          Completed NLGS competition rounds and completed Friendly Games can be imported automatically for the logged-in player.
        </div>
        <button class="btn" style="margin-top:10px" onclick="nlgsHcpSyncRounds()">SYNC COMPLETED ROUNDS</button>
        <div id="nlgsHcpSyncMsg" class="small" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <div class="label">ADD SCORE DIFFERENTIAL</div>
        <div style="margin-top:8px">
          <input id="nlgsHcpDiff" class="input" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 12.4">
        </div>
        <button class="btn" style="margin-top:10px" onclick="nlgsHcpAddRound()">ADD ROUND</button>
        <div id="nlgsHcpMsg" class="small" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <div class="row">
          <div class="label">ROUND HISTORY</div>
          <button class="btn secondary" style="width:auto;padding:8px 10px" onclick="nlgsHcpClearRounds()">CLEAR</button>
        </div>
        <div id="nlgsHcpHistory" style="max-height:360px;overflow:auto;margin-top:8px">No rounds recorded.</div>
      </div>

      <div class="card">
        <div class="label">NLGS HANDICAP RULES</div>
        <div class="small" style="line-height:1.65;margin-top:8px">
          • Current form = average of the best 8 Score Differentials from the last 20 rounds.<br>
          • Demonstrated ability = best Score Differential from the last 15 rounds.<br>
          • Ability limit = demonstrated ability + 5 shots.<br>
          • NLGS Handicap = the lower of current form and the ability limit.<br>
          • Demonstrated ability moves with the most recent 15 rounds.
        </div>
      </div>

      <button class="btn secondary" onclick="show('mygolf')">BACK TO MY GOLF</button>`;

    const builder=document.getElementById('competitionBuilder');
    const main=document.querySelector('main');
    if(builder)builder.parentNode.insertBefore(section,builder);
    else if(main)main.appendChild(section);
  }

  function addHomeTile(){
    if(document.getElementById('nlgsHandicapHomeTile'))return;
    const t=document.querySelector(".tile[onclick=\"show('mygolf')\"]");
    if(!t||!t.parentNode)return;
    const tile=document.createElement('button');
    tile.id='nlgsHandicapHomeTile';
    tile.className='tile';
    tile.setAttribute('onclick',"show('handicapTracker')");
    tile.innerHTML='📊<b>Handicap Tracker</b><span>NLGS ability handicap</span>';
    t.parentNode.insertBefore(tile,t.nextSibling);
  }

  function addMyGolfButton(){
    if(document.getElementById('nlgsHandicapMyGolfButton'))return;
    const g=document.getElementById('mygolf');
    if(!g)return;
    const b=document.createElement('button');
    b.id='nlgsHandicapMyGolfButton';
    b.className='btn';
    b.textContent='OPEN HANDICAP TRACKER';
    b.onclick=()=>show('handicapTracker');
    g.appendChild(b);
  }

  function calculate(){
    const r=getRounds();
    const last20=r.slice(-20);
    const last15=r.slice(-15);
    const best8=last20.slice().sort((a,b)=>a.diff-b.diff).slice(0,8).map(x=>x.diff);
    const form=best8.length?best8.reduce((a,b)=>a+b,0)/best8.length:NaN;
    const ability=last15.length?Math.min(...last15.map(x=>x.diff)):NaN;
    const limit=Number.isFinite(ability)?ability+5:NaN;
    const handicap=Number.isFinite(form)&&Number.isFinite(limit)
      ?Math.min(form,limit)
      :(Number.isFinite(form)?form:limit);
    return {r,form,ability,limit,handicap};
  }

  function render(){
    const m=getMember(),x=calculate();
    const p=document.getElementById('nlgsHcpPlayer');
    if(p)p.textContent=(m&&(m.full_name||m.name))||'Logged-in member';

    [
      ['nlgsHcpForm',x.form],
      ['nlgsHcpAbility',x.ability],
      ['nlgsHcpLimit',x.limit],
      ['nlgsHcpValue',x.handicap]
    ].forEach(a=>{
      const e=document.getElementById(a[0]);
      if(e)e.textContent=fmt(a[1]);
    });

    const mh=document.getElementById('myGolfHcp');
    if(mh)mh.textContent=fmt(x.handicap);

    const h=document.getElementById('nlgsHcpHistory');
    if(!h)return;

    h.innerHTML=x.r.length
      ?x.r.slice().reverse().map((v,i)=>{
        let label='Manual entry';
        if(v.source==='competition')label=v.competitionName||'NLGS competition';
        if(v.source==='friendly')label=v.friendlyName||v.competitionName||'Friendly Game';
        return '<div style="padding:9px 0;border-bottom:1px solid var(--line)"><b>Round '+(x.r.length-i)+'</b> — Score Differential <b>'+fmt(v.diff)+'</b><br><span class="small">'+label+'</span></div>';
      }).join('')
      :'No rounds recorded.';
  }

  function migrateOld(){
    try{
      const d=getAll(),k=memberKey();
      if(Array.isArray(d[k])&&d[k].length)return;

      const old2=JSON.parse(localStorage.getItem(OLD_KEY_V2)||'{}');
      if(old2&&Array.isArray(old2[k])&&old2[k].length){
        d[k]=old2[k].map(v=>{
          if(typeof v==='number')return {diff:Number(v),source:'manual'};
          return v;
        }).filter(x=>x&&Number.isFinite(Number(x.diff)))
         .map(x=>({...x,diff:Number(x.diff)}));
        saveAll(d);
        return;
      }

      const old1=JSON.parse(localStorage.getItem(OLD_KEY_V1)||'{}');
      if(old1&&Array.isArray(old1[k])){
        d[k]=old1[k].map(v=>({diff:Number(v),source:'manual'}))
          .filter(x=>Number.isFinite(x.diff));
        saveAll(d);
      }
    }catch(e){}
  }

  function courseRoundDiff(player,scores,holes,c){
    let adjusted=0;
    let holesPlayed=0;
    let courseHcp=Number(player.handicap_index);

    if(!Number.isFinite(courseHcp))
      courseHcp=Number(player.handicap||0);

    courseHcp=Math.round(
      courseHcp*(Number(c.slope_rating||113)/113)+
      (Number(c.course_rating||c.par||0)-Number(c.par||0))
    );

    const ordered=(holes||[]).slice().sort((a,b)=>Number(a.hole_no)-Number(b.hole_no));
    const strokesByHole={};
    (scores||[]).forEach(s=>{
      strokesByHole[String(s.hole_no)]=Number(s.strokes);
    });

    const extra=Math.max(0,courseHcp);
    const base=Math.floor(extra/18);
    const rem=extra%18;

    ordered.forEach(h=>{
      const s=strokesByHole[String(h.hole_no)];
      if(Number.isFinite(s)){
        const shots=base+(Number(h.stroke_index)<=rem?1:0);
        adjusted+=Math.min(s,Number(h.par)+2+shots);
        holesPlayed++;
      }
    });

    const cr=Number(c.course_rating);
    const slope=Number(c.slope_rating);

    if(holesPlayed!==18||!Number.isFinite(cr)||!Number.isFinite(slope)||slope<=0||adjusted<=0)
      return NaN;

    return (113/slope)*(adjusted-cr);
  }

  function parseScores(value){
    if(typeof value==='string'){
      try{return JSON.parse(value)||{};}catch(e){return {};}
    }
    return value&&typeof value==='object'?value:{};
  }

  function friendlyScoreMapForPlayer(game,playerData,playerIndex){
    const all=parseScores(game.scores);
    const name=String(playerData?.name||game.players?.[playerIndex]||'').trim();

    return all[name]||
      all[String(game.players?.[playerIndex]||'').trim()]||
      {};
  }

  function friendlyRoundDiff(playerData,scoreMap,holes,game){
    const ordered=(holes||[]).slice().sort((a,b)=>Number(a.hole_no)-Number(b.hole_no));
    if(ordered.length!==18)return NaN;

    let courseHcp=Number(playerData?.courseHandicap);
    if(!Number.isFinite(courseHcp))
      courseHcp=Number(playerData?.course_hcp);

    if(!Number.isFinite(courseHcp)){
      const hi=Number(playerData?.handicapIndex);
      const slope=Number(game.slope_rating);
      const cr=Number(game.course_rating);
      const par=Number(game.par);
      if(Number.isFinite(hi)&&Number.isFinite(slope)&&slope>0&&Number.isFinite(cr)&&Number.isFinite(par)){
        courseHcp=Math.round(hi*(slope/113)+(cr-par));
      }
    }

    if(!Number.isFinite(courseHcp))
      courseHcp=Number(playerData?.playingHandicap||0);

    if(!Number.isFinite(courseHcp))return NaN;

    const base=Math.floor(Math.max(0,courseHcp)/18);
    const rem=Math.max(0,courseHcp)%18;
    let adjusted=0;
    let holesPlayed=0;

    for(const h of ordered){
      let s=scoreMap[String(h.hole_no)];
      if(s==null)s=scoreMap[h.hole_no];
      s=Number(s);

      if(!Number.isFinite(s)||s<1)continue;

      const shots=base+(Number(h.stroke_index)<=rem?1:0);
      adjusted+=Math.min(s,Number(h.par)+2+shots);
      holesPlayed++;
    }

    const cr=Number(game.course_rating);
    const slope=Number(game.slope_rating);

    if(holesPlayed!==18||!Number.isFinite(cr)||!Number.isFinite(slope)||slope<=0||adjusted<=0)
      return NaN;

    return (113/slope)*(adjusted-cr);
  }

  function friendlyPlayerIndex(game,m){
    const meId=String(m.id||m.member_id||'');
    const myName=String(m.full_name||m.name||'').trim().toLowerCase();
    const pd=Array.isArray(game.player_data)?game.player_data:[];
    const players=Array.isArray(game.players)?game.players:[];

    let i=pd.findIndex(p=>{
      const id=String(p?.memberId||p?.member_id||p?.member_uuid||'');
      const name=String(p?.name||'').trim().toLowerCase();
      return (id&&id===meId)||(name&&name===myName);
    });

    if(i<0){
      i=players.findIndex(n=>String(n||'').trim().toLowerCase()===myName);
    }
    return i;
  }

  function jsonValue(v,fallback){
    if(v==null)return fallback;
    if(typeof v==='string'){
      try{return JSON.parse(v);}
      catch(e){return fallback;}
    }
    return v;
  }

  function normaliseFriendlyGame(g){
    if(!g)return null;
    const x={...g};
    x.players=jsonValue(x.players,[]);
    x.player_data=jsonValue(x.player_data,[]);
    x.hole_data=jsonValue(x.hole_data,[]);
    x.scores=jsonValue(x.scores,{});
    return x;
  }

  function friendlyPlayerData(game){
    const pd=jsonValue(game.player_data,[]);
    if(Array.isArray(pd))return pd;
    if(pd&&typeof pd==='object'){
      return Object.entries(pd).map(([name,value])=>({
        ...(value&&typeof value==='object'?value:{}),
        name:(value&&value.name)||name
      }));
    }
    return [];
  }

  function friendlyScoreMap(game,pd,pi){
    const all=jsonValue(game.scores,{});
    const name=String(pd?.name||game.players?.[pi]||'').trim();
    if(!all||typeof all!=='object')return {};
    return all[name]||all[String(game.players?.[pi]||'').trim()]||{};
  }

  async function getFriendlyGameRobust(summary){
    const sid=String(summary?.id||summary?.game_id||'');
    let game=normaliseFriendlyGame(summary);

    // The normal RPC is the authoritative route used by the Friendly Game app.
    if(sid){
      try{
        const detail=await sb.rpc('get_friendly_game',{p_id:sid});
        if(!detail.error&&detail.data){
          const d=Array.isArray(detail.data)?detail.data[0]:detail.data;
          if(d)game=normaliseFriendlyGame(d);
        }
      }catch(e){}
    }

    // If the list RPC only returns a summary, try the table directly as a
    // fallback. This is harmless when RLS blocks it; the RPC route above
    // remains the normal path.
    if(sid && (!Array.isArray(game.hole_data)||game.hole_data.length!==18)){
      try{
        const q=await sb.from('friendly_games').select('*').eq('id',sid).maybeSingle();
        if(!q.error&&q.data)game=normaliseFriendlyGame(q.data);
      }catch(e){}
    }

    return game;
  }

  async function syncFriendlyGames(rounds,m){
    let added=0;
    let candidates=[];

    // Completed Friendly Games are deliberately excluded from the normal
    // Fixtures list. Use the dedicated completed-games RPC first.
    try{
      const completed=await sb.rpc('list_completed_friendly_games');
      if(!completed.error && Array.isArray(completed.data))
        candidates=completed.data;
    }catch(e){}

    // Keep the normal list as a fallback for installations where the new
    // completed-games RPC has not yet been added.
    if(!candidates.length){
      try{
        const result=await sb.rpc('list_friendly_games');
        if(!result.error && Array.isArray(result.data))
          candidates=result.data;
      }catch(e){}
    }

    // The list_friendly_games RPC is used by the Fixtures screen and can
    // intentionally omit completed games. Always also query the table for
    // games up to today, then merge the two sources by ID. This makes the
    // handicap tracker independent of the Fixtures list filtering.
    try{
      const today=new Date().toISOString().slice(0,10);
      const q=await sb.from('friendly_games')
        .select('*')
        .lte('game_date',today)
        .order('game_date',{ascending:false});
      if(!q.error&&Array.isArray(q.data)){
        const seen=new Set(candidates.map(x=>String(x?.id||x?.game_id||'')));
        q.data.forEach(g=>{
          const id=String(g?.id||g?.game_id||'');
          if(id&&!seen.has(id)){
            candidates.push(g);
            seen.add(id);
          }
        });
      }
    }catch(e){
      // If direct table access is unavailable, the RPC candidates above
      // remain usable.
    }

    for(const summary of candidates){
      const gid=String(summary?.id||summary?.game_id||'');
      if(!gid)continue;

      if(rounds.some(r=>r.source==='friendly'&&String(r.friendlyGameId)===gid))
        continue;

      const game=await getFriendlyGameRobust(summary);
      if(!game)continue;

      const players=Array.isArray(game.players)?game.players:[];
      const playerData=friendlyPlayerData(game);

      let pi=-1;
      const meId=String(m.id||m.member_id||'');
      const myName=String(m.full_name||m.name||'').trim().toLowerCase();

      pi=playerData.findIndex(p=>{
        const id=String(p?.memberId||p?.member_id||p?.member_uuid||'');
        const name=String(p?.name||'').trim().toLowerCase();
        return (id&&id===meId)||(name&&name===myName);
      });

      if(pi<0)
        pi=players.findIndex(n=>String(n||'').trim().toLowerCase()===myName);

      if(pi<0)continue;

      const pd=playerData[pi]||{name:players[pi]||m.full_name||m.name};
      const holes=jsonValue(game.hole_data,[]);
      if(!Array.isArray(holes)||holes.length!==18)continue;

      const scoreMap=friendlyScoreMap(game,pd,pi);
      const diff=friendlyRoundDiff(pd,scoreMap,holes,game);

      // Only import when this player's own 18-hole card is complete.
      if(!Number.isFinite(diff))continue;

      const course=game.course_name||game.course||summary.course_name||'Golf course';
      const format=game.format||summary.format||'Friendly Game';
      const date=game.game_date||game.date||game.completed_at||summary.game_date||summary.date||new Date().toISOString();

      rounds.push({
        diff:Math.round(diff*10)/10,
        source:'friendly',
        friendlyGameId:gid,
        friendlyName:'Friendly Game — '+course,
        friendlyFormat:format,
        date:date
      });

      added++;
    }

    return added;
  }

  async function syncRounds(){
    const m=getMember();
    const msg=document.getElementById('nlgsHcpSyncMsg');

    if(!m){
      if(msg)msg.textContent='Please log into NLGS first.';
      return;
    }

    if(typeof sb==='undefined'||!sb||typeof sb.rpc!=='function'){
      if(msg)msg.textContent='NLGS database connection is not ready.';
      return;
    }

    const btn=document.querySelector('#handicapTracker button[onclick="nlgsHcpSyncRounds()"]');
    if(btn){btn.disabled=true;btn.textContent='SYNCING…';}

    try{
      let rounds=getRounds();
      let competitionAdded=0;
      let friendlyAdded=0;

      // Existing competition import — unchanged in principle.
      const list=await sb.rpc('list_completed_competitions');
      if(list.error)throw list.error;

      const comps=Array.isArray(list.data)?list.data:[];

      for(const c of comps){
        const cid=String(c.id||c.competition_id||'');
        if(!cid)continue;

        if(rounds.some(r=>r.source==='competition'&&String(r.competitionId)===cid))
          continue;

        const detail=await sb.rpc('get_competition_scoring',{p_competition_id:cid});
        if(detail.error||!detail.data)continue;

        const data=detail.data;
        const comp=data.competition||c;
        const meId=String(m.id||m.member_id||'');
        const myName=String(m.full_name||m.name||'').trim().toLowerCase();

        const p=(data.players||[]).find(x=>{
          const mid=String(x.member_id||x.member_uuid||x.memberId||'');
          const nm=String(x.name||'').trim().toLowerCase();
          return (mid&&mid===meId)||(nm&&nm===myName);
        });

        if(!p)continue;

        const scores=(data.scores||[]).filter(
          s=>String(s.competition_player_id)===String(p.id)
        );

        if(scores.length<18)continue;

        const diff=courseRoundDiff(p,scores,data.holes||[],comp);
        if(!Number.isFinite(diff))continue;

        rounds.push({
          diff:Math.round(diff*10)/10,
          source:'competition',
          competitionId:cid,
          competitionName:comp.name||c.name||'NLGS competition',
          date:comp.completed_at||comp.date||c.completed_at||c.date||new Date().toISOString()
        });

        competitionAdded++;
      }

      // New: Friendly Game import.
      try{
        friendlyAdded=await syncFriendlyGames(rounds,m);
      }catch(e){
        // Friendly sync must never stop the working competition sync.
        console.warn('Friendly Game handicap sync skipped:',e);
      }

      rounds.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      saveRounds(rounds);

      const messages=[];
      if(competitionAdded)
        messages.push(competitionAdded+' competition round'+(competitionAdded===1?'':'s'));
      if(friendlyAdded)
        messages.push(friendlyAdded+' friendly game'+(friendlyAdded===1?'':'s'));

      if(msg)
        msg.textContent=messages.length
          ?messages.join(' and ')+' imported.'
          :'No new completed rounds to import.';

      render();
    }catch(e){
      if(msg)msg.textContent='Sync failed: '+String(e.message||e).slice(0,160);
    }finally{
      if(btn){
        btn.disabled=false;
        btn.textContent='SYNC COMPLETED ROUNDS';
      }
    }
  }

  window.nlgsHcpRender=render;
  window.nlgsHcpSyncRounds=syncRounds;

  window.nlgsHcpAddRound=function(){
    const m=getMember();
    const i=document.getElementById('nlgsHcpDiff');
    const msg=document.getElementById('nlgsHcpMsg');
    const v=parseFloat(i?i.value:'');

    if(!m){
      if(msg)msg.textContent='Please log into NLGS first.';
      return;
    }

    if(!Number.isFinite(v)){
      if(msg)msg.textContent='Enter a score differential.';
      return;
    }

    const r=getRounds();
    r.push({
      diff:Math.round(v*10)/10,
      source:'manual',
      date:new Date().toISOString()
    });

    saveRounds(r);

    if(i)i.value='';
    if(msg)msg.textContent='Round added for '+(m.full_name||m.name)+'.';
    render();
  };

  window.nlgsHcpClearRounds=function(){
    const m=getMember();
    if(!m)return;

    if(!confirm('Clear all handicap rounds for '+(m.full_name||m.name)+'?'))return;

    const d=getAll();
    delete d[memberKey()];
    saveAll(d);

    const msg=document.getElementById('nlgsHcpMsg');
    if(msg)msg.textContent='Rounds cleared.';
    render();
  };

  let autoSyncStarted=false;

  function autoSyncOnAppOpen(){
    if(autoSyncStarted)return;
    const startedAt=Date.now();

    function trySync(){
      if(autoSyncStarted)return;

      const member=getMember();
      const ready=(member && typeof sb!=='undefined' && sb && typeof sb.rpc==='function');

      if(ready){
        autoSyncStarted=true;
        // Run once when the app opens. The normal sync duplicate protection
        // prevents an already-imported competition or Friendly Game being
        // added again.
        setTimeout(()=>{
          try{ window.nlgsHcpSyncRounds(); }catch(e){}
        },500);
        return;
      }

      // Give the main app/login a few seconds to finish initialising.
      if(Date.now()-startedAt<10000){
        setTimeout(trySync,500);
      }
    }

    trySync();
  }

  function install(){
    addStyles();
    buildSection();
    addHomeTile();
    addMyGolfButton();
    migrateOld();

    if(typeof window.show==='function'&&!window.nlgsHcpShowWrappedV3){
      const originalShow=window.show;
      window.show=function(id){
        originalShow(id);
        if(id==='handicapTracker'||id==='mygolf')
          setTimeout(render,0);
      };
      window.nlgsHcpShowWrappedV3=true;
    }

    render();

    // Automatically sync completed competitions and Friendly Games when the
    // NLGS app opens, once the logged-in member and Supabase connection are ready.
    autoSyncOnAppOpen();
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',install);
  else
    install();

})();
