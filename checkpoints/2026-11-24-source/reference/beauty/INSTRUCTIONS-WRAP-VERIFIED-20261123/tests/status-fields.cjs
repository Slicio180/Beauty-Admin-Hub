const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const path=require('node:path'), root=path.resolve(__dirname,'..');
const old=fs.readFileSync(root+'/baseline/Code.gs','utf8');
const changed=fs.readFileSync(root+'/candidate/Code.gs','utf8');
const attention=fs.readFileSync(path.resolve(root,'../REGISTRATION-READS-SPEED-20261123/candidate/HubTestAttention.gs'),'utf8');
const rowsCopy=x=>JSON.parse(JSON.stringify(x));
function fixture(source, initial, opts={}) {
 const rows=rowsCopy(initial), calls=[], events=[];let flushes=0, released=0, receiptWrites=0, appendCalls=0;
 const range=(r,c,h=1,w=1)=>({
  getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(rows[r+i-1]?.[c+j-1]??''))),
  getDisplayValue:()=>String(rows[r-1]?.[c-1]??''),
  setValue(value){calls.push({r,c,h:1,w:1,value});put([[value]]);return this;},
  setValues(values){calls.push({r,c,h,w,values:rowsCopy(values)});assert.equal(values.length,h);assert.equal(values[0].length,w);if(opts.batchFailure==='before')throw Error('temporary sheet failure');put(values);if(opts.batchFailure==='after')throw Error('reply lost');return this;}
 });
 function put(values){const call=calls.at(-1);for(let i=0;i<values.length;i++){while(rows.length<call.r+i)rows.push([]);for(let j=0;j<values[i].length;j++)rows[call.r+i-1][call.c+j-1]=values[i][j];}}
 const sheet={getLastRow:()=>rows.length,getRange:range};
 const book={getSheetByName:title=>opts.missing?null:sheet};
 const box={console:{log:()=>{},error:()=>{}},SpreadsheetApp:{openById:()=>book,flush:()=>{flushes++;if(opts.flushFailure)throw Error('flush failed');}},ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})}};
 vm.createContext(box);vm.runInContext(source,box);vm.runInContext(attention,box);
 Object.assign(box,{beautyHubAuthRequire_:()=>{},beautyHubRequestToken_:'synthetic',beautyHubRegistrationDateCheck_:()=>({success:true}),beautyRegistrationRecoverySource_:()=>book,beautyRegistrationRecoveryWrite_:r=>{receiptWrites++;events.push(rowsCopy(r));},beautyHubAttentionRemember_:()=>{},beautyRegistrationRecoveryFinish_:()=>{}});
 return {box,rows,calls,events,run:(name,consent,message,origin)=>box.updatePlayerStatusData_(name,consent,message,origin),counts:()=>({flushes,released,receiptWrites,appendCalls}),
 registration(){box.submitRegistrationIdentityCandidate_=()=>{appendCalls++;box.beautyRegistrationRecoveryActive_={version:1,name:'Åke Test',date:'2026-11-21',existingPlayer:true,state:'INTENT'};box.updatePlayerStatusData_('Åke Test','JA, JAG GODKÄNNER','hello','HUB');return {success:true,player:'Åke Test'};};return box.submitRegistrationLocked_({source:'HUB',_expectedEventDate:'2026-11-21'});}};
}
const head=['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM','UNRELATED'];
let count=0;const cases=[];function test(name,fn){fn();cases.push(name);count++;console.log('PASS '+name);}
for(const status of ['IN','OUT','STANDBY','',' '])for(const [consent,want] of [['JA, JAG GODKÄNNER','JA'],['NEJ, JAG GODKÄNNER INTE','NEJ']]){
 test('preserves '+JSON.stringify(status)+' and old-name memory with '+want,()=>{const data=[head,['Åke Test','Old name',status,'','old message','MOBIL','KEEP'],['Other','','OUT','NEJ','other text','KIOSK','OTHER']];const a=fixture(old,data),b=fixture(changed,data);for(const f of [a,b])f.run('  ÅKE TEST  ',consent,'message\nsecond line','HUB');assert.deepEqual(b.rows,a.rows);assert.equal(b.rows[1][1],'Old name');assert.equal(b.rows[1][6],'KEEP');assert.deepEqual(b.rows[2],data[2]);assert.equal(b.counts().flushes,a.counts().flushes);assert.equal(b.calls.filter(x=>x.c>=4).length,1);assert.equal(a.calls.filter(x=>x.c>=4).length,3);assert.deepEqual(b.rows[1].slice(3,6),[want,'message\nsecond line','HUB']);});
}
for(const origin of ['HUB','KIOSK','MOBIL'])test('new status row stores all fields from '+origin,()=>{const a=fixture(old,[head]),b=fixture(changed,[head]);for(const f of [a,b])f.run('Åke Test','NEJ, JAG GODKÄNNER INTE','',origin);assert.deepEqual(b.rows,a.rows);assert.equal(b.rows[1][2],'IN');assert.deepEqual(b.rows[1].slice(3,6),['NEJ','',origin]);assert.equal(b.calls.length,a.calls.length-2);});
test('blank player does not write or flush',()=>{const f=fixture(changed,[head]);f.run('   ','JA, JAG GODKÄNNER','ignored','HUB');assert.equal(f.calls.length,0);assert.equal(f.counts().flushes,0);});
test('missing status sheet remains an error without writes',()=>{const f=fixture(changed,[head],{missing:true});assert.throws(()=>f.run('Åke Test','JA, JAG GODKÄNNER','','HUB'),/sheet not found/);assert.equal(f.calls.length,0);});
test('empty values retain existing fallback behavior',()=>{const data=[head,['Åke Test','','IN','old','old','old']];const a=fixture(old,data),b=fixture(changed,data);for(const f of [a,b])f.run('Åke Test',null,undefined,null);assert.deepEqual(b.rows,a.rows);assert.deepEqual(b.rows[1].slice(3,6),['','','']);});
for(const failure of ['before','after'])test('saved registration retained after batch '+failure+' failure; no repeat',()=>{const f=fixture(changed,[head,['Åke Test','','IN','','','']],{batchFailure:failure});const result=f.registration();assert.equal(result.success,true);assert.equal(result.registrationPending,true);assert.equal(result.code,'REGISTRATION_DISPLAY_PENDING');assert.equal(f.counts().appendCalls,1);assert.equal(f.calls.filter(x=>x.c===4).length,1);assert.equal(f.counts().released,1);assert.equal(f.events.at(-1).state,'REVIEW');assert.equal(f.box.beautyRegistrationRecoveryActive_,null);});
test('flush error also retains saved registration and releases lock',()=>{const f=fixture(changed,[head,['Åke Test','','IN','','','']],{flushFailure:true});const r=f.registration();assert.equal(r.registrationPending,true);assert.equal(f.counts().appendCalls,1);assert.equal(f.counts().released,1);assert.deepEqual(f.rows[1].slice(3,6),['JA','hello','HUB']);});
test('all other code including status reads, authorization and projection checks unchanged',()=>{const start=old.indexOf('  sheet\n    .getRange(\n      playerRow,\n      4\n');const end=old.indexOf('  SpreadsheetApp.flush();',start);const newStart=changed.indexOf('  // Save the three adjacent registration fields together.');const newEnd=changed.indexOf('  SpreadsheetApp.flush();',newStart);assert.equal(old.slice(0,start),changed.slice(0,newStart));assert.equal(old.slice(end),changed.slice(newEnd));new vm.Script(changed);});
const result={result:'PASS',checks:count,cases,scope:'Synthetic differential field-state and registration-error boundary checks. No Google or Nakka calls. Does not measure native latency or simulate the complete registration workflow.'};
fs.writeFileSync(root+'/evidence/status-fields-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
