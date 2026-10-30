/* Public, read-only pool statistics. No estimates, credentials or provider writes. */
(function(root){
 'use strict';
 const event='t_RqC2_2034',num=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
 const average=(score,darts)=>darts>0?3*score/darts:null;
 function fixture(tmid,data){
  if(typeof tmid!=='string')return null;
  const m=tmid.match(/^t_RqC2_2034_(rr|lg)_(\d+)_(?:(\d+)_)?([A-Za-z0-9]{4})_([A-Za-z0-9]{4})$/);
  if(!m||(m[1]==='lg')!==(m[3]!==undefined)||m[4]===m[5])return null;
  const pool=data.pools.find(p=>p.id===m[1]+'_'+Number(m[2]));
  if(!pool?.matrix||![m[4],m[5]].every(id=>pool.matrix.some(p=>p.id===id)))return null;
  const a=pool.matrix.find(p=>p.id===m[4]),b=pool.matrix.find(p=>p.id===m[5]);
  if(a.cells[b.position-1].state==='multiple')return null;
  return {pool,left:m[4],right:m[5]};
 }
 async function collect(get,data){
  const all=[],seen=new Set();let done=false;
  for(let skip=0;skip<1000;skip+=100){
   const r=await get('match/list?tdid='+event+'&count=100&skip='+skip+'&sort=startTime&order=asc');
   if(r.result!==0||!Array.isArray(r.list)||r.list.length>100)throw Error('Incomplete match list');
   for(const m of r.list){if(m.tdid!==event||typeof m.mid!=='string'||seen.has(m.mid))throw Error('Invalid match list');seen.add(m.mid);all.push(m);}
   if(r.list.length<100){done=true;break;}
  }
  if(!done)throw Error('Match limit exceeded');
  const rows=all.filter(m=>fixture(m.tmid,data));
  const active=rows.filter(m=>m.endMatch===0);if(active.length>32)throw Error('Too many active games');
  const live=new Map();
  // At most four requests at once. Every cycle starts afresh, including corrected scores.
  for(let i=0;i<active.length;i+=4)await Promise.all(active.slice(i,i+4).map(async m=>{
   const r=await get('match/live?mid='+encodeURIComponent(m.mid));
   if(r.result!==0||r.mid!==m.mid||r.tdid!==event||r.tmid!==m.tmid||!Array.isArray(r.players)||r.players.length!==2||!Array.isArray(r.stats)||r.stats.length!==2||![0,1].includes(r.end_match))throw Error('Invalid live match');
   const f=fixture(r.tmid,data);if(new Set(r.players.map(p=>p.tpid)).size!==2||!r.players.every(p=>[f.left,f.right].includes(p.tpid)))throw Error('Live identity mismatch');
   live.set(m.mid,r);
  }));
  return {rows,live};
 }
 function apply(data,snapshot,plan){
  const out=JSON.parse(JSON.stringify(data)),used=new Set(),totals=new Map(),covered=new Map(),invalid=new Set();
  for(const p of out.pools){p.startAverage=null;p.currentAverage=null;p.board=null;p.group=null;p.shared=false;for(const r of p.matrix||[]){r.overallAverage=null;for(const c of r.cells)c.live=false;}}
  for(const m of snapshot.rows){
   const f=fixture(m.tmid,out);if(!f)continue;
   // Multiple documents for a fixture (sets/duplicates) need separate qualification.
   if(used.has(m.tmid)){invalid.add(f.pool.id);continue;}used.add(m.tmid);
   const l=snapshot.live.get(m.mid);let players=m.statsData,ended=m.endMatch;
   if(l){ended=l.end_match;players=l.players.map((p,i)=>({tpid:p.tpid,allScore:l.stats[i]?.score,allDarts:l.stats[i]?.darts}));}
   if((m.match_type&&m.match_type!=='01')||l?.show_sets===1||![0,1].includes(ended)||!Array.isArray(players)||players.length!==2||new Set(players.map(p=>p.tpid)).size!==2||!players.every(p=>[f.left,f.right].includes(p.tpid))){invalid.add(f.pool.id);continue;}
   for(const p of players){
    const key=f.pool.id+':'+p.tpid,a=totals.get(key)||{score:0,darts:0};
    if(num(p.allScore)===null||num(p.allDarts)===null||!Number.isInteger(p.allDarts)||p.allDarts===0&&p.allScore!==0){invalid.add(f.pool.id);continue;}
    a.score+=p.allScore;a.darts+=p.allDarts;totals.set(key,a);
    if(ended===1)covered.set(key,(covered.get(key)||0)+1);
   }
   if(l&&Array.isArray(l.legs)&&l.legs.length===2&&l.legs.every(n=>num(n)!==null)){
    l.players.forEach((p,i)=>{const row=f.pool.matrix.find(p2=>p2.id===p.tpid),other=f.pool.matrix.find(p2=>p2.id===l.players[1-i].tpid),c=row.cells[other.position-1];
     c.live=ended===0;c.score=l.legs[i];c.opponentScore=l.legs[1-i];c.average=average(l.stats[i].score,l.stats[i].darts);c.state=ended===1?'result':'live';});
   }
  }
  for(const p of out.pools){
   const rows=p.matrix||[],metadata=plan?.eventId===event&&plan.pools?.find(q=>q.id===p.id);
   if(metadata&&JSON.stringify(metadata.ids.slice().sort())===JSON.stringify(rows.map(q=>q.id).sort())){p.startAverage=num(metadata.startAverage);p.startCoverage=metadata.coverage;p.board=Number.isInteger(metadata.board)&&metadata.board>0?metadata.board:null;p.group=Number.isInteger(metadata.group)&&metadata.group>0?metadata.group:null;}
   for(const row of rows){const key=p.id+':'+row.id,recorded=row.cells.filter(c=>c.state==='result').length,standing=p.players.find(q=>q.id===row.id);if((covered.get(key)||0)<Math.max(recorded,standing?.played||0))invalid.add(p.id);}
   if(!invalid.has(p.id)){
    let score=0,darts=0;
    for(const row of rows){const a=totals.get(p.id+':'+row.id);if(a){row.overallAverage=average(a.score,a.darts);score+=a.score;darts+=a.darts;}}
    p.currentAverage=average(score,darts);
   }
  }
  for(const p of out.pools)p.shared=!!p.board&&out.pools.filter(q=>q.board===p.board).length>1;
  out.pools.sort((a,b)=>(a.board??1001)-(b.board??1001)||(a.group??a.number)-(b.group??b.number));
  return out;
 }
 const api=Object.freeze({fixture,collect,apply});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyNakkaPoolLive=api;
})(typeof globalThis==='object'?globalThis:this);
