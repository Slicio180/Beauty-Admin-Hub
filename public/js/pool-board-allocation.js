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
 const api=Object.freeze({parseBoards,allocate});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyPoolBoards=api;
})(typeof globalThis==='object'?globalThis:this);
