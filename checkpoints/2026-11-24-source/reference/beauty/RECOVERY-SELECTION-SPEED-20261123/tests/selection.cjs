const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture,clone,hash}=require('./regression/fixture.cjs');
const root=path.resolve(__dirname,'..'),checks=[];
const worker=kind=>fs.readFileSync(path.join(root,kind,'HubTestBackgroundRecovery.gs'),'utf8');
const helper=(kind)=>fs.readFileSync(path.join(root,kind,'HubTestAttention.gs'),'utf8');
const parts=text=>Object.fromEntries([...text.matchAll(/^function (\w+)\(/gm)].map((m,i,all)=>[m[1],text.slice(m.index,all[i+1]?.index??text.length).trim()]));
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
function setup(source='candidate',helperSource=source){
 process.env.BEAUTY_CLAIM_SOURCE=source;const f=fixture();delete process.env.BEAUTY_CLAIM_SOURCE;
 const counts={single:0,bulk:0,recoverySingle:0,eventScope:0,target:0};
 f.c.beautyHubEventScopeId_=()=>{counts.eventScope++;return f.context.eventId;};
 f.c.beautyHubTransferTarget_=()=>{counts.target++;return f.context.eventId;};
 const h=parts(helper(helperSource));
 vm.runInContext(['beautyHubAttentionKey_','beautyPlayerRecoveryKey_','beautyPlayerRecoveryLoad_','beautyPlayerRecoveryDecode_'].filter(k=>h[k]).map(k=>h[k]).join('\n'),f.c);
 const getProps=f.c.PropertiesService.getScriptProperties;
 f.c.PropertiesService.getScriptProperties=()=>{const p=getProps();return {...p,getProperties(){counts.bulk++;return p.getProperties();},getProperty(k){counts.single++;if(k.startsWith('BEAUTY_PLAYER_RECOVERY_V1_'))counts.recoverySingle++;return p.getProperty(k);}};};
 const recKey=name=>f.c.beautyPlayerRecoveryKey_(name,f.context.date);
 f.c.beautyPlayerRecoverySave_=(r,code,state,source)=>{r.state=state;r.code=code;r.updatedAt=new f.c.Date().toISOString();r.history.push({at:r.updatedAt,code,state,source});f.props[recKey(r.name)]=JSON.stringify(r);return r;};
 f.record=(name='A',change={})=>{const r={version:1,eventId:f.context.eventId,name,date:f.context.date,state:'VERIFIED',code:'ENTRY_CONFIRMED',updatedAt:new Date(f.now()-360000).toISOString(),history:[],...change};f.props[recKey(name)]=JSON.stringify(r);return r;};
 return {...f,counts,recKey,resetCounts:()=>{for(const k of Object.keys(counts))counts[k]=0;},select:()=>clone(f.c.beautyBackgroundCandidates_(f.now()))};
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

test('Six due recovery records use one final read and one event-scope lookup instead of six each',()=>{
 const a=setup('baseline'),b=setup();for(const f of [a,b]){for(let i=1;i<=6;i++){f.receipt('Player '+i);f.record('Player '+i);}f.resetCounts();}
 assert.deepEqual(b.select(),a.select());assert.equal(a.counts.recoverySingle,6);assert.equal(b.counts.recoverySingle,1);
 assert.equal(a.counts.eventScope,6);assert.equal(b.counts.eventScope,1);assert.equal(a.counts.target,6);assert.equal(b.counts.target,0);
 assert.equal(a.counts.bulk,1);assert.equal(b.counts.bulk,1);assert.equal(a.counts.single,9);assert.equal(b.counts.single,4);
 fs.writeFileSync(path.join(root,'evidence/selection-service-counts.json'),JSON.stringify({scope:'Six due receipts; actual current shared helpers with synthetic context/property services; not native latency',baseline:a.counts,candidate:b.counts},null,2)+'\n');
});
test('A new invocation gets a fresh property snapshot',()=>{const f=setup();f.receipt('A');assert.equal(f.select().length,1);f.receipt('B');assert.equal(f.select().length,2);assert.equal(f.counts.bulk,2);});
test('Selection snapshot does not mutate registration records',()=>{const f=setup();f.receipt('A');f.record('A');const before=clone(f.props);f.select();assert.deepEqual(f.props,before);});
test('Selected receipt changed after the snapshot is rejected before claiming or provider work',()=>{
 const f=setup();f.enable();f.receipt('A');const get=f.c.PropertiesService.getScriptProperties;let changed=false;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){const all=p.getProperties();if(!changed){changed=true;const r=JSON.parse(f.props['registration-A']);r.message='Later legitimate message';f.props['registration-A']=JSON.stringify(r);}return all;}};};
 f.tick();assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_SELECTION_CHANGED');assert.equal(JSON.parse(f.props[f.config.runKey]).state,'PAUSED_CHECK');assert.equal(f.provider.length,0);assert.equal(f.props[f.recKey('A')],undefined);assert.equal(JSON.parse(f.props['registration-A']).message,'Later legitimate message');
});
test('Selected receipt deleted after the snapshot cannot become a claim',()=>{
 const f=setup();f.receipt('A');const get=f.c.PropertiesService.getScriptProperties;f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){const all=p.getProperties();delete f.props['registration-A'];return all;}};};assert.equal(outcome(f).error,'BACKGROUND_SELECTION_CHANGED');assert.equal(f.provider.length,0);
});
test('Context changed after snapshot decoding is rejected before a claim',()=>{
 const f=setup();f.enable();f.receipt('A');const decode=f.c.beautyPlayerRecoveryDecode_;f.c.beautyPlayerRecoveryDecode_=(...args)=>{const r=decode(...args);f.context.title='Changed context title';return r;};f.tick();assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_CONTEXT_CHANGED');assert.equal(f.provider.length,0);assert.equal(f.props[f.recKey('A')],undefined);
});
test('Provider, mutation, lease, deferral, exhausted-claim and trigger functions remain byte-identical',()=>{
 const a=parts(worker('baseline')),b=parts(worker('candidate'));
 for(const name of Object.keys(a))if(!['beautyBackgroundCandidates_','beautyBackgroundClock_'].includes(name))assert.equal(b[name],a[name],name);
 assert.equal(b.beautyBackgroundClock_.replace("selectionMode:'batched-recovery-v3'","selectionMode:'batched-keys-v2'"),a.beautyBackgroundClock_);
 new vm.Script(worker('candidate'));new vm.Script(helper('candidate'));
});
test('Operation admission still reads the current receipt and preserves the long-lock guard',()=>{
 const f=setup();f.enable();f.receipt('A');f.c.beautyRegistrationRecoveryResume_=()=>{assert(f.lock.hasLock());const r=f.c.beautyBackgroundReceipt_('A');assert.equal(r.name,'A');return {success:true};};f.tick();const run=JSON.parse(f.props[f.config.runKey]);assert.equal(run.result.verified,true);assert.equal(run.timing.selectionMode,'batched-recovery-v3');assert.equal(f.lock.hasLock(),false);
});

