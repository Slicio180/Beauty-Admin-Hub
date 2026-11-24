const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,clone,root}=require('./recheck-fixture.cjs');
const checks=[];
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
function lastResult(f){return f.logs.map(x=>{try{return JSON.parse(x);}catch{return {};}}).findLast(x=>x.type==='BEAUTY_BACKGROUND_RESULT');}
function instrument(f){
 const counts={getProperty:0,getProperties:0,setProperty:0,guards:[],sheets:0},previous=f.c.PropertiesService.getScriptProperties;
 let guard=null;
 f.c.PropertiesService.getScriptProperties=()=>{
  const p=previous();return {...p,
   getProperty:k=>{counts.getProperty++;if(guard)guard.getProperty++;return p.getProperty(k);},
   getProperties:()=>{counts.getProperties++;if(guard)guard.getProperties++;return p.getProperties();},
   setProperty:(k,v)=>{counts.setProperty++;return p.setProperty(k,v);}};
 };
 const original=f.c.beautyBackgroundVerifiedGuard_;
 f.c.beautyBackgroundVerifiedGuard_=s=>{guard={getProperty:0,getProperties:0};try{return original(s);}finally{counts.guards.push(guard);guard=null;}};
 return counts;
}
function sample(source){
 const previous=process.env.BEAUTY_CLAIM_SOURCE;process.env.BEAUTY_CLAIM_SOURCE=source;
 let f;try{f=setup();}finally{if(previous===undefined)delete process.env.BEAUTY_CLAIM_SOURCE;else process.env.BEAUTY_CLAIM_SOURCE=previous;}
 const counts=instrument(f);f.tick();counts.sheets=f.reads.length;
 return {counts,record:f.get(),attention:f.props[f.keys.attention],journal:f.props[f.keys.journal],receipt:f.props[f.keys.receipt],run:f.getRun(),log:lastResult(f)};
}
const baseline=sample('baseline'),candidate=sample('candidate');
test('Identical fixture produces the same recovery, attention, receipt and journal outcome with fewer property reads',()=>{
 for(const key of ['record','attention','journal','receipt'])assert.deepEqual(candidate[key],baseline[key],key);
 assert.deepEqual(candidate.run.result,baseline.run.result);
 assert.equal(candidate.counts.guards.length,4);assert.equal(baseline.counts.guards.length,4);
 assert.equal(candidate.counts.sheets,baseline.counts.sheets);assert.equal(candidate.counts.sheets,8);
 assert.equal(candidate.counts.setProperty,baseline.counts.setProperty);
 assert(candidate.counts.getProperty<=baseline.counts.getProperty-36);
 assert(candidate.counts.getProperties<=baseline.counts.getProperties);
});
test('Each guard obtains its own property batch, on both sides of both fresh Sheet validations',()=>{
 assert(candidate.counts.guards.every(g=>g.getProperties===1));
 assert(candidate.counts.guards.every((g,i)=>g.getProperty<baseline.counts.guards[i].getProperty));
 for(const field of ['prepareGuardMs','prepareSheetsMs','commitGuardMs','commitSheetsMs','playerSaveMs','resultSaveMs'])assert.equal(typeof candidate.log.timing[field],'number',field);
 assert.equal(candidate.run.timing.resultSaveMs,undefined,'final save timing is log-only, without another durable write');
});
const changes=[
 ['receipt',f=>f.edit(f.keys.receipt,r=>r.message='Later message')],
 ['recovery owner',f=>f.edit(f.keys.recovery,r=>{r.owner='staff';r.state='CHECKING';})],
 ['transfer',f=>f.edit(f.keys.journal,r=>r.tpid='T009')],
 ['second transfer key',f=>f.props[f.keys.journal+'later']=JSON.stringify({...f.journal,state:'ATTEMPTED'})],
 ['creation',f=>f.props[f.keys.creation]=JSON.stringify({state:'ATTEMPTED'})],
 ['staff review',f=>f.props[f.keys.review]=JSON.stringify({review:'newer'})],
 ['attention',f=>f.edit(f.keys.attention,r=>r.state='ATTENTION')],
 ['missing receipt',f=>delete f.props[f.keys.receipt]],
 ['missing recovery',f=>delete f.props[f.keys.recovery]],
 ['missing transfer',f=>delete f.props[f.keys.journal]],
 ['pending event switch',f=>f.props.BEAUTY_EVENT_SWITCH_PENDING_V1='pending'],
 ['paused authority',f=>f.edit(f.config.key,r=>r.state='PAUSED')],
 ['new run owner',f=>f.edit(f.config.runKey,r=>r.owner='newer-run')],
 ['same-owner renewed lease',f=>f.edit(f.config.runKey,r=>r.leaseUntil+=1234)],
 ['malformed run',f=>f.props[f.config.runKey]='{'],
 ['changed context',f=>f.context.revision='newer-context'],
 ['expired lease',f=>f.advance(600001)],
 ['later removal',f=>f.c.beautyRemovalRecoveryList_=()=>[{receipt:{player:f.name,state:'ATTEMPTED',recordedUTC:new f.c.Date().toISOString()}}]]
];
for(const phase of [1,2])for(const [label,change]of changes)test(label+' appearing during '+(phase===1?'pre-read':'commit')+' Sheet validation blocks the next guard',()=>{
 const f=setup(),local=f.c.beautyBackgroundVerifiedLocal_;let number=0,retained;
 f.c.beautyBackgroundVerifiedLocal_=s=>{
  const r=local(s);if(++number===phase){change(f);retained=Object.fromEntries([f.keys.receipt,f.keys.recovery,f.keys.journal,f.keys.creation,f.keys.review,f.keys.attention].map(k=>[k,f.props[k]]));}return r;
 };
 f.tick();assert.equal(f.providerRequests.length,phase-1);assert.equal(f.lock.hasLock(),false);
 assert(retained,'change must occur at the intended phase');
 for(const [key,value]of Object.entries(retained))assert.equal(f.props[key],value,key);
 const log=lastResult(f);assert(!log||log.result.committed===false);assert(!log?.result?.verified);
});
test('A successor run created immediately after claim readback is preserved before any provider access',()=>{
 const f=setup(),get=f.c.PropertiesService.getScriptProperties,before=f.props[f.keys.recovery];let successor;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperty:k=>{
  const raw=p.getProperty(k);
  if(k===f.config.runKey&&raw&&JSON.parse(raw).state==='RUNNING'&&!f.c.beautyBackgroundInvocation_&&!successor){
   successor=JSON.stringify({...JSON.parse(raw),owner:'successor'});f.props[k]=successor;
  }
  return raw;
 }};};
 f.tick();assert(successor);assert.equal(f.props[f.config.runKey],successor);assert.equal(f.props[f.keys.recovery],before);assert.equal(f.providerRequests.length,0);
});
test('Property batch failure preserves the previous verified record and never writes a new success',()=>{
 const f=setup(),get=f.c.PropertiesService.getScriptProperties,before=f.props[f.keys.recovery];
 f.onRead(()=>{f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties:()=>{throw Error('storage unavailable');}};};});
 f.tick();assert.equal(f.props[f.keys.recovery],before);assert.equal(lastResult(f).result.committed,false);
});
test('Guard cannot use its snapshot as authority without the actual lock',()=>{
 const f=setup();let checked=false;
 f.onRead(()=>{assert.throws(()=>f.c.beautyBackgroundVerifiedGuard_({name:f.name,context:f.context}),/BACKGROUND_CLAIM_REQUIRED/);checked=true;});
 f.tick();assert(checked);assert.equal(f.getRun().result.verified,true);
});
test('Readback mismatch still fails the recovery save; no successful completion is logged',()=>{
 const f=setup(),get=f.c.PropertiesService.getScriptProperties;
 f.onRead(()=>{f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,setProperty:(k,v)=>{p.setProperty(k,v);if(k===f.keys.recovery)f.props[k]='later-storage-value';}};};});
 f.tick();assert.equal(f.props[f.keys.recovery],'later-storage-value');assert.equal(lastResult(f).result.committed,false);assert.equal(lastResult(f).result.verified,false);
});
test('No repair counters or provider request counts increase during batched verification',()=>{
 const f=setup(),before=clone(f.get());f.tick();assert.equal(f.get().worker.attempts,before.worker.attempts);assert.equal(f.get().autoAttempts,before.autoAttempts);
 assert.equal(f.providerRequests.length,1);assert.equal(f.provider.length,0);assert.equal(f.getRun().result.nakkaWrites,0);
});
const result={result:'PASS',checks:checks.length,details:checks,comparison:{baseline:baseline.counts,candidate:candidate.counts,savedSinglePropertyReads:baseline.counts.getProperty-candidate.counts.getProperty},scope:'Composed prior native dependency functions with simulated services; read counts are a local before/after comparison, not native timing. No fixtures or provider mutations run remotely.',remoteCalls:0};
fs.writeFileSync(path.join(root,'evidence/local-verification-tests.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:result.result,checks:result.checks,comparison:result.comparison}));
