/* Pure local planning. Complete entries (including doubles pairs) are indivisible. */
(function(root){
'use strict';
function validate(event,plan){
 if(!event||!['singles','doubles'].includes(event.format)||!Array.isArray(event.entries)||event.entries.length<2)throw Error('Invalid tournament entries.');
 const size=event.format==='doubles'?2:1,players=new Set();
 event.entries.forEach(team=>{if(!Array.isArray(team)||team.length!==size)throw Error('Invalid team size.');team.forEach(p=>{if(!p.id||players.has(p.id))throw Error('Repeated or missing player.');players.add(p.id);});});
 if(!plan||plan.eventId!==event.id||!Array.isArray(plan.groups)||!plan.groups.length||plan.groups.length>Math.floor(event.entries.length/2))throw Error('Choose groups with at least two entries each.');
 const ids=plan.groups.flat();
 if(ids.length!==event.entries.length||new Set(ids).size!==ids.length||ids.some(i=>!Number.isInteger(i)||i<0||i>=event.entries.length))throw Error('Every entry must appear exactly once.');
 const sizes=plan.groups.map(g=>g.length);
 if(Math.min(...sizes)<2||Math.max(...sizes)-Math.min(...sizes)>1)throw Error('Groups must be balanced, with at least two entries each.');
 return plan;
}
function draw(event,count,random=Math.random){
 if(!Number.isInteger(count)||count<1||count>Math.floor(event.entries.length/2))throw Error('Choose groups with at least two entries each.');
 const order=event.entries.map((_,i)=>i);
 for(let i=order.length-1;i>0;i--){const value=random();if(!Number.isFinite(value)||value<0||value>=1)throw Error('Invalid random source.');const j=Math.floor(value*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const plan={eventId:event.id,groups:Array.from({length:count},()=>[]),method:'random',status:'LOCAL_REVIEW'};
 order.forEach((id,i)=>plan.groups[i%count].push(id));return validate(event,plan);
}
function swap(event,plan,a,b){validate(event,plan);const next=JSON.parse(JSON.stringify(plan));let first,second;next.groups.forEach((g,gi)=>g.forEach((id,ii)=>{if(id===a)first=[gi,ii];if(id===b)second=[gi,ii];}));if(!first||!second||a===b)throw Error('Choose two different entries.');[next.groups[first[0]][first[1]],next.groups[second[0]][second[1]]]=[b,a];next.status='LOCAL_REVIEW';return validate(event,next);}
const api={draw,validate,swap};if(typeof module==='object'&&module.exports)module.exports=api;else root.AikPoolPlanner=Object.freeze(api);
})(globalThis);
