const {test}=require('node:test'),assert=require('node:assert/strict');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const submit=(h,route)=>route==='HUB'?h.register():h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);
test('Automatic registration does not yield its lock to a competing twelve-second operation between preview and save',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=registration({noAuth:route!=='HUB'}),original=h.context.LockService.getScriptLock;let reserved=0,stolen=false;
  h.context.LockService.getScriptLock=()=>{const lock=original();return {tryLock:ms=>{if(reserved){if(ms<reserved){reserved-=ms;return false;}reserved=0;}return lock.tryLock(ms);},releaseLock:()=>{lock.releaseLock();if(h.context.beautyHubAutoStage_==='EVENT_PREVIEW'&&h.cache.size){reserved=12000;stolen=true;}}};};
  const r=submit(h,route);assert.equal(r.nakka.entryConfirmed,true);assert.equal(stolen,false);assert.equal(h.posts().length,1);assert.equal(h.rows.length,1);assert.equal(h.held,false);
 }
});
test('Automatic creation preview and event save share one lock with no nested acquisition',()=>{
 for(const standalone of [false,true]){
  const h=registration({newLeague:true,standalone,state:{league:[]}}),original=h.context.beautyHubNakkaTransfer_,phases=[];
  h.context.beautyHubNakkaTransfer_=(a,d)=>{phases.push(a);assert.equal(h.held,true,'automatic transaction owns lock');return original(a,d);};
  const r=h.register();assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.acquires,2);assert.equal(h.posts().length,standalone?1:2);assert.equal(h.rows.length,1);assert.equal(h.held,false);assert.equal(h.context.beautyHubAutoLock_,null);assert(phases.includes('preview'));assert(phases.includes('save'));
 }
});

test('Automatic sequence releases ownership on read errors uncertain writes and thrown errors',()=>{
 for(const o of [{failGet:true},{newLeague:true,creationTimeout:true,state:{league:[]}},{postTimeout:true}]){
  const h=registration(o),r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.rows.length,1);assert.equal(h.posts().length,o.failGet?0:1);assert.equal(h.held,false);assert.equal(h.context.beautyHubAutoLock_,null);
 }
 const h=registration();h.context.beautyHubAutoSendRun_=()=>{throw Error('SECRET');};const r=h.register();assert.equal(r.nakka.code,'AUTO_EXCEPTION');assert.equal(h.context.beautyHubAutoLock_,null);assert.equal(h.held,false);assert.equal(h.rows.length,1);assert.equal(h.posts().length,0);
});
test('Automatic sequence busy at entry preserves registration and performs no provider call',()=>{
 const h=registration(),original=h.context.LockService.getScriptLock;h.context.LockService.getScriptLock=()=>{const lock=original();return {tryLock:ms=>h.context.beautyHubAutoStage_==='AUTO_LOCK'?false:lock.tryLock(ms),releaseLock:()=>lock.releaseLock()};};
 const r=h.register();assert.equal(r.success,true);assert.equal(r.nakka.code,'TRANSFER_BUSY');assert.equal(h.rows.length,1);assert.equal(h.calls.length,0);assert.equal(h.held,false);assert.equal(h.context.beautyHubAutoLock_,null);
});
test('Event change while awaiting automatic ownership blocks provider writes after acquiring the lock',()=>{
 for(const field of ['id','date']){
  const h=registration(),original=h.context.LockService.getScriptLock;
  h.context.LockService.getScriptLock=()=>{const lock=original();return {tryLock:ms=>{const ok=lock.tryLock(ms);if(h.context.beautyHubAutoStage_==='AUTO_LOCK'){if(field==='id')h.target.id='t_OTHER';else h.state.date='2026-10-28';}return ok;},releaseLock:()=>lock.releaseLock()};};
  const r=h.register();assert.equal(r.nakka.code,'STALE_EVENT');assert.equal(h.rows.length,1);assert.equal(h.calls.length,0);assert.equal(h.held,false);assert.equal(h.context.beautyHubAutoLock_,null);
 }
});
test('Automatic lock ownership cannot be borrowed for another player and manual transfers still acquire their own lock',()=>{
 const h=registration();assert.equal(h.context.beautyHubAutoLockHeld_('Anna'),false);h.context.beautyHubAutoLock_={player:'Anna'};assert.equal(h.context.beautyHubAutoLockHeld_('Other'),false);h.context.beautyHubAutoLock_=null;
 h.state.hub=[{name:'Anna',status:'IN'}];const before=h.acquires,p=h.preview();assert.equal(p.status,'PREVIEW');assert.equal(h.acquires,before+1);assert.equal(h.held,false);assert.equal(h.save(p).success,true);assert.equal(h.acquires,before+2);
});
