const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture,clone,hash}=require('./regression/fixture.cjs');
const root=path.resolve(__dirname,'..'),checks=[];
const worker=kind=>fs.readFileSync(path.join(root,kind,'HubTestBackgroundRecovery.gs'),'utf8');
const attention=fs.readFileSync(path.join(root,'../NAKKA-MONITOR-FIX-20261123/candidate/HubTestAttention.gs'),'utf8');
const loader=attention.slice(attention.indexOf('function beautyPlayerRecoveryLoad_'),attention.indexOf('function beautyPlayerRecoverySave_'));
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
function setup(source='candidate'){
 process.env.BEAUTY_CLAIM_SOURCE=source;const f=fixture();delete process.env.BEAUTY_CLAIM_SOURCE;
 f.c.beautyPlayerRecoveryKey_=name=>'recovery-'+name;f.c.beautyHubTransferTarget_=()=>f.context.eventId;
 vm.runInContext(loader,f.c);
 const counts={single:0,bulk:0,receiptSingle:0,key:0,scope:0};
 const getProps=f.c.PropertiesService.getScriptProperties;
 f.c.PropertiesService.getScriptProperties=()=>{const p=getProps();return {...p,getProperties(){counts.bulk++;return p.getProperties();},getProperty(k){counts.single++;if(k.startsWith('registration-'))counts.receiptSingle++;return p.getProperty(k);}};};
 const getKey=f.c.beautyRegistrationRecoveryKey_;f.c.beautyRegistrationRecoveryKey_=name=>{counts.key++;return getKey(name);};
 const scope=f.c.beautyBackgroundScope_;f.c.beautyBackgroundScope_=()=>{counts.scope++;return scope();};
 f.record=(name='A',change={})=>{const r={version:1,eventId:f.context.eventId,name,date:f.context.date,state:'VERIFIED',code:'ENTRY_CONFIRMED',updatedAt:new Date(f.now()-360000).toISOString(),history:[],...change};f.props['recovery-'+name]=JSON.stringify(r);return r;};
 return {...f,counts,select:()=>clone(f.c.beautyBackgroundCandidates_(f.now()))};
}
const outcome=f=>{try{return {items:f.select()};}catch(e){return {error:e.message};}};
function same(name,prepare){test(name,()=>{const a=setup('baseline'),b=setup();prepare(a);prepare(b);assert.deepEqual(outcome(b),outcome(a));assert.equal(b.provider.length,0);assert.equal(b.writes.length,0);});}

same('Empty history remains idle without provider or storage writes',()=>{});
same('Six due verified registrations keep identical ordering',f=>{for(let i=1;i<=6;i++){f.receipt('Player '+i);f.record('Player '+i);}});
same('New saved registration still waits for its original synchronous completion',f=>f.receipt('A',{recordedAt:new Date(f.now()-59999).toISOString()}));
same('Registration becomes eligible at the existing sixty-second boundary',f=>f.receipt('A',{recordedAt:new Date(f.now()-60000).toISOString()}));
same('Future-dated registration is not selected',f=>f.receipt('A',{recordedAt:new Date(f.now()+1000).toISOString()}));
same('Verified cooldown still lasts five minutes',f=>{f.receipt('A');f.record('A',{updatedAt:new Date(f.now()-299999).toISOString()});});
same('Verified registration remains due at the five-minute boundary',f=>{f.receipt('A');f.record('A',{updatedAt:new Date(f.now()-300000).toISOString()});});
same('Recent active claim remains unselected',f=>{f.receipt('A');f.record('A',{state:'CHECKING',updatedAt:new Date(f.now()-599999).toISOString()});});
same('Transient failure preserves retry eligibility',f=>{f.receipt('A');f.record('A',{state:'NEEDS_HELP',code:'NAKKA_UNAVAILABLE',autoAttempts:2});});
same('Genuine manual issue remains unselected',f=>{f.receipt('A');f.record('A',{state:'NEEDS_HELP',code:'REGISTRATION_DISPLAY_REVIEW'});});
same('Backoff and retry limit remain unchanged',f=>{f.receipt('A');f.record('A',{state:'NEEDS_HELP',code:'TRANSFER_BUSY',autoAttempts:3,worker:{attempts:3,nextAt:f.now()+10000}});});
same('Due removal remains ahead of newer registration',f=>{f.receipt('A');f.c.beautyRemovalRecoveryRows_=()=>[{name:'Removed',autoEligible:true,journal:'journal',history:[{at:new Date(f.now()-500000).toISOString()}]}];});
for(const state of ['ATTEMPTED','VERIFIED'])same(state+' later removal still suppresses re-registration',f=>{f.receipt('A');f.c.beautyRemovalRecoveryList_=()=>[{receipt:{player:'A',state,recordedUTC:new Date(f.now()).toISOString()}}];});
same('Older verified removal does not suppress a legitimate later registration',f=>{f.receipt('A');f.c.beautyRemovalRecoveryList_=()=>[{receipt:{player:'A',state:'VERIFIED',recordedUTC:new Date(f.now()-999999).toISOString()}}];});
same('Unrelated property keys remain outside selection',f=>{f.receipt('A');f.props.other='not json';});
same('One hundred receipts remain supported',f=>{for(let i=0;i<100;i++)f.receipt('P'+i);});
same('Receipt limit still refuses a larger history',f=>{for(let i=0;i<101;i++)f.receipt('P'+i);});
same('Malformed receipt JSON fails closed',f=>{f.props['registration-A']='{bad';});
same('A mismatched receipt property key fails closed',f=>{const r=f.receipt('A');r.name='B';f.props['registration-A']=JSON.stringify(r);});
for(const [field,value] of [['version',2],['context','different'],['sheetId','other'],['eventId','other'],['date','2026-11-22'],['state','UNKNOWN'],['source','OTHER'],['existingPlayer','true'],['row',1],['recordedAt','invalid']])same('Receipt validation unchanged for invalid '+field,f=>f.receipt('A',{[field]:value}));
for(const field of ['name','version','eventId','date','history','state'])same('Recovery record validation unchanged for invalid '+field,f=>{f.receipt('A');f.record('A',{[field]:field==='history'?{}:null});});
same('Non-integer automatic attempt count still fails closed',f=>{f.receipt('A');f.record('A',{autoAttempts:1.5});});
same('Selection still validates exact TEST context',f=>{f.receipt('A');f.context.revision='other';});

