/* NLGS Handicap Tracker v2
   Automatic import of completed NLGS competition rounds.
*/
(function(){
  'use strict';
  const KEY='nlgsHandicapTrackerV2';
  const OLD_KEY='nlgsHandicapTrackerV1';

  function getMember(){try{return JSON.parse(sessionStorage.getItem('nlgsMember')||'null');}catch(e){return null;}}
  function memberKey(){const m=getMember();return String((m&&m.id)||((m&&m.full_name)||'').trim()||'unknown').trim();}
  function getAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
  function saveAll(d){localStorage.setItem(KEY,JSON.stringify(d));}
  function getRounds(){
    const d=getAll(), k=memberKey();
    let r=Array.isArray(d[k])?d[k]:[];
    return r.map(x=>typeof x==='number'?{diff:x,source:'manual'}:x).filter(x=>x&&Number.isFinite(Number(x.diff))).map(x=>({...x,diff:Number(x.diff)}));
  }
  function saveRounds(r){const d=getAll();d[memberKey()]=r;saveAll(d);}
  function fmt(n){return Number.isFinite(n)?n.toFixed(1):'—';}
  function addStyles(){
    if(document.getElementById('nlgsHandicapTrackerStylesV2'))return;
    const s=document.createElement('style');s.id='nlgsHandicapTrackerStylesV2';
    s.textContent='.nlgs-hcp-stat{background:#f8faf7;border-radius:12px;padding:12px}.nlgs-hcp-stat b{display:block;font-size:21px;color:var(--green);margin-top:4px}';
    document.head.appendChild(s);
  }
  function buildSection(){
    if(document.getElementById('handicapTracker'))return;
    const section=document.createElement('section');section.id='handicapTracker';section.className='screen';
    section.innerHTML=`
      <div class="hero"><div class="sub">NLGS HANDICAP</div><h1>Handicap Tracker</h1><p>Ability-based NLGS handicap</p></div>
      <div class="card"><div class="label">PLAYER</div><div class="big" id="nlgsHcpPlayer" style="margin-top:5px">—</div><div class="small">This tracker is tied automatically to the logged-in NLGS member.</div></div>
      <div class="card"><div class="label">CURRENT NLGS HANDICAP</div><div class="grid2" style="margin-top:10px">
        <div class="nlgs-hcp-stat"><span class="small">Best 8 of last 20</span><b id="nlgsHcpForm">—</b></div>
        <div class="nlgs-hcp-stat"><span class="small">Best last 15</span><b id="nlgsHcpAbility">—</b></div>
        <div class="nlgs-hcp-stat"><span class="small">Ability limit (+5)</span><b id="nlgsHcpLimit">—</b></div>
        <div class="nlgs-hcp-stat"><span class="small">NLGS Handicap</span><b id="nlgsHcpValue">—</b></div>
      </div></div>
      <div class="card"><div class="label">NLGS ROUND SYNC</div>
        <div class="small" style="line-height:1.5;margin-top:8px">Completed NLGS competition rounds can be imported automatically for the logged-in player.</div>
        <button class="btn" style="margin-top:10px" onclick="nlgsHcpSyncRounds()">SYNC COMPLETED ROUNDS</button>
        <div id="nlgsHcpSyncMsg" class="small" style="margin-top:8px"></div>
      </div>
      <div class="card"><div class="label">ADD SCORE DIFFERENTIAL</div>
        <div style="margin-top:8px"><input id="nlgsHcpDiff" class="input" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 12.4"></div>
        <button class="btn" style="margin-top:10px" onclick="nlgsHcpAddRound()">ADD ROUND</button>
        <div id="nlgsHcpMsg" class="small" style="margin-top:8px"></div>
      </div>
      <div class="card"><div class="row"><div class="label">ROUND HISTORY</div><button class="btn secondary" style="width:auto;padding:8px 10px" onclick="nlgsHcpClearRounds()">CLEAR</button></div>
        <div id="nlgsHcpHistory" style="max-height:360px;overflow:auto;margin-top:8px">No rounds recorded.</div>
      </div>
      <div class="card"><div class="label">NLGS HANDICAP RULES</div><div class="small" style="line-height:1.65;margin-top:8px">
        • Current form = average of the best 8 Score Differentials from the last 20 rounds.<br>
        • Demonstrated ability = best Score Differential from the last 15 rounds.<br>
        • Ability limit = demonstrated ability + 5 shots.<br>
        • NLGS Handicap = the lower of current form and the ability limit.<br>
        • Demonstrated ability moves with the most recent 15 rounds.
      </div></div>
      <button class="btn secondary" onclick="show('mygolf')">BACK TO MY GOLF</button>`;
    const builder=document.getElementById('competitionBuilder'),main=document.querySelector('main');
    if(builder)builder.parentNode.insertBefore(section,builder);else if(main)main.appendChild(section);
  }
  function addHomeTile(){
    if(document.getElementById('nlgsHandicapHomeTile'))return;
    const t=document.querySelector(".tile[onclick=\"show('mygolf')\"]");if(!t||!t.parentNode)return;
    const tile=document.createElement('button');tile.id='nlgsHandicapHomeTile';tile.className='tile';tile.setAttribute('onclick',"show('handicapTracker')");
    tile.innerHTML='📊<b>Handicap Tracker</b><span>NLGS ability handicap</span>';t.parentNode.insertBefore(tile,t.nextSibling);
  }
  function addMyGolfButton(){
    if(document.getElementById('nlgsHandicapMyGolfButton'))return;
    const g=document.getElementById('mygolf');if(!g)return;
    const b=document.createElement('button');b.id='nlgsHandicapMyGolfButton';b.className='btn';b.textContent='OPEN HANDICAP TRACKER';b.onclick=()=>show('handicapTracker');g.appendChild(b);
  }
  function calculate(){
    const r=getRounds(),last20=r.slice(-20),last15=r.slice(-15);
    const best8=last20.slice().sort((a,b)=>a.diff-b.diff).slice(0,8).map(x=>x.diff);
    const form=best8.length?best8.reduce((a,b)=>a+b,0)/best8.length:NaN;
    const ability=last15.length?Math.min(...last15.map(x=>x.diff)):NaN;
    const limit=Number.isFinite(ability)?ability+5:NaN;
    const handicap=Number.isFinite(form)&&Number.isFinite(limit)?Math.min(form,limit):(Number.isFinite(form)?form:limit);
    return {r,form,ability,limit,handicap};
  }
  function render(){
    const m=getMember(), x=calculate();
    const p=document.getElementById('nlgsHcpPlayer');if(p)p.textContent=(m&&(m.full_name||m.name))||'Logged-in member';
    [['nlgsHcpForm',x.form],['nlgsHcpAbility',x.ability],['nlgsHcpLimit',x.limit],['nlgsHcpValue',x.handicap]].forEach(a=>{const e=document.getElementById(a[0]);if(e)e.textContent=fmt(a[1]);});
    const mh=document.getElementById('myGolfHcp');if(mh)mh.textContent=fmt(x.handicap);
    const h=document.getElementById('nlgsHcpHistory');
    if(h)h.innerHTML=x.r.length?x.r.slice().reverse().map((v,i)=>{
      const label=v.source==='competition'?(v.competitionName||'NLGS competition'):'Manual entry';
      return '<div style="padding:9px 0;border-bottom:1px solid var(--line)"><b>Round '+(x.r.length-i)+'</b> — Score Differential <b>'+fmt(v.diff)+'</b><br><span class="small">'+label+'</span></div>';
    }).join(''):'No rounds recorded.';
  }
  function migrateOld(){
    try{
      const old=JSON.parse(localStorage.getItem(OLD_KEY)||'{}'),k=memberKey();
      if(!old||!Array.isArray(old[k]))return;
      const d=getAll();if(Array.isArray(d[k])&&d[k].length)return;
      d[k]=old[k].map(v=>({diff:Number(v),source:'manual'})).filter(x=>Number.isFinite(x.diff));saveAll(d);
    }catch(e){}
  }

  function courseRoundDiff(player,scores,holes,c){
    let gross=0, adjusted=0, courseHcp=Number(player.handicap_index);
    if(!Number.isFinite(courseHcp))courseHcp=Number(player.handicap||0);
    courseHcp=Math.round(courseHcp*(Number(c.slope_rating||113)/113)+(Number(c.course_rating||c.par||0)-Number(c.par||0)));
    const ordered=holes.slice().sort((a,b)=>Number(a.hole_no)-Number(b.hole_no));
    const strokesByHole={};scores.forEach(s=>{strokesByHole[String(s.hole_no)]=Number(s.strokes);});
    const extra=Math.max(0,courseHcp);
    const shotHoles=[];
    if(extra>0){const base=Math.floor(extra/18),rem=extra%18;ordered.forEach(h=>shotHoles.push(base+(Number(h.stroke_index)<=rem?1:0)));}
    else ordered.forEach(()=>shotHoles.push(0));
    ordered.forEach((h,i)=>{
      const s=strokesByHole[String(h.hole_no)];
      if(Number.isFinite(s)){gross+=s;const max=Number(h.par)+2+shotHoles[i];adjusted+=Math.min(s,max);}
    });
    const cr=Number(c.course_rating),slope=Number(c.slope_rating);
    if(!Number.isFinite(cr)||!Number.isFinite(slope)||slope<=0||adjusted<=0)return NaN;
    return (113/slope)*(adjusted-cr);
  }

  async function syncRounds(){
    const m=getMember(),msg=document.getElementById('nlgsHcpSyncMsg');
    if(!m){if(msg)msg.textContent='Please log into NLGS first.';return;}
    if(typeof sb==='undefined'||!sb||typeof sb.rpc!=='function'){if(msg)msg.textContent='NLGS database connection is not ready.';return;}
    const btn=document.querySelector('#handicapTracker button[onclick="nlgsHcpSyncRounds()"]');if(btn){btn.disabled=true;btn.textContent='SYNCING…';}
    try{
      const list=await sb.rpc('list_completed_competitions');
      if(list.error)throw list.error;
      const comps=list.data||[];
      let rounds=getRounds(),added=0,skipped=0;
      for(const c of comps){
        const cid=String(c.id||c.competition_id||'');
        if(!cid||rounds.some(r=>r.source==='competition'&&String(r.competitionId)===cid)){skipped++;continue;}
        const detail=await sb.rpc('get_competition_scoring',{p_competition_id:cid});
        if(detail.error||!detail.data)continue;
        const data=detail.data, comp=data.competition||c;
        const meId=String(m.id||m.member_id||'');
        const p=(data.players||[]).find(x=>{
          const mid=String(x.member_id||x.member_uuid||x.memberId||'');
          return (mid&&mid===meId)||String(x.name||'').trim().toLowerCase()===String(m.full_name||m.name||'').trim().toLowerCase();
        });
        if(!p)continue;
        const scores=(data.scores||[]).filter(s=>String(s.competition_player_id)===String(p.id));
        if(scores.length<18)continue;
        const diff=courseRoundDiff(p,scores,data.holes||[],comp);
        if(!Number.isFinite(diff))continue;
        rounds.push({diff:Math.round(diff*10)/10,source:'competition',competitionId:cid,competitionName:comp.name||c.name||'NLGS competition',date:comp.completed_at||comp.date||c.completed_at||c.date||new Date().toISOString()});
        added++;
      }
      rounds.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      saveRounds(rounds);
      if(msg)msg.textContent=added?added+' completed NLGS round'+(added===1?'':'s')+' imported.':'No new completed rounds to import.';
      render();
    }catch(e){
      if(msg)msg.textContent='Sync failed: '+String(e.message||e).slice(0,120);
    }finally{if(btn){btn.disabled=false;btn.textContent='SYNC COMPLETED ROUNDS';}}
  }
  window.nlgsHcpRender=render;
  window.nlgsHcpSyncRounds=syncRounds;
  window.nlgsHcpAddRound=function(){
    const m=getMember(),i=document.getElementById('nlgsHcpDiff'),msg=document.getElementById('nlgsHcpMsg'),v=parseFloat(i?i.value:'');
    if(!m){if(msg)msg.textContent='Please log into NLGS first.';return;}
    if(!Number.isFinite(v)){if(msg)msg.textContent='Enter a score differential.';return;}
    const r=getRounds();r.push({diff:Math.round(v*10)/10,source:'manual',date:new Date().toISOString()});saveRounds(r);
    if(i)i.value='';if(msg)msg.textContent='Round added for '+(m.full_name||m.name)+'.';render();
  };
  window.nlgsHcpClearRounds=function(){
    const m=getMember();if(!m)return;
    if(!confirm('Clear all handicap rounds for '+(m.full_name||m.name)+'?'))return;
    const d=getAll();delete d[memberKey()];saveAll(d);
    const msg=document.getElementById('nlgsHcpMsg');if(msg)msg.textContent='Rounds cleared.';render();
  };
  function install(){
    addStyles();buildSection();addHomeTile();addMyGolfButton();migrateOld();
    if(typeof window.show==='function'&&!window.nlgsHcpShowWrappedV2){
      const originalShow=window.show;window.show=function(id){originalShow(id);if(id==='handicapTracker'||id==='mygolf')setTimeout(render,0);};window.nlgsHcpShowWrappedV2=true;
    }
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
