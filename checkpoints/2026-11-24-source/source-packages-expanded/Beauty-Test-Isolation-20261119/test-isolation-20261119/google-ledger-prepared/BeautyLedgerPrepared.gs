/* PREPARED ONLY: disabled; do not install as a working release. */
var BeautyLedgerRecords_=(function(){
// Offline prototype only. No Apps Script entry points, services, writes or deployment.
'use strict';
const sameEvent=(a,b)=>['leagueId','eventId','eventDate'].every(k=>a[k]===b[k]);
function event(e){
 if(!e||!/^lg_[A-Za-z0-9_]+$/.test(e.leagueId)||!/^t_[A-Za-z0-9_]+$/.test(e.eventId)||!/^20\d\d-\d\d-\d\d$/.test(e.eventDate)||!Number.isFinite(Date.parse(e.eventDate+'T12:00:00Z'))||new Date(e.eventDate+'T12:00:00Z').toISOString().slice(0,10)!==e.eventDate)throw Error('INVALID_EVENT');
 return {leagueId:e.leagueId,eventId:e.eventId,eventDate:e.eventDate};
}
const nameKey=s=>String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
function record(r){
 event(r);
 if(typeof r.registrationId!=='string'||!/^reg_[A-Za-z0-9_]{8,80}$/.test(r.registrationId)||typeof r.player!=='string'||!nameKey(r.player)||typeof r.submittedAt!=='string'||!Number.isFinite(Date.parse(r.submittedAt))||!['ACTIVE','REMOVED'].includes(r.state)||!['JA','NEJ'].includes(r.consent)||!['HUB','KIOSK','MOBIL'].includes(r.source)||typeof r.message!=='string')throw Error('INVALID_RECORD');
 return r;
}
function validate(rows){
 if(!Array.isArray(rows))throw Error('INVALID_LEDGER');
 const ids=new Set();for(const r of rows){record(r);if(ids.has(r.registrationId))throw Error('DUPLICATE_ID');ids.add(r.registrationId);}
}
function select(rows,scope){validate(rows);event(scope);return rows.filter(r=>sameEvent(r,scope)&&r.state==='ACTIVE').map(r=>({...r}));}
function append(rows,incoming){
 validate(rows);record(incoming);if(incoming.state!=='ACTIVE')throw Error('INVALID_NEW_STATE');
 const old=rows.find(r=>r.registrationId===incoming.registrationId);
 if(old){if(['leagueId','eventId','eventDate','player','submittedAt','consent','message','source','state'].some(k=>old[k]!==incoming[k]))throw Error('RETRY_CONFLICT');return {changed:false,rows:rows.map(r=>({...r}))};}
 if(rows.some(r=>sameEvent(r,incoming)&&r.state==='ACTIVE'&&nameKey(r.player)===nameKey(incoming.player)))throw Error('PLAYER_ALREADY_REGISTERED');
 return {changed:true,rows:[...rows.map(r=>({...r})),{...incoming}]};
}
function remove(rows,scope,id){
 validate(rows);event(scope);const r=rows.find(r=>r.registrationId===id);
 if(!r||!sameEvent(r,scope))throw Error('REGISTRATION_NOT_IN_EVENT');
 return {changed:r.state!=='REMOVED',rows:rows.map(row=>({...row,...(row.registrationId===id?{state:'REMOVED'}:{})}))};
}
return {select,append,remove};

})();
var BeautyLedgerProtocol_=(function(){
// Offline persistence protocol prototype. No Google/Nakka adapter or background trigger.
'use strict';
const records=BeautyLedgerRecords_;
const fields=['registrationId','leagueId','eventId','eventDate','player','submittedAt','state','consent','source','message'];
const equal=(a,b)=>a&&b&&fields.every(k=>a[k]===b[k]);
function save(store,request,approved){
 // Validate before any service access. Reject extra fields rather than persist unreviewed data.
 if(!request||Object.keys(request).some(k=>!fields.includes(k)))throw Error('INVALID_REQUEST');
 records.append([],request);
 if(!approved||['leagueId','eventId','eventDate'].some(k=>request[k]!==approved[k]))throw Error('WRONG_EVENT');
 if(!store.tryLock())return {status:'BUSY'};
 try{
  store.assertDestination(approved);
  const old=store.readReceipt(request.registrationId);
  if(old&&(!equal(old.request,request)||!['INTENT','ATTEMPTED','COMPLETE'].includes(old.phase)))throw Error('RECEIPT_CONFLICT');
  const rows=store.readRows();
  // Readback is mandatory even after a COMPLETE receipt; changed/removed data must not be replayed.
  const plan=records.append(rows,request);
  if(!plan.changed){
   store.assertDestination(approved);
   store.writeReceipt(request.registrationId,{phase:'COMPLETE',request:{...request}});
   const receipt=store.readReceipt(request.registrationId);
   if(receipt?.phase!=='COMPLETE'||!equal(receipt.request,request))throw Error('RECEIPT_READBACK');
   return {status:'VERIFIED',appended:false};
  }
  // Absence after an uncertain attempted write is not proof that a delayed write cannot land.
  if(old&&old.phase!=='INTENT')return {status:'REVIEW_REQUIRED',code:'ATTEMPTED_ROW_ABSENT'};
  if(!old){
   store.writeReceipt(request.registrationId,{phase:'INTENT',request:{...request}});
   const receipt=store.readReceipt(request.registrationId);
   if(receipt?.phase!=='INTENT'||!equal(receipt.request,request))throw Error('RECEIPT_READBACK');
  }
  store.assertDestination(approved);
  store.writeReceipt(request.registrationId,{phase:'ATTEMPTED',request:{...request}});
  const attempted=store.readReceipt(request.registrationId);
  if(attempted?.phase!=='ATTEMPTED'||!equal(attempted.request,request))throw Error('RECEIPT_READBACK');
  store.appendRecord({...request});
  store.assertDestination(approved);
  if(records.append(store.readRows(),request).changed)throw Error('ROW_READBACK');
  store.writeReceipt(request.registrationId,{phase:'COMPLETE',request:{...request}});
  const completed=store.readReceipt(request.registrationId);
  if(completed?.phase!=='COMPLETE'||!equal(completed.request,request))throw Error('RECEIPT_READBACK');
  return {status:'VERIFIED',appended:true};
 }finally{store.releaseLock();}
}
return {save};

})();
var BeautyLedgerAdapter_=(function(){
// Prepared adapter contract for Apps Script services. No automatic provisioning.
'use strict';
const PROJECT='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N';
const WORKBOOK='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';
function createAdapter(services,config){
 if(!config||config.enabled!==true)throw Error('LEDGER_DISABLED');
 if(config.projectId!==PROJECT||config.workbookId!==WORKBOOK||!Number.isInteger(config.recordsSheetId)||!Number.isInteger(config.receiptsSheetId)||config.recordsSheetId===config.receiptsSheetId)throw Error('UNAPPROVED_DESTINATION');
 const lock=services.LockService.getScriptLock();let held=false;
 function guard(){
  if(!held)throw Error('LOCK_REQUIRED');
  if(services.ScriptApp.getScriptId()!==PROJECT)throw Error('WRONG_PROJECT');
  const props=services.PropertiesService.getScriptProperties();
  if(props.getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'))throw Error('EVENT_SWITCH_PENDING');
  const context=JSON.parse(props.getProperty('BEAUTY_EVENT_CONTEXT_V1')||'null');
  if(!context||context.sheetId!==WORKBOOK||context.mode!=='league'||context.version!==1||context.revision!==config.contextRevision||['leagueId','eventId','eventDate'].some(k=>config.event[k]!==context[k==='eventDate'?'date':k]))throw Error('CONTEXT_CHANGED');
 }
 function table(kind){
  guard();const book=services.SpreadsheetApp.openById(WORKBOOK);
  if(book.getId()!==WORKBOOK)throw Error('WORKBOOK_MISMATCH');
  const title=kind==='records'?'BEAUTY REGISTRATIONS V1':'BEAUTY RECEIPTS V1';
  const sheet=book.getSheetByName(title),id=kind==='records'?config.recordsSheetId:config.receiptsSheetId;
  if(!sheet||sheet.getSheetId()!==id||sheet.getParent().getId()!==WORKBOOK||sheet.getLastColumn()!==2)throw Error('LEDGER_LAYOUT');
  if(JSON.stringify(sheet.getRange(1,1,1,2).getValues()[0])!==JSON.stringify(['REGISTRATION_ID','BEAUTY_JSON_V1']))throw Error('LEDGER_HEADER');
  const last=sheet.getLastRow();if(last<1||last>5001)throw Error('LEDGER_CAPACITY');
  const range=sheet.getRange(1,1,last,2);
  if(range.getFormulas().some(row=>row.some(Boolean)))throw Error('LEDGER_FORMULA');
  const data=range.getValues().slice(1),seen=new Set();
  const rows=data.map(([key,raw],i)=>{
   if(typeof key!=='string'||!/^reg_[A-Za-z0-9_]{8,80}$/.test(key)||seen.has(key)||typeof raw!=='string'||!raw.startsWith('BEAUTY_JSON_V1:'))throw Error('LEDGER_RECORD');
   seen.add(key);let value;try{value=JSON.parse(raw.slice(15));}catch(e){throw Error('LEDGER_JSON');}
   if((kind==='records'?value?.registrationId:value?.request?.registrationId)!==key)throw Error('LEDGER_ID_MISMATCH');
   return {key,value,row:i+2};
  });return {sheet,rows,last};
 }
 function encoded(id,value){
  if(typeof id!=='string'||!/^reg_[A-Za-z0-9_]{8,80}$/.test(id))throw Error('INVALID_ID');
  const text='BEAUTY_JSON_V1:'+JSON.stringify(value);
  if(text.length>20000)throw Error('LEDGER_RECORD_TOO_LARGE');
  return [id,text]; // Prefix prevents a submitted message from becoming a cell formula.
 }
 function write(t,row,values){guard();if(row>5001||row>t.sheet.getMaxRows())throw Error('LEDGER_CAPACITY');t.sheet.getRange(row,1,1,2).setValues([values]);}
 return {
  tryLock(){held=lock.tryLock(1000);return held;},
  releaseLock(){if(held){held=false;lock.releaseLock();}},
  assertDestination(approved){guard();if(['leagueId','eventId','eventDate'].some(k=>approved[k]!==config.event[k]))throw Error('WRONG_EVENT');table('records');table('receipts');},
  readRows(){return table('records').rows.map(r=>r.value);},
  readReceipt(id){return table('receipts').rows.find(r=>r.key===id)?.value||null;},
  writeReceipt(id,value){const t=table('receipts'),r=t.rows.find(r=>r.key===id);if(value?.request?.registrationId!==id)throw Error('INVALID_RECEIPT');write(t,r?r.row:t.last+1,encoded(id,value));},
  appendRecord(record){const t=table('records');if(t.rows.some(r=>r.key===record.registrationId))throw Error('DUPLICATE_ID');write(t,t.last+1,encoded(record.registrationId,record));}
 };
}
return {createAdapter,PROJECT,WORKBOOK};

})();
function beautyLedgerTestConfig_(){
 return {enabled:false,projectId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',workbookId:'1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU',recordsSheetId:1911192601,receiptsSheetId:1911192602,contextRevision:null,event:null};
}
function beautyLedgerTestSave_(request){
 const config=beautyLedgerTestConfig_();
 const store=BeautyLedgerAdapter_.createAdapter({ScriptApp:ScriptApp,PropertiesService:PropertiesService,LockService:LockService,SpreadsheetApp:SpreadsheetApp},config);
 return BeautyLedgerProtocol_.save(store,request,config.event);
}
