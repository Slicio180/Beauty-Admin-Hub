const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {setup,clone,root}=require('./recheck-fixture.cjs');
const checks=[];
const test=(name,fn)=>{try{fn();checks.push(name);}catch(e){console.error(name);throw e;}};
const read=(folder,name)=>fs.readFileSync(path.join(root,folder,name),'utf8');
const baseId='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';
function composed(folder='candidate'){
 const previous=process.env.BEAUTY_CLAIM_SOURCE;process.env.BEAUTY_CLAIM_SOURCE=folder;
 let f;try{f=setup();}finally{if(previous===undefined)delete process.env.BEAUTY_CLAIM_SOURCE;else process.env.BEAUTY_CLAIM_SOURCE=previous;}
 f.props.BEAUTY_EVENT_CONTEXT_V1=JSON.stringify(f.context);
 const context=read(folder,'HubEventContext.gs'),code=read('baseline','Code.gs'),bridge=read('baseline','HubTestBridge.gs');
 vm.runInContext(context+code.slice(0,code.indexOf('function doGet('))+read('baseline','HubTestNakkaEvent.gs')+
  bridge.slice(0,bridge.indexOf('function beautyHubTest(action')),f.c);
 vm.runInContext(read('baseline','HubTestNakkaTransfer.gs').split('\n').filter(l=>l.startsWith('function beautyHubTransferTarget_()')).join('\n'),f.c);
 Object.assign(f.c,{BEAUTY_IDENTITY_APPROVED_SCRIPT_:f.c.ScriptApp.getScriptId(),RESPONSE_SHEET:'Form responses 2',MASTER_SHEET:"PLAYER'S MASTER LIST"});
 f.sheets['Form responses 2']=f.sheets.Responses;delete f.sheets.Responses;
 f.sheets["PLAYER'S MASTER LIST"]=f.sheets.Master;delete f.sheets.Master;
 const calls=[],opens=[],cellWrites=[];let hook=()=>{},zone='Europe/Berlin',formula='',control=new f.c.Date('2026-11-21T12:00:00Z');
 let stage='prepare';
 function service(label,fn){calls.push({stage,label});hook(label,stage);return fn();}
 function book(id){
  const kind=id===baseId?'masterBook':'eventBook';
  return {getId(){assert.equal(this,books[id]);return service(kind+'.id',()=>id);},
   getSpreadsheetTimeZone(){assert.equal(this,books[id]);return service(kind+'.zone',()=>zone);},
   getSheetByName(title){assert.equal(this,books[id]);return service(kind+'.sheet:'+title,()=>{
    if(title==='Control')return {getRange:()=>({getValue:()=>service('control.value',()=>control),getFormula:()=>service('control.formula',()=>formula)})};
    if(!Object.hasOwn(f.sheets,title))return null;
    if(title==="PLAYER'S MASTER LIST"&&id!==baseId)throw Error('Master list came from wrong workbook');
    if(title!=="PLAYER'S MASTER LIST"&&id!==f.context.sheetId)throw Error('Event data came from wrong workbook');
    return {getLastRow:()=>service(title+'.bounds',()=>f.sheets[title].length+1),
     getRange:(row,col,count,width)=>{assert.equal(width,6);return service(title+'.range',()=>({
      getValues:()=>service(title+'.values',()=>f.sheets[title].map(r=>[...r])),
      getDisplayValues:()=>service(title+'.display',()=>f.sheets[title].map(r=>[...r])),
      setValues:values=>cellWrites.push({id,title,values})
     }));}};
   });}};
 }
 const books={};books[f.context.sheetId]=book(f.context.sheetId);books[baseId]=book(baseId);
 f.c.SpreadsheetApp.openById=id=>service('open:'+id,()=>{opens.push(id);assert(Object.hasOwn(books,id),'unapproved workbook open');return books[id];});
 f.onRead(()=>{stage='commit';});
 const providerHook=fn=>f.onRead(()=>{stage='commit';fn();});
 return {...f,books,opens,calls,cellWrites,providerHook,hook:fn=>hook=fn,
  setZone:v=>zone=v,setFormula:v=>formula=v,setControl:v=>control=v,
  result:()=>f.logs.map(JSON.parse).findLast(x=>x.type==='BEAUTY_BACKGROUND_RESULT')};
}
const before=composed('baseline'),after=composed();before.tick();after.tick();
test('Composed current helpers retain identical fresh cell reads and records with one master open per invocation',()=>{
 assert.equal(after.getRun().result.verified,true);assert.equal(before.getRun().result.verified,true);
 for(const k of ['receipt','recovery','journal','attention'])assert.equal(after.props[after.keys[k]],before.props[before.keys[k]],k);
 const reads=f=>f.calls.filter(x=>/\.(value|values|formula|display|bounds)$/.test(x.label));
 assert.deepEqual(reads(after),reads(before));assert.equal(after.opens.filter(x=>x===baseId).length,1);
 assert(before.opens.filter(x=>x===baseId).length>4);assert.equal(after.opens.filter(x=>x===after.context.sheetId).length,1);
 assert.equal(after.cellWrites.length,0);assert.equal(after.provider.length,0);
 fs.writeFileSync(path.join(root,'evidence/composed-service-counts.json'),JSON.stringify({baselineOpens:before.opens,candidateOpens:after.opens,freshReads:reads(after),simulated:true},null,2)+'\n');
});
test('Fixed step timings cover both complete validations without adding reads or writes',()=>{
 const labels=['identityMs','targetMs','dateMs','contextMs','workbookMs','responseSheetMs','responseRangeMs','responseReadMs',
  ...['master','status','display'].flatMap(k=>['SheetMs','BoundsMs','RangeMs','ReadMs'].map(s=>k+s))];
 for(const phase of ['prepare','commit'])assert.deepEqual(Object.keys(after.result().timing[phase+'SheetSteps']).sort(),labels.sort());
 assert(!JSON.stringify(after.result().timing).includes(after.name));
 assert(Buffer.byteLength(JSON.stringify(after.getRun()))<8500);
});
function rejected(f,change){const old=f.props[f.keys.recovery];f.providerHook(change);f.tick();assert.equal(f.providerRequests.length,1);assert.notEqual(f.result()?.result?.committed,true);assert.notEqual(f.getRun().result?.verified,true);assert.equal(f.props[f.keys.recovery],old);assert.equal(f.cellWrites.length,0);assert.equal(f.lock.hasLock(),false);}
for(const [label,change]of[
 ['response message',f=>f.sheets['Form responses 2'][0][4]='later'],
 ['response timestamp',f=>f.sheets['Form responses 2'][0][0]=new f.c.Date()],
 ['response consent',f=>f.sheets['Form responses 2'][0][3]='JA, JAG GODKÄNNER'],
 ['master duplicate',f=>f.sheets["PLAYER'S MASTER LIST"].push([...f.sheets["PLAYER'S MASTER LIST"][0]])],
 ['master removal',f=>f.sheets["PLAYER'S MASTER LIST"]=[]],
 ['status OUT',f=>f.sheets['PLAYER STATUS DATA'][0][2]='OUT'],
 ['status consent',f=>f.sheets['PLAYER STATUS DATA'][0][3]='JA'],
 ['status message',f=>f.sheets['PLAYER STATUS DATA'][0][4]='later'],
 ['status source',f=>f.sheets['PLAYER STATUS DATA'][0][5]='MOBIL'],
 ['display standby',f=>f.sheets["TONIGHT'S PLAYERS"][0][2]='STANDBY'],
 ['display duplicate',f=>f.sheets["TONIGHT'S PLAYERS"].push([...f.sheets["TONIGHT'S PLAYERS"][0]])],
 ['Control date',f=>f.setControl(new f.c.Date('2026-11-22T12:00:00Z'))],
 ['Control formula',f=>f.setFormula('=TODAY()')],
 ['Control invalid',f=>f.setControl('2026-11-21')],
 ['workbook zone',f=>f.setZone('UTC')],
 ['context revision',f=>{const c=clone(f.context);c.revision='a'.repeat(32);f.props.BEAUTY_EVENT_CONTEXT_V1=JSON.stringify(c);}],
 ['production destination',f=>{const c=clone(f.context);c.sheetId='1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM';f.props.BEAUTY_EVENT_CONTEXT_V1=JSON.stringify(c);}]
])test('Fresh commit rejects '+label+' despite reusing workbook connections',()=>{const f=composed();rejected(f,()=>change(f));});
for(const title of ['Form responses 2',"PLAYER'S MASTER LIST",'PLAYER STATUS DATA',"TONIGHT'S PLAYERS"])
 test('Deleted '+title+' is observed after provider access',()=>{const f=composed();rejected(f,()=>delete f.sheets[title]);});
