/* Public, read-only pool statistics. No estimates, credentials or provider writes. */
(function(root){
 'use strict';
 const num=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
 const average=(score,darts)=>darts>0?3*score/darts:null;
 function fixture(tmid,data){
  if(typeof tmid!=='string')return null;
  const m=(tmid.startsWith(data.eventId+'_')?tmid.slice(data.eventId.length+1):'').match(/^(rr|lg)_(\d+)_(?:(\d+)_)?([A-Za-z0-9]{4})_([A-Za-z0-9]{4})$/);
  if(!m||(m[1]==='lg')!==(m[3]!==undefined)||m[4]===m[5])return null;
  const pool=data.pools.find(p=>p.id===m[1]+'_'+Number(m[2]));
  if(!pool?.matrix||![m[4],m[5]].every(id=>pool.matrix.some(p=>p.id===id)))return null;
  const a=pool.matrix.find(p=>p.id===m[4]),b=pool.matrix.find(p=>p.id===m[5]);
  if(a.cells[b.position-1].state==='multiple')return null;
  return {pool,left:m[4],right:m[5]};
 }
 function knockoutFixture(tmid,data){
  if(typeof tmid!=='string')return null;
  const m=(tmid.startsWith(data.eventId+'_')?tmid.slice(data.eventId.length+1):'').match(/^(t|s2|t3|s2_3)_(\d+)_([A-Za-z0-9]{4})_([A-Za-z0-9]{4})$/);if(!m||m[3]===m[4])return null;
  const stage=data.knockouts?.find(s=>s.kind=== (m[1]==='t3'?'t':m[1]==='s2_3'?'s2':m[1]));
  const matches=m[1]==='t3'||m[1]==='s2_3'?[stage?.thirdPlace]:stage?.rounds?.[Number(m[2])]?.matches;
  return matches?.find(q=>q&&[q.left.id,q.right.id].includes(m[3])&&[q.left.id,q.right.id].includes(m[4]))||null;
 }
 async function collect(get,data,includeKnockouts=false){
  const event=data.eventId;
  const all=[],seen=new Set();let done=false;
  for(let skip=0;skip<1000;skip+=100){
   const r=await get('match/list?tdid='+event+'&count=100&skip='+skip+'&sort=startTime&order=asc');
   if(r.result!==0||!Array.isArray(r.list)||r.list.length>100)throw Error('Incomplete match list');
   for(const m of r.list){if(m.tdid!==event||typeof m.mid!=='string'||seen.has(m.mid))throw Error('Invalid match list');seen.add(m.mid);all.push(m);}
   if(r.list.length<100){done=true;break;}
  }
  if(!done)throw Error('Match limit exceeded');
  const rows=all.filter(m=>fixture(m.tmid,data)||(includeKnockouts&&knockoutFixture(m.tmid,data)));
  const active=rows.filter(m=>m.endMatch===0);if(active.length>32)throw Error('Too many active games');
  const live=new Map();
  // At most four requests at once. Every cycle starts afresh, including corrected scores.
  for(let i=0;i<active.length;i+=4)await Promise.all(active.slice(i,i+4).map(async m=>{
   const r=await get('match/live?mid='+encodeURIComponent(m.mid));
   if(r.result!==0||r.mid!==m.mid||r.tdid!==event||r.tmid!==m.tmid||!Array.isArray(r.players)||r.players.length!==2||!Array.isArray(r.stats)||r.stats.length!==2||![0,1].includes(r.end_match))throw Error('Invalid live match');
   const f=fixture(r.tmid,data),k=knockoutFixture(r.tmid,data),ids=f?[f.left,f.right]:[k?.left.id,k?.right.id];if(new Set(r.players.map(p=>p.tpid)).size!==2||!r.players.every(p=>ids.includes(p.tpid)))throw Error('Live identity mismatch');
   live.set(m.mid,r);
  }));
  return {rows,live};
 }
 function apply(data,snapshot,plan){
  const event=data.eventId;
  const out=JSON.parse(JSON.stringify(data)),used=new Set(),totals=new Map(),covered=new Map(),invalid=new Set();
  for(const p of out.pools){p.startAverage=null;p.currentAverage=null;p.board=null;p.boards=null;p.group=null;p.shared=false;for(const r of p.matrix||[]){r.overallAverage=null;for(const c of r.cells)c.live=false;}}
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
   if(metadata&&JSON.stringify(metadata.ids.slice().sort())===JSON.stringify(rows.map(q=>q.id).sort())){p.boards=Array.isArray(metadata.boards)&&metadata.boards.length<=2&&metadata.boards.every(n=>Number.isInteger(n)&&n>0)?metadata.boards.slice():null;p.startAverage=num(metadata.startAverage);p.startCoverage=metadata.coverage;p.board=Number.isInteger(metadata.board)&&metadata.board>0?metadata.board:null;p.group=Number.isInteger(metadata.group)&&metadata.group>0?metadata.group:null;}
   for(const row of rows){const key=p.id+':'+row.id,recorded=row.cells.filter(c=>c.state==='result').length,standing=p.players.find(q=>q.id===row.id);row.overallAveragePartial=(covered.get(key)||0)<Math.max(recorded,standing?.played||0);}
   p.currentAveragePartial=rows.some(r=>r.overallAveragePartial);
   if(!invalid.has(p.id)){
    let score=0,darts=0;
    for(const row of rows){const a=totals.get(p.id+':'+row.id);if(a){row.overallAverage=average(a.score,a.darts);score+=a.score;darts+=a.darts;}}
    p.currentAverage=average(score,darts);
   }
  }
  for(const p of out.pools){const boards=p.boards||[p.board];p.shared=out.pools.some(q=>q!==p&&(q.boards||[q.board]).some(b=>b&&boards.includes(b)));}
  out.pools.sort((a,b)=>(a.board??1001)-(b.board??1001)||(a.group??a.number)-(b.group??b.number));
  return out;
 }
 function applyKnockouts(data,snapshot){
  const out=JSON.parse(JSON.stringify(data)),counts=new Map();
  for(const stage of out.knockouts||[])for(const m of [...stage.rounds.flatMap(r=>r.matches),stage.thirdPlace].filter(Boolean))m.live=false;
  for(const row of snapshot.rows){if(knockoutFixture(row.tmid,out))counts.set(row.tmid,(counts.get(row.tmid)||0)+1);}
  for(const row of snapshot.rows){
   const m=knockoutFixture(row.tmid,out),l=snapshot.live.get(row.mid);
   // A saved bracket result takes precedence over a scoring tab left running.
   if(m){
    const stage=out.knockouts.find(s=>s.thirdPlace===m||s.rounds.some(r=>r.matches.includes(m)));
    const format=stage?.thirdPlace===m?m.format:stage?.rounds.find(r=>r.matches.includes(m))?.format;
    const target=/^First to ([1-9][0-9]?) (?:legs|sets)$/.exec(format||'');
    // A 1–0 lead is a completed leg, not a completed first-to-2 match.
    const complete=m.board?.state==='finished'||(target&&num(m.leftScore)!==null&&num(m.rightScore)!==null&&m.leftScore!==m.rightScore&&Math.max(m.leftScore,m.rightScore)>=Number(target[1]));
    if(complete)continue;
   }
   if(!m||!l||!l.stats.every(s=>num(s.score)!==null&&Number.isInteger(s.darts)&&s.darts>=0&&(s.darts>0||s.score===0))||counts.get(row.tmid)!==1||l.show_sets!==0||l.match_type&&l.match_type!=='01'||!Array.isArray(l.legs)||l.legs.length!==2||!l.legs.every(n=>num(n)!==null))continue;
   for(const [side,id]of [['left',m.left.id],['right',m.right.id]]){const i=l.players.findIndex(p=>p.tpid===id);if(i<0)continue;m[side+'Score']=l.legs[i];m[side+'Average']=average(l.stats[i].score,l.stats[i].darts);}
   m.live=l.end_match===0;
  }
  return out;
 }
 const api=Object.freeze({fixture,knockoutFixture,collect,apply,applyKnockouts});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyNakkaPoolLive=api;
})(typeof globalThis==='object'?globalThis:this);
