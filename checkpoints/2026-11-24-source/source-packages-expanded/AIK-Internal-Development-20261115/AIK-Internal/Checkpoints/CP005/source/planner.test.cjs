const assert=require('node:assert/strict'),P=require('./PoolPlanner.js');let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function event(n,format='singles'){return{id:'event-'+format,format,entries:Array.from({length:n},(_,i)=>Array.from({length:format==='singles'?1:2},(_,j)=>({id:i+'-'+j,name:'Test '+i+' '+j})))};}
check('every entry covered for all feasible sizes and group counts',()=>{for(let n=2;n<=128;n++)for(let k=1;k<=Math.floor(n/2);k++){const e=event(n),p=P.draw(e,k,()=>.37);assert.equal(p.groups.flat().length,n);assert.equal(new Set(p.groups.flat()).size,n);const sizes=p.groups.map(g=>g.length);assert.ok(Math.max(...sizes)-Math.min(...sizes)<=1);}});
check('doubles pairs remain complete entries',()=>{const e=event(8,'doubles'),before=JSON.stringify(e),p=P.draw(e,2,()=>.5);assert.equal(p.groups.flatMap(g=>g.flatMap(i=>e.entries[i])).length,16);assert.equal(JSON.stringify(e),before);});
check('four players in doubles make one group of two teams',()=>assert.equal(P.draw(event(2,'doubles'),1).groups[0].length,2));
check('singleton groups rejected',()=>assert.throws(()=>P.draw(event(5),3),/at least two/));
check('fractional group count rejected',()=>assert.throws(()=>P.draw(event(8),1.5),/at least two/));
check('duplicate or omitted entry rejected',()=>assert.throws(()=>P.validate(event(4),{eventId:'event-singles',groups:[[0,1],[2,2]]}),/exactly once/));
check('wrong tournament rejected',()=>assert.throws(()=>P.validate(event(4),{eventId:'other',groups:[[0,1],[2,3]]}),/groups/));
check('player in multiple pairs rejected',()=>{const e=event(4,'doubles');e.entries[1][0]=e.entries[0][0];assert.throws(()=>P.draw(e,2),/Repeated/);});
check('swap preserves pair identities and invalidates review',()=>{const e=event(4,'doubles'),p=P.draw(e,2,()=>.5);p.status='REVIEWED_LOCAL';const q=P.swap(e,p,p.groups[0][0],p.groups[1][0]);assert.equal(q.status,'LOCAL_REVIEW');assert.notDeepEqual(q.groups,p.groups);assert.equal(p.status,'REVIEWED_LOCAL');});
check('same entry swap refused',()=>{const e=event(4),p=P.draw(e,2);assert.throws(()=>P.swap(e,p,0,0),/different/);});
check('out of range and unbalanced plans rejected',()=>{assert.throws(()=>P.validate(event(6),{eventId:'event-singles',groups:[[0,1],[2,3,4,7]]}));assert.throws(()=>P.validate(event(6),{eventId:'event-singles',groups:[[0],[1,2,3,4,5]]}));});
console.log(checks+' planner checks passed');
