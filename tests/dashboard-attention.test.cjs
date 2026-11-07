const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const source=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTestAttention.gs','utf8');
const json=v=>JSON.parse(JSON.stringify(v));
function attach(h){
 const original=h.context.PropertiesService.getScriptProperties;
 h.context.PropertiesService.getScriptProperties=()=>({...original(),getProperties:()=>Object.fromEntries(h.props)});
 vm.runInContext(source,h.context);return h;
}
function fixture(o={}){
 const h=attach(harness(o));
 h.context.beautyHubNakkaEvent_=()=>({status:'MATCHED',eventDate:h.state.date,event:{id:h.state.event.tdid,title:h.state.event.title}});
 return {...h,refresh:()=>h.context.beautyHubAttentionRefresh_({}),read:()=>h.context.beautyHubAttentionRead_({eventDate:h.state.date,players:h.state.hub.map(p=>({player:p.name,status:p.status}))})};
}
test('Verified removal clears its existing attention record without deleting provider journals',()=>{
 const h=fixture();h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'MISSING_EVENT_ENTRY'});
 h.context.beautyHubAttentionRemember_('Anna',h.state.date,{success:true,readbackVerified:true,status:'REMOVED'});
 assert.equal(h.read().items.length,0);assert.equal(h.posts().length,0);
});
test('Uncertain removal retains organiser attention through read-only refresh even when event entry is present',()=>{
 const h=fixture({state:{entries:[{name:'Anna',tpid:'b123',lpid:'a123'}]}});h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'REMOVE_UNCERTAIN'});
 const r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items[0].code,'REMOVE_REVIEW_REQUIRED');assert.equal(h.posts().length,0);
});
test('Attention persists across server invocations and isolates dates without leaking credentials',()=>{
 const h=fixture();assert.equal(h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'TRANSFER_BUSY'}),true);
 const copy=fixture();for(const [k,v]of h.props)copy.props.set(k,v);
 assert.deepEqual(json(copy.read().items),[{name:'Anna',code:'TRANSFER_BUSY'}]);assert.doesNotMatch(JSON.stringify(copy.read()),/SECRET|N01_API|session/);
 copy.state.date='2026-10-28';assert.equal(copy.read().items.length,0);assert.equal(h.calls.length,0);
});
test('Attention records failed Hub mobile and kiosk Nakka outcomes after Sheet success and keeps public responses private',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=attach(registration({failGet:true,noAuth:route!=='HUB'}));
  const r=route==='HUB'?h.register(input):route==='MOBIL'?h.context.submitRegistration(input):h.context.submitKioskRegistration(input);
  assert.equal(r.success,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);
  const saved=h.context.beautyHubAttentionRead_({eventDate:input.eventDate,players:[]});assert.equal(saved.items.length,1);assert.equal(saved.items[0].name,'Anna');
  if(route!=='HUB')assert.doesNotMatch(JSON.stringify(r),/journal|BEAUTY_TEST_ATTENTION|SECRET/);
 }
});
test('Attention finds earlier missing IN entries using GET only and retains OUT issues',()=>{
 const h=fixture({state:{hub:[{name:'Anna',status:'IN'},{name:'Other',status:'OUT'}]}});h.context.beautyHubAttentionRemember_('Other',h.state.date,{code:'ENTRY_UNCONFIRMED'});
 const r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items.length,2);assert.equal(h.posts().length,0);assert.equal(h.read().complete,true);assert(h.calls.every(c=>c.options.method==='get'));
});
test('Attention flags duplicate league identity even when the name is already in the event',()=>{
 const h=fixture({state:{league:[{name:'Anna',lpid:'a123'},{name:' Anna ',lpid:'a124'}],entries:[{name:'Anna',tpid:'b123'}]}});
 const r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items[0].code,'LEAGUE_IDENTITY_REVIEW');assert.equal(h.posts().length,0);
});
test('Attention verified entry clears its alert without claiming an unexposed league ID or deleting journals',()=>{
 const h=fixture({state:{entries:[{name:'Anna',tpid:'b123'}]}});h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'ENTRY_UNCONFIRMED'});
 const key='BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_a123',record=JSON.stringify({state:'ENTRY_VERIFIED_LINK_UNEXPOSED',event:{id:'t_QHaG_7792',date:h.state.date},identity:{name:'Anna',lpid:'a123'},tpid:'b123'});h.props.set(key,record);
 const r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items.length,0);assert.equal(h.props.get(key),record);assert.equal(h.posts().length,0);assert.doesNotMatch(JSON.stringify(r),/identityVerified":true/);
});
test('Attention uncertain creation cannot clear through same-name event presence',()=>{
 const h=fixture({state:{entries:[{name:'Anna',tpid:'b123',lpid:'a123'}]}}),key='BEAUTY_NAKKA_LEAGUE_CREATE_lg_M2wQ_4189_'+h.context.beautyHubTransferHash_('anna');h.props.set(key,JSON.stringify({state:'ATTEMPTED',name:'Anna'}));
 const before=h.props.get(key),r=h.refresh();assert.equal(r.attention.items[0].code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(h.props.get(key),before);assert.equal(h.posts().length,0);
});
test('Attention uncertain transfer reconciliation respects the saved fingerprint',()=>{
 for(const correct of [false,true]){
  const h=fixture({state:{entries:[{name:'Anna',tpid:'b123'}]}}),key='BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_a123';
  h.props.set(key,JSON.stringify({state:'ATTEMPTED',event:{id:'t_QHaG_7792',date:h.state.date},identity:{name:'Anna',lpid:'a123'},beforeCount:0,beforeHash:correct?h.context.beautyHubTransferHash_([]):'wrong'}));
  const before=h.props.get(key),r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items.length,correct?0:1);assert.equal(h.props.get(key),before);assert.equal(h.posts().length,0);
 }
});
test('Attention outage malformed data and wrong target retain alerts instead of clearing them',()=>{
 for(const o of [{failGet:true},{state:{league:[{name:'Anna',lpid:'bad'}]}},{state:{event:{tdid:'t_OTHER_0001',title:'Other'}}}]){
  const h=fixture(o);h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'ENTRY_UNCONFIRMED'});assert.equal(h.refresh().success,false);assert.equal(h.read().items.length,1);assert.equal(h.posts().length,0);
 }
});
test('Attention refresh requires staff authorization and rejects injected input before provider calls',()=>{
 const h=fixture({noAuth:true});assert.throws(h.refresh,/AUTH_REQUIRED/);assert.equal(h.calls.length,0);
 const staff=fixture();assert.throws(()=>staff.context.beautyHubAttentionRefresh_({tdid:'other'}),/Unexpected/);assert.equal(staff.calls.length,0);
});
test('Attention stale Hub snapshot and busy lock do not publish a clear result',()=>{
 const busy=fixture({busy:true});assert.equal(busy.refresh().code,'BUSY');assert.equal(busy.calls.length,0);
 const h=fixture({state:{entries:[{name:'Anna',tpid:'b123'}]},onFetch:({url,state})=>{if(url.includes('league/entry/list'))state.date='2026-10-28';}});
 h.context.beautyHubAttentionRemember_('Anna','2026-10-27',{code:'ENTRY_UNCONFIRMED'});assert.equal(h.refresh().success,false);h.state.date='2026-10-27';assert.equal(h.read().items.length,1);
});
test('Attention corrupt records produce unavailable rather than a false white zero',()=>{
 const h=fixture();h.props.set(h.context.beautyHubAttentionKey_(h.state.date,'Anna'),'{broken');assert.equal(h.read().available,false);
});
test('Attention confirmed manual transfer clears an issue through existing guarded readback',()=>{
 const h=fixture();h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'MISSING_EVENT_ENTRY'});const p=h.preview(),r=h.save(p);assert.equal(r.readbackVerified,true);assert.equal(h.read().items.length,0);assert.equal(h.posts().length,1);
});

