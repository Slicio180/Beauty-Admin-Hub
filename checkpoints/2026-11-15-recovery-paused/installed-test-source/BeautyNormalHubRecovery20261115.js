/* Normal Hub dispatcher integration, isolated real-formula fixture only.
 * No provider/source writes, no new job, no reset, no durable receipt rewrite.
 */
function beautyHubFormulaGuard_(token,context){
 beautyHubTestGuard_();beautyHubAuthRequire_(token);
 const c=beautyFormulaGuard_();
 if(context!==beautyContextToken_()||context!==c.revision)throw Error('Reload the selected TEST event.');
 return c;
}
function beautyHubFormulaReceipt_(ss,config){
 beautyFormulaPreserved_(ss);
 const p=PropertiesService.getScriptProperties(),raw=p.getProperty('BFW1511_JOB'),j=JSON.parse(raw||'null'),fault=beautyFormulaProperty_('FAULT'),result=beautyFormulaProperty_('RESULT');
 if(!j||!(/^[a-f0-9]{32}$/).test(j.id)||j.kind!=='import'||j.player!=='BEAUTY FORMULA TEST 1511'||j.state!=='COMPLETE'||j.steps?.records!=='VERIFIED'||j.steps?.display!=='VERIFIED'||fault?.jobId!==j.id||result?.jobId!==j.id||result?.formulaRecoveryNativeVerified!==true||['sheetId','eventId','leagueId','date','revision','mode'].some(k=>j.event?.[k]!==config[k]))throw Error('The completed formula test receipt needs owner inspection. Do not repeat setup or interruption.');
 const keys=()=>{const all=p.getProperties();return Object.fromEntries(Object.keys(all).filter(k=>k.startsWith('BFW1511_')).sort().map(k=>[k,all[k]]));};
 const before=JSON.stringify(keys());
 return {job:j,raw,unchanged:()=>{if(JSON.stringify(keys())!==before)throw Error('The original formula receipts changed. Preserve the saved result for inspection.');beautyFormulaPreserved_(ss);}};
}
function beautyHubFormulaRecovery_(action,input,token){
 let locked=false,lock;
 try{
  const fields={list:'_context',recheck:'_context,ref'};
  beautyHubTestGuard_();beautyHubAuthRequire_(token);
  if(!input||Array.isArray(input)||fields[action]===undefined||Object.keys(input).sort().join(',')!==fields[action]||Object.values(input).some(v=>typeof v!=='string'||v.length>180))throw Error('Unsupported recovery request. Only the isolated formula result is connected in TEST.');
  const config=beautyHubFormulaGuard_(token,input._context);
  lock=LockService.getScriptLock();if(!(locked=lock.tryLock(1000)))throw Error('Another TEST operation is running. Wait, then check the result.');
  beautyHubFormulaGuard_(token,input._context);
  const ss=beautyPartialNativeBook_(),receipt=beautyHubFormulaReceipt_(ss,config),ref='BEAUTY_RECOVERY_JOB_'+receipt.job.id;
  if(action==='recheck'&&input.ref!==ref)throw Error('This control can only recheck the saved formula test.');
  let detail=null;
  if(action==='recheck'){
   const gate=()=>{beautyHubFormulaGuard_(token,input._context);receipt.unchanged();};
   const checking={...JSON.parse(receipt.raw),state:'PROCESSING'};
   detail=beautyHubFormulaCore_(ss,receipt,gate).run(checking);
   if(!detail?.success)throw Error(detail?.error||'The isolated display could not be verified.');
  }
  receipt.unchanged();beautyHubFormulaGuard_(token,input._context);
  let currentVerified=true;try{beautyFormulaDisplayVerified_(ss);}catch(e){currentVerified=false;}
  return {success:true,scope:'ISOLATED_FORMULA_FIXTURE',providerIsSynthetic:true,normalEventRecoveryEnabled:false,context:input._context,
   event:{sheetId:config.sheetId,eventId:config.eventId,date:config.date},ref,savedState:'COMPLETE',currentVerified,
   checkedAt:new Date().toISOString(),originalReceiptUnchanged:true,originalEventTabsUnchanged:true,sourceRowsAppended:0,nakkaCalls:0,
   detail:detail?{success:true,outcome:detail.outcome}:null,
   message:currentVerified?'Current isolated formula display verified. Original receipt unchanged.':'The saved exercise completed, but its current display needs review. Recheck can rebuild only the isolated display.'};
 }catch(e){return {success:false,code:e?.name==='HubAuthError'?'AUTH_REQUIRED':'RECOVERY_TEST_REVIEW',error:e?.name==='HubAuthError'?'Sign in to continue.':e.message||'Keep the saved result for inspection. No automatic repeat.'};}
 finally{if(locked)lock.releaseLock();}
}

