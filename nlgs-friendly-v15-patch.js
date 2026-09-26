(function(){
  console.log('NLGS FRIENDLY MULTI-SCORER TEST V15 ACTIVE');
  let multiStatus=null, finalising=false, exactScorerId='', saveInProgress=false;
  const unsavedDrafts={};

  function credentials(){
    try{
      const m=JSON.parse(sessionStorage.getItem('nlgsMember')||'null');
      const name=m?.full_name||m?.name||document.getElementById('loginName')?.value?.trim()||'';
      const pin=window.nlgsLoginCredentials?.pin||document.getElementById('loginPin')?.value?.trim()||'';
      if(name&&pin){
        window.nlgsLoginCredentials={name:name,pin:pin};
        if(!window.nlgsTestMember) window.nlgsTestMember=m;
        exactScorerId=String(m?.id||m?.member_id||m?.scorer_member_id||exactScorerId||'');
        return {name:name,pin:pin};
      }
    }catch(e){}
    return window.nlgsLoginCredentials||{};
  }

  async function resolveExactScorer(){
    const login=credentials();
    if(!login.name||!login.pin) return '';
    try{
      const r=await sb.rpc('login_member',{p_full_name:login.name,p_pin:login.pin});
      if(!r.error&&Array.isArray(r.data)&&r.data.length){
        const m=r.data[0];
        exactScorerId=String(m.id||m.member_id||m.scorer_member_id||'');
        window.nlgsTestMember=m;
      }
    }catch(e){}
    return exactScorerId;
  }

  function round(){return typeof getFriendlyRound==='function'?getFriendlyRound():null;}
  function rowsFor(p,h){
    return Array.isArray(multiStatus?.submissions)?multiStatus.submissions.filter(r=>Number(r.player_index)===Number(p)&&Number(r.hole_no)===Number(h)):[];
  }
  function scorerKey(r){return String(r.scorer_member_id||r.scorer_id||r.scorer_name||r.member_name||'');}

  function ownSubmission(p,h){
    const rows=rowsFor(p,h);
    if(exactScorerId){
      const hit=rows.find(r=>String(r.scorer_member_id||r.scorer_id||'')===String(exactScorerId));
      if(hit)return hit;
    }
    const m=window.nlgsTestMember||{};
    const ids=[m.id,m.member_id,m.scorer_member_id].filter(Boolean).map(String);
    if(ids.length){
      const hit=rows.find(r=>ids.includes(String(r.scorer_member_id||r.scorer_id||'')));
      if(hit)return hit;
    }
    return null;
  }

  function expectedScore(game,index,hole){
    try{
      const hd=friendlyHoleData(game,hole),pd=(game.playerData||[])[index]||{};
      const shots=friendlyShotsOnHole(pd.playingHandicap,hd.stroke_index);
      return Math.max(1,Math.min(15,Number(hd.par||0)+Number(shots||0)));
    }catch(e){return '';}
  }

  /*
    SCORERS ARE OPTIONAL.
    A hole is agreed when every member who has actually submitted
    that hole has submitted all four players' scores, and those
    submitted scores agree. One scorer is enough; two scorers must
    agree; three must agree; four must agree. Members who have not
    submitted anything for that hole are not treated as missing.
  */
  function holeScorers(game,h){
    const map={};
    game.players.forEach(function(_,index){
      rowsFor(index,h).forEach(function(row){
        const key=scorerKey(row);
        if(key){
          if(!map[key])map[key]={key:key,count:0};
          map[key].count++;
        }
      });
    });
    return Object.values(map);
  }

  function agreedScore(game,p,h){
    const rs=rowsFor(p,h);
    const scorers=holeScorers(game,h);
    if(!scorers.length)return null;

    // Every scorer who started this hole must have submitted all players.
    if(scorers.some(function(s){return s.count<game.players.length;}))return null;

    const values=[...new Set(rs.map(function(r){return Number(r.strokes);}))]
      .filter(function(v){return Number.isFinite(v);});
    return values.length===1?values[0]:null;
  }

    function roundCompletion(game){
    // A scorer becomes active as soon as they submit any score in this round.
    // Completion is measured by distinct hole/player submissions for each
    // active scorer.  This avoids treating 18 agreed holes as a completed
    // round when the same scorer has not actually completed all 18.
    const byScorer={};
    const submissions=Array.isArray(multiStatus?.submissions)?multiStatus.submissions:[];
    submissions.forEach(function(row){
      const key=scorerKey(row);
      const p=Number(row.player_index),h=Number(row.hole_no);
      if(!key||p<0||p>=game.players.length||h<1||h>18)return;
      if(!byScorer[key])byScorer[key]={key:key,pairs:new Set(),holes:new Set()};
      byScorer[key].pairs.add(h+'|'+p);
    });

    const scorers=Object.values(byScorer).map(function(s){
      const completedHoles=[];
      for(let h=1;h<=18;h++){
        let complete=true;
        for(let p=0;p<game.players.length;p++){
          if(!s.pairs.has(h+'|'+p)){complete=false;break;}
        }
        if(complete)completedHoles.push(h);
      }
      s.completedHoles=completedHoles.length;
      s.count=s.pairs.size;
      return s;
    });

    const incompleteScorers=scorers.filter(function(s){return s.completedHoles<18;});
    let agreed=0,disputes=0;
    for(let h=1;h<=18;h++){
      const hs=holeStatus(game,h);
      if(hs.agreed)agreed++;
      disputes+=hs.conflicts.length;
    }
    return {
      scorers:scorers,
      incompleteScorers:incompleteScorers,
      scorerCount:scorers.length,
      agreed:agreed,
      disputes:disputes,
      complete:scorers.length>0 && incompleteScorers.length===0 && agreed===18 && disputes===0
    };
  }

function holeStatus(game,h){
    const conflicts=[];
    const scorers=holeScorers(game,h);

    if(!scorers.length){
      return {
        missing:[],
        conflicts:[],
        agreed:false,
        scorerCount:0,
        incomplete:0
      };
    }

    const incomplete=scorers.filter(function(s){
      return s.count<game.players.length;
    }).length;

    game.players.forEach(function(player,index){
      const rs=rowsFor(index,h);
      const values=[...new Set(rs.map(function(r){return Number(r.strokes);}))]
        .filter(function(v){return Number.isFinite(v);});
      if(values.length>1)conflicts.push({player:player,values:values});
    });

    return {
      missing:[],
      conflicts:conflicts,
      agreed:incomplete===0 && conflicts.length===0,
      scorerCount:scorers.length,
      incomplete:incomplete
    };
  }

  function lockFinalisedRound(){
    if(String(multiStatus?.game_status||'').toLowerCase()!=='complete')return;
    document.querySelectorAll('.friendly-hole-score').forEach(function(input){
      input.disabled=true;
    });
    document.querySelectorAll('#friendlyHoleGrid button,#friendlyHolePlayers button,.cs-score-card button').forEach(function(btn){
      btn.disabled=true;
    });
    const save=document.getElementById('friendlySaveAllBtn');
    if(save){
      save.disabled=true;
      save.textContent='🔒 ROUND FINALISED';
    }
    const final=document.getElementById('friendlyFinaliseBtn');
    if(final)final.style.display='none';
  }

  function syncScoreCards(){
    const game=round(); if(!game?.dbId)return;
    const hole=Number(game.currentHole||1);
    const current=holeStatus(game,hole);
    const conflictByPlayer={};
    current.conflicts.forEach(function(x){
      const index=game.players.indexOf(x.player);
      if(index>=0)conflictByPlayer[index]=x.values;
    });

    document.querySelectorAll('.friendly-hole-score').forEach(function(input){
      const index=Number(input.dataset.player),own=ownSubmission(index,hole);
      const card=input.closest('.cs-score-card')||input.closest('.card')||input.parentElement?.parentElement;
      if(card)card.classList.remove('saved');
      const status=card?.querySelector?.('.cs-score-status');
      const smalls=card?.querySelectorAll?.('.small');
      const helper=smalls?.length?smalls[smalls.length-1]:null;

      let draft=unsavedDrafts[hole]?.[index];

      // Preserve a score that the scorer has manually changed, even if
      // another renderer refreshes the score card.
      if(draft===undefined && input.dataset.manualEdit==='1'){
        const v=Number(input.value);
        if(Number.isInteger(v) && v>=1 && v<=15){
          if(!unsavedDrafts[hole])unsavedDrafts[hole]={};
          unsavedDrafts[hole][index]=v;
          draft=v;
        }
      }

      const savedValue=own?String(Number(own.strokes)):'';
      const expected=String(expectedScore(game,index,hole));
      const conflict=conflictByPlayer[index];

      if(draft!==undefined){
        input.value=String(draft);
        if(card)card.classList.add('saved');
        if(conflict){
          if(status)status.textContent='⚠️ Discrepancy';
          if(helper)helper.textContent='Scores entered: '+conflict.join(' / ')+' • agree before finalising';
        }else{
          if(status)status.textContent='Changed — not saved';
          if(helper)helper.textContent='Changed score • press SAVE GROUP SCORES';
        }
        return;
      }

      if(own){
        input.value=savedValue;
        if(card)card.classList.add('saved');
        if(conflict){
          if(status)status.textContent='⚠️ Discrepancy';
          if(helper)helper.textContent='Scores entered: '+conflict.join(' / ')+' • agree before finalising';
        }else{
          if(status)status.textContent='Saved';
          if(helper)helper.textContent='Saved score • use + / − or swipe ← / →';
        }
      }else{
        input.value=expected;
        if(conflict){
          if(status)status.textContent='⚠️ Discrepancy';
          if(helper)helper.textContent='Scores entered: '+conflict.join(' / ')+' • agree before finalising';
        }else{
          if(status)status.textContent='Not entered';
          if(helper)helper.textContent='Expected handicap score';
        }
      }
    });
    lockFinalisedRound();
  }

  function syncLeaderboard(){
    const game=round(),list=document.getElementById('friendlyPlayersList');
    if(!game||!list||!Array.isArray(game.players))return;
    const medal=String(game.format||'').toLowerCase()==='medal';
    const data=game.players.map(function(player,index){
      let gross=0,points=0,holes=0;
      for(let h=1;h<=18;h++){
        const score=agreedScore(game,index,h); if(score===null)continue;
        holes++; gross+=Number(score)||0;
        try{
          const hd=friendlyHoleData(game,h),pd=(game.playerData||[])[index]||{};
          const shots=friendlyShotsOnHole(pd.playingHandicap,hd.stroke_index);
          points+=Number(friendlyPoints(Number(score),hd.par,shots))||0;
        }catch(e){}
      }
      return {player:player,pd:(game.playerData||[])[index]||{},gross:gross,points:points,holes:holes};
    });
    data.sort(function(a,b){
      if(medal){if(a.holes!==b.holes)return b.holes-a.holes;return a.gross-b.gross;}
      if(a.points!==b.points)return b.points-a.points;return a.gross-b.gross;
    });
    const fullyAgreed=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].filter(function(h){
      return game.players.every(function(_,i){return agreedScore(game,i,h)!==null;});
    }).length;
    list.innerHTML=data.map(function(x,i){
      const value=medal?(x.holes?x.gross+' gross':'—'):x.points+' pts';
      return '<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><div><b>'+(i+1)+'. '+x.player+'</b><div class="small">PH '+(x.pd.playingHandicap??'—')+' • '+x.holes+'/18 agreed • '+value+'</div></div><span class="pill">'+value+'</span></div>';
    }).join('');
    document.getElementById('friendlyLeaderboardTitle').textContent=fullyAgreed===18?'FINAL LEADERBOARD':'AGREED SCORES ONLY';
    document.getElementById('friendlyLeaderboardSub').textContent=fullyAgreed+'/18 holes fully agreed';
    if(!data.some(x=>x.holes>0))list.innerHTML='<div class="small" style="padding:12px 0">No scores are counted yet. A hole is counted only when all four scorers have entered the same scores.</div>';
  }

  function syncHoleGrid(){
    const game=round(),grid=document.getElementById('friendlyHoleGrid');
    if(!game||!grid)return;
    [...grid.querySelectorAll('button')].forEach(function(btn,i){
      const h=i+1,ok=game.players.every((_,p)=>agreedScore(game,p,h)!==null);
      const active=h===Number(game.currentHole||1);
      btn.textContent=String(h)+(ok?' ✓':'');
      btn.style.background=active?'var(--green)':(ok?'#e8f2ed':'#fff');
      btn.style.color=active?'#fff':'var(--ink)';
    });
  }

  function ensureAgreement(){
    const game=round(); if(!game?.dbId)return;
    let card=document.getElementById('friendlyAgreementCard');
    const save=document.getElementById('friendlySaveAllBtn'); if(!save)return;
    if(!card){
      card=document.createElement('div');card.id='friendlyAgreementCard';card.className='card';
      card.innerHTML='<div class="row"><h3 style="margin:0">SCORE AGREEMENT</h3><span class="pill" id="friendlyAgreementPill">Checking…</span></div><div id="friendlyAgreementBody" class="small" style="margin-top:8px"></div><button id="friendlyFinaliseBtn" class="btn" style="display:none;margin-top:12px" onclick="nlgsFinaliseFriendlyRound()">FINALISE ROUND</button>';
      save.parentNode.parentNode.insertBefore(card,save.parentNode.parentNode.children[1]||null);
    }
    let agreed=0,missing=0,conflicts=0;
    for(let h=1;h<=18;h++){const s=holeStatus(game,h);if(s.agreed)agreed++;missing+=s.missing.length;conflicts+=s.conflicts.length;}
    const current=holeStatus(game,Number(game.currentHole||1));
    const pill=document.getElementById('friendlyAgreementPill'),body=document.getElementById('friendlyAgreementBody'),final=document.getElementById('friendlyFinaliseBtn');
    if(current.conflicts.length){
      pill.textContent='AWAITING AGREEMENT';
      body.innerHTML='One or more player scores differ. The discrepancy is shown on the affected player card.<br>'+
        'Both scores are retained until the scorers agree.';
    }else if(!current.scorerCount){
      pill.textContent='AWAITING SCORES';
      body.innerHTML='No scorer has submitted Hole '+game.currentHole+' yet.';
    }else if(current.incomplete){
      pill.textContent='AWAITING SCORES';
      body.innerHTML=current.scorerCount+' scorer'+(current.scorerCount===1?'':'s')+
        ' started this hole. Waiting for all submitted scorers to complete their four scores.';
    }else if(current.agreed){
      pill.textContent='✓ AGREED';
      body.innerHTML=current.scorerCount+' scorer'+(current.scorerCount===1?'':'s')+
        ' submitted Hole '+game.currentHole+' and the scores agree.';
    }

    body.innerHTML+='<br><br><b>'+agreed+' / 18 holes agreed</b><br>'+
      current.scorerCount+' scorer'+(current.scorerCount===1?'':'s')+
      ' submitted this hole • '+conflicts+' disputed player/hole score'+(conflicts===1?'':'s')+'.';
    const completion=roundCompletion(game);
    if(completion.complete){
      body.innerHTML+='<br><br><b>18 / 18 holes agreed ✓</b><br>'+
        completion.scorerCount+' scorers completed all 18 holes.<br>'+
        'All agreed scores are ready for the final leaderboard.';
      final.style.display='block';
    }else{
      final.style.display='none';
      if(completion.incompleteScorers.length){
        body.innerHTML+='<br><br><b>Round not complete</b><br>'+
          completion.incompleteScorers.length+' scorer'+(completion.incompleteScorers.length===1?'':'s')+
          ' still have scores to enter for the full 18 holes.';
      }
    }
  }

  /*
    Keep unsaved edits in memory for each hole. The original NLGS renderer
    can rebuild the score inputs when a hole is opened or the live refresh
    runs; the draft must win until SAVE GROUP SCORES is pressed.
  */
  function captureDraft(input){
    if(!input?.classList?.contains('friendly-hole-score')) return;
    const game=round();
    if(!game)return;
    const hole=Number(game.currentHole||1);
    const index=Number(input.dataset.player);
    const value=Number(input.value);
    if(!Number.isInteger(value)||value<1||value>15)return;
    if(!unsavedDrafts[hole])unsavedDrafts[hole]={};
    unsavedDrafts[hole][index]=value;
    input.dataset.manualEdit='1';
    syncScoreCards();
  }

  document.addEventListener('input',function(e){
    if(e.target?.classList?.contains('friendly-hole-score')) captureDraft(e.target);
  },true);

  document.addEventListener('change',function(e){
    if(e.target?.classList?.contains('friendly-hole-score')) captureDraft(e.target);
  },true);

  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('button');
    if(!btn)return;
    const card=btn.closest?.('.cs-score-card');
    if(!card)return;
    const input=card.querySelector('.friendly-hole-score');
    if(input){
      setTimeout(function(){captureDraft(input);},0);
    }
  },true);

  async function refreshStatus(quiet){
    const game=round(),login=credentials();if(!game?.dbId||!login.name||!login.pin)return null;
    await resolveExactScorer();
    const r=await sb.rpc('get_friendly_submission_status',{p_friendly_game_id:game.dbId,p_member_name:login.name,p_member_pin:login.pin});
    if(r.error)throw r.error;if(r.data?.error)throw new Error(r.data.error);
    multiStatus=r.data;
if(!quiet){syncScoreCards();syncLeaderboard();syncHoleGrid();ensureAgreement();lockFinalisedRound();}
return r.data;
  }

  async function saveMulti(){
    if(String(multiStatus?.game_status||'').toLowerCase()==='complete'){
      throw new Error('This round has been finalised. Scores can no longer be changed.');
    }
    const game=round(),login=credentials();
    if(!game?.dbId)throw new Error('Friendly game database record not found.');
    if(!login.name||!login.pin)throw new Error('Please log in before scoring.');
    const inputs=[...document.querySelectorAll('.friendly-hole-score')];
    if(inputs.length!==game.players.length)throw new Error('Enter a score for every player.');
    const scores=inputs.map(input=>({player_index:Number(input.dataset.player),strokes:Number(input.value)}));
    if(scores.some(x=>!Number.isInteger(x.strokes)||x.strokes<1||x.strokes>15))throw new Error('Enter a valid score for every player.');
    const hole=Number(game.currentHole||1);
    const r=await sb.rpc('save_friendly_hole_submission',{p_friendly_game_id:game.dbId,p_member_name:login.name,p_member_pin:login.pin,p_hole_no:hole,p_scores:scores});
    if(r.error)throw r.error;if(r.data?.error)throw new Error(r.data.error);
    delete unsavedDrafts[hole];
    document.querySelectorAll('.friendly-hole-score').forEach(function(input){
      delete input.dataset.manualEdit;
    });

    // Re-check the hole immediately after saving. If another scorer has
    // submitted a different value, do NOT advance to the next hole.
    await refreshStatus(true);
    const afterSave=holeStatus(game,hole);
    if(afterSave.conflicts.length){
      originalRender();
      setTimeout(function(){
        syncScoreCards();syncLeaderboard();syncHoleGrid();ensureAgreement();

        // Take the scorer straight to the affected player card.
        const conflictPlayer=afterSave.conflicts[0]?.player;
        if(conflictPlayer){
          const cards=[...document.querySelectorAll('.cs-score-card')];
          const card=cards.find(function(card){
            const title=card.querySelector('h3,h4,.player-name,b');
            return title && title.textContent.trim().includes(conflictPlayer);
          });
          if(card){
            card.scrollIntoView({behavior:'smooth',block:'center'});
          }
        }
      },100);
      if(typeof toast==='function')toast('Score discrepancy — this hole must be agreed before you can continue.');
      return;
    }

    if(hole<18){
  game.currentHole=hole+1;
  if(typeof saveFriendlyState==='function')saveFriendlyState();

  const nextHole=friendlyHoleData(game,game.currentHole),holeInfo=document.getElementById('friendlyHoleInfo');if(holeInfo)holeInfo.textContent='Hole '+game.currentHole+' / 18 • Par '+nextHole.par+' • SI '+nextHole.stroke_index+(nextHole.yards!=null?' • '+Number(nextHole.yards).toLocaleString()+' yds':'');

  syncScoreCards();
  syncLeaderboard();
  syncHoleGrid();
  ensureAgreement();
      
    }else{
      // Hole 18 has been saved. Stay on Hole 18, then take the scorer
      // directly to the result that needs attention:
      // 1) discrepancy -> affected player card
      // 2) no discrepancy + round complete -> FINALISE ROUND
      // 3) no discrepancy but another active scorer is incomplete ->
      //    show the round-completion message.
      originalRender();
      syncScoreCards();syncLeaderboard();syncHoleGrid();ensureAgreement();

      setTimeout(function(){
        const latest=holeStatus(game,18);
        if(latest.conflicts.length){
          const conflictPlayer=latest.conflicts[0]?.player;
          if(conflictPlayer){
            const cards=[...document.querySelectorAll('.cs-score-card')];
            const card=cards.find(function(card){
              const title=card.querySelector('h3,h4,.player-name,b');
              return title && title.textContent.trim().includes(conflictPlayer);
            });
            if(card) card.scrollIntoView({behavior:'smooth',block:'center'});
          }
          return;
        }

        const completion=roundCompletion(game);
        const final=document.getElementById('friendlyFinaliseBtn');
        if(completion.complete && final && final.style.display!=='none'){
          final.scrollIntoView({behavior:'smooth',block:'center'});
        }else{
          const agreement=document.getElementById('friendlyAgreementCard');
          if(agreement) agreement.scrollIntoView({behavior:'smooth',block:'center'});
        }
      },150);
    }
  }

  window.saveFriendlyScore=async function(){
  const b=document.getElementById('friendlySaveAllBtn');
  if(saveInProgress)return;
  saveInProgress=true;
  const oldText=b?b.textContent:'SAVE GROUP SCORES';
  if(b){b.disabled=true;b.textContent='SAVING…';}
  try{
    await saveMulti();
    if(typeof toast==='function')toast('Scores saved');
  }catch(e){
    console.error(e);
    if(typeof toast==='function')toast(e.message||'Could not save scores');
  }finally{
    saveInProgress=false;
    if(b){b.disabled=false;b.textContent=oldText||'SAVE GROUP SCORES';}
  }
};

  window.nlgsFinaliseFriendlyRound=async function(){
    if(finalising)return;
    finalising=true;
    try{
      const game=round();
      await refreshStatus();

      if(String(multiStatus?.game_status||'').toLowerCase()==='complete'){
        lockFinalisedRound();
        if(typeof toast==='function')toast('This round has already been finalised. Scores are locked.');
        return;
      }

      const completion=roundCompletion(game);
      if(!completion.complete){
        if(typeof toast==='function')toast('Round cannot be finalised until every active scorer has completed all 18 holes and all scores agree.');
        ensureAgreement();
        return;
      }

      for(let h=1;h<=18;h++){
        if(!holeStatus(game,h).agreed){
          if(typeof toast==='function')toast('Round cannot be finalised until all active scorers agree every hole.');
          return;
        }
      }

      game.scores={};
      game.players.forEach(function(player,index){
        game.scores[player]={};
        for(let h=1;h<=18;h++){
          const v=agreedScore(game,index,h);
          if(v===null)throw new Error('A final agreed score could not be established.');
          game.scores[player][h]=v;
        }
      });

      if(typeof saveFriendlyState==='function')saveFriendlyState();
      if(typeof saveFriendlyToDatabase==='function')await saveFriendlyToDatabase();

      if(!game.dbId)throw new Error('Friendly game database record not found.');
      const lock=await sb.rpc('complete_friendly_game',{p_id:game.dbId});
      if(lock.error)throw lock.error;
      if(!Array.isArray(lock.data)||!lock.data.length)throw new Error('The round could not be finalised on the server.');

      multiStatus=multiStatus||{};
      multiStatus.game_status='complete';
      lockFinalisedRound();
      ensureAgreement();

      if(typeof finishFriendlyRound==='function')finishFriendlyRound();
    }catch(e){
      console.error(e);
      if(typeof toast==='function')toast(e.message||'Could not finalise the round');
    }finally{
      finalising=false;
    }
  };

  const originalRender=window.renderFriendlyScore;
  window.renderFriendlyScore=function(){
    if(typeof originalRender==='function')originalRender();
    setTimeout(()=>{syncScoreCards();syncLeaderboard();syncHoleGrid();ensureAgreement();},30);
  };

  setTimeout(async function(){try{await resolveExactScorer();await refreshStatus();syncScoreCards();}catch(e){console.warn('Friendly test:',e);}},1200);
  setInterval(async function(){try{if(!saveInProgress && round()?.dbId)await refreshStatus();}catch(e){}},2000);
})();

