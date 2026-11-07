'use strict';
const {validateGuide,bindGuide}=require('./qualification.cjs'),{stable}=require('./coordinator.cjs');
const equal=(a,b)=>stable(a)===stable(b),ensure=(v,m)=>{if(!v)throw Error(m);};
function planGuideEdit(snapshot,input){
 const {event,guide,guideRevision}=snapshot;ensure(guide?.eventId===event.tdid&&Number.isInteger(guideRevision),'Approved guide is unavailable');
 ensure(input.expectedRevision===guideRevision,'Guide changed; reload before editing');ensure(input.stages&&Object.keys(input.stages).sort().join(',')==='s2,t','Supply both stage guides');
 const next=bindGuide({...structuredClone(guide),stages:structuredClone(input.stages)},event);validateGuide(next);
 ensure(equal(next.members,guide.members)&&equal(next.settings,guide.settings),'Event membership or format changed; reapprove the draw first');
 const changes=[],warnings=[];
 for(const stage of ['t','s2']){
  const old=guide.stages[stage],slots=next.stages[stage],table=event[stage+'_table'];ensure(old.length===slots.length,'Changing bracket capacity requires event setup review');
  for(let i=0;i<old.length;i++){
   if(equal(old[i],slots[i]))continue;changes.push({stage,index:i,before:old[i],after:slots[i]});
   const pair=i-i%2;ensure(!table[0][pair]&&!table[0][pair+1],'Cannot change a match with assigned players');
   ensure(!snapshot.active.some(m=>m.ttype===stage&&m.round===0&&m.index===pair),'Cannot edit an active match');
   ensure(!Object.keys(event[stage+'_result']?.[0]||{}).length,'Recorded stage results require separate guide review');
   if((old[i]===null)!==(slots[i]===null))ensure(!table.flat().some(Boolean),'Moving a bye after assignment is blocked');
  }
 }
 ensure(changes.length,'No guide positions changed');
 for(const stage of ['t','s2'])for(let i=0;i<next.stages[stage].length;i+=2){const a=next.stages[stage][i],b=next.stages[stage][i+1];if(a&&b&&a.pool===b.pool)warnings.push('Pool '+(a.pool+1)+' has an opening-round rematch in '+(stage==='t'?'Slutspel 1':'Slutspel 2'));}
 return {operation:'guide',tdid:event.tdid,changes,warnings,request:{path:'local/guide/update',body:{expectedRevision:guideRevision,guide:next}}};
}
function verifyGuide(before,p,after){const expected={...structuredClone(before),guide:p.request.body.guide,guideRevision:before.guideRevision+1};return equal(expected,after);}
module.exports={planGuideEdit,verifyGuide};
