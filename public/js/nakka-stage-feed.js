/* Fixed TEST event, public GETs only. No credentials, provider writes or autopilot changes. */
(function(root){
 'use strict';
 const base='https://api.n01darts.com/api/v1/',id=root.BeautySelectedEventId||'t_QHaG_7792';
 function create({fetch,onData,onError,model=root.BeautyNakkaStages,includeLive=false,liveModel=root.BeautyNakkaPoolLive,plan=null,includeKnockouts=false}){
  let busy=false,revision=0,stopped=false,baseData=null,baseAt=0;
  async function get(path){if(stopped)throw Error('Stopped');const response=await fetch(base+path,{method:'GET',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok&&!(path.startsWith('tournament/standings?')&&data.result===-51))throw Error('Stage unavailable');return data;}
  async function refresh(){
   if(busy||stopped)return;busy=true;const ticket=revision;
   try{
    const before=await get('tournament/get?tdid='+id);let standings=await get('tournament/standings?tdid='+id);const hasLeague=before.tournament?.lg_table?.some(g=>Array.isArray(g)&&g.length>0),hasRobin=before.tournament?.rr_table?.some(g=>Array.isArray(g)&&g.length>0);
    if(standings.result===-51&&!hasLeague&&!hasRobin)standings={result:0,tdid:id,groups:[]};
    const schedule=hasLeague?await get('league/schedule/get?tdid='+id):undefined,after=await get('tournament/get?tdid='+id);
    if(before.result!==0||after.result!==0||!Number.isFinite(before.tournament?.updateTime)||before.tournament.updateTime!==after.tournament?.updateTime)throw Error('Stage changed during refresh');
    baseData=model.project(after,standings,schedule,id);const snapshot=includeLive?await liveModel.collect(get,baseData,includeKnockouts):null;let data=includeLive?liveModel.apply(baseData,snapshot,plan):baseData;if(includeKnockouts&&snapshot)data=liveModel.applyKnockouts(data,snapshot);if(!stopped&&ticket===revision){baseAt=Date.now();onData(data);}
   }catch(error){baseData=null;if(!stopped&&ticket===revision)onError('Stage data unavailable or changed.');}
   finally{busy=false;}
  }
  async function refreshLive(){
   if(!includeLive||!baseData||busy||stopped)return;if(Date.now()-baseAt>15000){onError('Full snapshot expired.');return;}busy=true;const ticket=revision;
   try{const snapshot=await liveModel.collect(get,baseData,includeKnockouts);if(!stopped&&ticket===revision)onData(includeKnockouts?liveModel.applyKnockouts(liveModel.apply(baseData,snapshot,plan),snapshot):liveModel.apply(baseData,snapshot,plan));}
   catch(e){if(!stopped&&ticket===revision)onError('Live pool data unavailable.');}finally{busy=false;}
  }
  return Object.freeze({refresh,refreshLive,setPlan(next){if(next?.eventId===id&&Array.isArray(next.pools))plan=next;},stop(){stopped=true;revision++;}});
 }
 const api=Object.freeze({create});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyNakkaStageFeed=api;
})(typeof globalThis==='object'?globalThis:this);