// V15 safety: recover/create the Supabase Friendly Game record when an
// older/local round does not yet have dbId. This lets the multi-scorer
// system work with rounds created before the database-backed flow.
(function(){
  async function ensureFriendlyDbId(){
    try{
      const game=typeof getFriendlyRound==='function'?getFriendlyRound():(typeof friendlyRound!=='undefined'?friendlyRound:null);
      if(!game)return null;
      if(game.dbId)return game.dbId;

      let fixture=null;
      try{fixture=JSON.parse(localStorage.getItem('nlgsFriendlyFixture')||'null');}catch(e){}

      if(fixture?.id){
        game.dbId=fixture.id;
        localStorage.setItem('nlgsFriendlyRound',JSON.stringify(game));
        return game.dbId;
      }

      if(!game.courseId || !game.date || !Array.isArray(game.players)||game.players.length<1||game.players.length>4){
        return null;
      }

      const payload={
        date:game.date,
        courseId:game.courseId,
        teeId:game.teeId||null,
        course:game.course,
        tee:game.tee||'Yellow',
        format:game.format||'Stableford',
        allowance:(()=>{const a=game.allowance;const n=parseFloat(String(a??95).replace('%','').trim());return Number.isFinite(n)?n:95;})(),
        courseRating:Number(game.courseRating),
        slope:Number(game.slope),
        par:Number(game.par),
        players:game.players||[],
        playerData:game.playerData||[],
        holeData:game.holeData||[],
        scores:game.scores||{},
        include3s5s:!!game.include3s5s,
        status:game.date===friendlyToday()?'in_progress':'scheduled',
        createdBy:(typeof credentials==='function'?(credentials().name||''):'')
      };

      const r=await sb.rpc('create_friendly_game',{p_game:payload});
      if(r.error)throw r.error;
      const id=Array.isArray(r.data)?(r.data[0]?.id||r.data[0]):r.data;
      if(!id)throw new Error('Could not create the Friendly game database record.');

      game.dbId=id;
      localStorage.setItem('nlgsFriendlyRound',JSON.stringify(game));
      localStorage.setItem('nlgsFriendlyFixture',JSON.stringify({
        id:id,date:game.date,course:game.course,format:game.format,
        players:game.players,tee:game.tee
      }));
      return id;
    }catch(e){
      console.error('Could not prepare Friendly Game database record',e);
      return null;
    }
  }

  window.NLGSensureFriendlyDbId=ensureFriendlyDbId;

  const previousSaveFriendlyScore=window.saveFriendlyScore;
  window.saveFriendlyScore=async function(){
    const id=await ensureFriendlyDbId();
    if(!id){
      if(typeof toast==='function')toast('Friendly game database record could not be prepared.');
      return;
    }
    return previousSaveFriendlyScore();
  };

  setTimeout(async function(){
    const game=typeof getFriendlyRound==='function'?getFriendlyRound():(typeof friendlyRound!=='undefined'?friendlyRound:null);
    if(game && !game.dbId) await ensureFriendlyDbId();
  },800);
})();
