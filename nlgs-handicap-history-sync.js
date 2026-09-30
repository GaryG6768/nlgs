(function(){
'use strict';
const KEY='nlgsHandicapTrackerV3';
async function sync(){
 try{
  const m=JSON.parse(sessionStorage.getItem('nlgsMember')||'null');
  const c=window.nlgsLoginCredentials||{};
  if(!m||!c.name||!c.pin||typeof sb==='undefined'||!sb.rpc)return;
  const r=await sb.rpc('get_nlgs_handicap_history_secure',{p_member_name:c.name,p_member_pin:c.pin});
  if(r.error||!Array.isArray(r.data))return;
  const all=JSON.parse(localStorage.getItem(KEY)||'{}')||{};
  const id=String(m.id||m.member_id||'');
  all[id]=r.data.map(x=>({date:x.date?String(x.date).slice(0,10)+'T12:00:00':'',diff:Number(x.diff),source:'manual'})).filter(x=>Number.isFinite(x.diff));
  localStorage.setItem(KEY,JSON.stringify(all));
  if(typeof window.nlgsHcpRender==='function')window.nlgsHcpRender();
 }catch(e){console.warn('NLGS handicap history sync skipped',e);}
}
function wait(){if(window.nlgsLoginCredentials&&typeof sb!=='undefined'){sync();return;}setTimeout(wait,500);}
wait();
window.nlgsSyncHandicapHistory=sync;
})();
