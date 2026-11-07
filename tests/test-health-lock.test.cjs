const {test}=require('node:test'),assert=require('node:assert/strict');
const {registration}=require('./fixtures/hub-registration-runtime.cjs');
test('TEST health releases the shared script lock before network work and deduplicates concurrent probes',()=>{
 const h=registration();let held=false,reads=0;h.context.LockService.getScriptLock=()=>({tryLock:()=>{if(held)return false;held=true;return true;},releaseLock:()=>{assert.equal(held,true);held=false;}});
 h.context.checkNakkaLeagueHealth_=()=>{reads++;assert.equal(held,false);const lock=h.context.LockService.getScriptLock();assert.equal(lock.tryLock(0),true);lock.releaseLock();assert.equal(h.context.getNakkaHealth_().status,'DEGRADED');return {status:'OK',message:'Checked'};};
 assert.equal(h.context.getNakkaHealth_().status,'OK');assert.equal(h.context.getNakkaHealth_().status,'OK');assert.equal(reads,1);assert.equal(held,false);
});
test('TEST health never starts an unthrottled probe when its in-flight cache claim fails',()=>{
 const h=registration();let reads=0;h.context.CacheService={getScriptCache:()=>({get:()=>null,put:()=>{throw Error('private');}})};h.context.checkNakkaLeagueHealth_=()=>{reads++;};
 assert.equal(h.context.getNakkaHealth_().status,'UNAVAILABLE');assert.equal(reads,0);assert.equal(h.held,false);
});
