function beautyStandaloneImportCore_(io){
const {PropertiesService,Utilities,SpreadsheetApp,beautyLiveTarget_,beautyLiveContextEvent_,beautyLiveRemoveSnapshot_,beautyLiveRemoveHash_,beautyLiveRegistrationKey_,beautyLiveRegistrationApi_,beautyLiveRemoveEntries_,beautyQueueWriteGuard_,beautyQueueLegacyBlock_,beautyLiveRegistrationList_,beautyLiveRemoveSerial_,beautyEventExternalWritesClosed_,beautyEventSheets_,beautyLiveRegistrationSync_}=io;
const BEAUTY_RECOVERY_PREFIX_="BEAUTY_RECOVERY_JOB_";
function beautyRecoverySame_(a,b){return JSON.stringify(a)===JSON.stringify(b);}

function beautyRecoveryRequire_(ok,message){if(!ok)throw Error(message);}

function beautyRecoverySave_(j){
 const p=PropertiesService.getScriptProperties(),k=BEAUTY_RECOVERY_PREFIX_+j.id,text=JSON.stringify(j);
 beautyRecoveryRequire_(Utilities.newBlob(text).getBytes().length<=8500,'Recovery receipt exceeds safe storage size.');p.setProperty(k,text);beautyRecoveryRequire_(p.getProperty(k)===text,'Recovery receipt could not be verified.');
}

function beautyRecoveryEvent_(j){
 const t=beautyLiveTarget_();if(j)beautyRecoveryRequire_(['eventId','leagueId','date','sheetId','revision','mode'].every(k=>t[k]===j.event[k]),'This receipt belongs to another event. Select its original event before rechecking.');
 const e=beautyLiveContextEvent_(t);return {target:t,provider:e};
}

function beautyRecoveryEntries_(){return beautyLiveRemoveEntries_(beautyLiveRegistrationApi_('tournament/entry/list?tdid='+beautyLiveTarget_().eventId)).sort((a,b)=>a.tpid.localeCompare(b.tpid));}

function beautyRecoverySnapshot_(){const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId),snap=beautyLiveRemoveSnapshot_(ss);beautyRecoveryRequire_(Utilities.formatDate(snap.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')===beautyLiveTarget_().date,'The workbook date does not match the event.');return {ss,snap};}

function beautyRecoveryRows_(snap,player){
 const key=beautyLiveRegistrationKey_,match=r=>key(r[0]||r[1])===key(player);
 return {shown:snap["TONIGHT'S PLAYERS"].display.slice(1).filter(match),stored:snap['PLAYER STATUS DATA'].display.slice(1).filter(r=>key(r[0])===key(player)||key(r[1])===key(player))};
}

function beautyRecoveryUnique_(rows,player){const key=beautyLiveRegistrationKey_,hits=rows.filter(r=>key(r.name)===key(player));beautyRecoveryRequire_(hits.length===1,'The player identity is missing or ambiguous. Review duplicate names before continuing.');return hits[0];}

function beautyRecoveryState_(kind,player){
 const {target,provider}=beautyRecoveryEvent_(),{ss,snap}=beautyRecoverySnapshot_(),entries=beautyRecoveryEntries_(),key=beautyLiveRegistrationKey_,rows=beautyRecoveryRows_(snap,player);
 beautyRecoveryRequire_(typeof player==='string'&&player.trim()&&player.length<=120&&!/[\x00-\x1f\x7f]/.test(player)&&! /^[=+@-]/.test(player),'Choose a valid player.');
 beautyQueueWriteGuard_(player);beautyQueueLegacyBlock_(player);
 let identity,entry;
 if(kind==='transfer'){
  beautyRecoveryRequire_([10,20].includes(provider.status),'Transfer is available only before the event starts.');
  beautyRecoveryRequire_(rows.shown.length===1&&rows.stored.length===1&&rows.shown[0][2]==='IN'&&rows.stored[0][2]==='IN','Transfer requires one uniquely registered IN player.');
  const name=rows.shown[0][0]||rows.shown[0][1];
  identity=target.mode==='tournament'?{name,lpid:''}:beautyRecoveryUnique_(beautyLiveRegistrationList_('league'),name);
  beautyRecoveryRequire_(identity.name.length<=60&&(target.mode==='tournament'||/^[A-Za-z0-9]{4}$/.test(identity.lpid)),'Review the existing Nakka league identity first. Transfer never creates a league member.');
  const hits=entries.filter(r=>key(r.name)===key(name)||identity.lpid&&r.lpid===identity.lpid);
  beautyRecoveryRequire_(hits.length<=1&&hits.every(r=>key(r.name)===key(name)&&(!r.lpid||r.lpid===identity.lpid)),'Nakka identity conflicts with this player.');entry=hits[0]||null;
 }else{
  beautyEventExternalWritesClosed_();entry=beautyRecoveryUnique_(entries,player);identity={name:entry.name,lpid:entry.lpid||''};
  beautyRecoveryRequire_(rows.shown.length===0&&rows.stored.length===0,'Import would replace an existing or previously removed Hub record. Review that player instead.');
  beautyRecoveryRequire_(snap["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>r[0]||r[1]).length<99,'The Hub player display is full.');
 }
 const state={kind,player,context:target,event:provider,identity:{name:identity.name,lpid:identity.lpid||''},entry,entries,snap};
 return {state,ss,version:beautyLiveRemoveHash_(state)};
}

function beautyRecoveryImportPlan_(state,ss){
 const snap=state.snap,zone=ss.getSpreadsheetTimeZone(),serial=Math.max(beautyLiveRemoveSerial_(snap.Control.values[1][0],zone),beautyLiveRemoveSerial_(snap.Control.values[1][1],zone));
 beautyRecoveryRequire_(serial<beautyLiveRemoveSerial_(snap.Control.values[1][0],zone)+1,'The registration time window is invalid.');
 beautyEventExternalWritesClosed_();
 const name=state.identity.name,plans=[{title:'Form responses 2',values:[serial,name,'','N/A','','NAKKA']},{title:'PLAYER STATUS DATA',values:[name,'','IN','N/A','','NAKKA']}];
 for(const x of plans){const sh=ss.getSheetByName(x.title),b=snap[x.title];x.start=sh.getLastRow();x.sheetId=b.id;const prefix={};for(const f of ['values','display','formulas','formats'])prefix[f]=b[f].slice(0,x.start);prefix.id=b.id;x.before=beautyLiveRemoveHash_(prefix);x.capacity=sh.getMaxRows();beautyRecoveryRequire_(x.start>=1&&x.start<=b.values.length&&b.values.slice(x.start).every(r=>r.every(v=>v===''||v===null))&&b.formulas.slice(x.start).every(r=>r.every(v=>!v))&&x.start<(x.title==='Form responses 2'?10000:1000),'The table boundary changed. Refresh the preview.');}
 return {plans,control:beautyLiveRemoveHash_(snap.Control),master:beautyLiveRemoveHash_(snap["PLAYER'S MASTER LIST"]),displayFormula:beautyLiveRemoveHash_(snap["TONIGHT'S PLAYERS"].formulas),displayFormats:beautyLiveRemoveHash_(snap["TONIGHT'S PLAYERS"].formats)};
}

function beautyRecoveryImportPresent_(j,snap,ss){
 const key=beautyLiveRegistrationKey_,zone=ss.getSpreadsheetTimeZone();
 return j.plan.plans.every(x=>{
  const b=snap[x.title],r=b.values[x.start];if(!r)return false;
  let actual;try{actual=x.title==='Form responses 2'?[beautyLiveRemoveSerial_(r[0],zone),...r.slice(1)]:r;}catch(e){return false;}
  const matches=x.title==='Form responses 2'?b.values.slice(1).filter(v=>key(v[1]==='MITT NAMN FINNS INTE I LISTAN'?v[2]:v[1])===key(j.player)&&(()=>{try{return Math.abs(beautyLiveRemoveSerial_(v[0],zone)-x.values[0])<1e-8;}catch(e){return false;}})()):b.display.slice(1).filter(v=>key(v[0])===key(j.player)||key(v[1])===key(j.player));
  return beautyRecoverySame_(actual,x.values)&&matches.length===1&&!b.formulas[x.start].some(Boolean);
 });
}

function beautyRecoveryImportPreserved_(j,snap){
 const hash=beautyLiveRemoveHash_;
 return j.plan.plans.every(x=>{const s=snap[x.title],prefix={};for(const k of ['values','display','formulas','formats'])prefix[k]=s[k].slice(0,x.start);prefix.id=s.id;return hash(prefix)===x.before;})&&hash(snap.Control)===j.plan.control&&hash(snap["PLAYER'S MASTER LIST"])===j.plan.master&&hash(snap["TONIGHT'S PLAYERS"].formulas)===j.plan.displayFormula&&hash(snap["TONIGHT'S PLAYERS"].formats)===j.plan.displayFormats;
}

function beautyRecoveryStep_(j,step,read,write){
 beautyRecoveryEvent_(j);
 if(read()){j.steps[step]='VERIFIED';beautyRecoverySave_(j);return;}
 beautyRecoveryRequire_(!j.steps[step],'An earlier write is not verified. No repeat was sent; inspect the saved result.');
 j.steps[step]='INTENT';beautyRecoverySave_(j);
 try{write();}catch(e){} // uncertain response: read once; never send another add
 beautyRecoveryRequire_(read(),'The saved result is not yet verified. Use RECHECK after inspecting it.');j.steps[step]='VERIFIED';beautyRecoverySave_(j);
}

function beautyRecoveryRun_(j){
 beautyRecoveryEvent_(j);
 if(j.kind==='transfer'){
  const key=beautyLiveRegistrationKey_;
  const read=()=>{const entries=beautyRecoveryEntries_(),hits=entries.filter(r=>key(r.name)===key(j.identity.name)||j.identity.lpid&&r.lpid===j.identity.lpid);beautyRecoveryRequire_(hits.length<=1&&hits.every(r=>key(r.name)===key(j.identity.name)&&(!r.lpid||r.lpid===j.identity.lpid)),'Nakka identity needs review.');if(!hits.length)return false;beautyRecoveryRequire_(!j.tpid||hits[0].tpid===j.tpid,'The Nakka entry ID changed.');beautyRecoveryRequire_(entries.length===j.beforeCount+1&&beautyLiveRemoveHash_(entries.filter(r=>r.tpid!==hits[0].tpid))===j.beforeEntries,'Other Nakka entries changed. Inspect the current event before acknowledging this transfer.');j.tpid=hits[0].tpid;j.leagueLinkVerified=!!j.identity.lpid&&hits[0].lpid===j.identity.lpid;return true;};
  beautyRecoveryStep_(j,'entry',read,()=>{const {provider}=beautyRecoveryEvent_(j);beautyRecoveryRequire_([10,20].includes(provider.status),'The event has started.');const current=beautyRecoveryRows_(beautyRecoverySnapshot_().snap,j.player);beautyRecoveryRequire_(current.shown.length===1&&current.stored.length===1&&current.shown[0][2]==='IN'&&current.stored[0][2]==='IN','The Hub player is no longer eligible for transfer.');if(j.event.mode==='league'){const member=beautyRecoveryUnique_(beautyLiveRegistrationList_('league'),j.player);beautyRecoveryRequire_(member.lpid===j.identity.lpid,'The league identity changed.');}beautyLiveRegistrationApi_('tournament/entry/update',{tdid:j.event.eventId,add:[{name:j.identity.name,...(j.identity.lpid?{lpid:j.identity.lpid}:{})}]});});
 }else{
  const read=()=>{const {ss,snap}=beautyRecoverySnapshot_();return beautyRecoveryImportPresent_(j,snap,ss);};
  beautyRecoveryStep_(j,'records',read,()=>{
   const {ss,snap}=beautyRecoverySnapshot_();beautyRecoveryRequire_(beautyRecoveryImportPreserved_(j,snap),'Existing records changed. Review a new plan; do not overwrite them.');
   const entry=beautyRecoveryUnique_(beautyRecoveryEntries_(),j.player);beautyRecoveryRequire_(beautyRecoverySame_(entry,j.entry),'The selected Nakka entry changed.');
   beautyEventExternalWritesClosed_();
   const requests=[];
   for(const x of j.plan.plans){const sh=ss.getSheetByName(x.title);beautyRecoveryRequire_(sh.getLastRow()===x.start&&sh.getMaxRows()===x.capacity,'The table size changed.');if(x.start+1>x.capacity)requests.push({appendDimension:{sheetId:x.sheetId,dimension:'ROWS',length:x.start+1-x.capacity}});requests.push({updateCells:{range:{sheetId:x.sheetId,startRowIndex:x.start,endRowIndex:x.start+1,startColumnIndex:0,endColumnIndex:6},rows:[{values:x.values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}});}
   beautyEventSheets_(':batchUpdate',{requests});SpreadsheetApp.flush();
  });
  const {ss,snap}=beautyRecoverySnapshot_();beautyRecoveryRequire_(beautyRecoveryImportPreserved_(j,snap),'Other workbook data changed. The import is retained for manual review.');
  // A derived display can be rebuilt from today's source records, not replayed.
  beautyLiveRegistrationSync_({store:ss.getSheetByName('PLAYER STATUS DATA'),tonight:ss.getSheetByName("TONIGHT'S PLAYERS")},j.player);
  const after=beautyRecoverySnapshot_();beautyRecoveryRequire_(beautyRecoveryImportPresent_(j,after.snap,after.ss)&&beautyRecoveryImportPreserved_(j,after.snap),'Imported records or preservation checks differ.');
  const rows=beautyRecoveryRows_(after.snap,j.player);beautyRecoveryRequire_(rows.shown.length===1&&beautyRecoverySame_(rows.shown[0],[j.player,'','IN','N/A','','NAKKA']),'The imported player display is not verified.');
  beautyRecoveryRequire_(beautyRecoverySame_(beautyRecoveryUnique_(beautyRecoveryEntries_(),j.player),j.entry),'The Nakka entry changed after import.');j.steps.display='VERIFIED';
 }
 beautyRecoveryEvent_(j);j.state='COMPLETE';j.completedAt=new Date().toISOString();delete j.failure;beautyRecoverySave_(j);return {success:true,outcome:'COMPLETE',message:j.kind==='import'?'Imported and verified. Consent is N/A; original Nakka registration time is unknown.':j.leagueLinkVerified?'Transfer verified, including the league link.':'Event entry verified. Nakka does not expose a league link for exact-ID verification.',reference:BEAUTY_RECOVERY_PREFIX_+j.id};
}

return {state:(kind,player)=>{if(kind!=="import")throw Error("IMPORT_ONLY");return beautyRecoveryState_(kind,player);},plan:beautyRecoveryImportPlan_,save:beautyRecoverySave_,run:j=>{if(j.kind!=="import")throw Error("IMPORT_ONLY");return beautyRecoveryRun_(j);}};
}

function beautyImportSerial_(value,zone) {
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(value instanceof Date&&!isNaN(value.getTime()))return (Date.parse(Utilities.formatDate(value,zone,"yyyy-MM-dd'T'HH:mm:ss.SSS")+'Z')-Date.UTC(1899,11,30))/86400000;
  throw Error('LAYOUT');
}

/* Native standalone import lab. Nakka is GET-only; writes use marked fixture tabs. */
function beautyImportKeys_(){return {baseline:'BSI1511_BASELINE',preview:'BSI1511_PREVIEW',job:'BSI1511_JOB',attempt:'BSI1511_SHEETS_ATTEMPT',displayFault:'BSI1511_DISPLAY_FAULT',result:'BSI1511_RESULT'};}
function beautyImportProperty_(key,value){if(!Object.values(beautyImportKeys_()).includes(key))throw Error('IMPORT_PROPERTY_ONLY');beautyStandaloneGuard_();const p=PropertiesService.getScriptProperties();if(value===undefined)return p.getProperty(key);const s=JSON.stringify(value);if(Utilities.newBlob(s).getBytes().length>8500)throw Error('IMPORT_RECEIPT_SIZE');p.setProperty(key,s);if(p.getProperty(key)!==s)throw Error('IMPORT_RECEIPT_READBACK');return s;}
function beautyImportGet_(key){const s=beautyImportProperty_(key);return s?JSON.parse(s):null;}
function beautyImportMap_(){return {Control:'BSI1511_Control','Form responses 2':'BSI1511_Responses','PLAYER STATUS DATA':'BSI1511_Status',"TONIGHT'S PLAYERS":'BSI1511_Display',"PLAYER'S MASTER LIST":'BSI1511_Master'};}
function beautyImportTab_(ss,title){const n=beautyImportMap_()[title];if(!n)throw Error('IMPORT_TAB_ONLY');const sh=ss.getSheetByName(n);if(!sh||sh.getRange('H1').getValue()!=='BEAUTY_IMPORT_TEST_V1:t_xeWf_2939')throw Error('IMPORT_TAB_MARKER');return sh;}
function beautyImportSnapshot_(ss){const out={};for(const title of Object.keys(beautyImportMap_())){const sh=beautyImportTab_(ss,title);if(sh.getLastRow()>10)throw Error('IMPORT_FIXTURE_SIZE');const r=sh.getRange(1,1,10,6);out[title]={id:sh.getSheetId(),values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return out;}
function beautyImportGuard_(ss){beautyStandaloneGuard_();beautyStandalonePreserved_(ss);}
function beautyImportSetup_(ss){
 beautyImportGuard_(ss);const keys=beautyImportKeys_(),b=beautyImportGet_(keys.baseline);if(b){if(beautyPartialNativeHash_(beautyImportSnapshot_(ss))!==b.fixture)throw Error('IMPORT_FIXTURE_CHANGED');return;}
 if(beautyImportGet_(keys.job)||beautyImportGet_(keys.attempt)||beautyImportGet_(keys.preview)||Object.values(beautyImportMap_()).some(n=>ss.getSheetByName(n)))throw Error('IMPORT_EXISTING_SETUP_REVIEW');
 const date=new Date('2026-11-14T12:00:00Z'),name='IMPORT PRESERVE TEST';
 for(const [title,n]of Object.entries(beautyImportMap_())){
  beautyStandaloneGuard_();const rows=Array.from({length:10},()=>Array(6).fill(''));
  rows[0]=title==='Control'?['START DATE','LAST RESET','','','','']:title==='Form responses 2'?['Timestamp','PLAYER','NEW NAME','CONSENT','MESSAGE','SOURCE']:['PLAYER','OLD NAME','STATUS','CONSENT','MESSAGE','SOURCE'];
  if(title==='Control')rows[1]=[date,date,'','','',''];
  else if(title==='Form responses 2')rows[1]=[date,name,'','NEJ, JAG GODKÄNNER INTE','Preserve.   ','TEST'];
  else if(title==="PLAYER'S MASTER LIST")rows[1][0]=name;
  else rows[1]=[name,'','OUT','NEJ','Preserve.   ','TEST'];
  const sh=ss.insertSheet(n);sh.getRange('H1').setValue('BEAUTY_IMPORT_TEST_V1:t_xeWf_2939');sh.getRange(1,1,10,6).setValues(rows);
 }
 SpreadsheetApp.flush();beautyImportGuard_(ss);beautyImportProperty_(keys.baseline,{fixture:beautyPartialNativeHash_(beautyImportSnapshot_(ss)),createdAt:new Date().toISOString()});
}
function beautyImportDisplay_(snap){const rows=[snap["TONIGHT'S PLAYERS"].values[0].slice()];for(const r of snap['PLAYER STATUS DATA'].values.slice(1).filter(r=>r[0]&&r[2]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'sv-SE')))rows.push([r[0],'',...r.slice(2)]);if(rows.length>10)throw Error('IMPORT_DISPLAY_SIZE');while(rows.length<10)rows.push(Array(6).fill(''));return rows;}
function beautyImportExpected_(snap,plan){const expected=JSON.parse(JSON.stringify(snap));for(const x of plan.plans)expected[x.title].values[x.start]=x.values.slice();expected["TONIGHT'S PLAYERS"].values=beautyImportDisplay_(expected);const out={};for(const title of Object.keys(expected))out[title]={values:beautyPartialNativeHash_(expected[title].values),formulas:beautyPartialNativeHash_(expected[title].formulas),formats:beautyPartialNativeHash_(expected[title].formats),id:expected[title].id};return out;}
function beautyImportVerified_(ss,j,displayRequired){const snap=beautyImportSnapshot_(ss);for(const [title,expected] of Object.entries(j.expected)){const s=snap[title];if(s.id!==expected.id||beautyPartialNativeHash_(s.formulas)!==expected.formulas||beautyPartialNativeHash_(s.formats)!==expected.formats)throw Error('IMPORT_LAYOUT_CHANGED');if(title!=="TONIGHT'S PLAYERS"||displayRequired)if(beautyPartialNativeHash_(s.values)!==expected.values)throw Error('IMPORT_SOURCE_OR_DISPLAY_MISMATCH');}return snap;}
function beautyImportAdapter_(ss,phase){
 const c=beautyStandaloneConfig_(),keys=beautyImportKeys_();
 const mapped={getId:()=>ss.getId(),getSpreadsheetTimeZone:()=>ss.getSpreadsheetTimeZone(),getSheetByName:t=>beautyImportTab_(ss,t)};
 const props={getProperty:k=>{const j=beautyImportGet_(keys.job);if(!/^BEAUTY_RECOVERY_JOB_[a-f0-9]{32}$/.test(k)||j&&k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('IMPORT_JOB_KEY');return j?JSON.stringify(j):null;},setProperty:(k,text)=>{const j=JSON.parse(text);if(k!=='BEAUTY_RECOVERY_JOB_'+j.id||j.kind!=='import'||j.player!==c.player||j.event.eventId!==c.eventId)throw Error('IMPORT_JOB_KEY');beautyImportProperty_(keys.job,j);}};
 function sheets(path,body){
  beautyImportGuard_(ss);if(phase!=='CONFIRM'||path!==':batchUpdate'||beautyImportGet_(keys.attempt))throw Error('IMPORT_NO_REPEAT_BATCH');
  const j=beautyImportGet_(keys.job);if(!j||j.steps.records!=='INTENT')throw Error('IMPORT_INTENT_REQUIRED');
  const expected={requests:j.plan.plans.map(x=>({updateCells:{range:{sheetId:x.sheetId,startRowIndex:x.start,endRowIndex:x.start+1,startColumnIndex:0,endColumnIndex:6},rows:[{values:x.values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}}))};
  if(JSON.stringify(body)!==JSON.stringify(expected)||j.plan.plans.length!==2)throw Error('IMPORT_BATCH_NOT_REVIEWED');
  for(const x of j.plan.plans){const sh=beautyImportTab_(ss,x.title);if(!['Form responses 2','PLAYER STATUS DATA'].includes(x.title)||sh.getSheetId()!==x.sheetId||sh.getLastRow()!==x.start||x.start!==2||sh.getMaxRows()!==x.capacity)throw Error('IMPORT_BATCH_TARGET');}
  beautyImportProperty_(keys.attempt,{jobId:j.id,count:1,at:new Date().toISOString()});
  // Same Sheets batch API as the production adapter, pinned to TEST fixture IDs.
  try{UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+c.sheetId+':batchUpdate',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify(body),muteHttpExceptions:true,followRedirects:false});}catch(e){}
  throw Error('TEST_DISCARDED_SHEETS_REPLY');
 }
 function sync(){
  beautyImportGuard_(ss);const j=beautyImportGet_(keys.job);beautyImportVerified_(ss,j,false);
  if(phase==='CONFIRM'&&!beautyImportGet_(keys.displayFault)){beautyImportProperty_(keys.displayFault,{jobId:j.id,injected:true});throw Error('TEST_DISPLAY_FAILURE_AFTER_SAVED_IMPORT');}
  const rows=beautyImportDisplay_(beautyImportSnapshot_(ss));beautyImportTab_(ss,"TONIGHT'S PLAYERS").getRange(1,1,10,6).setValues(rows);SpreadsheetApp.flush();
 }
 return {PropertiesService:{getScriptProperties:()=>props},Utilities,SpreadsheetApp:{openById:id=>{if(id!==c.sheetId)throw Error('IMPORT_BOOK_ONLY');beautyStandaloneGuard_();return mapped;},flush:()=>SpreadsheetApp.flush()},
  beautyLiveTarget_:()=>{beautyStandaloneGuard_();return {...c};},beautyLiveContextEvent_:()=>beautyStandaloneEvent_(),beautyLiveRemoveSnapshot_:()=>beautyImportSnapshot_(ss),beautyLiveRemoveHash_:beautyPartialNativeHash_,
  beautyLiveRemoveSerial_:beautyImportSerial_,beautyLiveRegistrationKey_:s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'),
  beautyLiveRegistrationApi_:(path,payload)=>{if(payload)throw Error('IMPORT_NAKKA_READ_ONLY');return beautyStandaloneReadApi_(path);},beautyLiveRemoveEntries_:beautyStandaloneEntries_,
  beautyQueueWriteGuard_:()=>beautyStandaloneGuard_(),beautyQueueLegacyBlock_:()=>beautyStandaloneGuard_(),beautyLiveRegistrationList_:()=>{throw Error('NO_LEAGUE_CALLS');},
  // Fixture tabs have no external form; real production form checks are not exercised here.
  beautyEventExternalWritesClosed_:()=>beautyStandaloneGuard_(),beautyEventSheets_:sheets,beautyLiveRegistrationSync_:sync};
}
function beautyImportTransferReceipt_(){const j=beautyStandaloneGet_(beautyStandaloneKeys_().job);if(!j||j.state!=='COMPLETE'||j.event.eventId!=='t_xeWf_2939'||j.player!==beautyStandaloneConfig_().player||!/^[A-Za-z0-9]{4}$/.test(j.tpid))throw Error('VERIFIED_TRANSFER_RECEIPT_REQUIRED');return j;}
function beautyTestStandaloneImportPreview20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),c=beautyStandaloneConfig_(),keys=beautyImportKeys_(),transfer=beautyImportTransferReceipt_();beautyStandaloneEvent_();
 if(beautyImportGet_(keys.job)||beautyImportGet_(keys.attempt))throw Error('USE_IMPORT_RECHECK');
 const entries=beautyStandaloneEntries_(beautyStandaloneReadApi_('tournament/entry/list?tdid=t_xeWf_2939'));if(entries.length!==1||entries[0].name!==c.player||entries[0].tpid!==transfer.tpid)throw Error('IMPORT_PROVIDER_ENTRY_CHANGED');
 beautyImportSetup_(ss);const core=beautyStandaloneImportCore_(beautyImportAdapter_(ss,'PREVIEW')),s=core.state('import',c.player),plan=core.plan(s.state,s.ss);
 const preview={ticket:Utilities.getUuid().replace(/-/g,''),owner:Session.getActiveUser().getEmail().toLowerCase(),version:s.version,expires:Date.now()+600000,plan};beautyImportProperty_(keys.preview,preview);
 return beautyStandaloneOutput_({result:'STANDALONE_IMPORT_PREVIEW_READY',eventId:c.eventId,player:c.player,entryId:transfer.tpid,providerWrites:0,sourceRowsToAppend:2,status:'IN',consent:'N/A',source:'NAKKA',originalEventTabsUnchanged:true,hubBindingChanged:false,confirmation:'Run beautyTestStandaloneImportConfirm20261115 within 10 minutes. Writes two fixture rows only, discards Sheets reply, then intentionally interrupts fixture display refresh. Expected REVIEW; recheck verifies without another append.',scope:'Production import core with isolated native fixture adapter; real Hub UI/form/formula wiring pending'});
 });}
function beautyTestStandaloneImportConfirm20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),c=beautyStandaloneConfig_(),keys=beautyImportKeys_();beautyImportGuard_(ss);if(beautyImportGet_(keys.job)||beautyImportGet_(keys.attempt))throw Error('USE_IMPORT_RECHECK');
 const p=beautyImportGet_(keys.preview);if(!p||p.consumed||Date.now()>=p.expires||p.owner!==Session.getActiveUser().getEmail().toLowerCase())throw Error('FRESH_IMPORT_PREVIEW_REQUIRED');
 const core=beautyStandaloneImportCore_(beautyImportAdapter_(ss,'CONFIRM')),s=core.state('import',c.player),plan=core.plan(s.state,s.ss);if(s.version!==p.version||JSON.stringify(plan)!==JSON.stringify(p.plan))throw Error('STALE_IMPORT_PREVIEW');
 beautyImportProperty_(keys.preview,{...p,consumed:true});const j={version:1,id:p.ticket,state:'PROCESSING',kind:'import',event:s.state.context,player:c.player,identity:s.state.identity,entry:s.state.entry,plan,expected:beautyImportExpected_(s.state.snap,plan),steps:{},createdAt:new Date().toISOString()};core.save(j);return beautyImportReport_(ss,core,j,'CONFIRM');
 });}