function beautyHubFormulaCore_(ss,receipt,gate){
 const phase="RECHECK";let memory=receipt.raw;gate();
 const config=beautyFormulaGuard_(),player='BEAUTY FORMULA TEST 1511',entry={name:player,tpid:'FW01',lpid:''};
 const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const mapped={getId:()=>ss.getId(),getSpreadsheetTimeZone:()=>ss.getSpreadsheetTimeZone(),getSheetByName:t=>beautyFormulaTab_(ss,t)};
 const io={Utilities,SpreadsheetApp:{openById:id=>{if(id!==config.sheetId)throw Error('FORMULA_BOOK_ONLY');return mapped;},flush:()=>SpreadsheetApp.flush()},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>{if(k!=='BEAUTY_RECOVERY_JOB_'+receipt.job.id)throw Error('FORMULA_JOB_KEY');return memory;},setProperty:(k,text)=>{gate();const j=JSON.parse(text);if(k!=='BEAUTY_RECOVERY_JOB_'+receipt.job.id||j.id!==receipt.job.id||j.player!==receipt.job.player||j.kind!=='import')throw Error('FORMULA_JOB_KEY');if(j.state==='COMPLETE')beautyFormulaDisplayVerified_(ss);memory=text;}})},
 beautyLiveTarget_:()=>{beautyFormulaGuard_();return config;},beautyLiveContextEvent_:()=>({status:20,synthetic:true}),beautyLiveRemoveSnapshot_:()=>beautyFormulaSnapshot_(ss),beautyLiveRemoveHash_:beautyFormulaHash_,beautyLiveRegistrationKey_:key,
 beautyLiveRegistrationApi_:(route,payload)=>{if(payload!==undefined||route!=='tournament/entry/list?tdid='+config.eventId)throw Error('FORMULA_PROVIDER_DISABLED');return [entry];},beautyLiveRemoveEntries_:v=>v,
 beautyQueueWriteGuard_:()=>beautyFormulaGuard_(),beautyQueueLegacyBlock_:()=>beautyFormulaGuard_(),beautyLiveRegistrationList_:()=>{throw Error('FORMULA_LEAGUE_DISABLED');},beautyLiveRemoveSerial_:beautyImportSerial_,
 beautyEventExternalWritesClosed_:()=>{throw Error('FORMULA_SOURCE_WRITE_DISABLED');},beautyEventSheets_:()=>{throw Error('FORMULA_SOURCE_WRITE_DISABLED');},
 beautyLiveRegistrationSync_:(s,p)=>{gate();beautyFormulaPreserved_(ss);if(phase==='INTERRUPT')throw Error('TEST_FORMULA_DISPLAY_INTERRUPTED');beautyFormulaSync_(s,p);}
 };
 // plan() needs only a fixture isolation assertion before the source is seeded.
 if(phase==='PLAN')io.beautyEventExternalWritesClosed_=()=>beautyFormulaGuard_();
 return beautyStandaloneImportCore_(io);
}
