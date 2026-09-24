/* NLGS Friendly Game - Personal Scoring Order V4
   Simple standalone patch.
   Does NOT change game.players, database indexes, V15 multi-scorer
   logic, finalisation or locking.
*/
(function(){
  'use strict';

  console.log('NLGS FRIENDLY PERSONAL SCORING ORDER V5 ACTIVE');

  let orderCard = null;
  let chosenOrder = null;
  let chosenGameId = '';

  function game(){
    try{
      return typeof getFriendlyRound === 'function' ? getFriendlyRound() : null;
    }catch(e){ return null; }
  }

  function gameKey(r){
    return String(r?.dbId || r?.id || r?.date || '');
  }

  function scoringArea(){
    return document.getElementById('friendlyScore');
  }

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
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

    /* Move DOM rows only. The original data-player indexes remain intact. */
    order.forEach(index => {
      if(rows[index]) holder.appendChild(rows[index]);
    });
  }

  function makeOrderCard(r){
    const root = scoringArea();
    if(!root) return null;

    let order = r.players.map((_,i) => i);

    const card = document.createElement('div');
    card.id = 'nlgsPersonalOrderCard';
    card.className = 'card';
    card.style.marginBottom = '12px';
    card.dataset.gameId = gameKey(r);

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
        <button id="nlgsOrderConfirm" type="button" class="btn"
          style="margin-top:14px">START SCORING</button>
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
          '<b>' + (position + 1) + '. ' +
          esc(r.players[playerIndex]) + '</b>';

        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'btn';
        up.textContent = '↑';
        up.style.cssText = 'width:46px;padding:8px 0';
        up.dataset.move = 'up';
        up.dataset.pos = String(position);
        up.disabled = position === 0;

        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'btn';
        down.textContent = '↓';
        down.style.cssText = 'width:46px;padding:8px 0';
        down.dataset.move = 'down';
        down.dataset.pos = String(position);
        down.disabled = position === order.length - 1;

        row.append(name, up, down);
        rows.appendChild(row);
      });

      card.querySelector('#nlgsOrderConfirm').onclick = function(){
        chosenOrder = order.slice();
        chosenGameId = gameKey(r);

        /* Keep the choice only for this page session. */
        showScoring();

        if(typeof window.renderFriendlyScore === 'function'){
          window.renderFriendlyScore();
        }

        setTimeout(() => applyOrder(r, chosenOrder), 80);

        if(typeof window.scrollTo === 'function'){
          window.scrollTo({top:0, behavior:'auto'});
        }
      };
    }

    /* Event delegation keeps the arrow buttons reliable after every redraw. */
    card.addEventListener('click', function(e){
      const button = e.target.closest('button[data-move]');
      if(!button) return;

      e.preventDefault();
      e.stopPropagation();

      const pos = Number(button.dataset.pos);
      if(!Number.isInteger(pos)) return;

      if(button.dataset.move === 'up' && pos > 0){
        [order[pos-1], order[pos]] =
          [order[pos], order[pos-1]];
        render();
      }

      if(button.dataset.move === 'down' && pos < order.length-1){
        [order[pos], order[pos+1]] =
          [order[pos+1], order[pos]];
        render();
      }
    });

    render();
    root.insertBefore(card, root.firstChild);
    return card;
  }

  function showOrderIfNeeded(){
    const r = game();
    if(!r || !Array.isArray(r.players) || r.players.length < 2) return;

    const key = gameKey(r);
    if(!key) return;

    /* If this scorer has already chosen an order during this visit,
       simply apply it after the normal renderer runs. */
    if(chosenGameId === key && Array.isArray(chosenOrder)){
      setTimeout(() => applyOrder(r, chosenOrder), 20);
      return;
    }

    /* If a different Friendly Game has been opened, discard the old
       order card before creating the new game's player list. */
    if(orderCard){
      if(orderCard.dataset.gameId !== key){
        orderCard.remove();
        orderCard = null;
      }else{
        return;
      }
    }

    orderCard = makeOrderCard(r);
    hideScoring();
  }

  const originalRender = window.renderFriendlyScore;

  window.renderFriendlyScore = function(){
    if(typeof originalRender === 'function'){
      originalRender.apply(this, arguments);
    }

    setTimeout(() => {
      try{
        const r = game();
        if(!r) return;

        const key = gameKey(r);

        if(chosenGameId === key && Array.isArray(chosenOrder)){
          showScoring();
          applyOrder(r, chosenOrder);
        }else{
          showOrderIfNeeded();
        }
      }catch(e){}
    }, 60);
  };

  /* Catch the moment the Friendly scoring screen becomes active. */
  const observer = new MutationObserver(() => {
    const root = scoringArea();
    if(!root || !root.classList.contains('active')) return;

    setTimeout(() => {
      try{
        const r = game();
        if(!r) return;

        const key = gameKey(r);

        if(chosenGameId === key && Array.isArray(chosenOrder)){
          showScoring();
          applyOrder(r, chosenOrder);
        }else{
          showOrderIfNeeded();
        }
      }catch(e){}
    }, 40);
  });

  observer.observe(document.body, {
    subtree:true,
    attributes:true,
    attributeFilter:['class']
  });

  setTimeout(() => {
    try{
      const r = game();
      if(r && scoringArea()?.classList.contains('active')){
        showOrderIfNeeded();
      }
    }catch(e){}
  }, 500);
})();
