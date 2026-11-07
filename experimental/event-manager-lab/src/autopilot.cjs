'use strict';
// Native integration configures Nakka's autopilot. This scheduler is ONLY a local rehearsal.
const {boards,autopilotPlan}=require('./operations.cjs'),{stable}=require('./coordinator.cjs');
const ensure=(v,m)=>{if(!v)throw Error(m);},key=(stage,round,index)=>`${stage}-${round}-${index}`;
function togglePlan(snapshot,input){const e=snapshot.event;ensure(e?.status===30&&snapshot.autopilot?.tdid===e.tdid&&snapshot.autopilot.result===0,'Autopilot target unavailable');ensure(['t','s2'].includes(input.stage)&&typeof input.enabled==='boolean','Invalid stage or state');ensure(snapshot.autopilot.config?.types?.[input.stage],'Configure this stage first');if(input.enabled){const cfg=snapshot.autopilot.config.types[input.stage];autopilotPlan(snapshot,{stage:input.stage,boardRange:cfg.badge_number,breakMinutes:cfg.break_time??0,rounds:cfg.round??0,enabled:true});}return {operation:'autopilot',tdid:e.tdid,request:{path:'autopilot/update',body:{tdid:e.tdid,config:{types:{[input.stage]:{enable:input.enabled?1:0}}}}}};}
function monitor(snapshot,now=Date.now()){
 const a=snapshot.autopilot;ensure(a?.result===0&&a.tdid===snapshot.event.tdid,'Autopilot read unavailable');
 const status=a.status,known=Number.isFinite(status?.time)&&status.time<=now+5000,fresh=known&&now-status.time<=30000;
 return {configured:!!a.config,enabled:['t','s2'].filter(k=>a.config?.types?.[k]?.enable===1),service:status?.error?'error':!known?'unavailable':!fresh?'stale':'recent-status',lastStatusAt:known?status.time:null,held:status?.held??null,synthetic:snapshot.rehearsal?.mode==='synthetic',note:'An enabled configuration is not proof of running automatic assignment.'};
}
function matches(snapshot,stage){const table=snapshot.event[stage+'_table']||[];return table.slice(0,-1).flatMap((row,round)=>row.flatMap((id,index)=>index%2?[]:[{stage,round,index,id:key(stage,round,index),players:[id,row[index+1]],final:round===table.length-2}]));}
function tick(snapshot){
 ensure(snapshot.rehearsal?.mode==='synthetic'&&snapshot.event.tdid==='local-rehearsal','Rehearsal scheduler cannot operate a native event');const next=structuredClone(snapshot),e=next.event,r=next.rehearsal,now=r.clock,held={},assigned=[];ensure(Number.isFinite(now),'Invalid rehearsal clock');
 const usedBoards=new Set(),busy=new Set();
 for(const stage of ['t','s2'])for(const m of matches(next,stage)){const badge=e.badge[m.id];if(badge?.str&&badge.st===1)m.players.filter(Boolean).forEach(id=>busy.add(id));}
 for(const b of Object.values(e.badge||{}))if(b?.str&&b.st===1)usedBoards.add(String(Number(b.str)));
 for(const m of next.active){const ids=m.players||(['t','s2','t3','s2_3'].includes(m.ttype)?next.event[m.ttype+'_table']?.[m.round]?.slice(m.index,m.index+2):null);ensure(ids?.length===2&&ids.every(Boolean),'Active player identities unavailable');ids.forEach(id=>busy.add(id));}
 const stages=r.lastAssignedStage==='t'?['s2','t']:['t','s2'],lists=stages.map(stage=>matches(next,stage)),candidates=[];
 for(let i=0;i<Math.max(...lists.map(l=>l.length));i++)for(const list of lists)if(list[i])candidates.push(list[i]);
 for(const m of candidates){
  const stage=m.stage,cfg=next.autopilot.config?.types?.[stage];if(!cfg)continue;const available=boards(cfg.badge_number).map(String);
   const badge=e.badge[m.id];
   if(r.finished[m.id]!==undefined){if(next.autopilot.config.remove_old_badge===1&&badge?.st===2)delete e.badge[m.id];continue;}
   if(badge?.str&&badge.st===1){held[m.id]={reason:'assigned',board:badge.str};continue;}
   if(!cfg.enable){held[m.id]={reason:'paused'};continue;}
   if(m.final){held[m.id]={reason:'manual-final'};continue;}
   if(cfg.round!==0&&m.round+1>Math.floor(cfg.round)){held[m.id]={reason:'outside-round-scope'};continue;}
   const guide=next.guide?.stages?.[stage];
   if(m.round===0&&guide&&(guide[m.index]===null||guide[m.index+1]===null)){held[m.id]={reason:'bye'};continue;}
   if(!m.players.every(id=>id&&id!=='empty')){held[m.id]={reason:'opponent-undecided'};continue;}
   if(m.players.some(id=>busy.has(id))){held[m.id]={reason:'player-busy'};continue;}
   if(m.players.some(id=>(r.playerReadyAt[id]||0)>now)){held[m.id]={reason:'player-break'};continue;}
   const board=available.find(b=>!usedBoards.has(b)&&(r.boardReadyAt[b]||0)<=now);
   if(!board){held[m.id]={reason:available.some(b=>!usedBoards.has(b))?'board-break':'waiting-board'};continue;}
   e.badge[m.id]={str:board,st:1};usedBoards.add(board);m.players.forEach(id=>busy.add(id));r.lastAssignedStage=stage;assigned.push({key:m.id,board,players:m.players});held[m.id]={reason:'assigned',board};
 }
 r.revision++;e.updateTime++;next.autopilot.status={time:now,error:'',held};return {next,assigned,held};
}
function tickPlan(snapshot){const result=tick(snapshot);return {operation:'autopilot-rehearsal',tdid:snapshot.event.tdid,assigned:result.assigned,held:result.held,request:{path:'local/autopilot/tick',body:{next:result.next}}};}
function verifyTick(before,p,after){return stable(after)===stable(p.request.body.next);}
function finishRehearsal(snapshot,input){
 ensure(snapshot.rehearsal?.mode==='synthetic'&&snapshot.event.tdid==='local-rehearsal','Synthetic event required');const m=['t','s2'].flatMap(s=>matches(snapshot,s)).find(m=>m.id===input.match);ensure(m,'Unknown rehearsal match');ensure(m.players.every(Boolean),'Match players undecided');const badge=snapshot.event.badge[m.id];ensure(badge?.str&&badge.st===1,'Match has no active badge');ensure(snapshot.rehearsal.finished[m.id]===undefined,'Already finished');
 const next=structuredClone(snapshot),r=next.rehearsal,cfg=next.autopilot.config.types[m.stage];r.finished[m.id]=r.clock;const ready=r.clock+(cfg.break_time||0)*60000;r.boardReadyAt[badge.str]=ready;for(const id of m.players)r.playerReadyAt[id]=ready;next.event.badge[m.id].st=2;next.active=next.active.filter(a=>!(a.ttype===m.stage&&a.round===m.round&&a.index===m.index));next.event.updateTime++;r.revision++;return next;
}
module.exports={togglePlan,monitor,matches,tick,tickPlan,verifyTick,finishRehearsal};