function beautyImportReport_(ss,core,j,phase){
 let detail;try{detail=core.run(j);if(detail.success)beautyImportVerified_(ss,j,true);}catch(e){j.state='REVIEW';j.failure=e.message;core.save(j);detail={success:false,outcome:'REVIEW',error:e.message};}
 beautyImportGuard_(ss);const keys=beautyImportKeys_(),report={result:detail.success?'STANDALONE_IMPORT_VERIFIED':'STANDALONE_IMPORT_REVIEW',phase,eventId:j.event.eventId,player:j.player,jobId:j.id,sheetsWriteAttempts:beautyImportGet_(keys.attempt)?.count||0,providerWrites:0,displayFailureInjected:!!beautyImportGet_(keys.displayFault),originalEventTabsUnchanged:true,transferFixturesUnchanged:true,hubBindingChanged:false,productionChanged:false,detail,scope:'Real Nakka read and native Sheets fixture writes using production import core; full Hub integration remains pending'};beautyImportProperty_(keys.result,report);return beautyStandaloneOutput_(report);
}
function beautyTestStandaloneImportRecheck20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),j=beautyImportGet_(beautyImportKeys_().job);if(!j||j.kind!=='import'||j.event.eventId!=='t_xeWf_2939'||j.player!==beautyStandaloneConfig_().player||!['INTENT','VERIFIED'].includes(j.steps.records))throw Error('IMPORT_RECEIPT_REQUIRED');
 return beautyImportReport_(ss,beautyStandaloneImportCore_(beautyImportAdapter_(ss,'RECHECK')),j,'RECHECK');
 });}
