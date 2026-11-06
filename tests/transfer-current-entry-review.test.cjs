const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
const journal='BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_a123',pointer='BEAUTY_NAKKA_REVIEW_t_QHaG_7792_a123';
function pending(o={}){
 const h=harness({...o,state:{entries:[{name:'Anna',tpid:'b123',...(o.link?{lpid:'a123'}:{})},{name:'Other',tpid:'c123',lpid:'d123'},{name:'Third',tpid:'e123'}],...o.state}});
 const state=h.context.beautyHubTransferState_('Anna','fixture');
 const original=JSON.stringify({state:'ATTEMPTED',recordedUTC:'2026-10-27T19:24:21.556Z',uid:'owner',event:state.event,identity:state.identity,beforeCount:1,beforeHash:'original-before-fingerprint'});
 h.props.set(journal,original);return {...h,original};
}
test('grown roster after uncertain old add offers staff review only and sends no Nakka POST',()=>{
 const h=pending(),p=h.preview();assert.equal(p.status,'REVIEW_EXISTING');assert.equal(p.tpid,'b123');assert.equal(p.identity.lpid,'a123');assert.equal(p.operationVerified,false);assert.equal(p.identityVerified,false);assert.equal(h.posts().length,0);assert.equal(h.props.get(journal),h.original);assert.equal(h.props.has(pointer),false);
});
test('confirmed current-entry review archives an explicit receipt and keeps the original ATTEMPTED record byte-for-byte',()=>{
 const h=pending(),p=h.preview(),r=h.save(p);assert.equal(r.status,'CURRENT_ENTRY_REVIEWED');assert.equal(r.readbackVerified,true);assert.equal(r.identityVerified,false);assert.equal(r.operationVerified,false);assert.equal(r.changed,false);assert.equal(h.posts().length,0);assert.equal(h.props.get(journal),h.original);
 const text=h.props.get(pointer),receipt=JSON.parse(text);assert.equal(receipt.tpid,'b123');assert.equal(receipt.uid,'owner');assert.equal(receipt.kind,'STAFF_REVIEWED_CURRENT_ENTRY');assert.equal(receipt.journalHash,h.context.beautyHubTransferHash_(h.original));assert.equal(h.props.get(receipt.auditKey),text);assert.equal(h.preview().status,'CURRENT_ENTRY_REVIEWED');assert.equal(h.posts().length,0);
});
test('current review distinguishes exposed league link from unexposed exact identity',()=>{
 const h=pending({link:true}),r=h.save(h.preview());assert.equal(r.identityVerified,true);assert.equal(r.operationVerified,false);assert.equal(JSON.parse(h.props.get(journal)).state,'ATTEMPTED');assert.equal(h.posts().length,0);
});
test('review ticket is single-use and bound to original session and user',()=>{
 for(const mutate of [h=>h.state.uid='other',h=>h.context.beautyHubRequestToken_='other',h=>{for(const [k,v]of h.cache){const x=JSON.parse(v);x.expires=1;h.cache.set(k,JSON.stringify(x));}}]){
  const h=pending(),p=h.preview();mutate(h);assert.equal(h.save(p).code,'STALE_TRANSFER');assert.equal(h.props.has(pointer),false);assert.equal(h.posts().length,0);
 }
 const h=pending(),p=h.preview();assert.equal(h.save(p).success,true);const text=h.props.get(pointer);assert.equal(h.save(p).code,'STALE_TRANSFER');assert.equal(h.props.get(pointer),text);
});
test('changed journal entry ID roster league or event invalidates the review before any review write',()=>{
 for(const mutate of [h=>h.props.set(journal,h.original+' '),h=>h.state.entries[0].tpid='x123',h=>h.state.entries.push({name:'New',tpid:'n123'}),h=>h.state.league[0].lpid='z123',h=>h.state.event.updateTime++]){
  const h=pending(),p=h.preview();mutate(h);assert.equal(h.save(p).success,false);assert.equal(h.props.has(pointer),false);assert.equal(h.posts().length,0);
 }
});
test('review receipt does not enable a retry when the player later disappears from Nakka',()=>{
 const h=pending();assert.equal(h.save(h.preview()).success,true);h.state.entries=h.state.entries.filter(r=>r.name!=='Anna');assert.equal(h.preview().code,'TRANSFER_REVIEW_REQUIRED');assert.equal(h.props.get(journal),h.original);assert.equal(h.posts().length,0);
});
test('replacement entry requires fresh review and cannot reuse the receipt for another player ID',()=>{
 const h=pending();assert.equal(h.save(h.preview()).success,true);h.state.entries[0].tpid='x123';assert.equal(h.preview().status,'REVIEW_EXISTING');assert.equal(h.posts().length,0);
 const text=h.props.get(pointer),r=JSON.parse(text);r.tpid='x123';h.props.set(pointer,JSON.stringify(r));assert.equal(h.preview().status,'REVIEW_EXISTING');h.props.set(r.auditKey,JSON.stringify(r));h.props.set(journal,h.original+' ');assert.equal(h.preview().status,'REVIEW_EXISTING');
});
test('public registration context cannot create a staff review or silently acknowledge uncertainty',()=>{
 const h=pending();h.context.beautyHubPlayerContext_={source:'MOBIL'};h.context.beautyHubPlayerTransferRequire_=()=>({uid:'public',sessionBinding:'public'});
 assert.equal(h.preview().code,'TRANSFER_REVIEW_REQUIRED');assert.equal(h.cache.size,0);assert.equal(h.props.has(pointer),false);assert.equal(h.posts().length,0);
});
test('review cannot turn into an add if the old journal is removed between preview and confirmation',()=>{
 const h=pending(),p=h.preview();h.props.delete(journal);h.state.entries=h.state.entries.filter(r=>r.name!=='Anna');assert.equal(h.save(p).code,'STALE_TRANSFER');assert.equal(h.posts().length,0);assert.equal(h.props.has(pointer),false);
});
test('review storage failure reports uncertainty without provider mutation or rewriting attempt history',()=>{
 const h=pending({journalFailure:true}),r=h.save(h.preview());assert.equal(r.code,'REVIEW_SAVE_UNCERTAIN');assert.equal(h.props.get(journal),h.original);assert.equal(h.posts().length,0);assert.equal(h.props.has(pointer),false);
});
test('attention clears only after confirmed current-entry review and reappears if that entry is replaced',()=>{
 const h=pending();const original=h.context.PropertiesService.getScriptProperties;h.context.PropertiesService.getScriptProperties=()=>({...original(),getProperties:()=>Object.fromEntries(h.props)});
 h.context.beautyHubNakkaEvent_=()=>({status:'MATCHED',eventDate:h.state.date,event:{id:h.state.event.tdid,title:h.state.event.title}});
 vm.runInContext(fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTestAttention.gs','utf8'),h.context);
 assert.equal(h.context.beautyHubAttentionRefresh_({}).attention.items[0].code,'TRANSFER_REVIEW_REQUIRED');
 assert.equal(h.preview().status,'REVIEW_EXISTING');assert.equal(h.context.beautyHubAttentionRead_({eventDate:h.state.date,players:[]}).items.length,1);
 assert.equal(h.save(h.preview()).success,true);assert.equal(h.context.beautyHubAttentionRefresh_({}).attention.items.length,0);assert.equal(h.props.get(journal),h.original);
 h.state.entries[0].tpid='x123';assert.equal(h.context.beautyHubAttentionRefresh_({}).attention.items[0].code,'TRANSFER_REVIEW_REQUIRED');assert.equal(h.posts().length,0);
});

function confirmedMissing(o={}){
 const h=harness(o),first=h.save(h.preview()),original=h.props.get(journal);assert.equal(first.readbackVerified,true);
 h.state.entries=[];h.calls.length=0;return {...h,original};
}
test('Confirmed missing entry offers staff recovery navigation without an add ticket or journal mutation',()=>{
 const h=confirmedMissing(),r=h.preview();assert.equal(r.success,false);assert.equal(r.code,'TRANSFER_REVIEW_REQUIRED');
 assert.equal(r.recovery.kind,'CONFIRMED_ENTRY_MISSING');assert.equal(r.recovery.player,'Anna');assert.equal(r.recovery.identity.lpid,'a123');assert.equal(r.recovery.event.id,'t_QHaG_7792');
 assert.equal(r.ticket,undefined);assert.equal(h.props.get(journal),h.original);assert.equal(h.posts().length,0);
 h.context.beautyHubPlayerContext_={source:'MOBIL'};h.context.beautyHubPlayerTransferRequire_=()=>({uid:'public',sessionBinding:'public'});
 assert.equal(h.preview().recovery,undefined);assert.equal(h.posts().length,0);
});
test('Manually restored confirmed entry requires a new staff review and preserves the historical transfer byte for byte',()=>{
 for(const linked of [false,true]){
  const h=confirmedMissing(),original=h.original;h.state.entries=[{name:'Anna',tpid:'r123',...(linked?{lpid:'a123'}:{})}];
  const api=h.context.PropertiesService.getScriptProperties;h.context.PropertiesService.getScriptProperties=()=>({...api(),getProperties:()=>Object.fromEntries(h.props)});
  h.context.beautyHubNakkaEvent_=()=>({status:'MATCHED',eventDate:h.state.date,event:{id:h.state.event.tdid,title:h.state.event.title}});
  vm.runInContext(fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTestAttention.gs','utf8'),h.context);
  assert.equal(h.context.beautyHubAttentionRefresh_({}).attention.items[0].code,'TRANSFER_REVIEW_REQUIRED');
  const p=h.preview();assert.equal(p.status,'REVIEW_EXISTING');assert.equal(p.tpid,'r123');assert.equal(h.props.has(pointer),false);
  const r=h.save(p);assert.equal(r.status,'CURRENT_ENTRY_REVIEWED');assert.equal(r.identityVerified,linked);assert.equal(r.operationVerified,false);
  assert.equal(h.props.get(journal),original);assert.equal(h.posts().length,0);assert.equal(h.context.beautyHubAttentionRefresh_({}).attention.items.length,0);
  const receipt=JSON.parse(h.props.get(pointer));assert.equal(h.props.get(receipt.auditKey),h.props.get(pointer));
  h.state.entries=[];assert.equal(h.preview().recovery.kind,'CONFIRMED_ENTRY_MISSING');assert.equal(h.posts().length,0);
 }
});
test('Restored entry review fails closed for identity conflicts changed history missing entries and stale sessions',()=>{
 for(const change of [
  h=>h.state.entries[0].lpid='z123',
  h=>h.state.entries.push({name:'Anna',tpid:'s123'}),
  h=>h.props.set(journal,h.original+' '),
  h=>h.state.entries=[],
  h=>h.state.uid='another'
 ]){
  const h=confirmedMissing();h.state.entries=[{name:'Anna',tpid:'r123',lpid:'a123'}];const p=h.preview();assert.equal(p.status,'REVIEW_EXISTING');change(h);
  assert.equal(h.save(p).success,false);assert.equal(h.props.has(pointer),false);assert.equal(h.posts().length,0);
 }
});
test('Uncertain missing entries retain the retry barrier and never claim a confirmed earlier transfer',()=>{
 const h=pending();h.state.entries=[];const p=h.preview();assert.equal(p.code,'TRANSFER_REVIEW_REQUIRED');assert.equal(p.recovery.kind,'UNCONFIRMED_ENTRY_MISSING');
 assert.equal(p.ticket,undefined);assert.equal(h.props.get(journal),h.original);assert.equal(h.posts().length,0);
});
