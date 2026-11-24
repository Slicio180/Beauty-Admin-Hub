const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture,hash,clone}=require('./fixture.cjs');const checks=[];
function test(name,fn){fn();checks.push(name);}
function setup({attempts=3,historyLength=3}={}){
 const f=fixture();f.enable();const receipt=f.receipt();
 const registrationServices=Object.fromEntries(['beautyRegistrationRecoveryPrefix_','beautyRegistrationRecoveryKey_','beautyRegistrationRecoveryResume_'].map(k=>[k,f.c[k]]));
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../candidate/HubTestAttention.gs'),'utf8'),f.c);
 Object.assign(f.c,registrationServices);
 Object.assign(f.c,{beautyPlayerRecoveryKey_:name=>'recovery-'+name,beautyHubTransferTarget_:()=>f.context.eventId,beautyHubEventScopeId_:()=>f.context.eventId,
  beautyHubRegistrationDiagnosticRead_:()=>null,beautyRegistrationRecoveryPending_:()=>[],beautyContextToken_:()=>f.context.revision,
  beautyHubActiveTestTarget_:()=>({id:f.context.eventId,title:f.context.title})});
 const claimedAt=new Date(f.now()-660000).toISOString(),leaseUntil=f.now()-60000;
 const record={version:1,eventId:f.context.eventId,name:receipt.name,date:f.context.date,state:'CHECKING',code:'RECOVERY_STARTED',owner:'expired-owner',autoAttempts:attempts,updatedAt:claimedAt,
  worker:{version:1,attempts,context:clone(f.context),intentHash:hash(f.c.beautyBackgroundReceiptIntent_(receipt)),claimedAt,leaseUntil,nextAt:f.now()-420000},
  history:Array.from({length:historyLength},(_,i)=>({at:new Date(Date.parse(claimedAt)-(historyLength-1-i)*600000).toISOString(),code:'RECOVERY_STARTED',state:'CHECKING',source:'background'}))};
 f.props['recovery-'+receipt.name]=JSON.stringify(record);const original=f.props['recovery-'+receipt.name];
 f.props[f.config.runKey]=JSON.stringify({state:'RUNNING',owner:record.owner,triggerUid:JSON.parse(f.props[f.config.key]).triggerUid,context:clone(f.context),operation:'registration',player:receipt.name,startedAt:claimedAt,leaseUntil});
 const get=()=>JSON.parse(f.props['recovery-'+receipt.name]);
 const edit=fn=>{const r=get();fn(r);f.props['recovery-'+receipt.name]=JSON.stringify(r);};
 const view=()=>f.c.beautyPlayerRecoveryView_({eventDate:f.context.date,players:[{player:receipt.name,status:'IN'}]}).players[0];
 return {...f,receipt,record,original,get,edit,view};
}
function noChange(f){const before=f.props['recovery-'+f.receipt.name];f.tick();assert.equal(f.props['recovery-'+f.receipt.name],before);assert.equal(f.provider.length,0);}
function wrapProperties(f,hook){const original=f.c.PropertiesService.getScriptProperties;f.c.PropertiesService.getScriptProperties=()=>{const p=original();return {...p,setProperty(k,v){hook(k,v,p);return p.setProperty(k,v);}};};}

