const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseBoards,allocate}=require('../public/js/pool-board-allocation.js');
const pool=(id,n=3)=>({id,players:Array.from({length:n},(_,i)=>({id:id+i}))});
test('boards: sparse venue ranges allocate twenty pools exactly once on selected boards',()=>{
 const selected=parseBoards('1–4, 7-9, 13-15');assert.deepEqual(selected,[1,2,3,4,7,8,9,13,14,15]);
 const pools=Array.from({length:20},(_,i)=>pool('p'+i)),before=JSON.stringify(pools),r=allocate(pools,selected);
 assert.equal(r.assignments.length,20);assert.equal(new Set(r.assignments.map(p=>p.poolId)).size,20);
 assert.ok(r.boards.every(b=>b.pools.length===2&&b.matches===6));assert.deepEqual(r.boards[0].pools.map(p=>p.poolNumber),[1,11]);assert.equal(JSON.stringify(pools),before);
});
test('boards: mixed sizes balance match workload and assign sequential board batches',()=>{
 const r=allocate([pool('a',5),pool('b',4),pool('c'),pool('d')],[7,2]);
 assert.deepEqual(r.boards.map(b=>b.matches),[10,12]);
 assert.ok(r.boards.every(b=>b.pools.every((p,i)=>p.batch===i+1)));assert.equal(r.mode,'sequential-pools');
 const spare=allocate([pool('x')],[1,4,16]);assert.equal(spare.boards.filter(b=>!b.pools.length).length,2);
});
test('boards: invalid ranges, empty selection and duplicate pool identities fail closed',()=>{
 for(const s of ['', '1-0','0','1-1001','1,1','1-3,3','1,,2','1;2'])assert.throws(()=>parseBoards(s));
 for(const b of [[],[1,1],[0],[1.5]])assert.throws(()=>allocate([pool('x')],b));
 assert.throws(()=>allocate([pool('x'),pool('x')],[1]));assert.throws(()=>allocate([],[1]));
});

test('boards: a four-player pool on two boards has six unique games in three conflict-free waves',()=>{
 const {matchPlan}=require('../public/js/pool-board-allocation.js'),pools=[pool('a',4),pool('b',3)],r=matchPlan(pools,[5,6],[{poolId:'a',boards:[5,6]},{poolId:'b',boards:[5]}]);
 const games=r.matches.filter(m=>m.poolId==='a');assert.equal(games.length,6);assert.equal(new Set(games.map(m=>m.players.slice().sort().join(':'))).size,6);assert.equal(new Set(games.map(m=>m.wave)).size,3);assert.equal(r.assignments[1].startWave,4);
 for(const wave of new Set(r.matches.map(m=>m.wave))){const matches=r.matches.filter(m=>m.wave===wave),ids=matches.flatMap(m=>m.players);assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(matches.map(m=>m.board)).size,matches.length);}
 const single=matchPlan([pool('a',4)],[5],[{poolId:'a',boards:[5]}]);assert.equal(single.assignments[0].endWave,6);
 for(const boards of [[5,5],[5,7],[]])assert.throws(()=>matchPlan([pool('a',4)],[5,6],[{poolId:'a',boards}]));
 assert.throws(()=>matchPlan([pool('a',3)],[5,6],[{poolId:'a',boards:[5,6]}]));
});


test('automatic boards: sparse selected boards fill three three four pools in draft order',()=>{
 const {defaults}=require('../public/js/pool-board-allocation.js');const pools=[pool('a'),pool('b'),pool('c',4)],before=JSON.stringify(pools);
 const plan=defaults(pools,[6,1,5,4]);assert.deepEqual(plan.assignments.map(a=>a.boards),[[1],[4],[5,6]]);assert.ok(plan.assignments.every(a=>a.startWave===1));assert.equal(JSON.stringify(pools),before);
});
test('automatic boards: reserves one per pool and gives spare boards to fours with deterministic fallbacks',()=>{
 const {defaults}=require('../public/js/pool-board-allocation.js');const pools=[pool('a',4),pool('b',4),pool('c')];
 assert.deepEqual(defaults(pools,[1,4,7,9]).assignments.map(a=>a.boards),[[1,4],[7],[9]]);
 assert.deepEqual(defaults(pools,[9]).assignments.map(a=>a.boards),[[9],[9],[9]]);
 assert.deepEqual(defaults([pool('a',4)],[5,6]).assignments[0].boards,[5,6]);
 for(const boards of [[],[1,1],[0]])assert.throws(()=>defaults(pools,boards));
});
test('automatic boards: fifty players on nine sparse boards have complete conflict-free queued games',()=>{
 const {defaults}=require('../public/js/pool-board-allocation.js');const pools=[...Array.from({length:14},(_,i)=>pool('p'+i)),pool('f1',4),pool('f2',4)];
 const boards=[1,4,5,6,7,8,10,12,14],plan=defaults(pools,boards);
 assert.equal(pools.reduce((n,p)=>n+p.players.length,0),50);assert.equal(plan.assignments.length,16);assert.equal(plan.matches.length,54);
 assert.ok(plan.assignments.every(a=>a.boards.length===1&&a.boards.every(b=>boards.includes(b))));assert.ok(plan.assignments.some(a=>a.startWave>1));
 for(const wave of new Set(plan.matches.map(m=>m.wave))){const games=plan.matches.filter(m=>m.wave===wave);assert.equal(new Set(games.map(m=>m.board)).size,games.length);assert.equal(new Set(games.flatMap(m=>m.players)).size,games.length*2);}
});
test('automatic boards: all small mixed venues stay within selection and cover every pair once',()=>{
 const {defaults}=require('../public/js/pool-board-allocation.js');
 for(let count=1;count<=12;count++)for(let n=1;n<=10;n++){
  const pools=Array.from({length:count},(_,i)=>pool('p'+i,i%2?4:3)),boards=Array.from({length:n},(_,i)=>1+i*2),p=defaults(pools,boards);
  assert.deepEqual(defaults(pools,boards),p);assert.equal(p.assignments.length,count);
  for(const pool of pools){const games=p.matches.filter(m=>m.poolId===pool.id);assert.equal(games.length,pool.players.length*(pool.players.length-1)/2);assert.equal(new Set(games.map(m=>m.players.slice().sort().join('|'))).size,games.length);}
  for(const wave of new Set(p.matches.map(m=>m.wave))){const games=p.matches.filter(m=>m.wave===wave);assert.ok(games.every(m=>boards.includes(m.board)));assert.equal(new Set(games.map(m=>m.board)).size,games.length);assert.equal(new Set(games.flatMap(m=>m.players)).size,games.length*2);}
 }
});
