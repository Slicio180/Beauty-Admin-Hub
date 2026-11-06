/* Pure planning only. No provider calls, scoring or session state. */
(function(root){
 'use strict';
 function parseBoards(text){
  if(typeof text!=='string'||!text.trim()||text.length>1000)throw Error('Select available boards.');
  const boards=new Set();
  for(const part of text.replace(/[–—]/g,'-').split(',')){
   const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
   if(!m)throw Error('Use board numbers or ranges separated by commas.');
   const a=Number(m[1]),b=m[2]===undefined?a:Number(m[2]);
   if(a<1||b>1000||a>b)throw Error('Board ranges must ascend within 1–1000.');
   for(let n=a;n<=b;n++){if(boards.has(n))throw Error('Each board must be selected once.');boards.add(n);}
  }
  return [...boards].sort((a,b)=>a-b);
 }
 function allocate(pools,available){
  if(!Array.isArray(available)||!available.length||available.length>1000||available.some(n=>!Number.isInteger(n)||n<1||n>1000)||new Set(available).size!==available.length)throw Error('Choose unique available board numbers.');
  if(!Array.isArray(pools)||!pools.length)throw Error('Generate pools first.');
  const ids=new Set(),jobs=pools.map((p,i)=>{
   if(!p||!((typeof p.id==='string'&&p.id)||(Number.isInteger(p.id)&&p.id>=0))||ids.has(p.id)||!Array.isArray(p.players)||p.players.length<2||p.players.length>5)throw Error('Pools need unique IDs and 2–5 players.');
   ids.add(p.id);return {poolId:p.id,poolNumber:i+1,matches:p.players.length*(p.players.length-1)/2};
  });
  // Longest workload first; stable ties keep equal-size pools in numeric order.
  jobs.sort((a,b)=>b.matches-a.matches||a.poolNumber-b.poolNumber);
  const boards=[...available].sort((a,b)=>a-b).map(board=>({board,matches:0,pools:[]}));
  for(const job of jobs){
   const target=[...boards].sort((a,b)=>a.matches-b.matches||a.pools.length-b.pools.length||a.board-b.board)[0];
   target.pools.push({...job,batch:target.pools.length+1});target.matches+=job.matches;
  }
  return {version:1,mode:'sequential-pools',boards,assignments:boards.flatMap(b=>b.pools.map(p=>({...p,board:b.board}))).sort((a,b)=>a.poolNumber-b.poolNumber)};
 }
 function matchPlan(pools,available,choices){
  allocate(pools,available); // Validate the same venue and frozen pool boundaries.
  if(!Array.isArray(choices)||choices.length!==pools.length)throw Error('Choose boards for every pool.');
  const ready=new Map(available.map(n=>[n,1])),matches=[],assignments=[];
  for(const pool of pools){
   const choice=choices.find(c=>c.poolId===pool.id),n=pool.players.length;
   if(!choice||Object.keys(choice).sort().join(',')!=='boards,poolId'||!Array.isArray(choice.boards)||![1,2].includes(choice.boards.length)||choice.boards.length===2&&n!==4||new Set(choice.boards).size!==choice.boards.length||choice.boards.some(b=>!available.includes(b)))throw Error('Choose one board, or two different available boards for a four-player pool.');
   const boards=choice.boards,start=Math.max(...boards.map(b=>ready.get(b))),pairs=[];
   if(n===4)pairs.push([0,3],[1,2],[0,2],[3,1],[0,1],[2,3]);
   else for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)pairs.push([a,b]);
   pairs.forEach(([a,b],i)=>matches.push({poolId:pool.id,wave:start+Math.floor(i/boards.length),board:boards[i%boards.length],players:[pool.players[a].id,pool.players[b].id]}));
   const end=start+Math.ceil(pairs.length/boards.length);for(const b of boards)ready.set(b,end);
   assignments.push({poolId:pool.id,boards:boards.slice(),startWave:start,endWave:end-1});
  }
  return {version:1,assignments,matches};
 }
 const api=Object.freeze({parseBoards,allocate,matchPlan});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyPoolBoards=api;
})(typeof globalThis==='object'?globalThis:this);
