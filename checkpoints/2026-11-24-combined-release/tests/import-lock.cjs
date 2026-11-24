const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {fixture}=require('./import.cjs'),root=path.resolve(__dirname,'..'),checks=[];
function test(name,fn){fn();checks.push({name,result:'PASS'});}
function setup(){
 const f=fixture(),c=f.c,p={},events=[];let held=false,busy=false,onLock=()=>{};
 vm.runInContext(fs.readFileSync(path.join(root,'application/BeautyInboundAdapter.gs'),'utf8'),c);
 c.BEAUTY_LIVE_BASE_={sheetId:f.state.context.sheetId};c.BEAUTY_QUEUE_LEASE_='QUEUE_LEASE';
 c.PropertiesService={getScriptProperties:()=>({getProperty:k=>p[k]||null})};
 c.beautyCombinedBackgroundRequire_=()=>{};c.beautyBackgroundScope_=()=>f.state.context;
 c.beautyNakkaImportSnapshot_=()=>{events.push('read:'+held);return f.io.read();};
 c.beautyNakkaImportHistory_=()=>f.io.history();
 c.beautyNakkaImportProvider_=()=>{events.push('provider:'+held);return f.provider;};
 c.beautyEventExternalWritesClosed_=()=>{assert(held);};
 c.beautyBackgroundSave_=(k,v)=>{if(k.endsWith('_SCAN')){p[k]=JSON.stringify(v);return;}assert(held);f.io.save(v);};
 c.LockService={getScriptLock:()=>({tryLock(){events.push('lock');onLock();if(busy)return false;assert(!held);held=true;return true;},releaseLock(){assert(held);held=false;events.push('release');}})};
 c.beautyEventSheets_=(endpoint,body)=>{assert(held);assert.equal(endpoint,':batchUpdate');const cells=body.requests.filter(r=>r.updateCells).map(({updateCells:r})=>({title:Object.keys(f.state.snap).find(t=>f.state.snap[t].id===r.range.sheetId),sheetId:r.range.sheetId,row:r.range.startRowIndex,values:r.rows[0].values.map(v=>v.userEnteredValue.numberValue??v.userEnteredValue.stringValue)}));f.io.write({cells});};
 c.SpreadsheetApp={flush(){assert(held);}};c.beautyLiveRegistrationSheets_=()=>({});c.beautyLiveRegistrationSync_=(_,name)=>{assert(held);f.io.sync(name);};
 return {f,c,p,events,run:()=>c.beautyLiveInboundScan_(),held:()=>held,busy:()=>busy=true,onLock:fn=>onLock=fn};
}
test('Discovery is unlocked; fresh commit reads, receipt, fixed-row write and projection hold one lock',()=>{const x=setup();assert.equal(x.run().imported,1);assert.deepEqual(x.events.slice(0,3),['provider:false','read:false','lock']);assert(x.events.includes('provider:true'));assert.equal(x.f.counts().writes,1);assert(!x.held());const locks=x.events.filter(v=>v==='lock').length;assert.equal(x.run().imported,0);assert.equal(x.events.filter(v=>v==='lock').length,locks);assert.equal(x.f.counts().writes,1);});
test('Busy commit defers without saving intent or writing a registration',()=>{const x=setup();x.busy();assert.equal(x.run().code,'IMPORT_BUSY');assert.equal(x.f.counts().saves,0);assert.equal(x.f.counts().writes,0);assert(!x.held());});
test('New queue lease between discovery and lock prevents all registration writes',()=>{const x=setup();x.onLock(()=>x.p.QUEUE_LEASE='active');assert.throws(()=>x.run(),/IMPORT_OPERATION_PENDING/);assert.equal(x.f.counts().saves,0);assert.equal(x.f.counts().writes,0);assert(!x.held());});
test('New registration history between discovery and lock is respected',()=>{const x=setup();x.onLock(()=>x.f.history.registrations.push({name:x.f.entry.name}));assert.equal(x.run().protected,1);assert.equal(x.f.counts().writes,0);assert(!x.held());});
test('Later consent edit after discovery is preserved and requires review',()=>{const x=setup();x.onLock(()=>{x.f.state.snap['PLAYER STATUS DATA'].values[2]=[x.f.entry.name,'','', 'JA','Keep this','HUB'];});assert.equal(x.run().issueCount,1);assert.equal(x.f.counts().writes,0);assert.equal(x.f.state.snap['PLAYER STATUS DATA'].values[2][3],'JA');assert(!x.held());});
test('A different selected workbook is refused before provider or sheet reads',()=>{const x=setup();x.c.BEAUTY_LIVE_BASE_.sheetId='other';assert.equal(x.run().code,'IMPORT_WORKBOOK_REVIEW');assert.deepEqual(x.events,[]);assert.equal(x.f.counts().writes,0);});
fs.writeFileSync(path.join(root,'evidence/import-lock-tests.json'),JSON.stringify({result:'PASS',checks,scope:'Actual assembled adapter and import core at mocked Apps Script I/O boundaries.'},null,2));console.log(JSON.stringify({result:'PASS',checks:checks.length}));
