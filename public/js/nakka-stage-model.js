/* Read-only competition projection. Nakka alone supplies results/advancement. */
(function(root){
 'use strict';
 const target='t_QHaG_7792';
 const fail=()=>{throw Error('Unsupported or mismatched TEST stage data.');};
 const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
 function badge(t,key){
  const map=t.badge;if(map==null)return {text:null,state:'unavailable'};
  if(typeof map!=='object'||Array.isArray(map))return {text:null,state:'unavailable'};
  if(!Object.hasOwn(map,key))return {text:null,state:'unassigned'};
  const value=map[key];if(value==null)return {text:null,state:'unavailable'};
  if(typeof value!=='object'||Array.isArray(value)||typeof value.str!=='string'||value.str.length>40||![0,1,2].includes(value.st))return {text:null,state:'unavailable'};
  return {text:value.str.trim()||null,state:value.str.trim()?['assigned','in-progress','finished'][value.st]:'unassigned'};
 }
 function format(setting,round,slotCount,third=false){
  if(!setting||typeof setting!=='object'||Array.isArray(setting))return null;
  let selected=setting;
  if(setting.game_setting!=null){
   if(!Array.isArray(setting.game_setting)||setting.game_setting.some(v=>!v||typeof v!=='object'||!Number.isInteger(v.round)))return null;
   const matches=setting.game_setting.filter(s=>s&&(third?[-3]:[round+1,slotCount===2?-1:slotCount===4?-2:0].filter(n=>n!==0)).includes(s.round));
   if(matches.length>1)return null;if(matches.length===1)selected={...setting,...matches[0]};
  }
  const n=selected.limit===1?selected.limit_leg_count:selected.limit===2?selected.limit_set_count:null;
  if(!Number.isInteger(n)||n<1||n>99||![0,1].includes(selected.drawMode))return null;
  return selected.drawMode===1?'Limit '+n+' '+(selected.limit===1?'legs':'sets')+' · draws allowed':'First to '+n+' '+(selected.limit===1?'legs':'sets');
 }
 function project(tournament,standings,schedule){
  const t=tournament?.tournament;
  if(tournament?.result!==0||!t||t.tdid!==target||t.lgid!=='lg_tM2v_3523'||t.team_games===1||!Array.isArray(t.entry_list)||t.entry_list.length>1000)fail();
  if(standings?.result!==0||standings.tdid!==target||!Array.isArray(standings.groups)||standings.groups.length>1000)fail();
  const names=new Map();
  for(const p of t.entry_list){if(typeof p.tpid!=='string'||names.has(p.tpid)||typeof p.name!=='string')fail();names.set(p.tpid,p.name);}
  const slot=id=>id===''?{id:null,name:'Awaiting player',state:'pending'}:id==='empty'?{id:null,name:'Bye',state:'bye'}:names.has(id)?{id,name:names.get(id),state:'player'}:fail();
  if(schedule&&(schedule.result!==0||schedule.tdid!==target||!Array.isArray(schedule.schedule)))fail();
  const pools=standings.groups.map(g=>{
   if(!['lg','rr'].includes(g.kind)||!Number.isInteger(g.index)||g.index<0||!Array.isArray(g.players)||g.players.length>1000)fail();
   const ids=new Set();const pool={id:g.kind+'_'+g.index,number:g.index+1,players:g.players.map(p=>{
    if(!names.has(p.tpid)||ids.has(p.tpid))fail();ids.add(p.tpid);
    return {...slot(p.tpid),rank:number(p.rank)>0?p.rank:null,played:number(p.p),wins:number(p.win??p.w),draws:number(p.d),losses:number(p.lose??p.l),points:number(p.pts)};
   })};
   const table=t[g.kind+'_table']?.[g.index];pool.matrix=null;pool.format=t[g.kind+'_setting']?.game_setting?.length?null:format(t[g.kind+'_setting'],g.index,0);
   if(table!=null){
    if(!Array.isArray(table)||table.length>1000)fail();const members=table.filter(id=>id!==''&&id!=='empty').map(slot);if(new Set(members.map(p=>p.id)).size!==members.length)fail();
    const cards=g.kind==='lg'?schedule?.schedule[g.index]:null;
    if(members.length<=16&&(g.kind==='rr'||Array.isArray(cards))){
     const pairs=new Map();
     if(g.kind==='lg')for(const card of cards){
      if(!card||!Array.isArray(card.p)||card.p.length!==2||typeof card.lsid!=='string'||!/^[A-Za-z0-9]{4}$/.test(card.lsid))fail();
      const [a,b]=card.p;if(['','empty'].includes(a)||['','empty'].includes(b))continue;
      if(!members.some(p=>p.id===a)||!members.some(p=>p.id===b)||a===b)fail();const key=[a,b].sort().join('|');if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(t.lg_result?.[g.index+'_'+card.lsid]||{});
     }
     pool.matrix=members.map((p,i)=>({...p,position:i+1,cells:members.map(v=>{
      if(v.id===p.id)return {state:'self'};
      const matches=g.kind==='rr'?[t.rr_result?.[g.index]||{}]:pairs.get([p.id,v.id].sort().join('|'))||[];
      if(matches.length>1)return {state:'multiple'};
      const result=matches[0],a=result?.[p.id]?.[v.id],b=result?.[v.id]?.[p.id];
      return {state:number(a?.r)!==null&&number(b?.r)!==null?'result':'pending',score:number(a?.r),opponentScore:number(b?.r),average:number(a?.a)};
     })}));
    }
   }
   return pool;
  });
  const knockouts=[];
  for(const kind of ['t','s2']){
   const table=t[kind+'_table'];if(table==null)continue;if(!Array.isArray(table)||table.length>12)fail();
   const rounds=table.map((players,round)=>{
    if(!Array.isArray(players)||players.length>1024)fail();
    const slots=players.map(slot),matches=[];
    // Only explicit numeric opening guide values; never substitute league ranks.
    const guide=t[kind+'_init'],candidate=Array.isArray(guide?.[0])?guide[0]:guide;
    const drawNumbers=round===0&&Array.isArray(candidate)&&candidate.length===players.length&&candidate.every(n=>Number.isInteger(n)&&n>0&&n<=players.length)&&new Set(candidate).size===candidate.length?candidate:null;
    for(let i=0;i<slots.length;i+=2){const left=slots[i],right=slots[i+1]||{id:null,name:'Awaiting player',state:'pending'};
     const results=t[kind+'_result']?.[round],a=left.id&&right.id?results?.[left.id]?.[right.id]:null,b=left.id&&right.id?results?.[right.id]?.[left.id]:null;
     matches.push({leftDrawNumber:drawNumbers?.[i]??null,rightDrawNumber:drawNumbers?.[i+1]??null,key:kind+'-'+round+'-'+i,board:badge(t,kind+'-'+round+'-'+i),left,right,leftScore:number(a?.r),rightScore:number(b?.r),leftAverage:number(a?.a),rightAverage:number(b?.a)});
    }
    return {round:round+1,slotCount:players.length,format:format(t[kind+'_setting'],round,players.length),matches};
   });
   const thirdKind=kind==='t'?'t3':'s2_3';let thirdPlace=null;
   const third=t[thirdKind+'_table'];if(third!=null&&!Array.isArray(third))fail();if(third?.length){if(!Array.isArray(third[0])||third[0].length!==2)fail();const [left,right]=third[0].map(slot),results=t[thirdKind+'_result']?.[0],a=left.id&&right.id?results?.[left.id]?.[right.id]:null,b=left.id&&right.id?results?.[right.id]?.[left.id]:null;
    thirdPlace={key:thirdKind+'-0-0',board:badge(t,thirdKind+'-0-0'),left,right,leftScore:number(a?.r),rightScore:number(b?.r),leftAverage:number(a?.a),rightAverage:number(b?.a),format:format(t[kind+'_setting'],0,2,true)};
   }
   knockouts.push({kind,rounds,thirdPlace});
  }
  // No admin IDs, passwords, consent, messages or private provider fields.
  return {eventId:target,title:String(t.title||''),eventDate:number(t.t_date),updateTime:number(t.updateTime),status:t.status,pools,knockouts};
 }
 const api=Object.freeze({project});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyNakkaStages=api;
})(typeof globalThis==='object'?globalThis:this);
