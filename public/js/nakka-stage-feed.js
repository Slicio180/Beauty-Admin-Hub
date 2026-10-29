/* Fixed TEST event, public GETs only. No credentials, provider writes or autopilot changes. */
(function(root){
 'use strict';
 const base='https://api.n01darts.com/api/v1/',id='t_RqC2_2034';
 function create({fetch,onData,onError,model=root.BeautyNakkaStages}){
  let busy=false,revision=0,stopped=false;
  async function get(path){if(stopped)throw Error('Stopped');const response=await fetch(base+path,{method:'GET',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok&&!(path.startsWith('tournament/standings?')&&data.result===-51))throw Error('Stage unavailable');return data;}
  async function refresh(){
   if(busy||stopped)return;busy=true;const ticket=revision;
   try{
    const before=await get('tournament/get?tdid='+id);let standings=await get('tournament/standings?tdid='+id);const hasLeague=before.tournament?.lg_table?.some(g=>Array.isArray(g)&&g.length>0),hasRobin=before.tournament?.rr_table?.some(g=>Array.isArray(g)&&g.length>0);
    if(standings.result===-51&&!hasLeague&&!hasRobin)standings={result:0,tdid:id,groups:[]};
    const schedule=hasLeague?await get('league/schedule/get?tdid='+id):undefined,after=await get('tournament/get?tdid='+id);
    if(before.result!==0||after.result!==0||!Number.isFinite(before.tournament?.updateTime)||before.tournament.updateTime!==after.tournament?.updateTime)throw Error('Stage changed during refresh');
    const data=model.project(after,standings,schedule);if(!stopped&&ticket===revision)onData(data);
   }catch(error){if(!stopped&&ticket===revision)onError('Stage data unavailable or changed.');}
   finally{busy=false;}
  }
  return Object.freeze({refresh,stop(){stopped=true;revision++;}});
 }
 const api=Object.freeze({create});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyNakkaStageFeed=api;
})(typeof globalThis==='object'?globalThis:this);
