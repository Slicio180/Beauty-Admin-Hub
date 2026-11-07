'use strict';
const {stable}=require('./coordinator.cjs');
const copy=x=>structuredClone(x);
const equal=(a,b)=>stable(a)===stable(b);
function ensure(value,message){if(!value)throw Error(message);}
function capacity(n){ensure(Number.isInteger(n)&&n>=2&&n<=1024,'Each stage needs 2–1024 qualifiers');return 2**Math.ceil(Math.log2(n));}
function bracket(size){ensure(capacity(size)===size,'Bracket capacity must be a power of two');return Array.from({length:Math.log2(size)+1},(_,r)=>Array(size/2**r).fill(''));}
function generateGuide(groups,top=2){
 ensure(Array.isArray(groups)&&groups.length>=2&&groups.length<=128,'Use 2–128 pools');ensure(Number.isInteger(top)&&top>=1,'Invalid advancing count');
 const stages={t:[],s2:[]};
 for(let pool=0;pool<groups.length;pool++){const size=groups[pool];ensure(Number.isInteger(size)&&size>top&&size<=16,'Invalid pool size');for(let rank=1;rank<=size;rank++)stages[rank<=top?'t':'s2'].push({pool,rank});}
 for(const key of ['t','s2']){
  const entries=stages[key].sort((a,b)=>a.rank-b.rank||a.pool-b.pool),size=capacity(entries.length);let order=[1,2];while(order.length<size){const max=order.length*2+1;order=order.flatMap(n=>[n,max-n]);}
  const slots=order.map(n=>entries[n-1]||null);
  // Retain rank tiers; avoid opening-round rematches where a tier-preserving swap exists.
  for(let i=0;i<size;i+=2){if(!slots[i]||!slots[i+1]||slots[i].pool!==slots[i+1].pool)continue;let fixed=false;
   for(let j=0;j<size;j++){const k=j^1;if(j===i||j===i+1||!slots[j]||slots[j].rank!==slots[i+1].rank)continue;if(slots[j].pool===slots[i].pool||slots[k]?.pool===slots[i+1].pool)continue;[slots[i+1],slots[j]]=[slots[j],slots[i+1]];fixed=true;break;}
   ensure(fixed,'Opening rematch requires a manual guide');
  }
  stages[key]=slots;
 }
 return {version:1,groups:groups.slice(),top,stages};
}
function validateGuide(guide){
 ensure(guide?.version===1&&Array.isArray(guide.groups)&&guide.groups.length>=2&&guide.groups.length<=128,'Invalid guide');
 ensure(Number.isInteger(guide.top)&&guide.top>=1,'Invalid qualification rule');const seen=new Set();
 for(const stage of ['t','s2']){
  const slots=guide.stages?.[stage];ensure(Array.isArray(slots)&&capacity(slots.length)===slots.length,'Invalid guide capacity');
  for(const slot of slots){if(slot===null)continue;ensure(slot&&Object.keys(slot).sort().join(',')==='pool,rank','Invalid guide slot');const {pool,rank}=slot;ensure(Number.isInteger(pool)&&pool>=0&&pool<guide.groups.length&&Number.isInteger(rank)&&rank>=1&&rank<=guide.groups[pool],'Invalid pool/rank');ensure((rank<=guide.top)===(stage==='t'),'Qualifier in wrong stage');const id=pool+':'+rank;ensure(!seen.has(id),'Duplicate qualifier guide');seen.add(id);}
 }
 ensure(guide.groups.every(n=>Number.isInteger(n)&&n>guide.top&&n<=16),'Invalid group sizes');ensure(seen.size===guide.groups.reduce((a,b)=>a+b,0),'Missing qualifier positions');return guide;
}
function bindGuide(guide,event){
 validateGuide(guide);ensure(event.rr_table.length===guide.groups.length,'Pool count changed');
 return {...copy(guide),eventId:event.tdid,members:event.rr_table.map(row=>row.filter(Boolean).slice().sort()),settings:{t:copy(event.t_setting),s2:copy(event.s2_setting),rr:copy(event.rr_setting||null)}};
}
function planAssignment(snapshot,guide,selected){
 validateGuide(guide);const {event,standings,completion,active=[]}=snapshot;ensure(event?.tdid&&event.status===30,'A running event is required');ensure(Array.isArray(event.rr_table)&&event.rr_table.length===guide.groups.length,'Pool count changed');ensure(guide.eventId===event.tdid&&equal(guide.members,event.rr_table.map(row=>row.filter(Boolean).slice().sort())),'Approved pool membership changed');ensure(equal(guide.settings,{t:event.t_setting,s2:event.s2_setting,rr:event.rr_setting||null}),'Approved format settings changed');
 ensure(standings?.tdid===event.tdid&&completion?.tdid===event.tdid&&standings.result===0&&completion.result===0,'Standings target mismatch');ensure(Array.isArray(selected)&&selected.length&&new Set(selected).size===selected.length,'Select completed pools');
 ensure(selected.every(i=>Number.isInteger(i)&&i>=0&&i<guide.groups.length),'Invalid selected pool');const resolved=new Map();
 const memberIds=event.rr_table.flat().filter(Boolean);ensure(new Set(memberIds).size===memberIds.length,'Repeated pool member');const known=new Set(event.entry_list.map(p=>p.tpid));ensure(memberIds.every(id=>known.has(id)),'Unknown pool member');
 for(const pool of selected){
  ensure(completion.groups?.['rr_'+pool]===1,'Selected pool is not complete');const ids=event.rr_table[pool].filter(Boolean);ensure(ids.length===guide.groups[pool],'Pool size changed');
  const groups=standings.groups.filter(g=>g.kind==='rr'&&g.index===pool);ensure(groups.length===1,'Ambiguous standings');const rows=groups[0].players;
  ensure(Array.isArray(rows)&&equal(rows.map(p=>p.tpid).sort(),ids.slice().sort()),'Pool membership changed');const ranks=new Set();
  for(const p of rows){ensure(Number.isInteger(p.rank)&&p.rank>0&&p.rank<=ids.length&&!ranks.has(p.rank),'Resolve tied ranks');ranks.add(p.rank);const win=p.win??p.w,lose=p.lose??p.l;ensure([win,lose].every(n=>Number.isInteger(n)&&n>=0)&&win+lose===ids.length-1,'Incomplete win/loss totals');resolved.set(pool+':'+p.rank,p.tpid);}
 }
 const set={},changes=[];
 for(const stage of ['t','s2']){
  const slots=guide.stages[stage],table=copy(event[stage+'_table']);ensure(event[stage+'_setting']?.tournament===1&&event[stage+'_setting'].t_player_count===slots.length,'Stage settings changed');ensure(Array.isArray(table)&&equal(table.map(r=>r.length),bracket(slots.length).map(r=>r.length)),'Bracket shape changed');
  const protectedMatch=(round,index)=>active.some(m=>m.ttype===stage&&m.round===round&&m.index===index)||[table[round][index],table[round][index+1]].some(id=>id&&Object.keys(event[stage+'_result']?.[round]?.[id]||{}).length);
  slots.forEach((slot,index)=>{
   if(slot===null){ensure(table[0][index]==='','A reserved bye slot is occupied');return;}
   const id=resolved.get(slot.pool+':'+slot.rank);if(!id)return;
   if(table[0][index]===id)return;ensure(table[0][index]==='','A guide position is already occupied');ensure(!protectedMatch(0,index-index%2),'Match has started; assignment blocked');
   table[0][index]=id;changes.push({stage,round:0,index,pool:slot.pool,rank:slot.rank,id});
  });
  // Only structural byes advance; an unresolved future qualifier is never a bye.
  for(let round=0;round<table.length-1;round++)for(let index=0;index<table[round].length;index+=2){const w=2**round,left=slots.slice(index*w,(index+1)*w).some(Boolean),right=slots.slice((index+1)*w,(index+2)*w).some(Boolean);if(left===right)continue;const winner=table[round][index]||table[round][index+1];if(!winner)continue;const old=table[round+1][index/2];ensure(old===''||old===winner,'Bye advancement conflicts with existing bracket');if(!old){ensure(!protectedMatch(round,index),'Bye match has activity');table[round+1][index/2]=winner;changes.push({stage,round:round+1,index:index/2,id:winner,bye:true});}}
  if(!equal(table,event[stage+'_table']))set[stage+'_table']=table;
 }
 ensure(changes.length,'Selected qualifiers are already assigned');return {operation:'qualify',tdid:event.tdid,selected:selected.slice(),changes,request:{path:'tournament/update',body:{tdid:event.tdid,expect_update_time:event.updateTime,set}}};
}
module.exports={capacity,bracket,generateGuide,validateGuide,bindGuide,planAssignment};
