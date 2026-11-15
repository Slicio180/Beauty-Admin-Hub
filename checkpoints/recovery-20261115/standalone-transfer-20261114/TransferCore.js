function beautyStandaloneTransferCore_(io){
const {PropertiesService,Utilities,SpreadsheetApp,beautyLiveTarget_,beautyLiveContextEvent_,beautyLiveRemoveSnapshot_,beautyLiveRemoveHash_,beautyLiveRegistrationKey_,beautyLiveRegistrationApi_,beautyLiveRemoveEntries_,beautyQueueWriteGuard_,beautyQueueLegacyBlock_,beautyLiveRegistrationList_}=io;
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

return {state:(kind,player)=>{if(kind!=="transfer")throw Error("TRANSFER_ONLY");return beautyRecoveryState_(kind,player);},save:beautyRecoverySave_,run:j=>{if(j.kind!=="transfer")throw Error("TRANSFER_ONLY");return beautyRecoveryRun_(j);}};
}
