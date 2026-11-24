const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,clone,root}=require('./recheck-fixture.cjs');
const checks=[];
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
function cached(source='candidate'){
 const prev=process.env.BEAUTY_CLAIM_SOURCE;process.env.BEAUTY_CLAIM_SOURCE=source;
 let f;try{f=setup();}finally{if(prev===undefined)delete process.env.BEAUTY_CLAIM_SOURCE;else process.env.BEAUTY_CLAIM_SOURCE=prev;}
 const cache=new Map(),cacheCalls=[];const faults={put:null,get:null,remove:null,afterPut:null,afterGet:null};
 f.c.CacheService={getScriptCache:()=>({
  put:(k,v,ttl)=>{cacheCalls.push({method:'put',key:k,value:v,ttl,locked:f.lock.hasLock()});if(faults.put)throw faults.put;cache.set(k,{value:v,expires:f.now()+ttl*1000});if(faults.afterPut)faults.afterPut(k,v);},
  get:k=>{cacheCalls.push({method:'get',key:k,locked:f.lock.hasLock()});if(faults.get)throw faults.get;const item=cache.get(k),value=item&&f.now()<item.expires?item.value:null;if(faults.afterGet)faults.afterGet(k,value);return value;},
  remove:k=>{cacheCalls.push({method:'remove',key:k,locked:f.lock.hasLock()});if(faults.remove)throw faults.remove;cache.delete(k);}
 })};
 return {...f,cache,cacheCalls,faults,
  markerKey:()=>[...cache.keys()][0],
  marker:()=>JSON.parse([...cache.values()][0].value),
  markerEdit:fn=>{const item=[...cache.values()][0],m=JSON.parse(item.value);fn(m);item.value=JSON.stringify(m);},
  logsParsed:()=>f.logs.map(JSON.parse)};
}
function defer(f){const before={recovery:f.props[f.keys.recovery],receipt:f.props[f.keys.receipt],journal:f.props[f.keys.journal],attention:f.props[f.keys.attention]};
 f.onRead(()=>f.setBusy(true));f.tick();assert.equal(f.getRun().state,'RUNNING');assert.equal(f.lock.hasLock(),false);
 for(const [label,raw]of Object.entries(before))assert.equal(f.props[f.keys[label]],raw,label);
 return f.getRun();
}
function ready(f){f.setBusy(false);f.onRead(()=>{});}
function retire(f){ready(f);assert(f.lock.tryLock(0));const result=f.c.beautyBackgroundRecheckRetire_(f.props[f.config.runKey],clone(f.context),JSON.parse(f.props[f.config.key]),f.lock);f.lock.releaseLock();return result;}
function unchangedRejected(f,change){change(f);const before=clone(f.props),writes=f.writes.length;assert.equal(retire(f),false);assert.deepEqual(f.props,before);assert.equal(f.writes.length,writes);}

