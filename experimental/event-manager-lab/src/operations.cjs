'use strict';
const {stable}=require('./coordinator.cjs');
function ensure(v,m){if(!v)throw Error(m);}
function boards(text){ensure(typeof text==='string'&&text.length<=200&&text.trim(),'Choose boards');const out=[];for(const term of text.split(',')){const m=term.trim().match(/^(\d+)(?:-(\d+))?$/);ensure(m,'Invalid board range');const a=Number(m[1]),b=Number(m[2]||m[1]);ensure(a>0&&b>=a&&b<=1000,'Invalid board bounds');for(let n=a;n<=b;n++){ensure(!out.includes(n),'Repeated board');out.push(n);}}return out;}
function badgePlan(snapshot,input){
 const e=snapshot.event;ensure(e?.status===30,'Event must be running');const {stage,round,index,board}=input;ensure(['t','s2','t3','s2_3'].includes(stage),'Unsupported badge stage');ensure(Number.isInteger(round)&&round>=0&&Number.isInteger(index)&&index>=0&&index%2===0,'Invalid badge match');
 ensure(snapshot.autopilot?.config?.types?.[stage.startsWith('s2')?'s2':'t']?.enable!==1,'Pause autopilot before manually changing its badges');
 const row=e[stage+'_table']?.[round];ensure(row&&index+1<row.length&&row[index]&&row[index+1],'Match has unresolved players or a bye');ensure(typeof board==='string'&&board.length<=40,'Invalid badge text');if(board)ensure(boards(board).length===1&&String(Number(board))===board,'Choose one canonical numeric board');
 ensure(!snapshot.active?.some(m=>m.ttype===stage&&m.round===round&&m.index===index),'Match is already active');
 if(board)ensure(!Object.entries(e.badge||{}).some(([key,b])=>key!==`${stage}-${round}-${index}`&&b?.str===board&&b.st===1),'Board is occupied');
 return {operation:'badge',tdid:e.tdid,request:{path:'tournament/badge/update',body:{tdid:e.tdid,ttype:stage,round,index,str:board,st:board?1:0}}};
}
function autopilotPlan(snapshot,input){
 const e=snapshot.event;ensure(e?.status===30,'Event must be running');ensure(snapshot.autopilot?.tdid===e.tdid&&snapshot.autopilot.result===0,'Autopilot read unavailable');const {stage,boardRange,breakMinutes,rounds,enabled}=input;
 ensure(['t','s2'].includes(stage),'Unsupported automatic stage');boards(boardRange);ensure(Number.isInteger(breakMinutes)&&breakMinutes>=0&&breakMinutes<=1440,'Invalid break');ensure(Number.isFinite(rounds)&&rounds>=0&&rounds<=99&&Number.isInteger(rounds*2),'Invalid round scope');ensure(typeof enabled==='boolean','Invalid automatic state');

 return {operation:'autopilot',tdid:e.tdid,request:{path:'autopilot/update',body:{tdid:e.tdid,config:{types:{[stage]:{badge_number:boardRange,break_time:breakMinutes,round:rounds,enable:enabled?1:0}}}}}};
}
function verifyOperation(before,proposal,after){
 if(after.event.tdid!==proposal.tdid)return false;
 const clean=e=>{const n=structuredClone(e);delete n.updateTime;return n;};
 if(proposal.operation==='badge'){
  const {ttype,round,index,str,st}=proposal.request.body,key=`${ttype}-${round}-${index}`,actual=after.event.badge?.[key];
  if(str?actual?.str!==str||actual?.st!==st:actual!=null&&actual.str!=='')return false;
  const a=clean(before.event),b=clean(after.event);a.badge={...(a.badge||{})};b.badge={...(b.badge||{})};delete a.badge[key];delete b.badge[key];return stable(a)===stable(b);
 }
 if(proposal.operation==='autopilot'){
  const patch=proposal.request.body.config,expected=structuredClone(before.autopilot.config);expected.types={...expected.types,...patch.types};
  // The server merges each stage's properties too; preserve all other stored fields.
  for(const key of Object.keys(patch.types))expected.types[key]={...before.autopilot.config.types?.[key],...patch.types[key]};
  return stable(expected)===stable(after.autopilot.config)&&stable(clean(before.event))===stable(clean(after.event));
 }
 return false;
}
module.exports={boards,badgePlan,autopilotPlan,verifyOperation};