test('Attention storage failure cannot turn a committed registration into a repeatable failure',()=>{const h=attach(registration({journalFailure:true}));const r=h.register(input);assert.equal(r.success,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);assert.equal(h.context.beautyHubAttentionRemember_('Anna',input.eventDate,{code:'ENTRY_UNCONFIRMED'}),false);});

test('Original registration diagnostic survives attention refresh and manual recovery without provider writes',()=>{
 const h=fixture({state:{league:[]}}),c=h.context;
 assert.equal(c.beautyHubRegistrationDiagnostic_('Anna',h.state.date,'MOBIL',{code:'TRANSFER_BUSY'},'LEAGUE_LOCK'),true);
 c.beautyHubAttentionRemember_('Anna',h.state.date,{code:'TRANSFER_BUSY'});
 const key=c.beautyHubRegistrationDiagnosticKey_('Anna',h.state.date),before=h.props.get(key);
 const r=h.refresh();assert.equal(r.attention.items[0].code,'LEAGUE_IDENTITY_REVIEW');assert.equal(r.attention.items[0].registrationDiagnostic.code,'TRANSFER_BUSY');assert.equal(r.attention.items[0].registrationDiagnostic.stage,'LEAGUE_LOCK');
 c.beautyHubAttentionRemember_('Anna',h.state.date,{entryConfirmed:true});assert.equal(h.props.get(key),before);assert.equal(h.read().items.length,0);assert.equal(h.posts().length,0);
});
test('Automatic registration stores bounded source phase and failure code for Hub mobile and kiosk',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=attach(registration({newLeague:true,creationTimeout:true,state:{league:[]},noAuth:route!=='HUB'}));
  const send=h.context.beautyHubAutoSend_;h.context.beautyHubAutoSend_=(...args)=>{assert.equal(h.context.beautyHubRegistrationDiagnosticRead_('Anna',input.eventDate).code,'AUTO_STARTED');return send(...args);};
  const result=route==='HUB'?h.register():h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);
  assert.equal(result.success,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);
  const d=h.context.beautyHubRegistrationDiagnosticRead_('Anna',input.eventDate);assert.equal(d.source,route);assert.equal(d.stage,'LEAGUE_WRITE');assert.equal(d.code,'LEAGUE_CREATION_UNCERTAIN');assert.doesNotMatch(JSON.stringify(d),/SECRET|password|token|Anna/);
  if(route!=='HUB')assert.equal(result.nakka.registrationDiagnostic,undefined);
 }
});
test('Diagnostic write failure does not invalidate committed registration or trigger another send',()=>{
 const h=attach(registration()),original=h.context.PropertiesService.getScriptProperties;
 h.context.PropertiesService.getScriptProperties=()=>{const p=original();return {...p,setProperty:(k,v)=>{if(k.startsWith('BEAUTY_TEST_REG_DIAGNOSTIC_'))throw Error('SECRET');return p.setProperty(k,v);}};};
 const result=h.register();assert.equal(result.success,true);assert.equal(result.nakka.entryConfirmed,true);assert.equal(h.posts().length,1);assert.equal(h.rows.length,1);
});
test('Registration diagnostics isolate event scopes and dates and reject raw provider details',()=>{
 const h=fixture(),c=h.context;c.beautyHubEventScopeId_=()=> 'event-one';
 c.beautyHubRegistrationDiagnostic_('Anna',h.state.date,'KIOSK',{code:'SECRET request body'},'raw SECRET');
 const d=c.beautyHubRegistrationDiagnosticRead_('Anna',h.state.date);assert.equal(d.code,'ENTRY_UNCONFIRMED');assert.equal(d.stage,'UNKNOWN');assert.doesNotMatch(JSON.stringify(d),/SECRET/);
 assert.equal(c.beautyHubRegistrationDiagnosticRead_('Anna','2026-10-28'),null);c.beautyHubEventScopeId_=()=> 'event-two';assert.equal(c.beautyHubRegistrationDiagnosticRead_('Anna',h.state.date),null);
});

