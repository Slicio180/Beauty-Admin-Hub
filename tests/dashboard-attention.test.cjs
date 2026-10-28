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
 const key='BEAUTY_NAKKA_TRANSFER_t_RqC2_2034_a123',record=JSON.stringify({state:'ENTRY_VERIFIED_LINK_UNEXPOSED',event:{id:'t_RqC2_2034',date:h.state.date},identity:{name:'Anna',lpid:'a123'},tpid:'b123'});h.props.set(key,record);
 const r=h.refresh();assert.equal(r.success,true);assert.equal(r.attention.items.length,0);assert.equal(h.props.get(key),record);assert.equal(h.posts().length,0);assert.doesNotMatch(JSON.stringify(r),/identityVerified":true/);
});
test('Attention uncertain creation cannot clear through same-name event presence',()=>{
 const h=fixture({state:{entries:[{name:'Anna',tpid:'b123',lpid:'a123'}]}}),key='BEAUTY_NAKKA_LEAGUE_CREATE_lg_tM2v_3523_'+h.context.beautyHubTransferHash_('anna');h.props.set(key,JSON.stringify({state:'ATTEMPTED',name:'Anna'}));
 const before=h.props.get(key),r=h.refresh();assert.equal(r.attention.items[0].code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(h.props.get(key),before);assert.equal(h.posts().length,0);
});
test('Attention uncertain transfer reconciliation respects the saved fingerprint',()=>{
 for(const correct of [false,true]){
  const h=fixture({state:{entries:[{name:'Anna',tpid:'b123'}]}}),key='BEAUTY_NAKKA_TRANSFER_t_RqC2_2034_a123';
  h.props.set(key,JSON.stringify({state:'ATTEMPTED',event:{id:'t_RqC2_2034',date:h.state.date},identity:{name:'Anna',lpid:'a123'},beforeCount:0,beforeHash:correct?h.context.beautyHubTransferHash_([]):'wrong'}));
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
