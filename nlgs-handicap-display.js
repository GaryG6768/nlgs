/* NLGS Handicap Display v2
   Shows the player's current NLGS Handicap next to their name on the Home screen.
   Automatically refreshes immediately after ADD ROUND, SYNC, or CLEAR.
*/
(function(){
  'use strict';

  const KEY='nlgsHandicapTrackerV3';

  function getMember(){
    try{
      return JSON.parse(sessionStorage.getItem('nlgsMember')||'null');
    }catch(e){
      return null;
    }
  }

  function memberKey(){
    const m=getMember();
    return String(
      (m&&m.id) ||
      ((m&&m.full_name)||'').trim() ||
      'unknown'
    ).trim();
  }

  function getRounds(){
    try{
      const all=JSON.parse(
        localStorage.getItem(KEY)||'{}'
      )||{};

      const r=Array.isArray(all[memberKey()])
        ? all[memberKey()]
        : [];

      return r
        .map(x=>typeof x==='number'?{diff:x}:x)
        .filter(x=>x&&Number.isFinite(Number(x.diff)))
        .map(x=>({...x,diff:Number(x.diff)}));

    }catch(e){
      return [];
    }
  }

  function handicap(){
    const r=getRounds();

    const last20=r.slice(-20);
    const last15=r.slice(-15);

    const best8=last20
      .slice()
      .sort((a,b)=>a.diff-b.diff)
      .slice(0,8)
      .map(x=>x.diff);

    const form=best8.length
      ? best8.reduce((a,b)=>a+b,0)/best8.length
      : NaN;

    const ability=last15.length
      ? Math.min(...last15.map(x=>x.diff))
      : NaN;

    const limit=Number.isFinite(ability)
      ? ability+5
      : NaN;

    if(!Number.isFinite(form)&&!Number.isFinite(limit))
      return NaN;

    if(!Number.isFinite(form))
      return limit;

    if(!Number.isFinite(limit))
      return form;

    return Math.min(form,limit);
  }

  function update(){
    const m=getMember();
    const welcome=document.getElementById('welcome');

    if(!m||!welcome)
      return;

    const h=handicap();
    const name=m.full_name||m.name||'';

    welcome.textContent=Number.isFinite(h)
      ? 'Welcome, '+name+'  •  HDC '+h.toFixed(1)
      : 'Welcome, '+name;
  }

  function wrapFunction(name){
    const flag='nlgsHcpDisplayWrapped_'+name;

    if(window[flag] || typeof window[name]!=='function')
      return;

    const original=window[name];

    window[name]=async function(){
      const result=await original.apply(this,arguments);

      // Give the handicap tracker a moment to save/recalculate first.
      setTimeout(update,50);
      setTimeout(update,250);
      setTimeout(update,1000);

      return result;
    };

    window[flag]=true;
  }

  function install(){
    update();

    // Keep the Home screen in sync after any handicap-changing action.
    wrapFunction('nlgsHcpAddRound');
    wrapFunction('nlgsHcpSyncRounds');
    wrapFunction('nlgsHcpClearRounds');

    let tries=0;

    const timer=setInterval(()=>{
      update();

      // These functions may be installed slightly after this script.
      wrapFunction('nlgsHcpAddRound');
      wrapFunction('nlgsHcpSyncRounds');
      wrapFunction('nlgsHcpClearRounds');

      if(++tries>=40)
        clearInterval(timer);

    },500);
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',install);
  else
    install();

})();
