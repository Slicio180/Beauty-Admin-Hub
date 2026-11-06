/* TEST-only memo handoff engine. No default transport, credentials or exposed route.
 * Notes describe pool plans; badges/autopilot remain under Nakka's control.
 */
'use strict';
const crypto=require('node:crypto');
const id='t_QHaG_7792',league='lg_tM2v_3523';
const copy=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function target(t){if(!t||t.tdid!==id||t.lgid!==league||t.title!=='Beauty Registration TEST event DO NOT USE LIVE'||![10,20,25].includes(t.status)||t.team_games!==0||!Number.isSafeInteger(t.updateTime)||t.lg_setting?.turnaround!==0||t.lg_setting?.swiss)throw Error('Only the pre-start single round-robin TEST event is supported.');}
function prepare(plan,t,bindings,now=Date.now()){
 target(t);if(plan?.schemaVersion!==1||plan.kind!=='hub-board-plan'||plan.state!=='PLANNED_NOT_SENT'||plan.eventId!==id||plan.leagueId!==league||!Array.isArray(plan.pools)||!plan.pools.length||plan.pools.length>1024||!Array.isArray(t.lg_table)||t.lg_table.length!==plan.pools.length)throw Error('Pool plan does not match TEST groups.');
 if(!Array.isArray(bindings)||!Array.isArray(plan.availableBoards)||new Set(plan.availableBoards).size!==plan.availableBoards.length||plan.availableBoards.some(n=>!Number.isInteger(n)||n<1||n>1000))throw Error('Invalid boards or identity bindings.');
 const map=new Map(),used=new Set();for(const b of bindings){if(!b||typeof b.id!=='string'||map.has(b.id)||typeof b.tpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(b.tpid)||used.has(b.tpid))throw Error('Ambiguous event identity.');map.set(b.id,b.tpid);used.add(b.tpid);}
 const dateParts=Number.isFinite(t.t_date)?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t.t_date*1000)):null;
 if(plan.eventDate!==dateParts)throw Error('Hub plan and Nakka event date differ.');
 if(!Number.isSafeInteger(now)||!Number.isFinite(Date.parse(plan.frozenAt))||now<Date.parse(plan.frozenAt)||now-Date.parse(plan.frozenAt)>=300000)throw Error('Frozen pool plan expired.');
 const batches=new Map(),all=new Set();const memo=plan.pools.map((p,i)=>{
  if(p.poolNumber!==i+1||!plan.availableBoards.includes(p.board)||!Number.isInteger(p.batch)||p.batch<1||!Array.isArray(p.players)||p.players.length<3||p.players.length>5)throw Error('Invalid pool assignment.');
  if(!batches.has(p.board))batches.set(p.board,[]);batches.get(p.board).push(p.batch);
  const members=p.players.map(q=>{if(!map.has(q.id)||all.has(q.id))throw Error('Missing or repeated event identity.');all.add(q.id);return map.get(q.id);});
  if(JSON.stringify(t.lg_table[i])!==JSON.stringify(members))throw Error('Nakka group membership or order changed.');
  return 'Pool '+p.poolNumber+' · Board '+p.board+' · Batch '+p.batch+' (planned)';
 });
 if(all.size!==map.size||[...batches.values()].some(values=>values.sort((a,b)=>a-b).some((n,i)=>n!==i+1)))throw Error('Incomplete plan or duplicate board batch.');
 const existing=t.lg_memo==null?[]:t.lg_memo;if(!Array.isArray(existing)||existing.some(v=>typeof v!=='string'))throw Error('Unsupported existing group notes.');
 // Never silently replace organiser notes, even for an otherwise valid plan.
 if(existing.some((v,i)=>v&&v!==memo[i]))throw Error('Existing Nakka group notes need explicit manual review.');
 const snapshot={eventId:id,leagueId:league,revision:t.updateTime,table:copy(t.lg_table),beforeMemo:copy(existing),payload:{tdid:id,ttype:'lg',memo},createdAt:now,expiresAt:now+300000};
 return Object.freeze({...snapshot,digest:hash(snapshot)});
}
function create({readEvent,writeMemo,audit,nativeMemoVerified=false,now=Date.now}){
 if(typeof readEvent!=='function'||typeof writeMemo!=='function'||typeof audit!=='function')throw Error('Explicit transport and durable audit required.');
 const consumed=new Set(),inFlight=new Set();
 return {async send(review,approval){
  const {digest,...snapshot}=review||{};
  if(!nativeMemoVerified)throw Error('Native TEST memo qualification is pending.');
  if(approval!==digest||digest!==hash(snapshot)||consumed.has(digest)||inFlight.has(digest)||!Number.isFinite(snapshot.createdAt)||!Number.isFinite(snapshot.expiresAt)||now()<snapshot.createdAt||now()>=snapshot.expiresAt)throw Error('Review expired, changed or already attempted.');
  inFlight.add(digest);
  try{
  const before=await readEvent();target(before);
  if(before.updateTime!==snapshot.revision||JSON.stringify(before.lg_table)!==JSON.stringify(snapshot.table)||JSON.stringify(before.lg_memo??[])!==JSON.stringify(snapshot.beforeMemo))throw Error('Nakka changed; review the board plan again.');
  if(snapshot.eventId!==id||snapshot.leagueId!==league||snapshot.payload?.tdid!==id||snapshot.payload?.ttype!=='lg'||!Array.isArray(snapshot.payload.memo))throw Error('Unexpected handoff target.');
  // A durable ATTEMPTED receipt must succeed before the one allowed write.
  const claim=await audit({state:'ATTEMPTED',digest,eventId:id,revision:snapshot.revision});
  if(claim?.claimed!==true)throw Error('This event revision already has a durable attempt. Inspect its journal.');consumed.add(digest);
  try{
   const result=await writeMemo(copy(snapshot.payload));if(result?.result!==0)throw Error('Provider did not acknowledge notes.');
   const after=await readEvent();target(after);
   if(JSON.stringify(after.lg_table)!==JSON.stringify(snapshot.table)||JSON.stringify(after.lg_memo)!==JSON.stringify(snapshot.payload.memo))throw Error('Notes could not be read back exactly.');
   await audit({state:'READBACK_VERIFIED',digest,eventId:id,revision:snapshot.revision});return {state:'READBACK_VERIFIED',digest,boardAssignmentsSent:false};
  }catch(error){try{await audit({state:'UNKNOWN_INSPECT_NAKKA',digest,eventId:id,revision:snapshot.revision});}catch{}const e=Error('Board notes outcome uncertain. Inspect Nakka and audit before any further attempt.');e.code='UNKNOWN_INSPECT_NAKKA';throw e;}
  }finally{inFlight.delete(digest);}
 }};
}
module.exports={prepare,create};
