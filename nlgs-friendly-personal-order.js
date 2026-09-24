/* NLGS Friendly Game - Personal Scoring Order
   Standalone patch. Does NOT change game.players, database indexes,
   V15 multi-scorer logic, finalisation or locking.
*/
(function(){
  'use strict';

  console.log('NLGS FRIENDLY PERSONAL SCORING ORDER V2 ACTIVE');

  const confirmed = {};
  let orderCard = null;
  let currentGameId = '';

  function game(){
    try{
      return typeof getFriendlyRound === 'function' ? getFriendlyRound() : null;
    }catch(e){ return null; }
  }

  function gameKey(r){
    return String(r?.dbId || r?.id || r?.date || '');
  }

  function memberKey(){
    try{
      const m = JSON.parse(sessionStorage.getItem('nlgsMember') || 'null');
      return String(m?.id || m?.member_id || m?.full_name || m?.name || 'guest');
    }catch(e){
      return 'guest';
    }
  }

  function storageKey(r){
    return 'nlgsFriendlyPersonalOrder:' + memberKey() + ':' + gameKey(r);
  }

  function readSavedOrder(r){
    try{
      const raw = localStorage.getItem(storageKey(r));
      const a = JSON.parse(raw || 'null');
      if(Array.isArray(a) && a.length === r.players.length &&
         a.every(x => Number.isInteger(Number(x)) &&
         Number(x) >= 0 && Number(x) < r.players.length)){
        return a.map(Number);
      }
    }catch(e){}
    return null;
  }

  function saveOrder(r, order){
    try{ localStorage.setItem(storageKey(r), JSON.stringify(order)); }catch(e){}
  }

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function scoringArea(){
    return document.getElementById('friendlyScore');
  }

  function hideScoring(){
    const root = scoringArea();
    if(!root) return;
    [...root.children].forEach(el => {
      if(el !== orderCard) el.style.display = 'none';
    });
  }

  function showScoring(){
    const root = scoringArea();
    if(!root) return;
    [...root.children].forEach(el => {
      if(el !== orderCard) el.style.display = '';
    });
    if(orderCard){
      orderCard.remove();
      orderCard = null;
    }
  }

  function applyOrder(r, order){
    const holder = document.getElementById('friendlyHolePlayers');
    if(!holder || !Array.isArray(order)) return;

    const rows = [...holder.children];
    if(rows.length !== r.players.length) return;

    order.forEach(index => {
      if(rows[index]) holder.appendChild(rows[index]);
    });
  }

  function makeOrderCard(r, initialOrder){
    const root = scoringArea();
    if(!root) return null;

    const card = document.createElement('div');
    card.id = 'nlgsPersonalOrderCard';
    card.className = 'card';
    card.style.marginBottom = '12px';

    let order = initialOrder.slice();

    function render(){
      card.innerHTML = `
        <div class="label">FRIENDLY GAME</div>
        <h2 style="margin:4px 0 6px">Choose Your Scoring Order</h2>
        <div class="small" style="margin-bottom:14px">
          Choose the order you personally want to enter the players.
          This only affects your scoring screen — it does not change
          the game's player order or anyone else's screen.
        </div>
        <div id="nlgsOrderRows"></div>
        <button id="nlgsOrderConfirm" type="button" class="btn" style="margin-top:14px">
          START SCORING
        </button>
      `;

      const rows = card.querySelector('#nlgsOrderRows');

      order.forEach((playerIndex, position) => {
        const row = document.createElement('div');
        row.style.cssText =
          'display:flex;align-items:center;gap:8px;padding:10px 0;' +
          'border-bottom:1px solid var(--line)';

        const name = document.createElement('div');
        name.style.cssText = 'flex:1;min-width:0';
        name.innerHTML =
          '<b>' + (position + 1) + '. ' + esc(r.players[playerIndex]) + '</b>';

        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'btn';
        up.textContent = '↑';
        up.dataset.orderMove = 'up';
        up.dataset.orderPosition = String(position);
        up.style.cssText = 'width:46px;padding:8px 0';
        up.disabled = position === 0;

        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'btn';
        down.textContent = '↓';
        down.dataset.orderMove = 'down';
        down.dataset.orderPosition = String(position);
        down.style.cssText = 'width:46px;padding:8px 0';
        down.disabled = position === order.length - 1;

        row.append(name, up, down);
        rows.appendChild(row);
      });

      card.querySelector('#nlgsOrderConfirm').onclick = function(){
        saveOrder(r, order);
        confirmed[gameKey(r)] = true;
        currentGameId = gameKey(r);

        showScoring();

        if(typeof window.renderFriendlyScore === 'function'){
          window.renderFriendlyScore();
        }

        setTimeout(() => applyOrder(r, order), 100);

        if(typeof window.scrollTo === 'function'){
          window.scrollTo({top:0, behavior:'auto'});
        }
      };
    }

    /* One event handler for all arrow buttons. */
    card.addEventListener('click', function(e){
      const button = e.target.closest('button[data-order-move]');
      if(!button) return;

      e.preventDefault();
      e.stopPropagation();

      const position = Number(button.dataset.orderPosition);
      if(!Number.isInteger(position)) return;

      if(button.dataset.orderMove === 'up' && position > 0){
        [order[position - 1], order[position]] =
          [order[position], order[position - 1]];
        render();
        return;
      }

      if(button.dataset.orderMove === 'down' && position < order.length - 1){
        [order[position], order[position + 1]] =
          [order[position + 1], order[position]];
        render();
      }
    });

    render();
    root.insertBefore(card, root.firstChild);
    return card;
  }

  function maybeShowOrder(){
    const r = game();
    if(!r || !Array.isArray(r.players) || r.players.length < 2) return;

    const key = gameKey(r);
    if(!key) return;

    currentGameId = key;

    const saved = readSavedOrder(r);

    if(saved){
      confirmed[key] = true;
      return;
    }

    if(confirmed[key]) return;

    const root = scoringArea();
    if(!root) return;

    if(orderCard) orderCard.remove();

    const defaultOrder = r.players.map((_, i) => i);
    orderCard = makeOrderCard(r, defaultOrder);
    hideScoring();
  }

  const originalRender = window.renderFriendlyScore;

  window.renderFriendlyScore = function(){
    if(typeof originalRender === 'function'){
      originalRender.apply(this, arguments);
    }

    setTimeout(() => {
      const r = game();
      if(!r) return;

      const saved = readSavedOrder(r);

      if(saved){
        confirmed[gameKey(r)] = true;
        currentGameId = gameKey(r);
        showScoring();
        applyOrder(r, saved);
      }else{
        maybeShowOrder();
      }
    }, 50);
  };

  /* Only watch the scoring screen becoming active.
     We do not watch every DOM change, so the arrow buttons cannot
     be interrupted while their order card is being rebuilt. */
  const observer = new MutationObserver(() => {
    const root = scoringArea();
    if(!root || !root.classList.contains('active')) return;

    setTimeout(() => {
      try{
        const r = game();
        if(!r) return;

        const saved = readSavedOrder(r);

        if(saved){
          confirmed[gameKey(r)] = true;
          currentGameId = gameKey(r);
          showScoring();
          applyOrder(r, saved);
        }else{
          maybeShowOrder();
        }
      }catch(e){}
    }, 30);
  });

  observer.observe(document.body, {
    subtree:true,
    attributes:true,
    attributeFilter:['class']
  });

  setTimeout(() => {
    try{
      const r = game();
      if(r && document.getElementById('friendlyScore')?.classList.contains('active')){
        const saved = readSavedOrder(r);
        if(saved){
          confirmed[gameKey(r)] = true;
          currentGameId = gameKey(r);
          showScoring();
          applyOrder(r, saved);
        }else{
          maybeShowOrder();
        }
      }
    }catch(e){}
  }, 1000);
})();