test('Attention monitoring releases the shared lock during Nakka reads and permits a concurrent registration lock',()=>{
 let held=false;const h=fixture({onFetch:()=>{assert.equal(held,false,'provider GET outside registration lock');const other=h.context.LockService.getScriptLock();assert.equal(other.tryLock(0),true);other.releaseLock();}});
 h.context.LockService.getScriptLock=()=>({tryLock:()=>{if(held)return false;held=true;return true;},releaseLock:()=>{assert.equal(held,true);held=false;}});
 const r=h.refresh();assert.equal(r.success,true);assert.equal(held,false);assert.equal(h.posts().length,0);
});
test('Attention snapshot cannot overwrite a transfer result committed during its unlocked network reads',()=>{
 let changed=false;const h=fixture({onFetch:()=>{if(!changed){changed=true;h.context.beautyHubAttentionRemember_('Anna',h.state.date,{entryConfirmed:true});}}});
 h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'MISSING_EVENT_ENTRY'});
 const r=h.refresh();assert.equal(r.code,'STALE_CHECK');assert.equal(h.read().items.length,0);assert.equal(h.posts().length,0);
});
test('Attention snapshot detects journal writes even when Hub names and statuses have not changed',()=>{
 let changed=false;const h=fixture({onFetch:()=>{if(!changed){changed=true;h.props.set('BEAUTY_NAKKA_TRANSFER_test','new operation');}}});
 h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'TRANSFER_UNCERTAIN'});
 assert.equal(h.refresh().code,'STALE_CHECK');assert.equal(h.read().items[0].code,'TRANSFER_UNCERTAIN');assert.equal(h.posts().length,0);
});
test('Attention skips publishing while the commit lock is busy and retains saved alerts',()=>{
 const h=fixture();let attempts=0,releases=0;h.context.LockService.getScriptLock=()=>({tryLock:()=>++attempts===1,releaseLock:()=>releases++});
 h.context.beautyHubAttentionRemember_('Anna',h.state.date,{code:'TRANSFER_UNCERTAIN'});
 assert.equal(h.refresh().code,'BUSY');assert.equal(releases,1);assert.equal(h.read().items[0].code,'TRANSFER_UNCERTAIN');
});

test('Mobile and kiosk registrations finish while an attention provider read is in progress and its stale result is discarded',()=>{
 for(const route of ['MOBIL','KIOSK']){
  let submitted=false,result;const h=attach(registration({onFetch:()=>{if(!submitted){submitted=true;result=h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);}}}));
  h.context.beautyHubNakkaEvent_=()=>({status:'MATCHED',eventDate:h.state.date,event:{id:h.state.event.tdid,title:h.state.event.title}});
  const check=h.context.beautyHubAttentionRefresh_({});assert.equal(result.success,true);assert.equal(result.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);assert.equal(check.code,'STALE_CHECK');assert.equal(h.held,false);
 }
});
