'use strict';
const assert=require('node:assert/strict');const {run}=require('./background-recovery.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const context={leagueId:'lg_fixture',eventId:'t_fixture',eventDate:'2026-11-16',revision:'rev1'};
const request={registrationId:'reg_fixture_0001',leagueId:'lg_fixture',eventId:'t_fixture',eventDate:'2026-11-16',player:'SYNTHETIC',submittedAt:'2026-11-19T20:00:00Z',state:'ACTIVE',consent:'JA',source:'HUB',message:'TEST'};
function fixture(n=1){
 let held=false, releases=0, appends=0, writes=0, changed=false;
 const jobs=Array.from({length:n},(_,i)=>({id:'reg_fixture_000'+i,request:{...request,registrationId:'reg_fixture_000'+i,player:'SYNTHETIC '+i},context:clone(context),status:'PENDING',attempts:0,nextAt:0,expiresAt:1000000}));
 const rows=jobs.map(j=>clone(j.request)),receipts=new Map(jobs.map(j=>[j.id,{phase:'ATTEMPTED',request:clone(j.request)}]));
 const a={tryLock:()=>{if(held)return false;held=true;return true;},releaseLock:()=>{held=false;releases++;},assertContext:c=>{if(changed||JSON.stringify(c)!==JSON.stringify(context))throw Error('CONTEXT_CHANGED');},list:()=>clone(jobs),read:id=>clone(jobs.find(j=>j.id===id)),write:j=>{writes++;Object.assign(jobs.find(x=>x.id===j.id),clone(j));},store:job=>({assertDestination:()=>a.assertContext(context),readReceipt:id=>clone(receipts.get(id)),readRows:()=>clone(rows),writeReceipt:(id,r)=>receipts.set(id,clone(r)),appendRecord:()=>{appends++;}})};
 return {a,jobs,rows,receipts,change:()=>changed=true,counts:()=>({held,releases,appends,writes})};
}
let passed=0;function test(name,f){f();passed++;console.log('PASS '+name);}
test('recovers saved row and repeated tick does nothing',()=>{const f=fixture();assert.equal(run(f.a,context,()=>100).processed,1);assert.equal(f.jobs[0].status,'COMPLETE');assert.equal(f.receipts.get(f.jobs[0].id).phase,'COMPLETE');assert.equal(run(f.a,context,()=>200).processed,0);assert.equal(f.counts().appends,0);});
test('overlapping tick cannot enter',()=>{const f=fixture();f.a.tryLock();assert.equal(run(f.a,context,()=>100).status,'BUSY');assert.equal(f.counts().writes,0);});
test('temporary failure is retried with delay',()=>{const f=fixture(),store=f.a.store;f.a.store=()=>{throw Error('TEMPORARY_READ_FAILURE');};run(f.a,context,()=>100);assert.equal(f.jobs[0].status,'PENDING');assert.equal(f.jobs[0].nextAt,30100);f.a.store=store;assert.equal(run(f.a,context,()=>200).processed,0);run(f.a,context,()=>30100);assert.equal(f.jobs[0].status,'COMPLETE');});
test('unknown exception becomes blocker without saving private error text',()=>{const f=fixture();f.a.store=()=>{throw Error('PRIVATE PROVIDER PAYLOAD');};run(f.a,context,()=>100);assert.equal(f.jobs[0].status,'BLOCKED');assert.equal(f.jobs[0].code,'UNEXPECTED_FAILURE');assert.ok(!JSON.stringify(f.jobs).includes('PRIVATE'));});
test('missing attempted row is never appended',()=>{const f=fixture();f.rows.length=0;run(f.a,context,()=>100);assert.equal(f.jobs[0].code,'ATTEMPTED_ROW_ABSENT');assert.equal(f.counts().appends,0);});
test('removed row cannot resurrect',()=>{const f=fixture();f.rows[0].state='REMOVED';run(f.a,context,()=>100);assert.equal(f.jobs[0].status,'BLOCKED');assert.equal(f.rows[0].state,'REMOVED');});
test('different consent blocks',()=>{const f=fixture();f.rows[0].consent='NEJ';run(f.a,context,()=>100);assert.equal(f.jobs[0].code,'RETRY_CONFLICT');});
test('old event jobs are untouched',()=>{const f=fixture();f.jobs[0].context.eventId='t_old';run(f.a,context,()=>100);assert.equal(f.counts().writes,0);});
test('old revision jobs are untouched',()=>{const f=fixture();f.jobs[0].context.revision='old';run(f.a,context,()=>100);assert.equal(f.counts().writes,0);});
test('event switch during read aborts completion',()=>{const f=fixture(),store=f.a.store;f.a.store=j=>{const s=store(j);return {...s,readRows:()=>{f.change();return clone(f.rows);}};};assert.throws(()=>run(f.a,context,()=>100),/CONTEXT_CHANGED/);assert.equal(f.jobs[0].status,'PENDING');assert.equal(f.counts().held,false);});
test('expired work requires review',()=>{const f=fixture();f.jobs[0].expiresAt=100;run(f.a,context,()=>100);assert.equal(f.jobs[0].code,'RECOVERY_EXPIRED');});
test('retry count bounds repeated crashes',()=>{const f=fixture();f.jobs[0].attempts=5;run(f.a,context,()=>100);assert.equal(f.jobs[0].code,'RETRY_LIMIT');});
test('one tick handles at most three jobs',()=>{const f=fixture(4);assert.equal(run(f.a,context,()=>100).processed,3);assert.equal(f.jobs[3].status,'PENDING');});
test('time budget stops starting additional jobs',()=>{const f=fixture(2);let calls=0;assert.equal(run(f.a,context,()=>calls++<2?100:15100).processed,1);});
test('duplicate queue IDs fail before writes',()=>{const f=fixture(2);f.jobs[1]=clone(f.jobs[0]);assert.throws(()=>run(f.a,context,()=>100),/INVALID_JOB/);assert.equal(f.counts().writes,0);});
test('failed attempt persistence prevents work',()=>{const f=fixture();f.a.write=()=>{};assert.throws(()=>run(f.a,context,()=>100),/QUEUE_READBACK/);assert.equal(f.receipts.get(f.jobs[0].id).phase,'ATTEMPTED');});
test('completion persistence failure resumes without duplicates',()=>{const f=fixture(),write=f.a.write;let once=true;f.a.write=j=>{if(j.status==='COMPLETE'&&once){once=false;throw Error('SAVE_LOST');}write(j);};assert.throws(()=>run(f.a,context,()=>100),/SAVE_LOST/);assert.equal(f.jobs[0].status,'PENDING');run(f.a,context,()=>30100);assert.equal(f.jobs[0].status,'COMPLETE');assert.equal(f.counts().appends,0);});
test('failure for one job does not starve next job',()=>{const f=fixture(2);f.rows.shift();run(f.a,context,()=>100);assert.equal(f.jobs[0].status,'BLOCKED');assert.equal(f.jobs[1].status,'COMPLETE');});
test('invalid timing is rejected',()=>{const f=fixture();f.jobs[0].expiresAt=NaN;assert.throws(()=>run(f.a,context,()=>100),/INVALID_JOB/);});
console.log(JSON.stringify({result:'PASS',checks:passed,scope:'offline synthetic adapters only'}));
