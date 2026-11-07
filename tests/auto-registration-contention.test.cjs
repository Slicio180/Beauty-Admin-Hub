const {test}=require('node:test'),assert=require('node:assert/strict');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const submit=(h,route)=>route==='HUB'?h.register():h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);
test('Retried event preview still creates a missing league profile for Hub mobile and kiosk',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=registration({newLeague:true,noAuth:route!=='HUB',state:{league:[]}}),original=h.context.beautyHubNakkaTransfer_;let previews=0;
  h.context.beautyHubNakkaTransfer_=(a,d)=>a==='preview'&&++previews===1?{success:false,code:'TRANSFER_BUSY'}:original(a,d);
  const r=submit(h,route);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.posts().length,2);assert.equal(h.rows.length,1);assert.equal(h.state.league.length,1);assert.equal(h.state.entries.length,1);assert.equal(h.held,false);assert.equal(h.context.beautyHubPlayerContext_,null);
 }
});
test('League creation waits through a simulated twelve-second competing lock without replaying registration',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=registration({newLeague:true,noAuth:route!=='HUB',state:{league:[]}}),original=h.context.LockService.getScriptLock;let remaining=12000,attempts=0;
  h.context.LockService.getScriptLock=()=>{const lock=original();return {tryLock:ms=>{if(h.context.beautyHubAutoStage_==='AUTO_LOCK'){attempts++;if(ms<remaining){remaining-=ms;return false;}remaining=0;}return lock.tryLock(ms);},releaseLock:()=>lock.releaseLock()};};
  const r=submit(h,route);assert.equal(r.nakka.entryConfirmed,true);assert.equal(attempts,1);assert.equal(remaining,0);assert.equal(h.posts().length,2);assert.equal(h.rows.length,1);assert.equal(h.held,false);
 }
});
test('Identity discovered on retry still blocks ambiguous profiles and uncertain creation without duplicate sends',()=>{
 for(const o of [{state:{league:[{name:'Anna',lpid:'a123'},{name:'ANNA',lpid:'z123'}]}},{creationTimeout:true,state:{league:[]}}]){
  const h=registration({...o,newLeague:true}),original=h.context.beautyHubNakkaTransfer_;let previews=0;
  h.context.beautyHubNakkaTransfer_=(a,d)=>a==='preview'&&++previews===1?{success:false,code:'TRANSFER_BUSY'}:original(a,d);
  const r=h.register();assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,o.creationTimeout?1:0);assert.equal(h.rows.length,1);if(o.creationTimeout)assert.equal(r.nakka.code,'LEAGUE_CREATION_UNCERTAIN');
 }
});
