/* NLGS Handicap Display v3
   Shows the player's current NLGS Handicap next to their name on the Home screen.
   Automatically refreshes immediately after ADD ROUND, SYNC, or CLEAR.
*/
(function(){
  'use strict';

  // Match the Handicap Tracker: show the official England Golf Handicap
  // Index stored on the logged-in NLGS member record. Do not calculate a
  // separate estimate from round history for the Home screen.
  function getMember(){
    try{
      return JSON.parse(sessionStorage.getItem('nlgsMember')||'null');
    }catch(e){
      return null;
    }
  }

  function update(){
    const m=getMember();
    const welcome=document.getElementById('welcome');

    if(!m||!welcome)
      return;

    const name=m.full_name||m.name||'';
    const h=Number(m.handicap);

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
