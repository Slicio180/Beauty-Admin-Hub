const {test}=require('node:test'),assert=require('node:assert/strict');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
const submit=(h,route)=>route==='HUB'?h.register():h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);
function observe(h,hook){const original=h.context.beautyHubNakkaTransfer_,calls=[];h.context.beautyHubNakkaTransfer_=(action,data)=>{calls.push({action,...data});return hook(action,data,()=>original(action,data),calls);};return calls;}
test('Registration retries a genuine pre-send roster conflict once across Hub mobile and kiosk',()=>{
 for(const route of ['HUB','MOBIL','KIOSK'])for(const standalone of [false,true]){
  const h=registration({standalone,noAuth:route!=='HUB'});let changed=false;
  const calls=observe(h,(a,d,run)=>{const result=run();if(a==='preview'&&!changed){changed=true;h.state.hub.push({name:'Other',status:'IN'});}return result;});
  const r=submit(h,route);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.posts().length,1);assert.equal(h.rows[0][5],route);assert.equal(h.held,false);assert.equal(h.context.beautyHubPlayerContext_,null);
  assert.deepEqual(calls.map(c=>c.action),['preview','save','preview','save']);assert.notEqual(calls[1].ticket,calls[3].ticket);assert.equal(h.cache.size,0);
 }
});
test('Registration makes only one fresh attempt for busy preview or busy save',()=>{
 for(const phase of ['preview','save'])for(const persistent of [false,true]){
  const h=registration();let conflicts=0;
  const calls=observe(h,(a,d,run)=>a===phase&&(persistent||conflicts===0)?(conflicts++,{success:false,code:'TRANSFER_BUSY'}):run());
  const r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,!persistent);assert.equal(h.rows.length,1);assert.equal(h.posts().length,persistent?0:1);assert.equal(calls.filter(c=>c.action==='preview').length,2);assert.equal(conflicts,persistent?2:1);
 }
});
test('Registration leaves a repeatedly changing roster for review after two previews without sending',()=>{
 const h=registration();let n=0;const calls=observe(h,(a,d,run)=>{const result=run();if(a==='preview')h.state.hub.push({name:'Arrival '+(++n),status:'IN'});return result;});
 const r=h.register();assert.equal(r.nakka.code,'STALE_TRANSFER');assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);assert.equal(calls.length,4);assert.equal(h.cache.size,0);
});
test('Registration stops automatic retry if the event ID or date changes after a pre-send conflict',()=>{
 for(const field of ['id','date']){
  const h=registration();const calls=observe(h,(a,d,run)=>{if(a==='save'){if(field==='id')h.target.id='t_OTHER_0001';else h.state.date='2026-10-28';return {success:false,code:'STALE_TRANSFER'};}return run();});
  const r=h.register();assert.equal(r.nakka.code,'STALE_EVENT');assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);assert.equal(calls.length,2);
 }
});
test('Registration never retries provider uncertainty read failures identity errors or prior attempt barriers',()=>{
 for(const options of [{postTimeout:true},{failGet:true},{state:{league:[{name:'Anna',lpid:'a123'},{name:'ANNA',lpid:'z123'}]}}]){
  const h=registration(options),calls=observe(h,(a,d,run)=>run());const r=h.register();assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.rows.length,1);assert.equal(calls.filter(c=>c.action==='save').length,options.postTimeout?1:0);assert.equal(h.posts().length,options.postTimeout?1:0);
 }
 for(const code of ['TRANSFER_UNCERTAIN','TRANSFER_FAILED','TRANSFER_REVIEW_REQUIRED','AUTH_REQUIRED','NAKKA_UNAVAILABLE']){
  const h=registration(),calls=observe(h,()=>({success:false,code})),r=h.register();assert.equal(r.nakka.code,code);assert.equal(calls.length,1);assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);
 }
});
test('Registration rechecks eligibility and identity on its fresh preview',()=>{
 for(const change of [h=>h.state.hub[0].status='OUT',h=>h.state.league.push({name:'ANNA',lpid:'z123'})]){
  const h=registration();let changed=false;observe(h,(a,d,run)=>{const result=run();if(a==='preview'&&!changed){changed=true;change(h);}return result;});
  const r=h.register();assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);
 }
});
test('Standalone transfers verify tournament entries without claiming a league link or calling league endpoints',()=>{
 const h=harness({standalone:true});const p=h.preview();assert.equal(p.status,'PREVIEW');assert.match(p.message,/tournament player/);assert.doesNotMatch(p.message,/league/);
 const r=h.save(p);assert.equal(r.success,true);assert.equal(r.readbackVerified,true);assert.equal(r.identityVerified,false);assert.match(r.message,/New entry verified/);assert.doesNotMatch(r.message,/league/);
 const again=h.preview();assert.equal(again.status,'ALREADY_PRESENT');assert.equal(again.identityVerified,false);assert.doesNotMatch(again.message,/league/);assert.equal(h.posts().length,1);assert.equal(h.calls.some(c=>c.url.includes('/league/')),false);
 const record=JSON.parse(h.props.get(r.journal));assert.equal(record.entryVerified,true);assert.equal(record.identityVerified,false);
});
test('Standalone registration does not create a league identity when a player name requires review',()=>{
 const h=registration({standalone:true});h.master.push('A'.repeat(61));const r=h.register({...input,selectedName:'A'.repeat(61)});assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);assert.equal(h.calls.some(c=>c.url.includes('/league/')),false);
});
