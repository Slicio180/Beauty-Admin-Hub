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
