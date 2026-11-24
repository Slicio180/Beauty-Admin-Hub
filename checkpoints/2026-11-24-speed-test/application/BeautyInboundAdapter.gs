/* Selected-event adapter for the previously tested automatic-import core.
 * Uses LIVE's existing workbook/schema and transport. No Nakka/master writes.
 */
function beautyNakkaImportKey_(suffix){const c=beautyBackgroundScope_();return 'BEAUTY_NAKKA_IMPORT_V1_'+c.eventId+'_'+c.revision+'_'+suffix;}
function beautyNakkaImportDue_(now){
 const raw=PropertiesService.getScriptProperties().getProperty(beautyNakkaImportKey_('SCAN'));if(!raw)return true;
 const r=JSON.parse(raw);beautyNakkaImportNeed_(r?.version===1&&Number.isFinite(r.nextAt),'IMPORT_HISTORY_REVIEW');return now>=r.nextAt;
}
function beautyNakkaImportProvider_(context){
 const event=beautyLiveRegistrationApi_('tournament/get?tdid='+context.eventId).tournament;
 beautyNakkaImportNeed_(event?.tdid===context.eventId&&event.lgid===context.leagueId&&event.title===context.title&&event.team_games===0&&Number.isFinite(event.t_date)&&
  Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')===context.date,'IMPORT_CONTEXT_CHANGED');
 beautyNakkaImportNeed_([10,20].includes(event.status),'IMPORT_EVENT_CLOSED');
 const entries=beautyHubTransferEntries_(beautyLiveRegistrationApi_('tournament/entry/list?tdid='+context.eventId));
 const league=beautyLiveRegistrationApi_('league/entry/list?lgid='+context.leagueId).list;
 beautyNakkaImportNeed_(Array.isArray(league)&&league.length<1000&&league.every(r=>r&&typeof r.name==='string'&&r.name.trim()&&r.name.length<=120&&/^[A-Za-z0-9]{4}$/.test(r.lpid||''))&&new Set(league.map(r=>r.lpid)).size===league.length,'IMPORT_PROVIDER_REVIEW');
 return {entries,league:league.map(r=>({name:r.name,lpid:r.lpid})),readAt:Date.now()};
}
function beautyNakkaImportSnapshot_(){
 const context=beautyBackgroundScope_(),ss=SpreadsheetApp.openById(context.sheetId),snap=beautyLiveRemoveSnapshot_(ss);
 beautyNakkaImportNeed_(Utilities.formatDate(snap.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')===context.date,'IMPORT_CONTEXT_CHANGED');
 for(const title of ['Control','Form responses 2'])snap[title].values=snap[title].values.map(row=>row.map(v=>v instanceof Date?beautyLiveRemoveSerial_(v,ss.getSpreadsheetTimeZone()):v));
 const bounds={};for(const title of ['Form responses 2','PLAYER STATUS DATA']){const sh=ss.getSheetByName(title);bounds[title]={last:sh.getLastRow(),capacity:sh.getMaxRows()};}
 return {context,snap,bounds};
}
function beautyNakkaImportHistory_(){
 const context=beautyBackgroundScope_(),all=PropertiesService.getScriptProperties().getProperties(),removals=[],imports=[];
 const registrations=beautyQueueRead_().filter(j=>j.event.eventId===context.eventId&&j.event.revision===context.revision).map(j=>({name:j.player}));
 for(const j of beautyRecoveryJobs_().filter(j=>j.event.eventId===context.eventId))registrations.push({name:j.player});
 const prefix=beautyNakkaImportKey_('');
 for(const [key,raw] of Object.entries(all)){
  if(key.startsWith('BEAUTY_LIVE_REMOVE_'+context.eventId+'_')){
   const r=JSON.parse(raw);beautyNakkaImportNeed_(r&&['ATTEMPTED','VERIFIED'].includes(r.state)&&r.event?.id===context.eventId&&r.player,'IMPORT_HISTORY_REVIEW');removals.push(r);
  }else if(key.startsWith(prefix)&&key!==prefix+'SCAN'){
   const r=JSON.parse(raw);beautyNakkaImportNeed_(r?.version===1&&beautyNakkaImportEqual_(r.context,context)&&r.entry&&key===prefix+r.entry.tpid&&['INTENT','COMPLETE','REVIEW'].includes(r.state),'IMPORT_HISTORY_REVIEW');imports.push(r);
  }
 }
 beautyNakkaImportNeed_(imports.length<=100,'IMPORT_HISTORY_REVIEW');return {removals,registrations,imports};
}
function beautyNakkaImportResponseCurrent_(row,state){
 return Number.isFinite(row[0])&&row[0]>=state.snap.Control.values[1][1]&&row[0]<state.snap.Control.values[1][0]+1;
}
function beautyLiveInboundScan_(){
 beautyCombinedBackgroundRequire_();const context=beautyBackgroundScope_(),p=PropertiesService.getScriptProperties();
 // Discovery is read-only and does not own ScriptLock. Candidate execution
 // takes the lock and rereads state/history before any saved intent or write.
 const guard=()=>{
  beautyCombinedBackgroundRequire_();beautyNakkaImportNeed_(beautyNakkaImportEqual_(beautyBackgroundScope_(),context),'IMPORT_CONTEXT_CHANGED');
  beautyNakkaImportNeed_(context.sheetId===BEAUTY_LIVE_BASE_.sheetId,'IMPORT_WORKBOOK_REVIEW');
  beautyNakkaImportNeed_(!p.getProperty(BEAUTY_QUEUE_LEASE_)&&!p.getProperty('BEAUTY_LIVE_REMOVE_PENDING')&&!p.getProperty('BEAUTY_LIVE_REGISTRATION_PENDING')&&!p.getProperty('BEAUTY_LIVE_STATUS_PENDING'),'IMPORT_OPERATION_PENDING');
 };
 let provider;
 try{guard();provider=beautyNakkaImportProvider_(context);}catch(e){
  const result={version:1,checkedAt:new Date().toISOString(),nextAt:Date.now()+120000,code:/^IMPORT_[A-Z_]+$/.test(e.message||'')?e.message:'IMPORT_CHECK_UNAVAILABLE',nakkaWrites:0,masterWrites:0};
  beautyBackgroundSave_(beautyNakkaImportKey_('SCAN'),result);return result;
 }
 const io={provider,guard,read:beautyNakkaImportSnapshot_,history:beautyNakkaImportHistory_,now:()=>new Date().toISOString(),
  revalidate:()=>{guard();Object.assign(provider,beautyNakkaImportProvider_(context));guard();},
  externalClosed:()=>{guard();beautyEventExternalWritesClosed_();},
  save:r=>{guard();beautyBackgroundSave_(beautyNakkaImportKey_(r.entry.tpid),r);},
  write:plan=>{
   guard();beautyEventExternalWritesClosed_();
   const requests=plan.cells.map(c=>({updateCells:{range:{sheetId:c.sheetId,startRowIndex:c.row,endRowIndex:c.row+1,startColumnIndex:0,endColumnIndex:6},rows:[{values:c.values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}}));
   const response=plan.cells.find(c=>c.title==='Form responses 2');
   requests.push({repeatCell:{range:{sheetId:response.sheetId,startRowIndex:response.row,endRowIndex:response.row+1,startColumnIndex:0,endColumnIndex:1},cell:{userEnteredFormat:{numberFormat:{type:'DATE_TIME',pattern:'yyyy-mm-dd hh:mm:ss'}}},fields:'userEnteredFormat.numberFormat'}});
   beautyEventSheets_(':batchUpdate',{requests});SpreadsheetApp.flush();
  },
  sync:name=>{guard();beautyLiveRegistrationSync_(beautyLiveRegistrationSheets_(),name,guard);}
 };
 const state=io.read(),history=io.history(),decisions=provider.entries.map(e=>beautyNakkaImportDecision_(e,provider,state,history));
 const next=decisions.find(d=>d.state==='RESUME')||decisions.find(d=>d.state==='READY');
 if(next){
  const commitLock=LockService.getScriptLock();
  if(!commitLock.tryLock(1000)){
   const result={version:1,checkedAt:new Date().toISOString(),nextAt:Date.now()+120000,code:'IMPORT_BUSY',nakkaWrites:0,masterWrites:0};
   beautyCombinedBackgroundRequire_();beautyBackgroundSave_(beautyNakkaImportKey_('SCAN'),result);return result;
  }
  try{guard();decisions[decisions.indexOf(next)]=beautyNakkaImportExecute_(next.entry,io);}
  finally{commitLock.releaseLock();}
 }
 const issues=decisions.filter(d=>['REVIEW','RESUME'].includes(d.state));
 const result={version:1,checkedAt:new Date().toISOString(),nextAt:Date.now()+120000,entries:provider.entries.length,imported:decisions.filter(d=>d.state==='COMPLETE').length,pending:decisions.filter(d=>['READY','RESUME'].includes(d.state)).length,protected:decisions.filter(d=>d.state==='PROTECTED').length,issueCount:issues.length,issues:issues.slice(0,20).map(d=>({name:d.entry.name,code:d.code})),nakkaWrites:0,masterWrites:0};
 guard();beautyBackgroundSave_(beautyNakkaImportKey_('SCAN'),result);return result;
}
