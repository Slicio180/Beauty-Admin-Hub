
// Authorized fixture for existing feature tests; auth itself is tested separately.
const authFixture={beautyHubActiveTestTarget_:()=>({id:'t_QHaG_7792',title:'Beauty Registration TEST event DO NOT USE LIVE'}),beautyHubCastHtml_:file=>({file,setTitle(){return this;}}),beautyHubAuthRequire_:()=>({uid:'fixture'}),beautyHubRequestToken_:'fixture',BeautyHubAuth:{token:()=> 'fixture',generation:()=>0,isCurrent:()=>true,expired(){}}};
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const base='apps-script/registration-identity-test/remote-app/';
const realFormula=require('./fixtures/tonight-event-formula.json');
function fixture(options={}) {
 const events=[],backups=[],tables={
  Control:[['START DATE','LAST RESET'],[new Date('2026-10-25T12:00:00Z'),new Date('2026-10-24T12:00:00Z')]],
  'PLAYER STATUS DATA':[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','SOURCE'],['Adam','','OUT','NEJ','old','HUB'],['Corrected','Old name','STANDBY','JA','old','MOBIL'],['Jonathan','','IN','JA',options.message||'A long message '.repeat(100),'HUB']],
  "TONIGHT'S PLAYERS":[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM']],
  "PLAYER'S MASTER LIST":[['PLAYERS'],['Adam'],['Corrected'],['Jonathan']],
  'Form responses 2':[['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM'],[new Date('2026-10-25T12:00:00Z'),'Adam','','NEJ, JAG GODKÄNNER INTE','old','HUB'],[new Date('2026-10-26T08:12:41Z'),'Jonathan','','JA, JAG GODKÄNNER',options.message||'A long message '.repeat(100),'HUB']]
 };
 if(options.duplicate)tables['Form responses 2'].push([...tables['Form responses 2'][2]]);
 const format=d=>d instanceof Date?d.toISOString().slice(0,10):String(d??'');
 function members(){const date=format(tables.Control[1][0]);return tables['Form responses 2'].slice(1).filter(r=>format(r[0])===date).map(r=>r[1]);}
 const statuses={2:'OUT'};let mutations=0,copies=0;
 function data(name,r,c){
  if(name!=="TONIGHT'S PLAYERS"||r===1)return tables[name]?.[r-1]?.[c-1]??'';
  const who=members()[r-2];if(!who)return c===3?statuses[r]||'':'';
  const stored=tables['PLAYER STATUS DATA'].find(a=>a[0]===who)||[];
  return [who,'',statuses[r]||'',stored[3]||'',stored[4]||'',stored[5]||''][c-1];
 }
 function range(name,r,c,h=1,w=1){return {
  getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>data(name,r+i,c+j))),
  getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>format(data(name,r+i,c+j)))),
  getFormulas:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>name==="TONIGHT'S PLAYERS"&&r+i===2&&c+j===1?(options.legacyCutoff?realFormula.before:realFormula.after):options.formula&&name==='PLAYER STATUS DATA'&&r+i===2&&c+j===3?'=1':'')),
  getNumberFormats:()=>Array.from({length:h},()=>Array(w).fill('General')),
  clearContent(){events.push('clear:'+name);mutations++;if(options.failWrite)throw Error('write failed');for(let i=0;i<h;i++)for(let j=0;j<w;j++)put(name,r+i,c+j,'');},
  setValue(v){events.push('write:'+name);mutations++;put(name,r,c,v);},
  setValues(rows){events.push('rows:'+name);if(!name.startsWith('BKP-'))mutations++;rows.forEach((row,i)=>row.forEach((v,j)=>put(name,r+i,c+j,v)));}
 };}
 function put(name,r,c,v){if(typeof v==='string'&&v.startsWith("'"))v=v.slice(1);if(name==="TONIGHT'S PLAYERS"&&c===3){statuses[r]=v;return;}(tables[name]??=[])[r-1]??=[];tables[name][r-1][c-1]=v;}
 const names=Object.keys(tables);
 const sheets={};names.forEach((name,id)=>sheets[name]={getSheetId:()=>id,getName:()=>name,getMaxRows:()=>100,getLastRow:()=>name==="TONIGHT'S PLAYERS"?Math.max(2,members().length+1):tables[name].findLastIndex(r=>r?.some(v=>v!==''&&v!=null))+1,getLastColumn:()=>name==='Control'?2:name==="PLAYER'S MASTER LIST"?1:6,getRange:(r,c,h,w)=>typeof r==='string'?range(name,2,r==='A2'?1:2):range(name,r,c,h,w),copyTo(){events.push('backup:'+name);copies++;if(options.backupFail)throw Error('backup failed');if(options.drift&&copies===5)tables['Form responses 2'][2][4]='changed during backup';return {setName(n){backups.push(n);return {getSheetId:()=>100+copies,getName:()=>n};}};}});
 const ss={getId:()=>options.wrongSheet?'wrong':'TEST',getSpreadsheetTimeZone:()=>options.zone||'Europe/Berlin',getSpreadsheetLocale:()=> 'en_GB',getSheetByName:n=>sheets[n],insertSheet(n){tables[n]=[];return {getName:()=>n,getRange:(...args)=>range(n,...args)};}};
 const ctx={Date,Map,Set,JSON,SHEET_ID:'TEST',BEAUTY_IDENTITY_WRITES_ENABLED_:true,beautyHubTestGuard_:()=>{if(options.wrongScript)throw Error('identity');},SpreadsheetApp:{openById:()=>ss,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>!options.busy,releaseLock:()=>events.push('release')})},Utilities:{formatDate:(d,z,fmt)=>fmt==='yyyy-MM-dd'?format(d):'20261026-100000',getUuid:()=> '12345678-abcd',parseDate:d=>new Date(d+'T12:00:00Z'),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algo,s)=>crypto.createHash('sha256').update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url')},getBeautyHubData_:()=>({success:true,eventDate:format(tables.Control[1][0]),players:members().map((name,i)=>{const row=Array.from({length:6},(_,j)=>format(data("TONIGHT'S PLAYERS",i+2,j+1)));return {player:row[0],newPlayer:row[1],status:row[2],consent:row[3],message:row[4].trim(),whereFrom:row[5].trim()};})})};
 Object.assign(ctx,authFixture);vm.createContext(ctx);vm.runInContext(fs.readFileSync(base+'HubTestEventSave.gs','utf8'),ctx);
 if(options.disabled)vm.runInContext('BEAUTY_IDENTITY_WRITES_ENABLED_=false',ctx);
 const prepare=()=>ctx.beautyHubTestEventTransition_('prepare',{date:'2026-10-26',expectedDate:'2026-10-25'});
 const save=version=>ctx.beautyHubTestEventTransition_('save',{date:'2026-10-26',expectedDate:'2026-10-25',confirmed:'true',version});
 return {ctx,tables,events,backups,prepare,save,get mutations(){return mutations;}};
}
test('event save: prepare is read-only and counts target-day registration before reset',()=>{const f=fixture(),p=f.prepare();assert.equal(p.success,true);assert.equal(p.targetPlayers,1);assert.match(p.version,/^[\w-]{43}$/);assert.equal(f.mutations,0);assert.equal(f.backups.length,0);});
test('event save: complete transition backs up first, preserves target message and correction names',()=>{
 const f=fixture(),before=JSON.stringify([f.tables["PLAYER'S MASTER LIST"],f.tables['Form responses 2']]),p=f.prepare(),result=f.save(p.version);
 assert.equal(result.success,true,JSON.stringify(result));assert.equal(result.readbackVerified,true);assert.equal(result.data.players.length,1);assert.equal(result.data.players[0].player,'Jonathan');assert.equal(result.data.players[0].message,'A long message '.repeat(100).trim());
 assert.equal(f.tables['PLAYER STATUS DATA'][2][4],'A long message '.repeat(100));assert.equal(result.data.players[0].consent,'JA');assert.equal(result.data.players[0].whereFrom,'HUB');
 assert.equal(f.backups.length,5);assert.ok(f.events.indexOf('backup:Form responses 2')<f.events.indexOf('clear:PLAYER STATUS DATA'));assert.equal(f.tables['PLAYER STATUS DATA'][1][0],'Corrected');assert.equal(f.tables['PLAYER STATUS DATA'][1][1],'Old name');assert.equal(f.tables['PLAYER STATUS DATA'][1][5],'');assert.equal(JSON.stringify([f.tables["PLAYER'S MASTER LIST"],f.tables['Form responses 2']]),before);assert.equal(f.events.at(-1),'release');
});
test('event save: wrong identities, disabled gate and busy lock never mutate event sheets',()=>{for(const o of [{wrongSheet:true},{zone:'UTC'},{disabled:true},{busy:true}]){const f=fixture(o);assert.equal(f.prepare().success,false);assert.equal(f.mutations,0);}const f=fixture({wrongScript:true});assert.throws(()=>f.prepare());assert.equal(f.mutations,0);});
test('event save: impossible dates, missing confirmation and client sheet selection are rejected',()=>{const f=fixture();for(const input of [{date:'2026-02-30',expectedDate:'2026-10-25'},{date:'2026-10-26',expectedDate:'2026-10-25',sheet:'LIVE'}])assert.equal(f.ctx.beautyHubTestEventTransition_('prepare',input).code,'INVALID');assert.equal(f.save('a'.repeat(43)).code,'STALE_EVENT');assert.equal(f.mutations,0);});
test('event save: changed registration invalidates reviewed version before backup or reset',()=>{const f=fixture(),p=f.prepare();f.tables['Form responses 2'][2][4]='new';assert.equal(f.save(p.version).code,'STALE_EVENT');assert.equal(f.mutations,0);assert.equal(f.backups.length,0);});
test('event save: backup failures and drift during backup prevent reset',()=>{for(const o of [{backupFail:true},{drift:true}]){const f=fixture(o),p=f.prepare(),result=f.save(p.version);assert.equal(result.success,false);assert.equal(f.mutations,0);assert.equal(f.tables.Control[1][0].toISOString().slice(0,10),'2026-10-25');}});
test('event save: failed mutation returns uncertainty and backup without retry',()=>{const f=fixture({failWrite:true}),p=f.prepare(),r=f.save(p.version);assert.equal(r.code,'SAVE_UNCERTAIN');assert.ok(r.backup.snapshotSheet);assert.equal(f.mutations,1);});
test('event save: duplicate target names and status formulas block the transition',()=>{for(const o of [{duplicate:true},{formula:true}]){const f=fixture(o);assert.equal(f.prepare().success,false);assert.equal(f.mutations,0);}});
test('event save: formula-like messages remain literal and retain exact content',()=>{const f=fixture({message:'=HYPERLINK("bad")'}),p=f.prepare(),r=f.save(p.version);assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.data.players[0].message,'=HYPERLINK("bad")');});
test('event save: transport permits only bounded TEST prepare and save inputs',async()=>{
 let received,success;const runner={withSuccessHandler(f){success=f;return this;},withFailureHandler(){return this;},beautyHubTest(a,i){received={a,i};success({success:true});}};
 const c={URL,google:{script:{run:runner}}};Object.assign(c,authFixture);vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.s=BeautyHubServices;',c);
 await c.s.request('https://beauty.invalid/hub?page=eventprepare&date=2026-10-26&expectedDate=2026-10-25');assert.equal(received.a,'eventprepare');
 await assert.rejects(c.s.request('https://beauty.invalid/hub?page=eventsave&sheet=LIVE'));
});
test('event save: calendar-day selection follows the TEST sheet timezone at midnight',()=>{
 const f=fixture();f.ctx.Utilities.formatDate=(d,z,fmt)=>fmt==='yyyy-MM-dd'?new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit'}).format(d):'20261026-100000';
 f.tables['Form responses 2'][2][0]=new Date('2026-10-25T23:30:00Z');assert.equal(f.prepare().targetPlayers,1);
});
test('event save: mismatched Hub readback fails closed after the backed-up transition',()=>{
 const f=fixture(),p=f.prepare(),original=f.ctx.getBeautyHubData_;f.ctx.getBeautyHubData_=()=>{const data=original();data.players[0].message='corrupted readback';return data;};
 const r=f.save(p.version);assert.equal(r.code,'SAVE_UNCERTAIN');assert.ok(r.backup.snapshotSheet);assert.equal(f.events.filter(e=>e==='clear:PLAYER STATUS DATA').length,1);
});

test('event save: real legacy reset-time formula is blocked during review before any write',()=>{const f=fixture({legacyCutoff:true});const p=f.prepare();assert.equal(p.success,false);assert.equal(f.mutations,0);assert.equal(f.backups.length,0);});
