/* NLGS Handicap Tracker v1
   Integrated add-on for the live NLGS app.
   It injects the tracker into the existing app and keeps handicap data
   tied to the logged-in NLGS member.
*/
(function(){
  'use strict';

  const KEY = 'nlgsHandicapTrackerV1';

  function getMember(){
    try { return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null'); }
    catch(e){ return null; }
  }

  function memberKey(){
    const m = getMember();
    return String((m && m.id) || ((m && m.full_name) || '').trim() || 'unknown').trim();
  }

  function getAll(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch(e){ return {}; }
  }

  function saveAll(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getRounds(){
    const data = getAll();
    const key = memberKey();
    return Array.isArray(data[key]) ? data[key] : [];
  }

  function fmt(n){
    return Number.isFinite(n) ? n.toFixed(1) : '—';
  }

  function addStyles(){
    if(document.getElementById('nlgsHandicapTrackerStyles')) return;
    const style = document.createElement('style');
    style.id = 'nlgsHandicapTrackerStyles';
    style.textContent = `
      .nlgs-hcp-stat{background:#f8faf7;border-radius:12px;padding:12px}
      .nlgs-hcp-stat b{display:block;font-size:21px;color:var(--green);margin-top:4px}
    `;
    document.head.appendChild(style);
  }

  function buildSection(){
    if(document.getElementById('handicapTracker')) return;

    const section = document.createElement('section');
    section.id = 'handicapTracker';
    section.className = 'screen';
    section.innerHTML = `
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

      <button class="btn secondary" onclick="show('mygolf')">BACK TO MY GOLF</button>
    `;

    const builder = document.getElementById('competitionBuilder');
    const main = document.querySelector('main');
    if(builder) builder.parentNode.insertBefore(section, builder);
    else if(main) main.appendChild(section);
  }

  function addHomeTile(){
    if(document.getElementById('nlgsHandicapHomeTile')) return;
    const myGolfTile = document.querySelector(".tile[onclick=\"show('mygolf')\"]");
    if(!myGolfTile || !myGolfTile.parentNode) return;

    const tile = document.createElement('button');
    tile.id = 'nlgsHandicapHomeTile';
    tile.className = 'tile';
    tile.setAttribute('onclick', "show('handicapTracker')");
    tile.innerHTML = '📊<b>Handicap Tracker</b><span>NLGS ability handicap</span>';
    myGolfTile.parentNode.insertBefore(tile, myGolfTile.nextSibling);
  }

  function addMyGolfButton(){
    if(document.getElementById('nlgsHandicapMyGolfButton')) return;
    const myGolf = document.getElementById('mygolf');
    if(!myGolf) return;
    const btn = document.createElement('button');
    btn.id = 'nlgsHandicapMyGolfButton';
    btn.className = 'btn';
    btn.textContent = 'OPEN HANDICAP TRACKER';
    btn.onclick = function(){ show('handicapTracker'); };
    myGolf.appendChild(btn);
  }

  function render(){
    const m = getMember();
    const rounds = getRounds();
    const last20 = rounds.slice(-20);
    const last15 = rounds.slice(-15);

    const player = document.getElementById('nlgsHcpPlayer');
    if(player) player.textContent = (m && (m.full_name || m.name)) || 'Logged-in member';

    const best8 = last20.slice().sort((a,b)=>a-b).slice(0,8);
    const form = best8.length ? best8.reduce((a,b)=>a+b,0)/best8.length : NaN;
    const ability = last15.length ? Math.min(...last15) : NaN;
    const limit = Number.isFinite(ability) ? ability + 5 : NaN;
    const handicap = Number.isFinite(form) && Number.isFinite(limit)
      ? Math.min(form, limit)
      : (Number.isFinite(form) ? form : limit);

    const set = (id,value) => {
      const el = document.getElementById(id);
      if(el) el.textContent = fmt(value);
    };

    set('nlgsHcpForm', form);
    set('nlgsHcpAbility', ability);
    set('nlgsHcpLimit', limit);
    set('nlgsHcpValue', handicap);

    const myGolfHcp = document.getElementById('myGolfHcp');
    if(myGolfHcp) myGolfHcp.textContent = fmt(handicap);

    const history = document.getElementById('nlgsHcpHistory');
    if(history){
      history.innerHTML = rounds.length
        ? rounds.slice().reverse().map((v,i) =>
            '<div style="padding:9px 0;border-bottom:1px solid var(--line)">' +
            '<b>Round ' + (rounds.length-i) + '</b> — Score Differential <b>' +
            fmt(v) + '</b></div>'
          ).join('')
        : 'No rounds recorded.';
    }
  }

  window.nlgsHcpRender = render;

  window.nlgsHcpAddRound = function(){
    const m = getMember();
    const input = document.getElementById('nlgsHcpDiff');
    const msg = document.getElementById('nlgsHcpMsg');
    const value = parseFloat(input ? input.value : '');

    if(!m){
      if(msg) msg.textContent = 'Please log into NLGS first.';
      return;
    }
    if(!Number.isFinite(value)){
      if(msg) msg.textContent = 'Enter a score differential.';
      return;
    }

    const data = getAll();
    const key = memberKey();
    if(!Array.isArray(data[key])) data[key] = [];
    data[key].push(Math.round(value * 10) / 10);
    saveAll(data);

    if(input) input.value = '';
    if(msg) msg.textContent = 'Round added for ' + (m.full_name || m.name) + '.';
    render();
  };

  window.nlgsHcpClearRounds = function(){
    const m = getMember();
    if(!m) return;

    if(!confirm('Clear all handicap rounds for ' + (m.full_name || m.name) + '?')) return;

    const data = getAll();
    delete data[memberKey()];
    saveAll(data);

    const msg = document.getElementById('nlgsHcpMsg');
    if(msg) msg.textContent = 'Rounds cleared.';
    render();
  };

  function install(){
    addStyles();
    buildSection();
    addHomeTile();
    addMyGolfButton();

    if(typeof window.show === 'function' && !window.nlgsHcpShowWrapped){
      const originalShow = window.show;
      window.show = function(id){
        originalShow(id);
        if(id === 'handicapTracker' || id === 'mygolf'){
          setTimeout(render,0);
        }
      };
      window.nlgsHcpShowWrapped = true;
    }

    render();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', install);
  }else{
    install();
  }
})();
