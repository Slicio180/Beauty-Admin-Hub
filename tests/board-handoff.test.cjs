const {test}=require('node:test'),assert=require('node:assert/strict');
const seeding=require('../public/js/pool-seeding.js'),planModule=require('../public/js/pool-board-plan.js'),engine=require('../server/board-handoff.cjs');
const now=Date.parse('2026-10-29T15:00:00Z');
function fixture(){
 const players=Array.from({length:9},(_,i)=>({id:'p'+i,name:'Player '+i,status:'IN',average:50-i,privateMessage:'SECRET'}));
 const draw=seeding.draw({players,sizes:[3,3,3],seed:42,eventDate:'2026-10-27',frozenAt:new Date(now).toISOString(),source:{leagueId:'lg_M2wQ_4189',fetchedAt:new Date(now).toISOString()}}),plan=planModule.create(draw,[1,7],'2026-10-27');
 const bindings=players.map((p,i)=>({id:p.id,tpid:'t00'+i})),map=new Map(bindings.map(p=>[p.id,p.tpid]));
 const event={tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',title:'Beauty Registration TEST event DO NOT USE LIVE',status:25,team_games:0,updateTime:1,t_date:1793124000,lg_setting:{turnaround:0},lg_table:plan.pools.map(p=>p.players.map(q=>map.get(q.id)))};
 return {plan,event,bindings,draw};
}
test('board plan export records sparse boards sharing batches and no private roster data',()=>{
 const f=fixture(),text=planModule.text(f.plan);assert.match(text,/BOARD 1/);assert.match(text,/Batch 2 · Pool 3/);assert.match(text,/NOT SENT/);assert.doesNotMatch(JSON.stringify(f.plan),/SECRET|privateMessage|points|average/);assert.equal(f.plan.pools.length,3);assert.throws(()=>planModule.create(f.draw,[1],'2026-02-30'));
});
test('board memo preparation binds exact TEST group order identities date and board batches',()=>{
 const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now);assert.equal(r.payload.ttype,'lg');assert.deepEqual(r.payload.memo,['Pool 1 · Board 1 · Batch 1 (planned)','Pool 2 · Board 7 · Batch 1 (planned)','Pool 3 · Board 1 · Batch 2 (planned)']);assert.equal(r.expiresAt,now+300000);assert.equal(r.digest.length,64);
 for(const change of [e=>e.status=30,e=>e.tdid='other',e=>e.lg_table[0].reverse(),e=>e.lg_memo=['Organiser note'],e=>e.t_date=1]){const g=fixture();change(g.event);assert.throws(()=>engine.prepare(g.plan,g.event,g.bindings,now));}
 const g=fixture();g.plan.pools[2].batch=1;assert.throws(()=>engine.prepare(g.plan,g.event,g.bindings,now));assert.throws(()=>engine.prepare(f.plan,f.event,f.bindings,now+300000));
});
test('board notes stay closed without native qualification and never update badges or autopilot',async()=>{
 const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now);let writes=0;const e=engine.create({readEvent:async()=>f.event,writeMemo:async()=>writes++,audit:async()=>{},now:()=>now});await assert.rejects(e.send(r,r.digest),/qualification/);assert.equal(writes,0);
});
test('board notes require durable attempt then single write and exact readback before success',async()=>{
 const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now),calls=[];let event=f.event;
 const e=engine.create({nativeMemoVerified:true,now:()=>now,readEvent:async()=>{calls.push('read');return event;},audit:async a=>{calls.push(a.state);return {claimed:true};},writeMemo:async p=>{calls.push('write');assert.deepEqual(Object.keys(p),['tdid','ttype','memo']);event={...event,lg_memo:p.memo,updateTime:2};return {result:0};}});
 assert.equal((await e.send(r,r.digest)).boardAssignmentsSent,false);assert.deepEqual(calls,['read','ATTEMPTED','write','read','READBACK_VERIFIED']);await assert.rejects(e.send(r,r.digest),/already attempted/);
});
test('board notes reject drift expired approvals and overlapping attempts before mutation',async()=>{
 const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now);let writes=0,release;
 const e=engine.create({nativeMemoVerified:true,now:()=>now,readEvent:()=>new Promise(done=>release=done),writeMemo:async()=>writes++,audit:async()=>{}}),pending=e.send(r,r.digest);
 await assert.rejects(e.send(r,r.digest),/already attempted/);release({...f.event,updateTime:2});await assert.rejects(pending,/changed/);assert.equal(writes,0);
 const expired=engine.create({nativeMemoVerified:true,now:()=>now+300000,readEvent:async()=>f.event,writeMemo:async()=>writes++,audit:async()=>{}});await assert.rejects(expired.send(r,r.digest),/expired/);await assert.rejects(e.send({...r,revision:20},r.digest),/changed/);
});
test('board notes uncertain write and audit failures never retry a provider mutation',async()=>{
 const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now);let writes=0,states=[];
 const e=engine.create({nativeMemoVerified:true,now:()=>now,readEvent:async()=>f.event,writeMemo:async()=>{writes++;throw Error('timeout');},audit:async a=>{states.push(a.state);return {claimed:true};}});await assert.rejects(e.send(r,r.digest),/uncertain/);await assert.rejects(e.send(r,r.digest),/already attempted/);assert.equal(writes,1);assert.deepEqual(states,['ATTEMPTED','UNKNOWN_INSPECT_NAKKA']);
 const noAudit=engine.create({nativeMemoVerified:true,now:()=>now,readEvent:async()=>f.event,writeMemo:async()=>writes++,audit:async()=>{throw Error('Audit unavailable');}});await assert.rejects(noAudit.send(r,r.digest),/Audit unavailable/);assert.equal(writes,1);
});

test('board handoff durable revision journal refuses restart retries and competing plans',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),journal=require('../server/handoff-journal.cjs'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'beauty-board-journal-'));
 try{const f=fixture(),r=engine.prepare(f.plan,f.event,f.bindings,now);let writes=0;
 const setup=()=>engine.create({nativeMemoVerified:true,now:()=>now,readEvent:async()=>f.event,writeMemo:async()=>{writes++;throw Error('unknown network outcome');},audit:journal.create(dir)});
 await assert.rejects(setup().send(r,r.digest),/uncertain/);await assert.rejects(setup().send(r,r.digest),/durable attempt/);assert.equal(writes,1);
 const records=fs.readFileSync(path.join(dir,'test-revision-1.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.deepEqual(records.map(r=>r.state),['ATTEMPTED','UNKNOWN_INSPECT_NAKKA']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
