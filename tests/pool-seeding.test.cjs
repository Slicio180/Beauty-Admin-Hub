const test=require('node:test'),assert=require('node:assert/strict');
const s=require('../public/js/pool-seeding.js');
const known=(n,missing=0)=>Array.from({length:n},(_,i)=>({id:'p'+String(i).padStart(3,'0'),name:'Player '+i,status:'IN',average:i<missing?null:90-i*.65}));
const options=(players,sizes,extra={})=>({players,sizes,seed:42,eventDate:'2026-10-27',frozenAt:'2026-10-28T21:40:00Z',source:{leagueId:'lg_fixture',fetchedAt:'2026-10-28T21:35:00Z'},...extra});
test('mixed capacities spread first seeds and improve pool means without clustering the strongest',()=>{
 const players=[90,80,70,60,50,40,30].map((average,i)=>({id:String(i),name:'Player '+i,status:'IN',average}));
 const draw=s.draw(options(players,[4,3]));assert.equal(s.check(draw),true);
 assert.ok(draw.pools.every(g=>g.players.filter(p=>p.average>=80).length===1));
 assert.deepEqual(draw.pools.map(g=>s.summary(g).knownAverage),[60,60]);
});
test('unseeded allocation remains even for all valid 3/4 pool schemes and boundary missing counts',()=>{
 for(let n=5;n<=101;n++){
  const layouts=[];if(n===5)layouts.push([5]);else for(let four=0;four<=Math.floor(n/4);four++){const left=n-four*4;if(left%3===0)layouts.push([...Array(four).fill(4),...Array(left/3).fill(3)]);}
  for(const sizes of layouts)for(const missing of [0,1,Math.floor(n/2),n-1,n]){
   const draw=s.draw(options(known(n,missing),sizes)),counts=draw.pools.map(g=>s.summary(g).unseeded);
   assert.ok(Math.max(...counts)-Math.min(...counts)<=1,`${n}/${missing}/${sizes}`);assert.equal(draw.pools.flatMap(g=>g.players).length,n);assert.equal(s.check(draw),true);
  }
 }
});
test('101-player boundary respects capacities and even unseeded quotas',()=>{
 const draw=s.draw(options(known(101,26),[...Array(23).fill(4),...Array(3).fill(3)]));
 assert.equal(draw.pools.length,26);assert.ok(draw.pools.every(g=>s.summary(g).unseeded===1));assert.equal(s.check(draw),true);
});
test('missing average is null while genuine measured zero remains a known average',()=>{
 const players=known(6,3);players[3].average=0;players[4].average=0;players[5].average=0;
 const draw=s.draw(options(players,[3,3]));assert.equal(draw.pools.reduce((n,g)=>n+s.summary(g).known,0),3);assert.ok(draw.pools.every(g=>s.summary(g).knownAverage===0));
 const all=s.draw(options(known(6,6),[3,3]));assert.ok(all.pools.every(g=>s.summary(g).knownAverage===null));assert.match(s.warnings(all).join(' '),/not treated as zero/);
});
test('deterministic tie shuffle uses the recorded seed and ignores incoming roster order',()=>{
 const players=known(12).map(p=>({...p,average:55}));
 const a=s.draw(options(players,[4,4,4])),b=s.draw(options([...players].reverse(),[4,4,4]));assert.deepEqual(a,b);
 const c=s.draw(options(players,[4,4,4],{seed:43}));assert.notDeepEqual(a.pools,c.pools);assert.equal(a.seed,42);
});
test('frozen draw is independent of future source roster and average changes and excludes private fields',()=>{
 const players=known(6,1);players[0].message='PRIVATE';players[1].consent='PRIVATE';
 const input=options(players,[3,3]);input.source.password='PRIVATE';const before=JSON.stringify(input),draw=s.draw(input);
 assert.equal(JSON.stringify(input),before);players[1].average=1;players[1].name='Changed';input.source.fetchedAt='2027-01-01T00:00:00Z';
 assert.equal(draw.source.fetchedAt,'2026-10-28T21:35:00Z');assert.doesNotMatch(JSON.stringify(draw),/PRIVATE|Changed|2027/);
 assert.equal(s.check(draw),true);
});
test('IN-only membership signature changes on withdrawal arrival or rename but not averages or messages',()=>{
 const players=known(6);players.push({id:'out',name:'Excluded',status:'OUT',average:null});
 const key=s.rosterSignature(players);assert.equal(s.draw(options(players,[3,3])).roster.length,6);players[0].average=20;players[0].message='note';assert.equal(s.rosterSignature(players),key);
 players[0].status='STANDBY';assert.notEqual(s.rosterSignature(players),key);players[0].status='IN';players[6].status='IN';assert.notEqual(s.rosterSignature(players),key);
 players[6].status='OUT';players[0].name='Renamed';assert.notEqual(s.rosterSignature(players),key);
});
test('manual swaps retain frozen values capacities membership and source draw',()=>{
 const original=s.draw(options(known(8,2),[4,4])),text=JSON.stringify(original),left=original.pools[0].players[0],right=original.pools[1].players[0];
 const moved=s.adjust(original,{playerId:left.id,targetPool:1,swapWith:right.id});assert.equal(JSON.stringify(original),text);assert.equal(s.check(moved),true);assert.equal(moved.manualChanges.length,1);
 assert.ok(moved.pools[1].players.some(p=>p.id===left.id));assert.ok(moved.pools[0].players.some(p=>p.id===right.id));assert.equal(moved.frozenAt,original.frozenAt);
});
test('manual changes warn about clustered first seeds or uneven unseeded counts without inventing averages',()=>{
 const original=s.draw(options(known(12,3),[4,4,4]));
 const first=original.firstSeeds[0],origin=original.pools.find(g=>g.players.some(p=>p.id===first)),target=original.pools.find(g=>g.id!==origin.id);
 const nonSeed=target.players.find(p=>!original.firstSeeds.includes(p.id));
 const moved=s.adjust(original,{playerId:first,targetPool:target.id,swapWith:nonSeed.id});assert.match(s.warnings(moved).join(' '),/first-round seeds together/);
});
test('invalid moves ambiguous identities unknown statuses string averages and altered snapshots are refused',()=>{
 const draw=s.draw(options(known(6),[3,3]));assert.throws(()=>s.adjust(draw,{playerId:'missing',targetPool:1}));assert.throws(()=>s.adjust(draw,{playerId:draw.pools[0].players[0].id,targetPool:1}),/destination is full/);
 for(const mutate of [p=>p[0].id=p[1].id,p=>p[0].status='?',p=>p[0].average='55',p=>p[0].average=NaN,p=>p[0].average=-1,p=>p[0].average=181,p=>delete p[0].average]){
  const players=known(6);mutate(players);assert.throws(()=>s.draw(options(players,[3,3])));
 }
 const altered=JSON.parse(JSON.stringify(draw));altered.pools[0].players[0].average=180;assert.throws(()=>s.check(altered));
});
test('adjustable bands use exact non-overlapping boundaries and keep unseeded separate',()=>{
 assert.deepEqual([null,0,49.999,50,54.999,55,59.999,60,180].map(n=>s.band(n)),['UNSEEDED',0,0,1,1,2,2,3,3]);
 assert.equal(s.band(52,[45,52,65]),2);for(const bands of [[60,55,50],[50,50,60],[50,55],[50,NaN,60],[-1,50,60]])assert.throws(()=>s.band(55,bands));
});
test('invalid pool schemes limits dates and missing statistics provenance cannot produce an approved-looking draw',()=>{
 for(const sizes of [[2,4],[5,3],[3,4],[6],[]])assert.throws(()=>s.draw(options(known(6),sizes)));
 for(const extra of [{eventDate:'2026-02-30'},{seed:-1},{seed:1.5},{seed:2**32},{frozenAt:'bad'},{source:{leagueId:'lg_fixture'}}])assert.throws(()=>s.draw(options(known(6),[3,3],extra)));
 assert.throws(()=>s.draw(options(known(4),[4])));assert.throws(()=>s.draw(options(known(102),Array(34).fill(3))));
 assert.deepEqual(s.sizesFromPlan({three:3,four:7,five:0,pools:10}),[4,4,4,4,4,4,4,3,3,3]);assert.deepEqual(s.sizesFromPlan({three:0,four:0,five:1,pools:1}),[5]);
});
