const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
const base='apps-script/registration-identity-test/remote-app/';
const input={eventDate:'2026-10-27',selectedName:'Anna',consent:'JA, JAG GODKÄNNER',message:'TEST'};
const {registration}=require('./fixtures/hub-registration-runtime.cjs');
test('Automatic Hub registration saves once then sends one fixed TEST add without a manual transfer step',()=>{
 const h=registration(),r=h.register();assert.equal(r.success,true);assert.equal(r.existingPlayer,true);assert.equal(r.nakka.status,'TRANSFERRED');assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.rows[0].length,6);assert.equal(h.rows[0][5],'HUB');assert.equal(h.rows[0][0].toISOString(),'2026-10-27T17:00:00.000Z');assert.equal(r.registrationEventDate,input.eventDate);assert.equal(h.posts().length,1);assert.equal(h.acquires,2);assert.equal(h.held,false);assert.equal(h.cache.size,0);
 const conflict=h.register();assert.equal(conflict.code,'NAME_CONFLICT');const again=h.register({...input,identityChoice:'existing',identityBase:'Anna'});assert.equal(again.code,'ALREADY_REGISTERED');assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);
});
test('Automatic Hub registration preserves Sheet success when Nakka cannot be read and never resubmits',()=>{
 const h=registration({failGet:true}),r=h.register();assert.equal(r.success,true);assert.equal(h.rows.length,1);assert.equal(r.nakka.status,'ATTENTION');assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,0);assert.equal(h.register({...input,identityChoice:'existing',identityBase:'Anna'}).code,'ALREADY_REGISTERED');assert.equal(h.rows.length,1);assert.doesNotMatch(JSON.stringify(r),/SECRET/);
});
test('Automatic Hub registration handles missing LPID readback as entry confirmed with identity explicitly unverified',()=>{
 const h=registration({omitLink:true}),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.status,'ENTRY_VERIFIED_LINK_UNEXPOSED');assert.equal(r.nakka.entryConfirmed,true);assert.equal(r.nakka.identityVerified,false);assert.equal(h.posts().length,1);assert.equal(h.rows.length,1);
});
test('Automatic Hub registration existing Nakka entries are reused without a duplicate add',()=>{
 const h=registration({state:{entries:[{name:'Anna',tpid:'b123'}]}}),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.status,'ALREADY_PRESENT');assert.equal(r.nakka.entryConfirmed,true);assert.equal(r.nakka.identityVerified,false);assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);
});
test('Automatic Hub registration target mismatch ambiguous league and OUT state retain registration and refuse transfer',()=>{
 for(const o of [{otherTarget:true},{state:{league:[{name:'Anna',lpid:'a123'},{name:'ANNA',lpid:'z123'}]}}]){const h=registration(o),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.status,'ATTENTION');assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);}
 const h=registration();h.context.updatePlayerStatusData_=n=>h.state.hub.push({name:n,status:'OUT'});assert.equal(h.register().nakka.status,'ATTENTION');assert.equal(h.posts().length,0);
});
test('Automatic Hub registration new-player and different-person nickname identities create verified league members',()=>{
 for(const data of [{...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'New Person'},{...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'Anna',identityChoice:'different',identityBase:'Anna',identityDetail:'Other',identityConfirmedName:'Anna (Other)'}]){
  const h=registration({newLeague:true}),r=h.register(data);assert.equal(r.success,true);assert.equal(r.existingPlayer,false);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,2);assert.ok(h.master.includes(r.player));
 }
});
test('Automatic Hub registration conflict cancellation and stale dates never start a transfer or append',()=>{
 const h=registration(),conflict=h.register({...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'Anna'});assert.equal(conflict.code,'NAME_CONFLICT');assert.equal(h.rows.length,0);assert.equal(h.posts().length,0);
 assert.equal(h.register({...input,eventDate:'2026-10-28'}).code,'STALE_EVENT');assert.equal(h.rows.length,0);
 const future=registration({state:{date:'2026-10-28'}});assert.equal(future.register({...input,eventDate:'2026-10-28'}).code,'REGISTRATION_DAY_MISMATCH');assert.equal(future.rows.length,0);assert.equal(future.calls.length,0);
});
test('Automatic Hub registration rechecks selected day immediately before actual append',()=>{
 const h=registration();let checks=0;const original=h.context.beautyHubRegistrationDateCheck_;
 h.context.beautyHubRegistrationDateCheck_=(...a)=>{if(++checks===2)h.state.date='2026-10-28';return original(...a);};
 assert.equal(h.register().code,'STALE_EVENT');assert.equal(h.rows.length,0);assert.equal(h.calls.length,0);assert.equal(h.held,false);
});
test('Automatic Hub registration request rejects spoofed source internal metadata and targets',()=>{
 for(const extras of [{source:'HUB'},{_expectedEventDate:'2026-10-27'},{tdid:'t_other'},{existingPlayer:'true'}]){const h=registration();assert.throws(()=>h.register({...input,...extras}));assert.equal(h.rows.length,0);assert.equal(h.calls.length,0);}
 const h=registration();assert.equal(h.context.submitRegistration({source:'HUB',selectedName:'Anna'}).code,'BLOCKED');assert.equal(h.rows.length,0);
});
test('Automatic Hub registration timeout after POST keeps Sheet entry and durable retry barrier',()=>{
 const h=registration({postTimeout:true}),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.code,'TRANSFER_UNCERTAIN');assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);assert.equal(h.register({...input,identityChoice:'existing',identityBase:'Anna'}).code,'ALREADY_REGISTERED');assert.equal(h.posts().length,1);assert.equal(h.rows.length,1);
});
test('Automatic Hub registration confirms existing identity choice through the established name-conflict flow',()=>{
 const h=registration(),r=h.register({...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'Anna',identityChoice:'existing',identityBase:'Anna'});assert.equal(r.success,true);assert.equal(r.player,'Anna');assert.equal(r.existingPlayer,true);assert.equal(h.posts().length,1);assert.equal(h.rows[0][2],'');
});
test('Automatic registration date check uses Sweden calendar day and never fabricates submission dates',()=>{
 const h=registration(),c=h.context;assert.equal(c.beautyHubRegistrationDateCheck_('2026-10-27',new Date('2026-10-26T23:30Z')).success,true);
 assert.equal(c.beautyHubRegistrationDateCheck_('2026-10-27',new Date('2026-10-27T23:30Z')).code,'REGISTRATION_DAY_MISMATCH');
});

test('Automatic Hub registration disabled auto gate preserves registration without any provider request',()=>{
 const h=registration({autoDisabled:true}),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.code,'AUTO_DISABLED');assert.equal(h.rows.length,1);assert.equal(h.calls.length,0);assert.equal(h.posts().length,0);
});

test('Automatic Hub registration expired session after Sheet commit reports saved registration without another write',()=>{
 const h=registration({expireAt:4}),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.status,'ATTENTION');assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);assert.doesNotMatch(JSON.stringify(r),/SECRET|session/);
});
