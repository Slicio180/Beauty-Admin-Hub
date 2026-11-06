const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const rpc=(h,route,data=input)=>h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](data);
for(const route of ['MOBIL','KIOSK']){
 test(route+' TEST registration saves and transfers with stamped source and no Hub staff session',()=>{
  const h=registration({noAuth:true}),r=rpc(h,route);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.rows[0].length,6);assert.equal(h.rows[0][5],route);assert.equal(h.posts().length,1);assert.equal(h.acquires,3);assert.equal(h.held,false);assert.equal(h.context.beautyHubPlayerContext_,null);
  assert.deepEqual(Object.keys(r.nakka).sort(),['entryConfirmed','identityVerified','needsAttention']);assert.doesNotMatch(JSON.stringify(r),/SECRET|journal|sessionBinding|test-registration:/);
 });
 test(route+' TEST registration retains Sheet success on timeout and blocks duplicate across sources',()=>{
  const h=registration({noAuth:true,postTimeout:true}),r=rpc(h,route);assert.equal(r.success,true);assert.equal(r.nakka.needsAttention,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);
  const other=route==='MOBIL'?'KIOSK':'MOBIL';assert.equal(rpc(h,other,{...input,identityChoice:'existing',identityBase:'Anna'}).code,'ALREADY_REGISTERED');assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);assert.equal(h.context.beautyHubPlayerContext_,null);
 });
 test(route+' TEST registration rejects target source context token and actor spoofing before writes',()=>{
  for(const extra of [{source:'HUB'},{source:route},{token:'staff'},{context:'TRANSFER'},{_expectedEventDate:input.eventDate},{existingPlayer:'true'},{tdid:'t_other'}]){const h=registration();const r=rpc(h,route,{...input,...extra});assert.equal(r.success,false);assert.equal(h.rows.length,0);assert.equal(h.posts().length,0);assert.equal(h.context.beautyHubPlayerContext_,null);}
 });
 test(route+' TEST registration preserves nickname conflict and creates the resolved new league identity',()=>{
  const h=registration({noAuth:true,newLeague:true});const first=rpc(h,route,{...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'Anna'});assert.equal(first.code,'NAME_CONFLICT');assert.equal(h.rows.length,0);
  const r=rpc(h,route,{...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'Anna',identityChoice:'different',identityBase:'Anna',identityDetail:'Other',identityConfirmedName:'Anna (Other)'});assert.equal(r.success,true);assert.equal(r.player,'Anna (Other)');assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,2);assert.equal(h.rows[0][2],'Anna (Other)');
 });
 test(route+' TEST registration stale day busy and invalid input cannot append or transfer',()=>{
  for(const data of [null,[],{}, {...input,eventDate:'2026-10-28'}]){const h=registration(),r=rpc(h,route,data);assert.equal(r.success,false);assert.equal(h.rows.length,0);assert.equal(h.posts().length,0);assert.equal(h.context.beautyHubPlayerContext_,null);}
  const h=registration({busy:true});assert.equal(rpc(h,route).code,'BUSY');assert.equal(h.rows.length,0);assert.equal(h.context.beautyHubPlayerContext_,null);
 });
}
test('Player registration context returns only bounded names date and availability without staff access',()=>{
 const h=registration({noAuth:true}),r=h.context.getTestRegistrationContext();assert.equal(r.eventDate,input.eventDate);assert.equal(r.registrationAvailable,true);assert.deepEqual(Array.from(r.names),['Anna','Other','MITT NAMN FINNS INTE I LISTAN']);assert.deepEqual(Object.keys(r).sort(),['eventDate','names','registrationAvailable','success']);assert.equal(h.calls.length,0);assert.equal(h.rows.length,0);
 assert.throws(()=>h.context.getTestRegistrationContext({sheet:'wrong'}));h.state.date='2026-10-28';assert.equal(h.context.getTestRegistrationContext().registrationAvailable,false);
 assert.equal(h.context.beautyHubTest('read',{},'bad').code,'AUTH_REQUIRED');
});
test('Player context cannot call transfers for a different player or unlock a Hub staff route',()=>{
 const h=registration({noAuth:true});h.context.beautyHubPlayerContext_={source:'MOBIL',eventDate:input.eventDate,phase:'TRANSFER',nonce:'a'.repeat(32),expires:h.context.Date.now()+60000,player:'Anna'};
 assert.throws(()=>h.context.beautyHubNakkaAuthorize_('Other'),/AUTH_REQUIRED/);assert.equal(h.context.beautyHubTest('read',{},'bad').code,'AUTH_REQUIRED');
 h.context.beautyHubPlayerContext_.expires=1;assert.throws(()=>h.context.beautyHubNakkaAuthorize_('Anna'),/AUTH_REQUIRED/);h.context.beautyHubPlayerContext_=null;assert.throws(()=>h.context.beautyHubNakkaAuthorize_('Anna'),/AUTH_REQUIRED/);assert.equal(h.posts().length,0);
});
test('Player registration context always clears on core error and never becomes a reusable public credential',()=>{
 const h=registration({noAuth:true});h.context.submitRegistrationLocked_=()=>{throw Error('fixture failure');};assert.throws(()=>rpc(h,'MOBIL'),/fixture failure/);assert.equal(h.context.beautyHubPlayerContext_,null);assert.equal(h.posts().length,0);
 assert.throws(()=>h.context.beautyHubPlayerTransferRequire_('Anna'),/AUTH_REQUIRED/);
});
test('Central TEST kiosk route uses owner-only existing project and rejects configuration injection',()=>{
 const h=registration();h.context.HtmlService={createHtmlOutputFromFile:file=>({file,addMetaTag(){return this;},setTitle(){return this;}})};
 assert.equal(h.context.doGet({parameter:{page:'kiosk'}}).file,'KioskTest');assert.equal(h.context.doGet({parameter:{page:'remote'}}).file,'RemoteRegistration');assert.throws(()=>h.context.doGet({parameter:{page:'kiosk',sheet:'wrong'}}));
 const manifest=JSON.parse(fs.readFileSync('apps-script/registration-identity-test/remote-app/appsscript.json'));assert.equal(manifest.webapp.access,'MYSELF');assert.equal(manifest.webapp.executeAs,'USER_ACCESSING');assert.deepEqual(manifest.oauthScopes,['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.external_request']);
});
test('Player registrations reuse existing Nakka entry and truthful unavailable league-ID state',()=>{
 const existing=registration({noAuth:true,state:{entries:[{name:'Anna',tpid:'b123'}]}}),r=rpc(existing,'KIOSK');assert.equal(r.nakka.entryConfirmed,true);assert.equal(r.nakka.identityVerified,false);assert.equal(existing.posts().length,0);
 const missing=registration({noAuth:true,omitLink:true}),saved=rpc(missing,'MOBIL');assert.equal(saved.nakka.entryConfirmed,true);assert.equal(saved.nakka.identityVerified,false);assert.equal(missing.posts().length,1);
});
test('Player registration project and write gates block service access and leave context empty',()=>{
 const h=registration();h.context.beautyHubTestGuard_=()=>{throw Error('wrong project');};assert.throws(()=>rpc(h,'MOBIL'),/wrong project/);assert.throws(()=>h.context.getTestRegistrationContext(),/wrong project/);assert.equal(h.rows.length,0);assert.equal(h.calls.length,0);assert.equal(h.context.beautyHubPlayerContext_,null);
 const disabled=registration({disableActualWrites:true});assert.equal(rpc(disabled,'KIOSK').code,'BLOCKED');assert.equal(disabled.rows.length,0);assert.equal(disabled.calls.length,0);assert.equal(disabled.context.beautyHubPlayerContext_,null);
});
