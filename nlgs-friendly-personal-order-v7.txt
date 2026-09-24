/* NLGS Friendly Game - Personal Scoring Order V7
   Direct start-flow patch.
   Does NOT alter game.players, player indexes, V15 multi-scorer logic,
   finalisation or locking.
*/
(function(){
  'use strict';

  console.log('NLGS FRIENDLY PERSONAL SCORING ORDER V7 ACTIVE');

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

  function root(){
    return document.getElementById('friendlyScore');
  }

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function hideScoreScreen(){
    const r = root();
    if(!r) return;
    [...r.children].forEach(el => {
      if(el !== orderCard) el.style.display='none';
    });
  }

  function showScoreScreen(){
    const r = root();
    if(!r) return;

    [...r.children].forEach(el => {
      if(el !== orderCard) el.style.display='';
    });

    if(orderCard){
      orderCard.remove();
      orderCard=null;
    }
  }

  function applyOrder(r, order){
    const holder=document.getElementById('friendlyHolePlayers');
    if(!holder || !Array.isArray(order)) return;

    const rows=[...holder.children];
    if(rows.length !== r.players.length) return;

    order.forEach(index=>{
      if(rows[index]) holder.appendChild(rows[index]);
    });
  }

  function makeOrderCard(r){
    const parent=root();
    if(!parent) return null;

    let order=r.players.map((_,i)=>i);

    const card=document.createElement('div');
    card.id='nlgsPersonalOrderCard';
    card.className='card';
    card.style.marginBottom='12px';

    function render(){
      card.innerHTML=`
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

      const list=card.querySelector('#nlgsOrderRows');

      order.forEach((playerIndex,position)=>{
        const row=document.createElement('div');
        row.style.cssText=
          'display:flex;align-items:center;gap:8px;padding:10px 0;' +
          'border-bottom:1px solid var(--line)';

        const name=document.createElement('div');
        name.style.cssText='flex:1;min-width:0';
        name.innerHTML='<b>'+(position+1)+'. '+
          esc(r.players[playerIndex])+'</b>';

        const up=document.createElement('button');
        up.type='button';
        up.className='btn';
        up.textContent='↑';
        up.dataset.move='up';
        up.dataset.pos=String(position);
        up.style.cssText='width:46px;padding:8px 0';
        up.disabled=position===0;

        const down=document.createElement('button');
        down.type='button';
        down.className='btn';
        down.textContent='↓';
        down.dataset.move='down';
        down.dataset.pos=String(position);
        down.style.cssText='width:46px;padding:8px 0';
        down.disabled=position===order.length-1;

        row.append(name,up,down);
        list.appendChild(row);
      });
    }

    card.addEventListener('click',e=>{
      const b=e.target.closest('button[data-move]');
      if(!b) return;

      e.preventDefault();
      e.stopPropagation();

      const pos=Number(b.dataset.pos);
      if(!Number.isInteger(pos)) return;

      if(b.dataset.move==='up' && pos>0){
        [order[pos-1],order[pos]]=[order[pos],order[pos-1]];
        render();
      }

      if(b.dataset.move==='down' && pos<order.length-1){
        [order[pos],order[pos+1]]=[order[pos+1],order[pos]];
        render();
      }
    });

    card.querySelector = card.querySelector.bind(card);

    card.addEventListener('click',e=>{
      if(e.target.id!=='nlgsOrderConfirm') return;

      chosenOrder=order.slice();
      chosenGameId=gameKey(r);

      showScoreScreen();

      if(typeof window.renderFriendlyScore==='function'){
        window.renderFriendlyScore();
      }

      setTimeout(()=>applyOrder(r,chosenOrder),120);

      if(typeof window.scrollTo==='function'){
        window.scrollTo({top:0,behavior:'auto'});
      }
    });

    render();
    parent.insertBefore(card,parent.firstChild);
    return card;
  }

  function showOrderForCurrentGame(){
    const r=game();
    if(!r || !Array.isArray(r.players) || r.players.length<2) return;

    if(orderCard){
      orderCard.remove();
      orderCard=null;
    }

    chosenOrder=null;
    chosenGameId='';

    orderCard=makeOrderCard(r);
    hideScoreScreen();
  }

  /* Fixture flow: this is the important part. We intercept the actual
     START FRIENDLY GAME action before it can leave the scoring screen. */
  const originalScheduled=window.startScheduledFriendly;

  window.startScheduledFriendly=async function(){
    try{
      const fixture=JSON.parse(localStorage.getItem('nlgsFriendlyFixture')||'null');
      const saved=JSON.parse(localStorage.getItem('nlgsFriendlyRound')||'null');

      if(!fixture || !saved){
        if(typeof toast==='function') toast('Friendly game could not be found');
        return;
      }

      const today=typeof friendlyToday==='function' ? friendlyToday() : new Date().toISOString().slice(0,10);

      if(fixture.date>today){
        if(typeof toast==='function') toast('This friendly game is not due to start yet');
        return;
      }

      if(fixture.date<today){
        if(typeof toast==='function') toast('This friendly game date has passed');
        return;
      }

      friendlyRound=saved;

      if(!Array.isArray(friendlyRound.holeData) ||
         friendlyRound.holeData.length!==18){
        if(typeof loadFriendlyHoles==='function'){
          const holes=await loadFriendlyHoles(
            friendlyRound.courseId,
            friendlyRound.teeId
          );
          if(!holes || holes.length!==18){
            if(typeof toast==='function') toast('This course does not have all 18 holes loaded yet');
            return;
          }
          friendlyRound.holeData=holes;
          if(typeof saveFriendlyState==='function') saveFriendlyState();
        }
      }

      show('friendlyScore');

      /* Render once so the scoring area exists, then immediately replace
         it with the personal order screen. */
      if(typeof window.renderFriendlyScore==='function'){
        await window.renderFriendlyScore();
      }

      showOrderForCurrentGame();

    }catch(e){
      console.error('Could not start scheduled friendly',e);
      if(typeof toast==='function') toast('Friendly game could not be opened');
    }
  };

  /* Also cover a brand-new Friendly Game created from the setup screen. */
  const originalNew=window.startFriendlyRound;

  window.startFriendlyRound=function(){
    if(typeof originalNew==='function') originalNew.apply(this,arguments);

    setTimeout(()=>{
      try{
        const r=game();
        if(!r || !Array.isArray(r.players) || r.players.length<2) return;
        showOrderForCurrentGame();
      }catch(e){
        console.error('Could not open personal scoring order',e);
      }
    },80);
  };

})();
