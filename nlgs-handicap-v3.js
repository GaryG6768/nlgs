/* NLGS Handicap Tracker v3.1
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
  const m=getMember();

  if(String(m&& (m.id||m.member_id) || '')==='39e93d56-4904-4287-85d0-06a9b0568898'){
    r=r.filter(x=>{
      const name=String(x&&x.competitionName||'').toLowerCase();
      const date=String(x&&x.date||'').slice(0,10);

      return !(name.includes('barnham') &&
               date==='2026-09-14' &&
               Number(x.diff)===23.3);
    });
  }
if(String(m && (m.id||m.member_id) || '')==='776a7e18-c032-42b0-a9ca-57a56a8531c6'){
  r=r.filter(x=>{
    const name=String(x&&x.competitionName||'').toLowerCase();
    const date=String(x&&x.date||'').slice(0,10);
    return !(name.includes('barnham') &&
             date==='2026-09-14' &&
             Number(x.diff)===15.9);
  });
}
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
  <label class="label" style="display:block;margin-bottom:6px">DATE</label>
  <input id="nlgsHcpDate" class="input" type="date">
</div>

<div style="margin-top:10px">
  <label class="label" style="display:block;margin-bottom:6px">SCORE DIFFERENTIAL</label>
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

  // My Golf player and handicap
  const name=document.getElementById('myGolfName');
  if(name)name.textContent=(m&&(m.full_name||m.name))||'Member';

  const mh=document.getElementById('myGolfHcp');
  if(mh)mh.textContent=fmt(x.handicap);

  // My Golf statistics
  const roundsEl=document.getElementById('myGolfRounds');
  const averageEl=document.getElementById('myGolfAverage');
  const bestEl=document.getElementById('myGolfBest');
  const lastEl=document.getElementById('myGolfLast');

  if(roundsEl)roundsEl.textContent=String(x.r.length);

  if(x.r.length){
    const diffs=x.r.map(r=>Number(r.diff)).filter(Number.isFinite);
    const average=diffs.length
      ?diffs.reduce((a,b)=>a+b,0)/diffs.length
      :NaN;
    const best=diffs.length?Math.min(...diffs):NaN;
    const last=diffs.length?diffs[diffs.length-1]:NaN;

    if(averageEl)averageEl.textContent=fmt(average);
    if(bestEl)bestEl.textContent=fmt(best);
    if(lastEl)lastEl.textContent=fmt(last);
  }else{
    if(averageEl)averageEl.textContent='—';
    if(bestEl)bestEl.textContent='—';
    if(lastEl)lastEl.textContent='—';
  }

  // Recent results
  const recent=document.getElementById('myGolfRecent');

  if(recent){
    if(!x.r.length){
      recent.textContent='No rounds recorded.';
    }else{
      recent.innerHTML=x.r.slice().reverse().slice(0,5).map((v,i)=>{
        let label='Manual entry';

        if(v.source==='competition')
          label=v.competitionName||'NLGS competition';

        if(v.source==='friendly')
          label=v.friendlyName||v.competitionName||'Friendly Game';
if(v.source==='individual')
  label=v.competitionName||'Individual Competition';
        let date='';
        if(v.date){
          const d=new Date(v.date);
          if(!isNaN(d.getTime()))
            date=d.toLocaleDateString('en-GB');
        }

        return '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)">' +
          '<div><b>'+label+'</b><br>' +
          '<span class="small">'+date+'</span></div>' +
          '<b>'+fmt(v.diff)+'</b>' +
          '</div>';
      }).join('');
    }
  }

  const h=document.getElementById('nlgsHcpHistory');
  if(!h)return;

  h.innerHTML=x.r.length
    ?x.r.slice().reverse().map((v,i)=>{
      let label='Manual entry';

      if(v.source==='competition')
        label=v.competitionName||'NLGS competition';

      if(v.source==='friendly')
        label=v.friendlyName||v.competitionName||'Friendly Game';
if(v.source==='individual')
  label=v.competitionName||'Individual Competition';
      const actualIndex=x.r.length-1-i;

const roundDate=v.date
  ? new Date(v.date).toLocaleDateString('en-GB')
  : '';

return '<div style="padding:9px 0;border-bottom:1px solid #ddd">' +
'<div style="display:flex;justify-content:space-between">' +
'<div><b>Round '+(x.r.length-i)+'</b> — Score Differential '+fmt(v.diff)+'<br>' +
'<span class="small">'+label+'</span>' +
(roundDate ? '<br><span class="small">'+roundDate+'</span>' : '') +
'</div>' +
'<button class="btn secondary" style="width:auto;padding:8px 10px" onclick="nlgsHcpRemoveRound('+actualIndex+')">CLEAR</button>' +
'</div></div>';
      
    }).join('')
    :'No rounds recorded.';
}
   function correctKnownRoundDates(){
  const rounds=getRounds();
  let changed=false;

  rounds.forEach(r=>{
    const comp=String(r.competitionName||'').toLowerCase();
    const friendly=String(r.friendlyName||'').toLowerCase();
    const label=comp+' '+friendly;
    const currentDate=String(r.date||'').slice(0,10);

    if(label.includes('barnham') && currentDate!=='2026-09-14'){
      r.date='2026-09-14T12:00:00';
      changed=true;
    }
  });

  if(changed){
    rounds.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    saveRounds(rounds);
  }
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


  function friendlyRoundStats(pd,scoreMap,holes,game){
    let gross=0, points=0, playingHcp=Number(pd?.playingHandicap);
    if(!Number.isFinite(playingHcp)) playingHcp=Number(pd?.playing_handicap);
    if(!Number.isFinite(playingHcp)) playingHcp=Number(pd?.courseHandicap);
    if(!Number.isFinite(playingHcp)) playingHcp=Number(pd?.course_handicap);
    if(!Number.isFinite(playingHcp)) playingHcp=0;

    const base=Math.floor(Math.max(0,playingHcp)/18);
    const rem=Math.max(0,playingHcp)%18;

    for(const h of holes){
      let v=scoreMap[String(h.hole_no)];
      if(v==null)v=scoreMap[h.hole_no];
      const sc=Number(v);
      const par=Number(h.par);
      const si=Number(h.stroke_index);
      if(!Number.isFinite(sc)||!Number.isFinite(par))continue;
      gross+=sc;
      const shots=base+(Number.isFinite(si)&&si<=rem?1:0);
      const net=sc-shots;
      points+=Math.max(0,2-(net-par));
    }

    return {
      gross,
      playingHcp,
      net:gross-playingHcp,
      stableford:points
    };
  }

  async function syncFriendlyGames(rounds,m){
    let added=0;
    let candidates=[];

    try{
      const completed=await sb.rpc('list_completed_friendly_games');
      if(!completed.error && Array.isArray(completed.data)) candidates=completed.data;
    }catch(e){}

    try{
      const result=await sb.rpc('list_friendly_games');
      if(!result.error && Array.isArray(result.data)){
        const seen=new Set(candidates.map(x=>String(x?.id||x?.game_id||'')));
        result.data.forEach(g=>{
          const id=String(g?.id||g?.game_id||'');
          if(id&&!seen.has(id)){candidates.push(g);seen.add(id);}
        });
      }
    }catch(e){}

    try{
      const today=new Date().toISOString().slice(0,10);
      const q=await sb.from('friendly_games').select('*').eq('status','complete').lte('game_date',today).order('game_date',{ascending:false});
      if(!q.error&&Array.isArray(q.data)){
        const seen=new Set(candidates.map(x=>String(x?.id||x?.game_id||'')));
        q.data.forEach(g=>{
          const id=String(g?.id||g?.game_id||'');
          if(id&&!seen.has(id)){candidates.push(g);seen.add(id);}
        });
      }
    }catch(e){}

    for(const summary of candidates){
      const gid=String(summary?.id||summary?.game_id||'');
      if(!gid)continue;

      const existing=rounds.find(r=>r.source==='friendly'&&String(r.friendlyGameId)===gid);
      const game=await getFriendlyGameRobust(summary);
      if(!game)continue;
      if(!game)continue;

      const players=Array.isArray(game.players)?game.players:[];
      const playerData=friendlyPlayerData(game);
      const meId=String(m.id||m.member_id||'');
      const myName=String(m.full_name||m.name||'').trim().toLowerCase();

      let pi=playerData.findIndex(p=>{
        const id=String(p?.memberId||p?.member_id||p?.member_uuid||'');
        const name=String(p?.name||'').trim().toLowerCase();
        return (id&&id===meId)||(name&&name===myName);
      });
      if(pi<0)pi=players.findIndex(n=>String(n||'').trim().toLowerCase()===myName);
      if(pi<0)continue;

      const pd=playerData[pi]||{name:players[pi]||m.full_name||m.name};
      const scoreMap=friendlyScoreMap(game,pd,pi);
      const holes=jsonValue(game.hole_data,[]);
      if(!Array.isArray(holes)||holes.length!==18)continue;

      let validScores=0;
      for(const h of holes){
        let v=scoreMap[String(h.hole_no)];
        if(v==null)v=scoreMap[h.hole_no];
        if(Number.isFinite(Number(v))&&Number(v)>=1)validScores++;
      }
      if(validScores!==18)continue;

      const diff=friendlyRoundDiff(pd,scoreMap,holes,game);
      if(!Number.isFinite(diff))continue;

      const course=game.course_name||game.course||summary.course_name||'Golf course';
      const format=game.format||summary.format||'Friendly Game';
      const date=game.game_date||game.date||game.completed_at||summary.game_date||summary.date||new Date().toISOString();

      const stats=friendlyRoundStats(pd,scoreMap,holes,game);

      if(existing){
        existing.diff=Math.round(diff*10)/10;
        existing.friendlyName='Friendly Game — '+course;
        existing.friendlyFormat=format;
        existing.date=date;
        existing.gross=stats.gross;
        existing.net=stats.net;
        existing.stableford=stats.stableford;
        existing.playingHcp=stats.playingHcp;
        continue;
      }

      rounds.push({
        diff:Math.round(diff*10)/10,
        source:'friendly',
        friendlyGameId:gid,
        friendlyName:'Friendly Game — '+course,
        friendlyFormat:format,
        date:date,
        gross:stats.gross,
        net:stats.net,
        stableford:stats.stableford,
        playingHcp:stats.playingHcp
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

// Roger's Barnham 2 result is already recorded correctly as 22.4.
// Do not import the automatic Barnham calculation, which produces 23.3.
const isRoger = String(m.id||m.member_id||'') ===
  '39e93d56-4904-4287-85d0-06a9b0568898';

const isBarnham =
  String(comp.name||'').toLowerCase().includes('barnham');

const compDate =
  String(comp.competition_date||comp.date||'').slice(0,10);

if(isRoger && isBarnham && compDate==='2026-09-14'){
  continue;
}

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
      // Roger's Barnham 2 correction.
      // The original competition import incorrectly produces 23.3.
      // The genuine round is the 22.4 manual entry dated 14/09/2026.
      if(String(m.id||m.member_id||'')==='39e93d56-4904-4287-85d0-06a9b0568898'){
        rounds=rounds.filter(r=>{
          const name=String(r.competitionName||'').toLowerCase();
          const date=String(r.date||'').slice(0,10);

          if(name.includes('barnham') &&
             date==='2026-09-14' &&
             Number(r.diff)===23.3){
            return false;
          }

          return true;
        });
      }
      // New: Friendly Game import.
       
      // Import completed Individual Competition rounds.
      try{
        const individualResult=await sb.rpc(
          'list_completed_individual_competition_rounds',
          {p_member_id:m.id}
        );

        if(!individualResult.error &&
           Array.isArray(individualResult.data)){

          for(const item of individualResult.data){
             const testCompetitionIds=[
  'd7b3eb3e-6d0c-4715-999d-4aca51fc61b4',
  '2edcb886-1fda-4b40-a3cc-efcec090d95b'
];

if(testCompetitionIds.includes(
  String(item.individual_competition_id||'')
))continue;
            const roundId=String(item.round_id||'');
            const comp=item.competition||{};
            const player=item.player||{};
            const scores=item.scores||[];
            const holes=item.holes||[];

            if(!roundId || scores.length!==18 || holes.length!==18)
              continue;

            const diff=courseRoundDiff(
              player,scores,holes,comp
            );

            if(!Number.isFinite(diff))continue;

            const existing=rounds.find(r=>
              r.source==='individual' &&
              String(r.individualCompetitionRoundId||'')===roundId
            );

            const entry={
              diff:Math.round(diff*10)/10,
              source:'individual',
              individualCompetitionRoundId:roundId,
              individualCompetitionId:item.individual_competition_id,
              competitionName:
                String(comp.name||'Individual Competition')+
                ' — Round '+item.round_no,
              date:comp.round_date,
              gross:scores.reduce((sum,s)=>sum+Number(s.strokes||0),0)
            };

            if(existing){
              Object.assign(existing,entry);
            }else{
              rounds.push(entry);
              competitionAdded++;
            }
          }
        }else if(individualResult.error){
          console.warn(
            'Individual Competition import skipped:',
            individualResult.error
          );
        }
      }catch(e){
        console.warn(
          'Individual Competition import skipped:',
          e
        );
      }

      try{
        friendlyAdded=await syncFriendlyGames(rounds,m);
      }catch(e){
        // Friendly sync must never stop the working competition sync.
        console.warn('Friendly Game handicap sync skipped:',e);
      }
      // Final Barnham 2 correction for Roger.
      if(String(m.id||m.member_id||'')==='39e93d56-4904-4287-85d0-06a9b0568898'){
        rounds=rounds.filter(r=>{
          const name=String(r.competitionName||'').toLowerCase();
          const date=String(r.date||'').slice(0,10);

          return !(name.includes('barnham') &&
                   date==='2026-09-14' &&
                   Number(r.diff)===23.3);
        });
      }
      rounds.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      saveRounds(rounds);
correctKnownRoundDates();
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
  const dateInput=document.getElementById('nlgsHcpDate');
  const msg=document.getElementById('nlgsHcpMsg');
  const v=parseFloat(i?i.value:'');
  const dateValue=dateInput?dateInput.value:'';

  if(!m){
    if(msg)msg.textContent='Please log into NLGS first.';
    return;
  }

  if(!Number.isFinite(v)){
    if(msg)msg.textContent='Enter a score differential.';
    return;
  }

  if(!dateValue){
    if(msg)msg.textContent='Please enter the round date.';
    return;
  }

  const r=getRounds();
  r.push({
    diff:Math.round(v*10)/10,
    source:'manual',
    date:dateValue+'T12:00:00'
  });

  r.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  saveRounds(r);

  if(i)i.value='';
  if(msg)msg.textContent='Round added for '+(m.full_name||m.name)+'.';
  render();
};

    

    

  window.nlgsHcpRemoveRound=function(index){
    const m=getMember();
    if(!m)return;

    const rounds=getRounds();
    if(index<0||index>=rounds.length)return;

    const round=rounds[index];
    const label=round.friendlyName||round.competitionName||
      (round.source==='manual'?'Manual entry':'Round');
    if(!confirm('Clear Round '+(index+1)+' — '+label+'?'))return;

    rounds.splice(index,1);
    saveRounds(rounds);

    const msg=document.getElementById('nlgsHcpMsg');
    if(msg)msg.textContent='Round cleared.';
    render();
  };

  function install(){
    addStyles();
    buildSection();
    addHomeTile();
    addMyGolfButton();
    migrateOld();
correctKnownRoundDates();
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

    // Automatically sync after the player has actually logged in.
    // The handicap script can load before login, so a one-off timer is not
    // reliable. Hook the main app's openApp() and keep a short fallback.
    if(!window.nlgsHcpAutoSyncHooked){
      window.nlgsHcpAutoSyncHooked=true;

      const runAutoSync=()=>{
        if(getMember()&&typeof window.nlgsHcpSyncRounds==='function'){
          setTimeout(()=>{
            try{ window.nlgsHcpSyncRounds(); }catch(e){}
          },400);
        }
      };

      // The main NLGS login calls openApp(member). This runs immediately
      // after a successful login, when nlgsMember is already stored.
      const wrapOpenApp=()=>{
        if(typeof window.openApp==='function'&&!window.nlgsHcpOpenAppWrapped){
          const originalOpenApp=window.openApp;
          window.openApp=function(m){
            const result=originalOpenApp.apply(this,arguments);
            setTimeout(runAutoSync,250);
            return result;
          };
          window.nlgsHcpOpenAppWrapped=true;
          return true;
        }
        return false;
      };

      wrapOpenApp();

      // Fallback for an already logged-in session or if openApp was not
      // available at the instant this script loaded.
      let attempts=0;
      const retry=setInterval(()=>{
        attempts++;
        wrapOpenApp();
        if(getMember()){
          runAutoSync();
          clearInterval(retry);
        }else if(attempts>=60){
          clearInterval(retry);
        }
      },500);

      // Re-sync when the app returns to the foreground.
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')runAutoSync();
      });
      window.addEventListener('pageshow',runAutoSync);
    }
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',install);
  else
    install();

})();