test('Previously installed baseline retains next-tick recovery with an available completion hint',()=>{
 const f=cached('baseline'),run=defer(f);assert.equal(f.cache.size,1);ready(f);f.advance(60000);f.tick();
 assert.equal(f.providerRequests.length,2);assert.notEqual(f.getRun().owner,run.owner);assert.equal(f.getRun().result.verified,true);
 assert(f.now()<run.leaseUntil);assert.equal(f.cache.size,0);
});
test('Contention signals completion without changing player data, claim bytes, expiry or repair counters',()=>{
 const f=cached();let rawAtPut,writesAtPut;
 f.faults.afterPut=()=>{rawAtPut=f.props[f.config.runKey];writesAtPut=f.writes.length;};const run=defer(f);
 assert.equal(f.cache.size,1);assert.equal(f.props[f.config.runKey],rawAtPut);assert.equal(f.writes.length,writesAtPut);
 assert.equal(run.leaseUntil-Date.parse(run.startedAt),600000);assert.equal(f.get().worker.attempts,2);
 assert.equal(f.logsParsed().at(-1).result.deferredSignal,true);assert.equal(f.logsParsed().at(-1).result.committed,false);
 assert(f.cacheCalls.find(x=>x.method==='put'&&!x.locked));assert(!JSON.stringify(f.marker()).includes(f.name));assert(!JSON.stringify(f.marker()).includes('local-test'));
});
test('Next ordinary tick retires the exact abandoned claim and verifies afresh before the old lease expires',()=>{
 const f=cached(),old=defer(f);ready(f);f.advance(60000);const reads=f.reads.length;f.tick();
 assert(f.now()<old.leaseUntil);assert.equal(f.getRun().result.verified,true);assert.notEqual(f.getRun().owner,old.owner);
 assert.equal(f.providerRequests.length,2);assert.equal(f.provider.length,0);assert.equal(f.getRun().result.attempts,0);
 assert.equal(f.reads.length-reads,8);assert(f.reads.every(x=>x.locked));assert.equal(f.cache.size,0);
 const released=f.logsParsed().find(x=>x.type==='BEAUTY_BACKGROUND_RECHECK_RELEASED');assert(released);assert.equal(released.owner,old.owner);assert.equal(released.delayMs,60000);assert.equal(released.nakkaWrites,0);
 const terminal=f.writes.filter(w=>w.key===f.config.runKey&&w.value).map(w=>JSON.parse(w.value)).find(x=>x.result?.code==='BACKGROUND_RECHECK_DEFERRED');
 assert(terminal);assert.equal(terminal.leaseUntil,old.leaseUntil);assert.equal(terminal.result.verified,false);assert.equal(terminal.result.committed,false);
});
test('An active lock holder still wins; no retirement or new provider read occurs until the lock is available',()=>{
 const f=cached(),old=defer(f);f.advance(60000);f.tick();assert.equal(f.getRun().owner,old.owner);assert.equal(f.providerRequests.length,1);
 ready(f);f.advance(60000);f.tick();assert.equal(f.getRun().result.verified,true);assert.equal(f.providerRequests.length,2);
});
test('Retirement alone changes only the exact run record and cannot mark a player verified',()=>{
 const f=cached();defer(f);const before=clone(f.props),requests=f.providerRequests.length;assert.equal(retire(f),true);
 for(const k of Object.keys(before))if(k!==f.config.runKey)assert.equal(f.props[k],before[k],k);
 assert.equal(f.providerRequests.length,requests);assert.equal(f.provider.length,0);assert.equal(f.getRun().result.verified,false);
});
test('A completed old signal cannot retire the next active owner',()=>{
 const f=cached();defer(f);f.faults.remove=Error('cache removal failed');assert.equal(retire(f),true);const oldRaw=f.props[f.config.runKey];
 const next={...JSON.parse(oldRaw),state:'RUNNING',owner:'new-owner'};f.props[f.config.runKey]=JSON.stringify(next);const raw=f.props[f.config.runKey];
 assert.equal(retire(f),false);assert.equal(f.props[f.config.runKey],raw);
});
for(const [label,change]of[
 ['cache eviction',f=>f.cache.clear()],['cache get failure',f=>f.faults.get=Error('cache unavailable')],
 ['malformed cache JSON',f=>[...f.cache.values()][0].value='{'],['null marker',f=>[...f.cache.values()][0].value='null'],
 ['extra marker field',f=>f.markerEdit(m=>m.extra=true)],['different marker version',f=>f.markerEdit(m=>m.version=2)],
 ['different reason',f=>f.markerEdit(m=>m.reason='REPAIR')],['wrong run hash',f=>f.markerEdit(m=>m.runHash='wrong')],
 ['wrong configuration hash',f=>f.markerEdit(m=>m.configHash='wrong')],['missing timestamp',f=>f.markerEdit(m=>delete m.finishedAt)],
 ['numeric timestamp',f=>f.markerEdit(m=>m.finishedAt=f.now())],['invalid timestamp',f=>f.markerEdit(m=>m.finishedAt='bad')],
 ['future timestamp',f=>f.markerEdit(m=>m.finishedAt=new f.c.Date(f.now()+1000).toISOString())],
 ['timestamp before claim',f=>f.markerEdit(m=>m.finishedAt=new f.c.Date(Date.parse(f.getRun().startedAt)-1).toISOString())],
 ['different claim owner',f=>f.edit(f.config.runKey,r=>r.owner='successor')],
 ['same-owner changed lease',f=>f.edit(f.config.runKey,r=>r.leaseUntil+=1000)],
 ['different claim player',f=>f.edit(f.config.runKey,r=>r.player='Another player')],
 ['different claim context',f=>f.edit(f.config.runKey,r=>r.context.revision='new')],
 ['different trigger',f=>f.edit(f.config.runKey,r=>r.triggerUid='new-trigger')],
 ['ordinary registration claim',f=>f.edit(f.config.runKey,r=>r.operation='registration')],
 ['removal claim',f=>f.edit(f.config.runKey,r=>r.operation='removal')],
 ['legacy worker claim',f=>f.edit(f.config.runKey,r=>r.timing.workerMode='verified-recheck-sheets-v3')],
 ['already terminal claim',f=>f.edit(f.config.runKey,r=>r.state='FINISHED')],
 ['invalid owner key',f=>f.edit(f.config.runKey,r=>r.owner='../other')],
 ['malformed claim',f=>f.props[f.config.runKey]='{'],['missing claim',f=>delete f.props[f.config.runKey]],
 ['expired claim',f=>f.advance(600001)],['changed current context',f=>f.context.revision='later'],
 ['pending event switch',f=>f.props.BEAUTY_EVENT_SWITCH_PENDING_V1='pending'],
 ['paused configuration',f=>f.edit(f.config.key,r=>r.state='PAUSED')],
 ['changed configuration bytes',f=>f.props[f.config.key]=' '+f.props[f.config.key]],
 ['changed account',f=>f.setEffective('another@example.invalid')],
 ['changed project',f=>f.c.ScriptApp.getScriptId=()=> 'other-project']
])test(label+' cannot retire or overwrite an active claim',()=>{const f=cached();defer(f);unchangedRejected(f,change);});
test('No signal or retirement authority exists without an actual worker invocation and lock',()=>{
 const f=cached();assert.equal(f.c.beautyBackgroundRecheckSignal_(),false);defer(f);ready(f);const raw=f.props[f.config.runKey];
 assert.equal(f.c.beautyBackgroundRecheckRetire_(raw,clone(f.context),JSON.parse(f.props[f.config.key]),f.lock),false);assert.equal(f.props[f.config.runKey],raw);
});
test('A claim changed during the cache read is detected before any terminal save',()=>{
 const f=cached();defer(f);let later;f.faults.afterGet=()=>{f.edit(f.config.runKey,r=>r.owner='successor');later=f.props[f.config.runKey];};
 assert.equal(retire(f),false);assert.equal(f.props[f.config.runKey],later);
});
test('A configuration changed during current-context validation prevents retirement',()=>{
 const f=cached();defer(f);const scope=f.c.beautyBackgroundScope_;f.c.beautyBackgroundScope_=()=>{const x=scope();f.props[f.config.key]+=' ';return x;};
 const raw=f.props[f.config.runKey];assert.equal(retire(f),false);assert.equal(f.props[f.config.runKey],raw);
});
test('Loss of the lock during validation prevents the terminal save',()=>{
 const f=cached();defer(f);const scope=f.c.beautyBackgroundScope_;f.c.beautyBackgroundScope_=()=>{const x=scope();f.lock.releaseLock();return x;};const raw=f.props[f.config.runKey];assert.equal(retire(f),false);assert.equal(f.props[f.config.runKey],raw);
});
test('Cache write failure preserves the original lease and eventual expiry recovery',()=>{
 const f=cached();f.faults.put=Error('cache unavailable');const old=defer(f);assert.equal(f.cache.size,0);ready(f);f.advance(60000);f.tick();assert.equal(f.getRun().owner,old.owner);assert.equal(f.providerRequests.length,1);
 f.advance(600001);f.tick();assert.equal(f.getRun().result.verified,true);
});
test('A stored signal survives failed readback without allowing unlocked durable writes',()=>{
 const f=cached();f.faults.afterPut=()=>{throw Error('cache transport interrupted after storage');};defer(f);assert.equal(f.cache.size,1);assert.equal(f.logsParsed().at(-1).result.deferredSignal,false);ready(f);f.tick();assert.equal(f.getRun().result.verified,true);
});
test('Eviction after the completion signal retains the crash/expiry fallback',()=>{
 const f=cached(),old=defer(f);f.cache.clear();ready(f);f.advance(60000);f.tick();assert.equal(f.getRun().owner,old.owner);f.advance(600001);f.tick();assert.equal(f.getRun().result.verified,true);
});
for(const when of ['before','after'])test('Terminal property write failure '+when+' storage does not launch work or alter player records',()=>{
 const f=cached();defer(f);ready(f);const before=clone(f.props),get=f.c.PropertiesService.getScriptProperties;let failed=false;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,setProperty:(k,v)=>{
  if(k===f.config.runKey&&JSON.parse(v).result?.code==='BACKGROUND_RECHECK_DEFERRED'&&!failed){failed=true;if(when==='after')p.setProperty(k,v);throw Error('storage failure');}return p.setProperty(k,v);
 }};};
 f.tick();assert(failed);assert.equal(f.providerRequests.length,1);for(const k of Object.keys(before))if(k!==f.config.runKey)assert.equal(f.props[k],before[k]);
 f.tick();assert.equal(f.getRun().result.verified,true);assert.equal(f.providerRequests.length,2);
});
test('A successor replacing the terminal save readback remains intact',()=>{
 const f=cached();defer(f);ready(f);const get=f.c.PropertiesService.getScriptProperties;let successor;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperty:k=>{let raw=p.getProperty(k);if(k===f.config.runKey&&raw&&JSON.parse(raw).result?.code==='BACKGROUND_RECHECK_DEFERRED'){
  successor=JSON.stringify({state:'RUNNING',owner:'successor',leaseUntil:f.now()+600000});f.props[k]=successor;raw=successor;}return raw;}};};
 f.tick();assert(successor);assert.equal(f.props[f.config.runKey],successor);assert.equal(f.providerRequests.length,1);
});
for(const [label,change]of[
 ['status',f=>f.sheets['PLAYER STATUS DATA'][0][2]='OUT'],['consent',f=>f.sheets['PLAYER STATUS DATA'][0][3]='JA'],
 ['message',f=>f.sheets.Responses[0][4]='later message'],['source',f=>f.sheets["TONIGHT'S PLAYERS"][0][5]='MOBIL'],
 ['master duplicate',f=>f.sheets.Master.push([...f.sheets.Master[0]])]
])test('A later '+label+' edit is freshly checked after retirement and blocks stale confirmation',()=>{
 const f=cached();defer(f);ready(f);change(f);const before=f.props[f.keys.recovery];f.advance(60000);f.tick();assert.equal(f.props[f.keys.recovery],before);assert.equal(f.providerRequests.length,1);assert.notEqual(f.getRun().result?.verified,true);assert.equal(f.provider.length,0);
});
test('New provider data is read after retirement; an old success cannot hide a now-missing entry',()=>{
 const f=cached();defer(f);ready(f);f.data[1].list=[];f.advance(60000);f.tick();assert.equal(f.getRun().result.code,'TRANSFER_REVIEW_REQUIRED');assert.equal(f.get().state,'NEEDS_HELP');assert.equal(f.providerRequests.length,2);assert.equal(f.provider.length,0);
});
test('Interactive owner, attention, receipts and protected records remain byte-identical during retirement',()=>{
 const f=cached();defer(f);f.edit(f.keys.recovery,r=>{r.owner='staff-owner';r.state='CHECKING';});f.edit(f.keys.attention,r=>r.state='ATTENTION');f.props.protectedRemoval05='legitimate edit';f.props.synthetic12Archive='archive';const before=clone(f.props);
 assert.equal(retire(f),true);for(const k of Object.keys(before))if(k!==f.config.runKey)assert.equal(f.props[k],before[k],k);
});
test('Repeated contention produces distinct scoped signals and retains repair counters',()=>{
 const f=cached(),first=defer(f);f.setBusy(false);f.advance(60000);f.tick();const second=f.getRun();assert.notEqual(second.owner,first.owner);assert.equal(second.state,'RUNNING');assert.equal(f.cache.size,1);assert.equal(f.get().worker.attempts,2);assert.equal(f.provider.length,0);
 ready(f);f.advance(60000);f.tick();assert.equal(f.getRun().result.verified,true);assert.equal(f.cache.size,0);
});
test('Normal uncontended verification adds no cache operations',()=>{const f=cached();f.tick();assert.equal(f.getRun().result.verified,true);assert.equal(f.cacheCalls.length,0);});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,nativeAcceptance:false,scope:'Actual worker and registration/projection/provider guards with simulated cache, clock, lock, properties and Sheets. Includes baseline reproduction, next-tick resumption, cache loss, ownership races, partial storage and fresh-data checks.'};
fs.writeFileSync(path.join(root,'evidence/commit-contention-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