for(const label of ['control.value','control.formula','Form responses 2.values',"PLAYER'S MASTER LIST.bounds","PLAYER'S MASTER LIST.display",'PLAYER STATUS DATA.bounds','PLAYER STATUS DATA.display',"TONIGHT'S PLAYERS.bounds","TONIGHT'S PLAYERS.display"])
 test('Commit service failure '+label+' preserves previous verification and releases lock',()=>{const f=composed();rejected(f,()=>f.hook((l,phase)=>{if(phase==='commit'&&l===label)throw Error('service unavailable');}));});
test('A slow individual read is attributed to its phase and step without bypassing lease expiry',()=>{
 const f=composed(),old=f.props[f.keys.recovery];f.hook((l,phase)=>{if(phase==='commit'&&l==="TONIGHT'S PLAYERS.display")f.advance(600001);});f.tick();
 assert.equal(f.result().timing.commitSheetSteps.displayReadMs,600001);assert.equal(f.result().result.committed,false);assert.equal(f.props[f.keys.recovery],old);
});
test('Failed first master open is not cached as a valid connection',()=>{
 const f=composed();let failed=false;f.hook(l=>{if(l==='open:'+baseId&&!failed){failed=true;throw Error('open unavailable');}});
 assert.throws(()=>f.c.beautyHubSpreadsheet_(),/open unavailable/);assert(!f.c.beautyContextMasterHandle_);
 f.hook(()=>{});assert.equal(f.c.beautyHubSpreadsheet_().getId(),f.context.sheetId);assert.equal(f.opens.filter(x=>x===baseId).length,1);
});
test('Cached master handle cannot redirect to another workbook',()=>{const f=composed();f.c.beautyContextMasterHandle_=f.books[f.context.sheetId];assert.throws(()=>f.c.beautyHubSpreadsheet_(),/master workbook destination/);});
test('Wrong source workbook is rejected before opening master',()=>{const f=composed();assert.throws(()=>f.c.beautyContextMasterWorkbook_({getId:()=> 'wrong-book'}),/master workbook destination/);assert.equal(f.opens.length,0);});
test('Base workbook passes through unchanged without a redundant open',()=>{const f=composed();assert.equal(f.c.beautyContextMasterWorkbook_(f.books[baseId]),f.books[baseId]);assert.equal(f.opens.length,0);});
test('Each new invocation opens its own connection',()=>{const a=composed(),b=composed();a.tick();b.tick();assert.notEqual(a.c.beautyContextMasterHandle_,b.c.beautyContextMasterHandle_);assert.equal(a.opens.filter(x=>x===baseId).length,1);assert.equal(b.opens.filter(x=>x===baseId).length,1);});
test('Proxy still routes master writes to the master workbook and event methods to the event workbook',()=>{
 const f=composed(),ss=f.c.beautyHubSpreadsheet_();ss.getSheetByName("PLAYER'S MASTER LIST").getRange(2,1,1,6).setValues([['synthetic']]);
 assert.equal(f.cellWrites[0].id,baseId);assert.equal(ss.getId(),f.context.sheetId);assert.equal(ss.getSpreadsheetTimeZone(),'Europe/Berlin');
});
for(const folder of ['baseline','candidate'])test(folder+' unprofiled registration source and projection validation remain callable',()=>{
 const f=composed(folder),ss=f.c.beautyRegistrationRecoverySource_(f.receipt);assert.equal(f.c.beautyRegistrationProjectionVerified_(f.receipt,ss),true);
 f.sheets['PLAYER STATUS DATA'][0][2]='OUT';assert.throws(()=>f.c.beautyRegistrationProjectionVerified_(f.receipt,ss),/REGISTRATION_DISPLAY_REVIEW/);
});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,nativeAcceptance:false};
fs.writeFileSync(path.join(root,'evidence/sheets-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