function duringSnapshot(f,fn){const get=f.c.PropertiesService.getScriptProperties;let changed=false;f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){const all=p.getProperties();if(!changed){changed=true;fn();}return all;}};};}
for(const [label,change] of [
 ['interactive owner',r=>{r.owner='staff-owner';r.state='CHECKING';}],
 ['manual issue',r=>{r.state='NEEDS_HELP';r.code='REGISTRATION_DISPLAY_REVIEW';}],
 ['later verification',r=>r.updatedAt='2026-11-21T19:00:00.000Z'],
 ['retry count',r=>{r.autoAttempts=3;r.worker={attempts:3};}],
 ['backoff',r=>r.worker={nextAt:Date.parse('2026-11-21T20:00:00Z')}],
 ['history',r=>r.history.push({source:'staff',state:'CHECKING'})]
])test('Fresh selected-record guard preserves a later '+label,()=>{
 const f=setup();f.enable();f.receipt('A');f.record('A');const key=f.recKey('A');let updated;
 duringSnapshot(f,()=>{const r=JSON.parse(f.props[key]);change(r);updated=f.props[key]=JSON.stringify(r);});
 f.tick();assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_SELECTION_CHANGED');assert.equal(f.props[key],updated);assert.equal(f.provider.length,0);
 assert(!f.writes.some(x=>x.key===key));
});
test('A newly created selected recovery record is never overwritten from an empty snapshot',()=>{
 const f=setup();f.enable();f.receipt('A');const key=f.recKey('A');let raw;
 duringSnapshot(f,()=>{f.record('A',{owner:'staff',state:'CHECKING'});raw=f.props[key];});f.tick();
 assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_SELECTION_CHANGED');assert.equal(f.props[key],raw);assert.equal(f.provider.length,0);
});
test('A selected recovery deleted after the batch is not recreated',()=>{
 const f=setup();f.enable();f.receipt('A');f.record('A');const key=f.recKey('A');duringSnapshot(f,()=>delete f.props[key]);f.tick();
 assert.equal(JSON.parse(f.props[f.config.runKey]).code,'BACKGROUND_SELECTION_CHANGED');assert.equal(f.props[key],undefined);assert.equal(f.provider.length,0);
});
test('A changed selected record is rejected even when only serialized whitespace differs',()=>{
 const f=setup();f.receipt('A');f.record('A');const key=f.recKey('A');duringSnapshot(f,()=>f.props[key]=' '+f.props[key]);assert.equal(outcome(f).error,'BACKGROUND_SELECTION_CHANGED');
});
test('A later unrelated manual issue is preserved and excluded by the next fresh selection',()=>{
 const f=setup();for(const n of ['A','B']){f.receipt(n);f.record(n);}const key=f.recKey('B');let raw;
 duringSnapshot(f,()=>{const r=JSON.parse(f.props[key]);r.state='NEEDS_HELP';r.code='REGISTRATION_DISPLAY_REVIEW';raw=f.props[key]=JSON.stringify(r);});
 assert.equal(f.select()[0].name,'A');assert.equal(f.props[key],raw);assert.deepEqual(f.select().map(x=>x.name),['A']);assert.equal(f.props[key],raw);
});
test('Read failure during the final selected recovery check creates no operation claim',()=>{
 const f=setup();f.enable();f.receipt('A');f.record('A');const key=f.recKey('A'),before=f.props[key],get=f.c.PropertiesService.getScriptProperties;
 f.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperty:k=>{if(k===key)throw Error('service down');return p.getProperty(k);}};};f.tick();
 assert.equal(JSON.parse(f.props[f.config.runKey]).state,'PAUSED_CHECK');assert.equal(f.props[key],before);assert.equal(f.provider.length,0);
});
for(const [workerSource,helperSource] of [['baseline','candidate'],['candidate','baseline']])test('Mixed source installation remains safe: '+workerSource+' worker / '+helperSource+' helper',()=>{
 const normal=setup(),mixed=setup(workerSource,helperSource);for(const f of [normal,mixed])for(const n of ['A','B']){f.receipt(n);f.record(n);}
 assert.deepEqual(mixed.select(),normal.select());assert.equal(mixed.provider.length,0);assert.equal(mixed.writes.length,0);
});
test('Attention and recovery keys stay identical for Unicode, case and whitespace variants',()=>{
 const a=setup('baseline'),b=setup();for(const name of ['A','  Åke  Öström ','A\u030ake O\u0308stro\u0308m','Élodie','Ö','lower','UPPER','']){
  assert.equal(b.c.beautyHubAttentionKey_(b.context.date,name),a.c.beautyHubAttentionKey_(a.context.date,name));
  assert.equal(b.recKey(name),a.recKey(name));assert.equal(b.c.beautyPlayerRecoveryKey_(name,b.context.date,b.context.eventId),a.recKey(name));
 }
});
test('Explicit checked event produces identical keys without reading event context again',()=>{
 const f=setup(),expected=f.recKey('Åke');f.resetCounts();assert.equal(f.c.beautyPlayerRecoveryKey_('Åke',f.context.date,f.context.eventId),expected);assert.equal(f.counts.eventScope,0);
});
test('Ordinary key calls continue to read the current event on every invocation',()=>{
 const f=setup();f.resetCounts();const a=f.recKey('A');f.context.eventId='t_other';const b=f.recKey('A');assert.notEqual(a,b);assert.equal(f.counts.eventScope,2);
});
test('Existing default legacy attention namespace remains unchanged',()=>{
 const a=setup('baseline'),b=setup();delete a.c.beautyHubEventScopeId_;delete b.c.beautyHubEventScopeId_;
 assert.equal(a.recKey('A'),b.recKey('A'));assert.equal(a.c.beautyHubAttentionKey_('2026-11-21','A'),b.c.beautyHubAttentionKey_('2026-11-21','A'));
});
for(const scope of [null,false,12,{},'', 'lg_M2wQ_4189','t_a/b','t_'+ 'a'.repeat(81)])test('Malformed private event namespace fails closed: '+JSON.stringify(scope),()=>{
 const f=setup();assert.throws(()=>f.c.beautyPlayerRecoveryKey_('A',f.context.date,scope),/REGISTRATION_CONTEXT_CHANGED/);assert.equal(f.provider.length,0);assert.equal(f.writes.length,0);
});
test('Normal recovery loader keeps original decoding and short-circuit target behavior',()=>{
 const a=setup('baseline'),b=setup();for(const raw of [undefined,'','{bad','null','{}',JSON.stringify({version:2}),JSON.stringify({version:1,name:'A',date:'2026-11-21',eventId:'other',history:[],state:'VERIFIED'}),JSON.stringify({version:1,name:'A',date:'2026-11-21',eventId:a.context.eventId,history:[],state:'VERIFIED'})]){
  const output=[];for(const f of [a,b]){const key=f.recKey('A');if(raw===undefined)delete f.props[key];else f.props[key]=raw;f.resetCounts();try{output.push({record:clone(f.c.beautyPlayerRecoveryLoad_('A',f.context.date)),target:f.counts.target});}catch(e){output.push({error:e.message,target:f.counts.target});}}
  assert.deepEqual(output[1],output[0]);
 }
});
test('Default recovery loader performs a fresh read on each call',()=>{
 const f=setup();f.record('A');const first=f.c.beautyPlayerRecoveryLoad_('A',f.context.date);f.record('A',{state:'NEEDS_HELP'});const second=f.c.beautyPlayerRecoveryLoad_('A',f.context.date);assert.equal(first.state,'VERIFIED');assert.equal(second.state,'NEEDS_HELP');
});
test('Only private key and decode helpers change in the shared attention module',()=>{
 const a=parts(helper('baseline')),b=parts(helper('candidate'));
 for(const name of Object.keys(a))if(!['beautyHubAttentionKey_','beautyPlayerRecoveryKey_','beautyPlayerRecoveryLoad_'].includes(name))assert.equal(b[name],a[name],name);
 assert.deepEqual(Object.keys(b).filter(k=>!a[k]),['beautyPlayerRecoveryDecode_']);
});

const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,scope:'Differential selection against exact installed baseline; actual receipt/worker and recovery loader, synthetic platform services. No native speed claim.'};
fs.writeFileSync(path.join(root,'evidence/selection-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
