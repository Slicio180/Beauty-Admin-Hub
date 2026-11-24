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
module.exports={createAdapter,PROJECT,WORKBOOK};
