(function(){
'use strict';

const KEY='nlgsHandicapTrackerV3';

async function syncHistory(){
  try{
    const m=JSON.parse(sessionStorage.getItem('nlgsMember')||'null');
    const c=window.nlgsLoginCredentials||{};

    if(!m||!c.name||!c.pin||typeof sb==='undefined'||typeof sb.rpc!=='function') return;

    const r=await sb.rpc('get_nlgs_handicap_history_secure',{
      p_member_name:c.name,
      p_member_pin:c.pin
    });

    if(r.error||!Array.isArray(r.data)){
      console.warn('NLGS handicap history sync:',r.error||'No history returned');
      return;
    }

    const id=String(m.id||m.member_id||'');
    if(!id)return;

    const all=JSON.parse(localStorage.getItem(KEY)||'{}')||{};

    all[id]=r.data.map(x=>({
      date:x.date?String(x.date).slice(0,10)+'T12:00:00':'',
      diff:Number(x.diff),
      source:'manual'
    })).filter(x=>Number.isFinite(x.diff));

    localStorage.setItem(KEY,JSON.stringify(all));

    if(typeof window.nlgsHcpRender==='function'){
      window.nlgsHcpRender();
    }

    console.log('NLGS: handicap history restored — '+all[id].length+' rounds');
  }catch(e){
    console.warn('NLGS handicap history sync failed:',e);
  }
}

function scheduleHistorySync(){
  // nlgs-handicap-v3 automatically imports completed rounds after login.
  // Wait for that sync to finish, then restore the stored historical history.
  setTimeout(syncHistory,2000);
}

function install(){
  if(typeof window.openApp==='function'&&!window.nlgsHistoryOpenAppWrapped){
    const originalOpenApp=window.openApp;

    window.openApp=function(m){
      const result=originalOpenApp.apply(this,arguments);
      scheduleHistorySync();
      return result;
    };

    window.nlgsHistoryOpenAppWrapped=true;
  }

  // Also handle an already logged-in session.
  if(sessionStorage.getItem('nlgsMember')&&window.nlgsLoginCredentials){
    scheduleHistorySync();
  }
}

window.nlgsSyncHandicapHistory=syncHistory;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',install);
}else{
  install();
}

})();