test('Expired third background claim becomes NEEDS_HELP with full immutable before-image and no provider call',()=>{
 const f=setup({historyLength:20});const receiptRaw=f.props['registration-'+f.receipt.name];f.tick();const r=f.get(),run=JSON.parse(f.props[f.config.runKey]);
 assert.equal(r.state,'NEEDS_HELP');assert.equal(r.code,'BACKGROUND_RETRY_EXHAUSTED');assert.equal(r.autoAttempts,3);assert.equal(r.worker.attempts,3);assert.equal(r.owner,f.record.owner);
 assert.equal(f.props[r.worker.exhaustedBackup],f.original);assert.deepEqual(r.history.slice(0,-1),f.record.history.slice(1));assert.equal(r.history.at(-1).source,'background-review');
 assert.deepEqual({...r.worker,exhaustedBackup:undefined},{...f.record.worker,exhaustedBackup:undefined});assert.equal(receiptRaw,f.props['registration-'+f.receipt.name]);
 assert.equal(run.state,'FINISHED');assert.equal(run.result.requiresReview,true);assert.equal(run.result.verified,false);assert.equal(run.result.nakkaWrites,0);assert.equal(f.provider.length,0);
});
test('Repeated ticks neither reset attempts nor append another terminal history or backup',()=>{
 const f=setup();f.tick();const before=f.props['recovery-'+f.receipt.name],keys=Object.keys(f.props).filter(k=>k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_'));f.advance(3600000);f.tick();f.tick();assert.equal(f.props['recovery-'+f.receipt.name],before);assert.deepEqual(Object.keys(f.props).filter(k=>k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_')),keys);assert.equal(f.provider.length,0);
});
test('A second interrupted attempt retains ordinary recovery eligibility',()=>{
 const f=setup({attempts:2});f.tick();assert.equal(f.get().state,'VERIFIED');assert.equal(f.get().autoAttempts,3);assert.deepEqual(f.provider,['resume','send']);assert(!f.get().worker.exhaustedBackup);
});
test('An active global lease prevents terminalization',()=>{const f=setup();const r=JSON.parse(f.props[f.config.runKey]);r.leaseUntil=f.now()+60000;f.props[f.config.runKey]=JSON.stringify(r);noChange(f);});
test('A contended ScriptLock leaves records and provider untouched',()=>{const f=setup();f.setBusy(true);const before=clone(f.props);f.tick();assert.deepEqual(f.props,before);assert.equal(f.provider.length,0);});
for(const [name,change]of[
 ['unexpired per-player lease',r=>r.worker.leaseUntil=Number.MAX_SAFE_INTEGER],
 ['recent recovery update',r=>r.updatedAt=new Date(Date.parse(r.updatedAt)+600000).toISOString()],
 ['missing lease',r=>delete r.worker.leaseUntil],
 ['non-numeric lease',r=>r.worker.leaseUntil='expired'],
 ['invalid claim time',r=>r.worker.claimedAt='bad'],
 ['future update time',r=>r.updatedAt='2099-01-01T00:00:00Z'],
 ['older worker count than current attempts',r=>r.worker.attempts=2],
 ['non-integer counter',r=>r.autoAttempts=3.5],
 ['different context revision',r=>r.worker.context.revision='later'],
 ['changed intent hash',r=>r.worker.intentHash='later'],
 ['interactive owner claim',r=>{r.owner='interactive-owner';r.history.at(-1).source='review';}],
 ['missing source history',r=>r.history=[]],
 ['mismatched history timestamp',r=>r.history.at(-1).at='2020-01-01T00:00:00Z'],
 ['future backoff',r=>r.worker.nextAt=Number.MAX_SAFE_INTEGER],
 ['finished result rather than interrupted check',r=>{r.state='NEEDS_HELP';r.code='NAKKA_UNAVAILABLE';}]
])test(name+' is preserved without automatic finalization',()=>{const f=setup();f.edit(change);noChange(f);});
test('A later registration message preserves the old recovery and the new intent',()=>{const f=setup();const r=JSON.parse(f.props['registration-'+f.receipt.name]);r.message='Later legitimate message';f.props['registration-'+f.receipt.name]=JSON.stringify(r);noChange(f);assert.equal(JSON.parse(f.props['registration-'+f.receipt.name]).message,r.message);});
for(const state of ['ATTEMPTED','VERIFIED'])test(state+' intervening removal takes precedence without re-registration',()=>{const f=setup();f.c.beautyRemovalRecoveryList_=()=>[{receipt:{player:f.receipt.name,state,recordedUTC:new Date(f.now()).toISOString()}}];noChange(f);});
test('A record superseded after the backup write cannot be overwritten',()=>{
 const f=setup();let changed=false;wrapProperties(f,(k)=>{if(k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_')&&!changed){changed=true;f.edit(r=>{r.owner='later-owner';r.history.at(-1).source='review';});}});f.tick();assert.equal(f.get().owner,'later-owner');assert.equal(f.get().state,'CHECKING');assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_EXHAUSTED_CLAIM_CHANGED');assert.equal(f.provider.length,0);
});
test('Changed registration between backup and final save cannot be overwritten',()=>{
 const f=setup();wrapProperties(f,k=>{if(k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_')){const r=JSON.parse(f.props['registration-'+f.receipt.name]);r.consent='JA, JAG GODKÄNNER';f.props['registration-'+f.receipt.name]=JSON.stringify(r);}});f.tick();assert.equal(f.get().state,'CHECKING');assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_EXHAUSTED_CLAIM_CHANGED');assert.equal(f.provider.length,0);
});
test('Removal appearing after backup is preserved and blocks finalization',()=>{
 const f=setup();let later=false;wrapProperties(f,k=>{if(k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_'))later=true;});f.c.beautyRemovalRecoveryList_=()=>later?[{receipt:{player:f.receipt.name,state:'ATTEMPTED',recordedUTC:new Date(f.now()).toISOString()}}]:[];f.tick();assert.equal(f.get().state,'CHECKING');assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_REMOVAL_PENDING');assert.equal(f.provider.length,0);
});
test('Backup storage failure never publishes a terminal result',()=>{
 const f=setup();wrapProperties(f,k=>{if(k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_'))throw Error('Storage down');});f.tick();assert.equal(f.get().state,'CHECKING');assert(!f.get().worker.exhaustedBackup);assert.equal(JSON.parse(f.props[f.config.runKey]).state,'NEEDS_HELP');assert.equal(f.provider.length,0);
});
test('Existing conflicting backup is not overwritten',()=>{
 const f=setup(),key='BEAUTY_BACKGROUND_EXHAUSTED_V1_'+hash([f.context.eventId,f.context.revision,f.receipt.name,f.record.owner,f.record.worker.claimedAt]);f.props[key]='conflicting before-image';f.tick();assert.equal(f.props[key],'conflicting before-image');assert.equal(f.get().state,'CHECKING');assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_EXHAUSTED_BACKUP_CHANGED');
});
test('Existing identical backup allows an interrupted local finalization to finish once',()=>{
 const f=setup(),key='BEAUTY_BACKGROUND_EXHAUSTED_V1_'+hash([f.context.eventId,f.context.revision,f.receipt.name,f.record.owner,f.record.worker.claimedAt]);f.props[key]=f.original;f.tick();assert.equal(f.get().state,'NEEDS_HELP');assert.equal(f.props[key],f.original);assert.equal(f.provider.length,0);
});
test('Recovery-record write failure retains the immutable before-image and can finish later without transfer',()=>{
 const f=setup();let fail=true;wrapProperties(f,k=>{if(k==='recovery-'+f.receipt.name&&fail)throw Error('Recovery storage down');});f.tick();assert.equal(f.get().state,'CHECKING');assert.equal(Object.keys(f.props).filter(k=>k.startsWith('BEAUTY_BACKGROUND_EXHAUSTED_V1_')).length,1);fail=false;f.tick();assert.equal(f.get().state,'NEEDS_HELP');assert.equal(f.provider.length,0);
});
test('Exhausted record is red and not auto-eligible even if attention save fails over a fresh CLEAR',()=>{
 const f=setup();f.c.beautyHubAttentionRemember_(f.receipt.name,f.context.date,{entryConfirmed:true});const attention=f.c.beautyHubAttentionKey_(f.context.date,f.receipt.name);wrapProperties(f,k=>{if(k===attention)throw Error('Attention unavailable');});f.tick();const v=f.view();assert.equal(v.tone,'red');assert.equal(v.code,'BACKGROUND_RETRY_EXHAUSTED');assert.equal(v.autoEligible,false);assert.match(v.problem,/retry limit/);assert.match(v.next,/Check after correction/);
});
test('Old transient attention cannot hide the exhausted result or start another automatic attempt',()=>{
 const f=setup();f.c.beautyHubAttentionRemember_(f.receipt.name,f.context.date,{code:'MISSING_EVENT_ENTRY'});const attention=f.c.beautyHubAttentionKey_(f.context.date,f.receipt.name);wrapProperties(f,k=>{if(k===attention)throw Error('Attention unavailable');});f.tick();assert.equal(f.view().code,'BACKGROUND_RETRY_EXHAUSTED');assert.equal(f.view().autoEligible,false);
});
test('Direct finalizer invocation cannot obtain clock authority',()=>{const f=setup(),before=clone(f.props);assert.throws(()=>f.c.beautyBackgroundExhaustedRun_({name:f.receipt.name}),/CLAIM_REQUIRED/);assert.deepEqual(f.props,before);assert.equal(f.provider.length,0);});
test('Review-only worker operation cannot acquire provider mutation authority',()=>{
 const f=setup(),original=f.c.beautyBackgroundExhaustedRun_;f.c.beautyBackgroundExhaustedRun_=item=>{assert.throws(()=>f.c.beautyBackgroundMutationRequire_('tournament/entry/update',{}),/MUTATION_BLOCKED/);return original(item);};f.tick();assert.equal(f.get().state,'NEEDS_HELP');assert.equal(f.provider.length,0);
});
test('Phase diagnostics distinguish selector and operation time while preserving the existing long-lock model',()=>{
 const f=fixture();f.enable();f.receipt();const select=f.c.beautyBackgroundCandidates_;f.c.beautyBackgroundCandidates_=now=>{f.advance(120);return select(now);};
 f.c.beautyRegistrationRecoveryResume_=()=>{assert(f.lock.hasLock());f.advance(20);return {success:true};};f.c.beautyHubAutoSendRun_=()=>{assert(f.lock.hasLock());f.advance(30);return {entryConfirmed:true};};
 f.tick();const run=JSON.parse(f.props[f.config.runKey]);assert.equal(run.timing.selectionMs,120);assert.equal(run.timing.operationMs,50);assert.equal(run.timing.beforeResultSaveMs,170);assert.equal(f.lock.hasLock(),false);assert.equal(run.result.verified,true);
});
const out={result:'PASS',checks:checks.length,recordedUTC:new Date().toISOString(),details:checks,remoteCalls:0,nativeAcceptance:false,scope:'Actual candidate worker, recovery storage/policy/view with simulated Apps Script services; existing guard and full before-image preservation checks. Phase timing values are simulated, not speed measurements.'};
fs.writeFileSync(path.join(__dirname,'../evidence/candidate-tests.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
