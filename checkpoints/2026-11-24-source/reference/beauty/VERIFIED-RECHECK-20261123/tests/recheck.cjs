const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {setup,clone,hash,root}=require('./recheck-fixture.cjs');const checks=[];
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
const execute=f=>{f.tick();assert.equal(f.lock.hasLock(),false);assert.equal(f.c.beautyBackgroundInvocation_,null);return f.getRun();};
function unchanged(f,key,before){assert.equal(f.props[key],before);}
function discarded(f,change){const before=f.props[f.keys.recovery];f.onRead(change);const run=execute(f);assert.equal(run.result.verified,false);assert.equal(run.result.committed,false);unchanged(f,f.keys.recovery,before);return run;}

test('Actual fixed-target GET batch runs unlocked; fresh guarded completion verifies without repair or mutation',()=>{
 const f=setup(),protectedKeys=[f.keys.receipt,f.keys.journal,f.keys.attention],before=Object.fromEntries(protectedKeys.map(k=>[k,f.props[k]]));
 f.onRead(()=>{assert(f.lock.tryLock(0),'another operation can acquire the lock');f.lock.releaseLock();assert.equal(f.get().state,'VERIFIED');assert.equal(f.get().owner,'previous-owner');});
 const run=execute(f);assert.equal(run.operation,'registration-recheck');assert.equal(run.result.verified,true);assert.equal(run.result.committed,true);assert.equal(run.result.nakkaWrites,0);assert.equal(run.result.attempts,0);assert.equal(run.result.identityVerified,true);
 assert.deepEqual(f.provider,[]);assert.equal(f.providerRequests.length,1);assert(f.reads.every(r=>r.locked));
 assert.deepEqual(f.providerRequests[0].map(r=>r.url),['https://push.n01darts.com/api/v1/tournament/get?tdid='+f.context.eventId+'&entry=0','https://push.n01darts.com/api/v1/tournament/entry/list?tdid='+f.context.eventId,'https://push.n01darts.com/api/v1/league/entry/list?lgid='+f.context.leagueId+'&count=1000']);
 for(const k of protectedKeys)unchanged(f,k,before[k]);assert.equal(f.get().autoAttempts,2);assert.equal(f.get().worker.attempts,2);assert.equal(f.get().history.at(-1).source,'background-recheck');assert.equal(run.timing.providerReadMs,7000);assert.equal(run.timing.providerUnlockedMs,7000);
});
test('Repeat ticks respect the existing five-minute cadence',()=>{const f=setup();execute(f);f.tick();assert.equal(f.providerRequests.length,1);f.advance(300000);execute(f);assert.equal(f.providerRequests.length,2);});
test('Link-unexposed transfer and entry remain verified without asserting an unexposed identity',()=>{const f=setup();f.edit(f.keys.journal,r=>r.state='ENTRY_VERIFIED_LINK_UNEXPOSED');delete f.data[1].list[0].lpid;const r=execute(f);assert.equal(r.result.verified,true);assert.equal(r.result.identityVerified,false);});
for(const status of [10,25,30,40])test('Existing entry can be rechecked in event status '+status,()=>{const f=setup();f.data[0].tournament.status=status;assert.equal(execute(f).result.verified,true);});
test('Matching verified league creation stays byte-identical',()=>{const f=setup();f.props[f.keys.creation]=JSON.stringify({state:'VERIFIED',name:f.name,lpid:'L001'});const before=f.props[f.keys.creation];assert.equal(execute(f).result.verified,true);unchanged(f,f.keys.creation,before);});
for(const [label,change]of[
 ['incomplete receipt',f=>f.edit(f.keys.receipt,r=>r.state='REVIEW')],
 ['no transfer journal',f=>delete f.props[f.keys.journal]],
 ['uncertain transfer journal',f=>f.edit(f.keys.journal,r=>r.state='ATTEMPTED')],
 ['malformed transfer journal',f=>f.props[f.keys.journal]='{'],
 ['different transfer date',f=>f.edit(f.keys.journal,r=>r.event.date='2026-11-22')],
 ['missing journal identity',f=>f.edit(f.keys.journal,r=>delete r.identity)],
 ['wrong journal key',f=>{f.props[f.keys.journal+'wrong']=f.props[f.keys.journal];delete f.props[f.keys.journal];}],
 ['duplicate candidate journal',f=>f.props[f.keys.journal+'duplicate']=f.props[f.keys.journal]],
 ['staff reconciliation record',f=>f.props[f.keys.review]='{"kind":"STAFF_REVIEWED_CURRENT_ENTRY"}'],
 ['unverified league creation',f=>f.props[f.keys.creation]=JSON.stringify({state:'ATTEMPTED',name:f.name,lpid:'L001'})],
 ['attention issue',f=>f.edit(f.keys.attention,r=>r.state='ATTENTION')]
])test(label+' keeps the original guarded operation path',()=>{const f=setup();change(f);const r=execute(f);assert.equal(f.providerRequests.length,0);assert.notEqual(r.operation,'registration-recheck');assert(f.provider.includes('send'));});
for(const [label,change]of[
 ['receipt consent',f=>f.edit(f.keys.receipt,r=>r.consent='JA, JAG GODKÄNNER')],
 ['receipt message',f=>f.edit(f.keys.receipt,r=>r.message='Later intent')],
 ['transfer journal',f=>f.edit(f.keys.journal,r=>r.tpid='T009')],
 ['new creation journal',f=>f.props[f.keys.creation]='{"state":"ATTEMPTED"}'],
 ['new staff review',f=>f.props[f.keys.review]='{"new":true}'],
 ['new attention problem',f=>f.edit(f.keys.attention,r=>r.state='ATTENTION')]
])test('Concurrent '+label+' discards stale provider result',()=>{const f=setup();discarded(f,()=>change(f));});
test('Concurrent interactive recovery ownership is never overwritten',()=>{const f=setup();let after;f.onRead(()=>{f.edit(f.keys.recovery,r=>{r.owner='staff';r.state='CHECKING';});after=f.props[f.keys.recovery];});const r=execute(f);assert.equal(r.result.committed,false);unchanged(f,f.keys.recovery,after);});
for(const state of ['ATTEMPTED','VERIFIED'])test('A later '+state+' removal takes precedence at commit',()=>{const f=setup();discarded(f,()=>{f.c.beautyRemovalRecoveryList_=()=>[{receipt:{player:f.name,state,recordedUTC:new f.c.Date().toISOString()}}];});});
for(const [title,column,value]of[["PLAYER STATUS DATA",2,'OUT'],["PLAYER STATUS DATA",3,'JA'],["PLAYER STATUS DATA",4,'later'],["PLAYER STATUS DATA",5,'MOBIL'],["TONIGHT'S PLAYERS",2,'STANDBY']])test('Concurrent local field '+title+'/'+column+' is retained and blocks stale success',()=>{const f=setup();discarded(f,()=>f.sheets[title][0][column]=value);assert.equal(f.sheets[title][0][column],value);});
test('Concurrent response-row edit prevents confirmation',()=>{const f=setup();discarded(f,()=>f.sheets.Responses[0][4]='later');});
test('Concurrent master duplicate prevents confirmation',()=>{const f=setup();discarded(f,()=>f.sheets.Master.push([...f.sheets.Master[0]]));});
for(const [label,change]of[
 ['revision',f=>f.context.revision='different'],['event',f=>f.context.eventId='t_different'],['date',f=>f.context.date='2026-11-22'],['pending switch',f=>f.props.BEAUTY_EVENT_SWITCH_PENDING_V1='pending'],
 ['authority configuration',f=>f.edit(f.config.key,r=>r.state='PAUSED')],['owner account',f=>f.setEffective('different@example.invalid')],['expired lease',f=>f.advance(600001)]
])test('Concurrent '+label+' cannot publish or overwrite a result',()=>{const f=setup(),before=f.props[f.keys.recovery];f.onRead(()=>change(f));execute(f);unchanged(f,f.keys.recovery,before);assert(!f.logs.some(t=>{try{return JSON.parse(t).result?.verified===true;}catch{return false;}}));});
test('Newer global claim is not overwritten, including the error path',()=>{const f=setup();let later;f.onRead(()=>{later=JSON.stringify({state:'RUNNING',owner:'later-owner',triggerUid:'later',leaseUntil:f.now()+100000});f.props[f.config.runKey]=later;});execute(f);unchanged(f,f.config.runKey,later);});
test('Contended commit keeps player record and durable lease; never writes while unlocked',()=>{const f=setup(),before=f.props[f.keys.recovery];f.onRead(()=>f.setBusy(true));const r=execute(f);assert.equal(r.state,'RUNNING');unchanged(f,f.keys.recovery,before);const log=JSON.parse(f.logs.at(-1));assert.equal(log.result.code,'BACKGROUND_RECHECK_COMMIT_BUSY');assert.equal(log.result.committed,false);});
test('After deferred commit the original clock can resume following lease expiry',()=>{const f=setup();f.onRead(()=>f.setBusy(true));execute(f);f.setBusy(false);f.onRead(()=>{});f.tick();assert.equal(f.providerRequests.length,1);f.advance(600001);assert.equal(execute(f).result.verified,true);assert.equal(f.providerRequests.length,2);});
for(const [label,alter]of[['exception',f=>f.readError(Error('Network'))],['HTTP failure',f=>f.http(503)],['invalid result',f=>f.data[1].result=1],['event date mismatch',f=>f.data[0].tournament.t_date+=86400],['wrong event',f=>f.data[0].tournament.tdid='other'],['wrong league',f=>f.data[0].tournament.lgid='other'],['wrong title',f=>f.data[0].tournament.title='other'],['invalid status',f=>f.data[0].tournament.status=99],['invalid event time',f=>delete f.data[0].tournament.updateTime],['malformed league',f=>f.data[2].list={}],['duplicate league IDs',f=>f.data[2].list.push({...f.data[2].list[0],name:'Different'})],['malformed entries',f=>f.data[1].list={}],['duplicate entry IDs',f=>f.data[1].list.push({...f.data[1].list[0],name:'Different'})]])test(label+' retains last verification without fresh green confirmation and delays retry',()=>{
 const f=setup();alter(f);const before=f.get(),attention=f.props[f.keys.attention],journal=f.props[f.keys.journal],r=execute(f),after=f.get();assert.equal(r.result.verified,false);assert.equal(r.result.lastVerifiedRetained,true);assert.equal(after.updatedAt,before.updatedAt);assert.deepEqual(after.history,before.history);assert.equal(after.state,'VERIFIED');assert.equal(after.code,before.code);assert.equal(after.worker.nextAt,f.now()+300000);unchanged(f,f.keys.attention,attention);unchanged(f,f.keys.journal,journal);f.tick();assert.equal(f.providerRequests.length,1);
});
for(const [label,change,code]of[
 ['missing entry',f=>f.data[1].list=[],'TRANSFER_REVIEW_REQUIRED'],
 ['changed entry ID',f=>f.data[1].list[0].tpid='T009','TRANSFER_REVIEW_REQUIRED'],
 ['conflicting linked name',f=>f.data[1].list[0].name='Different','IDENTITY_CONFLICT'],
 ['conflicting league ID',f=>f.data[1].list[0].lpid='L009','IDENTITY_CONFLICT'],
 ['duplicate matching entry',f=>f.data[1].list.push({...f.data[1].list[0],tpid:'T009'}),'IDENTITY_CONFLICT'],
 ['missing league profile',f=>f.data[2].list=[],'LEAGUE_IDENTITY_REVIEW'],
 ['changed league profile',f=>f.data[2].list[0].lpid='L009','LEAGUE_IDENTITY_REVIEW'],
 ['duplicate matching league profile',f=>f.data[2].list.push({...f.data[2].list[0],lpid:'L009'}),'LEAGUE_IDENTITY_REVIEW']
])test(label+' records review needed without replaying the prior transfer',()=>{const f=setup(),journal=f.props[f.keys.journal];change(f);const r=execute(f);assert.equal(r.result.verified,false);assert.equal(r.result.code,code);assert.equal(f.get().state,'NEEDS_HELP');assert.equal(JSON.parse(f.props[f.keys.attention]).code,code);unchanged(f,f.keys.journal,journal);assert.equal(f.providerRequests.length,1);assert.equal(f.provider.length,0);});
test('Read-only claim cannot call ordinary registration or provider mutation authorization even while unlocked',()=>{const f=setup();f.onRead(()=>{assert.throws(()=>f.c.beautyBackgroundRequire_(f.name),/CLAIM_REQUIRED/);assert.throws(()=>f.c.beautyBackgroundMutationRequire_('tournament/entry/update',{}),/MUTATION_BLOCKED/);});assert.equal(execute(f).result.verified,true);});
test('Direct reader invocation without a clock claim cannot access provider',()=>{const f=setup();assert.throws(()=>f.c.beautyBackgroundVerifiedRead_({name:f.name,context:f.context}),/READ_CLAIM_REQUIRED/);assert.equal(f.providerRequests.length,0);});
test('Selected player source mismatch blocks the provider read',()=>{const f=setup();f.sheets.Responses[0][4]='later';const before=f.props[f.keys.recovery],r=execute(f);assert.equal(r.result.committed,false);assert.equal(f.providerRequests.length,0);unchanged(f,f.keys.recovery,before);});
test('New-source worker leaves archived synthetic 12 and protected removal 05 records byte-identical',()=>{const f=setup();f.props.synthetic12Archive='retained archive';f.props.protectedRemoval05='retained later edit';execute(f);assert.equal(f.props.synthetic12Archive,'retained archive');assert.equal(f.props.protectedRemoval05,'retained later edit');});
test('Provider replies never persist credentials or raw response bodies in diagnostics',()=>{const f=setup();execute(f);assert(!f.logs.join('').includes('local-test'));assert(!f.logs.join('').includes('Authorization'));assert(!f.logs.join('').includes('tournament/get'));});
test('New same-player journal under a second key blocks stale confirmation',()=>{const f=setup();discarded(f,()=>{f.props[f.keys.journal+'new']=JSON.stringify({...f.journal,state:'ATTEMPTED'});});});
test('Changed global lease with the same owner cannot be overwritten',()=>{const f=setup();let later;f.onRead(()=>{f.edit(f.config.runKey,r=>r.leaseUntil+=1000);later=f.props[f.config.runKey];});execute(f);unchanged(f,f.config.runKey,later);});
test('An attention write failure cannot publish a new verified recovery record',()=>{const f=setup(),before=f.props[f.keys.recovery];f.c.beautyHubAttentionRemember_=()=>false;const r=execute(f);assert.equal(r.result.committed,false);unchanged(f,f.keys.recovery,before);});
test('A recovery write failure leaves a definitive missing-entry alert visible',()=>{const f=setup();f.data[1].list=[];const before=f.props[f.keys.recovery],get=f.c.PropertiesService.getScriptProperties;f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,setProperty:(k,v)=>{if(k===f.keys.recovery)throw Error('storage');return p.setProperty(k,v);}};};execute(f);unchanged(f,f.keys.recovery,before);assert.equal(JSON.parse(f.props[f.keys.attention]).code,'TRANSFER_REVIEW_REQUIRED');});
test('Source change preserves all existing mutation, recovery, removal, selection, lease and trigger function bodies',()=>{const a=fs.readFileSync(path.join(root,'baseline/HubTestBackgroundRecovery.gs'),'utf8'),b=fs.readFileSync(path.join(root,'candidate/HubTestBackgroundRecovery.gs'),'utf8');const parts=s=>Object.fromEntries([...s.matchAll(/^function (\w+)\(/gm)].map((m,i,all)=>[m[1],s.slice(m.index,all[i+1]?.index??s.length).trim()]));const x=parts(a),y=parts(b);for(const name of Object.keys(x))if(!['beautyBackgroundClock_','beautyBackgroundRemovalRun_'].includes(name))assert.equal(y[name],x[name],name);assert.equal(y.beautyBackgroundRemovalRun_.split('// Read-only fast path')[0].trim(),x.beautyBackgroundRemovalRun_.split('// Private:')[0].trim());new vm.Script(b);});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,nativeAcceptance:false,scope:'Exact candidate worker composed with current registration projection/recovery/attention, provider decoding, identity validation and TEST URL guards; simulated lock, property, sheet and provider services.'};fs.writeFileSync(path.join(root,'evidence/recheck-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
