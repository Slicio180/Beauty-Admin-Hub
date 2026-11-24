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
// Ratings are explicit three-dart averages, never inferred from a name.
function rating(player){
 const r=player.rating;
 if(!r||typeof r.average!=='number'||!Number.isFinite(r.average)||r.average<=0||r.average>180||!['manual','dartstatistik'].includes(r.source)||typeof r.asOf!=='string'||!/^20\d\d-\d\d-\d\d$/.test(r.asOf)||isNaN(Date.parse(r.asOf+'T12:00:00Z'))||new Date(r.asOf+'T12:00:00Z').toISOString().slice(0,10)!==r.asOf)throw Error('Set a valid average, source and date for '+player.name+'. Unrated is not zero.');
 return r.average;
}
function shuffled(items,random){const a=items.slice();for(let i=a.length-1;i>0;i--){const v=random();if(!Number.isFinite(v)||v<0||v>=1)throw Error('Invalid random source.');const j=Math.floor(v*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pair(players,method='fair',random=Math.random){
 if(!Array.isArray(players)||players.length<4||players.length%2)throw Error('Doubles requires an even number of players, at least four.');
 if(players.some(p=>!p||!p.id||p.active===false)||new Set(players.map(p=>p.id)).size!==players.length)throw Error('Repeated, inactive or missing player.');
 if(!['fair','similar','random'].includes(method))throw Error('Unknown pairing method.');
 let order=shuffled(players,random);
 if(method!=='random'){order.forEach(rating);order.sort((a,b)=>rating(b)-rating(a));}
 const pairs=[];while(order.length){const a=order.shift(),b=method==='fair'?order.pop():order.shift();pairs.push([a.id,b.id]);}return pairs;
}
function balanced(event,count,random=Math.random){
 // Validate entries/count before accessing ratings. Serpentine seeding keeps
 // group sizes within one, preserving each existing pair as one entry.
 const check=draw(event,count,()=>0);
 const order=shuffled(event.entries.map((team,i)=>({i,average:team.reduce((n,p)=>n+rating(p),0)/team.length})),random).sort((a,b)=>b.average-a.average);
 const groups=check.groups.map(()=>[]);
 order.forEach((entry,i)=>{const row=Math.floor(i/count),col=i%count;groups[row%2?count-1-col:col].push(entry.i);});
 return validate(event,{eventId:event.id,groups,method:'fair',algorithm:'serpentine-v1',status:'LOCAL_REVIEW',ratingSnapshot:event.entries.map(team=>team.map(p=>({id:p.id,...p.rating})))});
}
const api={draw,validate,swap,pair,balanced,rating};if(typeof module==='object'&&module.exports)module.exports=api;else root.AikPoolPlanner=Object.freeze(api);
})(globalThis);
