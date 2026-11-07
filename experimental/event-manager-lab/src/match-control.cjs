'use strict';
const ensure=(v,m)=>{if(!v)throw Error(m);};
function resultPlan(snapshot,input){
 const e=snapshot.event,{stage,round,index,left,right}=input;
 ensure(e?.status===30,'Event must be running');ensure(['t','s2','t3','s2_3'].includes(stage),'Unsupported result stage');
 const table=e[stage+'_table'];ensure(Number.isInteger(round)&&round>=0&&round<table.length-1&&Number.isInteger(index)&&index>=0&&index%2===0&&index+1<table[round].length,'Invalid match position');
 const ids=table[round].slice(index,index+2);ensure(ids.every(Boolean)&&ids[0]!==ids[1],'Both players must be decided');ensure(!snapshot.active.some(m=>m.ttype===stage&&m.round===round&&m.index===index),'Match is currently active');
 const settings=e[(stage.startsWith('s2')?'s2':'t')+'_setting'];ensure(settings?.limit===1&&!settings.game_setting?.length&&settings.drawMode===0,'Only qualified simple leg format is supported');
 const target=settings.limit_leg_count;ensure(Number.isInteger(target)&&target>0,'Invalid match format');ensure([left,right].every(n=>Number.isInteger(n)&&n>=0&&n<=target)&&left!==right&&Math.max(left,right)===target,'Enter a completed match score');
 ensure(ids.every(id=>!Object.keys(e[stage+'_result']?.[round]?.[id]||{}).length),'Existing result correction needs downstream review');
 return {operation:'result',tdid:e.tdid,requiresNativeQualification:true,request:{path:'tournament/result/update',body:{tdid:e.tdid,ttype:stage,round,t_no:index/2+1,tpid:ids[0],vsTpid:ids[1],result:left,vsResult:right}}};
}
function releasePlan(snapshot,input){ensure(snapshot.event.status===30,'Event must be running');ensure(typeof input.matchId==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(input.matchId),'Invalid match ID');ensure(snapshot.matches?.some(m=>m.tmid===input.matchId&&m.tdid===snapshot.event.tdid),'Match identity must be read from provider');return {operation:'release',tdid:snapshot.event.tdid,requiresNativeQualification:true,request:{path:'tournament/match/release',body:{tdid:snapshot.event.tdid,tmid:input.matchId}}};}
module.exports={resultPlan,releasePlan};
