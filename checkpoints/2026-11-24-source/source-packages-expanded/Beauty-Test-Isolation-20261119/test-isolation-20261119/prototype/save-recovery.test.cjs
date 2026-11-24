const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{save}=require('./save-recovery.cjs');
const approved={leagueId:'lg_fixture',eventId:'t_fixture',eventDate:'2026-11-16'};
const request={...approved,registrationId:'reg_fixture01',player:'Synthetic Player',submittedAt:'2026-11-15T12:00:00Z',state:'ACTIVE',consent:'JA',source:'MOBIL',message:''};
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(fault){
 const state={rows:[],receipts:{},appends:0,locked:false,calls:0};let used=false;
 const hit=label=>{state.calls++;if(!used&&fault===label){used=true;throw Error('SIMULATED_INTERRUPTION');}};
 const store={tryLock(){if(state.locked)return false;state.locked=true;return true;},releaseLock(){state.locked=false;},assertDestination(){hit('destination');},readRows(){hit('rows');return copy(state.rows);},readReceipt(id){hit('receipt-read');return state.receipts[id]?copy(state.receipts[id]):null;},writeReceipt(id,r){hit('before-'+r.phase);state.receipts[id]=copy(r);hit('after-'+r.phase);},appendRecord(r){hit('before-append');state.rows.push(copy(r));state.appends++;hit('after-append');}};
 return {store,state};
}
const results=[];function test(name,f){f();results.push({name,status:'PASS'});}
test('Ordinary save verifies one row and completed receipt',()=>{const e=fixture();assert.equal(save(e.store,request,approved).status,'VERIFIED');assert.equal(e.state.appends,1);assert.equal(e.state.locked,false);});
for(const point of ['before-INTENT','after-INTENT','before-ATTEMPTED'])test('Resume safely before append attempt: '+point,()=>{const e=fixture(point);assert.throws(()=>save(e.store,request,approved),/SIMULATED/);assert.equal(e.state.locked,false);assert.equal(save(e.store,request,approved).status,'VERIFIED');assert.equal(e.state.appends,1);});
for(const point of ['after-append','before-COMPLETE','after-COMPLETE'])test('Recover committed row without second append: '+point,()=>{const e=fixture(point);assert.throws(()=>save(e.store,request,approved),/SIMULATED/);assert.equal(save(e.store,request,approved).status,'VERIFIED');assert.equal(e.state.appends,1);});
for(const point of ['after-ATTEMPTED','before-append'])test('Uncertain absent write cannot be blindly repeated: '+point,()=>{const e=fixture(point);assert.throws(()=>save(e.store,request,approved),/SIMULATED/);assert.equal(save(e.store,request,approved).status,'REVIEW_REQUIRED');assert.equal(e.state.appends,0);});
test('Late arrival resolves uncertain operation by readback',()=>{const e=fixture('before-append');assert.throws(()=>save(e.store,request,approved));e.state.rows.push(copy(request));assert.equal(save(e.store,request,approved).status,'VERIFIED');assert.equal(e.state.appends,0);});
test('Changed consent cannot reuse receipt',()=>{const e=fixture();save(e.store,request,approved);assert.throws(()=>save(e.store,{...request,consent:'NEJ'},approved),/RECEIPT_CONFLICT/);assert.equal(e.state.appends,1);});
test('Removed row is not resurrected by completed receipt',()=>{const e=fixture();save(e.store,request,approved);e.state.rows[0].state='REMOVED';assert.throws(()=>save(e.store,request,approved),/RETRY_CONFLICT/);assert.equal(e.state.appends,1);});
test('Missing row after COMPLETE is not silently recreated',()=>{const e=fixture();save(e.store,request,approved);e.state.rows=[];assert.equal(save(e.store,request,approved).status,'REVIEW_REQUIRED');assert.equal(e.state.appends,1);});
test('Busy writer performs no reads or writes',()=>{const e=fixture();e.state.locked=true;assert.equal(save(e.store,request,approved).status,'BUSY');assert.equal(e.state.calls,0);});
test('Wrong event blocked before storage access',()=>{const e=fixture();assert.throws(()=>save(e.store,{...request,eventId:'t_other'},approved),/WRONG_EVENT/);assert.equal(e.state.calls,0);});
test('Duplicate IDs in storage block recovery',()=>{const e=fixture();e.state.rows=[copy(request),copy(request)];assert.throws(()=>save(e.store,request,approved),/DUPLICATE_ID/);assert.equal(e.state.appends,0);});
test('Destination rejection releases lock without append',()=>{const e=fixture('destination');assert.throws(()=>save(e.store,request,approved));assert.equal(e.state.appends,0);assert.equal(e.state.locked,false);});
test('Bad row readback cannot report success',()=>{const e=fixture();e.store.appendRecord=()=>{e.state.appends++;};assert.throws(()=>save(e.store,request,approved),/ROW_READBACK/);assert.equal(e.state.receipts[request.registrationId].phase,'ATTEMPTED');});
fs.writeFileSync(path.join(__dirname,'save-recovery-results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Offline synchronous adapter contract with injected interruptions. No Google atomicity, asynchronous write guarantees, Nakka recovery or closed-Hub worker demonstrated.',results},null,2));console.log(results.length+' PASS');