test('Six-receipt selection avoids repeated receipt service reads and scope loads',()=>{
 const a=setup('baseline'),b=setup();for(const f of [a,b])for(let i=1;i<=6;i++){f.receipt('Player '+i);f.record('Player '+i);}
 assert.deepEqual(b.select(),a.select());assert.equal(a.counts.receiptSingle,12);assert.equal(b.counts.receiptSingle,1);
 assert.equal(a.counts.scope,7);assert.equal(b.counts.scope,2);assert.equal(a.counts.key,12);assert.equal(b.counts.key,7);
 fs.writeFileSync(path.join(root,'evidence/local-read-counts.json'),JSON.stringify({scope:'Six due receipts; synthetic service-call counts, not native timing',baseline:a.counts,candidate:b.counts},null,2)+'\n');
});
test('A new invocation gets a fresh property snapshot',()=>{const f=setup();f.receipt('A');assert.equal(f.select().length,1);f.receipt('B');assert.equal(f.select().length,2);assert.equal(f.counts.bulk,2);});
test('Selection snapshot does not mutate registration records',()=>{const f=setup();f.receipt('A');f.record('A');const before=clone(f.props);f.select();assert.deepEqual(f.props,before);});
test('Selected receipt changed after the snapshot is rejected before claiming or provider work',()=>{
 const f=setup();f.enable();f.receipt('A');const get=f.c.PropertiesService.getScriptProperties;let changed=false;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){const all=p.getProperties();if(!changed){changed=true;const r=JSON.parse(f.props['registration-A']);r.message='Later legitimate message';f.props['registration-A']=JSON.stringify(r);}return all;}};};
 f.tick();assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_SELECTION_CHANGED');assert.equal(JSON.parse(f.props[f.config.runKey]).state,'PAUSED_CHECK');assert.equal(f.provider.length,0);assert.equal(f.props['recovery-A'],undefined);assert.equal(JSON.parse(f.props['registration-A']).message,'Later legitimate message');
});
test('Selected receipt deleted after the snapshot cannot become a claim',()=>{
 const f=setup();f.receipt('A');const get=f.c.PropertiesService.getScriptProperties;f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){const all=p.getProperties();delete f.props['registration-A'];return all;}};};assert.equal(outcome(f).error,'BACKGROUND_SELECTION_CHANGED');assert.equal(f.provider.length,0);
});
test('Context changed after the last receipt check is rejected before a claim',()=>{
 const f=setup();f.enable();f.receipt('A');const load=f.c.beautyPlayerRecoveryLoad_;f.c.beautyPlayerRecoveryLoad_=(...args)=>{const r=load(...args);f.context.title='Changed context title';return r;};f.tick();assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_CONTEXT_CHANGED');assert.equal(f.provider.length,0);assert.equal(f.props['recovery-A'],undefined);
});
test('Provider, mutation, lease, exhausted-claim and trigger functions remain byte-identical',()=>{
 const parts=text=>Object.fromEntries(text.split(/(?=^function )/m).slice(1).map(s=>[s.match(/^function (\w+)/)[1],s]));
 const a=parts(worker('baseline')),b=parts(worker('candidate'));
 for(const name of Object.keys(a))if(!['beautyBackgroundReceipt_','beautyBackgroundCandidates_','beautyBackgroundClock_'].includes(name))assert.equal(b[name],a[name],name);
 assert.equal(b.beautyBackgroundClock_.replace(",selectionMode:'batched-keys-v2'",''),a.beautyBackgroundClock_);
 new vm.Script(worker('candidate'));
});
test('Operation admission still reads the current receipt and preserves the long-lock guard',()=>{
 const f=setup();f.enable();f.receipt('A');f.c.beautyRegistrationRecoveryResume_=()=>{assert(f.lock.hasLock());const r=f.c.beautyBackgroundReceipt_('A');assert.equal(r.name,'A');return {success:true};};f.tick();const run=JSON.parse(f.props[f.config.runKey]);assert.equal(run.result.verified,true);assert.equal(run.timing.selectionMode,'batched-keys-v2');assert.equal(f.lock.hasLock(),false);
});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,scope:'Differential selection against exact installed baseline; actual receipt/worker and recovery loader, synthetic platform services. No native speed claim.'};
fs.writeFileSync(path.join(root,'evidence/selection-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
