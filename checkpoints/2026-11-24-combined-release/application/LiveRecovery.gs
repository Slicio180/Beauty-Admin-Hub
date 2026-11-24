/* Staff recovery and explicit, one-player reconciliation. No bulk replay.
 * New operations carry durable intent before writes. Rechecks never repeat an
 * uncertain add. Legacy records are archived byte-for-byte before release.
 */
const BEAUTY_RECOVERY_PREFIX_='BEAUTY_RECOVERY_JOB_';
function beautyRecoverySame_(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function beautyRecoveryRequire_(ok,message){if(!ok)throw Error(message);}
function beautyRecoveryJobs_(){
 const values=PropertiesService.getScriptProperties().getProperties(),out=[];
 for(const k of Object.keys(values).filter(k=>k.startsWith(BEAUTY_RECOVERY_PREFIX_))){
  const j=JSON.parse(values[k]);
  beautyRecoveryRequire_(j&&k===BEAUTY_RECOVERY_PREFIX_+j.id&&/^[a-f0-9]{32}$/.test(j.id)&&['transfer','import'].includes(j.kind)&&['PROCESSING','REVIEW','COMPLETE'].includes(j.state)&&j.event&&j.steps&&typeof j.player==='string','A recovery receipt is unreadable. Preserve it for owner inspection.');out.push(j);
 }
 return out;
}
function beautyRecoveryGuard_(player,all){
 const key=beautyLiveRegistrationKey_;
 beautyRecoveryRequire_(!beautyRecoveryJobs_().some(j=>j.state!=='COMPLETE'&&(all||key(j.player)===key(player))), 'This player has an unfinished transfer or import. Open Recovery and recheck it.');
}
function beautyRecoverySave_(j){
 const p=PropertiesService.getScriptProperties(),k=BEAUTY_RECOVERY_PREFIX_+j.id,text=JSON.stringify(j);
 beautyRecoveryRequire_(Utilities.newBlob(text).getBytes().length<=8500,'Recovery receipt exceeds safe storage size.');p.setProperty(k,text);beautyRecoveryRequire_(p.getProperty(k)===text,'Recovery receipt could not be verified.');
}
function beautyRecoveryRoom_(j){
 const props=PropertiesService.getScriptProperties().getProperties();
 // Keep the existing queue reservations as well as this operation's maximum.
 beautyQueueCapacity_(props,beautyQueueRead_());
 const total=Object.keys(props).reduce((n,k)=>n+Utilities.newBlob(k).getBytes().length+Utilities.newBlob(props[k]).getBytes().length,0);
 beautyRecoveryRequire_(total+17000<430000,'Recovery storage needs owner review. Nothing has been discarded.');
 beautyRecoveryRequire_(Utilities.newBlob(JSON.stringify(j)).getBytes().length<7000,'Recovery plan is too large.');
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
function beautyRecoveryInventory_(){
 const t=beautyLiveTarget_(),p=PropertiesService.getScriptProperties(),all=p.getProperties(),items=[];
 for(const [ref,kind] of [['BEAUTY_LIVE_REGISTRATION_PENDING','registration'],['BEAUTY_LIVE_STATUS_PENDING','status'],['BEAUTY_LIVE_REMOVE_PENDING','removal']])if(all[ref]){
  let r;try{r=JSON.parse(all[ref]);}catch(e){}
  items.push({ref,kind,player:r?.player||'Unidentified player',date:r?.eventDate||r?.event?.date||'',message:'Verify the saved result. The original receipt will be retained.',canCheck:!!r});
 }
 for(const ref of Object.keys(all).filter(k=>k.startsWith('BEAUTY_CONSENT_PENDING_'))){let r;try{r=JSON.parse(all[all[ref]]);}catch(e){}items.push({ref,kind:'consent',player:r?.player||'Unidentified player',date:r?.eventDate||'',message:'Check the saved consent answer without resubmitting it.',canCheck:!!r});}
 for(const j of beautyRecoveryJobs_().filter(j=>j.state!=='COMPLETE'))items.push({ref:BEAUTY_RECOVERY_PREFIX_+j.id,kind:j.kind,player:j.player,date:j.event.date,message:j.state==='PROCESSING'?'Operation started. Recheck its saved result if the original window did not finish.':j.failure||'Saved operation needs verification.',processing:j.state==='PROCESSING'&&Number.isFinite(j.until)&&Date.now()<j.until,canCheck:j.event.revision===t.revision});
 for(const ref of Object.keys(all).filter(k=>/^BEAUTY_(EVENT_SETTINGS|POOL_SEND|POOL_START)_/.test(k))){let r;try{r=JSON.parse(all[ref]);}catch(e){}if(!r||r.state==='ATTEMPTED')items.push({ref,kind:'competition',player:'Event / pool operation',date:r?.date||'',message:'Inspect Event Setup or Pool Planner and the saved Nakka result. This action cannot safely be replayed as a player registration.',canCheck:false});}
 return items;
}
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
function beautyRecoveryArchive_(ref,raw,actor,evidence){
 const p=PropertiesService.getScriptProperties(),id='BEAUTY_RECOVERY_PROOF_'+beautyLiveRemoveHash_({ref,raw}),previous=p.getProperty(id),record=previous||JSON.stringify({kind:'CURRENT_STATE_VERIFIED',ref,original:raw,uid:actor.uid,checkedAt:new Date().toISOString(),evidence,operationAttributionVerified:false});
 beautyRecoveryRequire_(p.getProperty(ref)===raw,'The saved receipt changed during verification.');
 if(previous){const prior=JSON.parse(previous);beautyRecoveryRequire_(prior.kind==='CURRENT_STATE_VERIFIED'&&prior.ref===ref&&prior.original===raw,'The archived recovery evidence does not match.');}
 beautyRecoveryRequire_(Utilities.newBlob(record).getBytes().length<=8500,'The receipt is too large to archive safely.');if(!previous){beautyRecoveryRoom_({});p.setProperty(id,record);}beautyRecoveryRequire_(p.getProperty(id)===record,'Recovery evidence could not be verified.');
 p.deleteProperty(ref);beautyRecoveryRequire_(p.getProperty(ref)===null,'Recovery was verified but receipt release needs checking.');return {success:true,outcome:'COMPLETE',reference:id,message:'Current saved state verified. Original receipt archived; no registration was repeated.'};
}
function beautyRecoveryLegacy_(ref,actor){
 const p=PropertiesService.getScriptProperties(),raw=p.getProperty(ref);beautyRecoveryRequire_(raw,'This receipt is no longer pending. Refresh Recovery.');
 const consent=ref.startsWith('BEAUTY_CONSENT_PENDING_'),j=JSON.parse(consent?p.getProperty(raw):raw),t=beautyLiveTarget_(),key=beautyLiveRegistrationKey_;
 beautyRecoveryRequire_(j&&j.player&&(j.eventDate||j.event?.date)===t.date&&(!j.eventId||j.eventId===t.eventId)&&(!j.event?.id||j.event.id===t.eventId)&&(!j.sheetId||j.sheetId===t.sheetId),'This receipt belongs to another event or lacks a verifiable identity. Preserve it for owner review.');
 beautyQueueWriteGuard_(j.player);
 let {ss,snap}=beautyRecoverySnapshot_(),rows=beautyRecoveryRows_(snap,j.player);
 if(ref==='BEAUTY_LIVE_REMOVE_PENDING')return beautyRecoveryRemoval_(ref,raw,j,actor,ss,snap);
 beautyRecoveryRequire_(rows.stored.length===1&&rows.shown.length===1,'The player must have one source record and one displayed registration.');
 const r=rows.stored[0];
 if(ref==='BEAUTY_LIVE_STATUS_PENDING'){
  beautyRecoveryRequire_(['IN','OUT','STANDBY'].includes(j.afterStatus)&&r[2]===j.afterStatus,'The requested status is not saved. No status write was repeated.');
  beautyLiveRegistrationSync_({store:ss.getSheetByName('PLAYER STATUS DATA'),tonight:ss.getSheetByName("TONIGHT'S PLAYERS")},j.player);
 }else if(consent){beautyRecoveryRequire_(['JA','NEJ','N/A'].includes(j.after)&&r[3]===j.after,'The requested consent is not saved. Ask the player before changing it; no consent write was repeated.');}
 else{
  beautyRecoveryRequire_(ref==='BEAUTY_LIVE_REGISTRATION_PENDING'&&['HUB','KIOSK','MOBIL'].includes(j.source)&&Number.isFinite(Date.parse(j.recordedUTC)),'The registration receipt cannot be reconstructed safely.');
  const serial=beautyLiveRemoveSerial_(new Date(j.recordedUTC),ss.getSpreadsheetTimeZone());
  const matches=snap['Form responses 2'].values.slice(1).filter(v=>key(v[1]==='MITT NAMN FINNS INTE I LISTAN'?v[2]:v[1])===key(j.player)&&v[5]===j.source&&(()=>{try{return Math.abs(beautyLiveRemoveSerial_(v[0],ss.getSpreadsheetTimeZone())-serial)<1/86400;}catch(e){return false;}})());
  beautyRecoveryRequire_(matches.length===1,'No unique original response matches this receipt. Do not resubmit it.');const response=matches[0],consentValue={'JA, JAG GODKÄNNER':'JA','NEJ, JAG GODKÄNNER INTE':'NEJ'}[response[3]];
  beautyRecoveryRequire_(consentValue&&r[3]===consentValue&&r[4]===String(response[4]||'')&&r[5]===j.source&&['IN','OUT','STANDBY'].includes(r[2]),'Saved registration fields differ from the original response. Owner review is required.');
  const member=t.mode==='tournament'?{lpid:''}:beautyRecoveryUnique_(beautyLiveRegistrationList_('league'),j.player),entry=beautyRecoveryUnique_(beautyRecoveryEntries_(),j.player);
  beautyRecoveryRequire_((!j.leaguePlayerId||j.leaguePlayerId===member.lpid)&&(!j.eventEntryId||j.eventEntryId===entry.tpid)&&(!entry.lpid||entry.lpid===member.lpid),'The Nakka identity differs from the saved receipt.');
  const master=snap["PLAYER'S MASTER LIST"].display.slice(1).filter(v=>key(v[0])===key(j.player));beautyRecoveryRequire_(master.length===1,'The master identity is missing or ambiguous.');
  if(response[1]==='MITT NAMN FINNS INTE I LISTAN'){const form=beautyLiveRegistrationForm_(),choices=form.question.getChoices().map(c=>c.getValue());beautyRecoveryRequire_(choices.filter(n=>key(n)===key(j.player)).length===1,'The backup form does not contain this new player. Owner review is required.');}
  beautyLiveRegistrationSync_({store:ss.getSheetByName('PLAYER STATUS DATA'),tonight:ss.getSheetByName("TONIGHT'S PLAYERS")},j.player);
 }
 const after=beautyRecoverySnapshot_();for(const title of ['Control','PLAYER STATUS DATA','Form responses 2',"PLAYER'S MASTER LIST"])beautyRecoveryRequire_(beautyRecoverySame_(snap[title],after.snap[title]),'Source data changed while checking. Refresh and inspect it.');
 const a=beautyRecoveryRows_(after.snap,j.player);beautyRecoveryRequire_(a.shown.length===1&&a.shown[0][2]===r[2]&&a.shown[0][3]===r[3]&&String(a.shown[0][4]).trim()===String(r[4]).trim()&&a.shown[0][5]===r[5],'The displayed result still differs from its source.');
 beautyContextAssert_();if(consent)beautyRecoveryRequire_(p.getProperty(raw)===JSON.stringify(j),'The consent receipt changed while checking.');return beautyRecoveryArchive_(ref,raw,actor,{eventId:t.eventId,date:t.date,player:j.player,sourceHash:beautyLiveRemoveHash_(r)});
}
function beautyRecoveryRemoval_(ref,raw,j,actor,ss,snap){
 if(j.recoveryVersion===1&&j.context?.mode==='league')return beautyLiveRemovalReconcile_(ref,raw,actor,false);
 // Read-only completion only: a partial removal retains its backup and blocker.
 beautyRecoveryRequire_(/^REMOVE-\d{8}-\d{6}-[a-f0-9-]{8}$/.test(j.backup||''),'The removal backup reference is invalid.');
 const sh=ss.getSheetByName(j.backup);beautyRecoveryRequire_(sh&&sh.getLastRow()>0&&sh.getLastRow()<=200,'The removal backup is missing.');
 const saved=JSON.parse(sh.getRange(1,1,sh.getLastRow(),1).getValues().map(r=>String(r[0]).replace(/^'/,'')).join('')),state=saved.state,key=beautyLiveRegistrationKey_;
 beautyRecoveryRequire_(state&&state.version===j.version&&saved.player===j.player&&state.event.id===beautyLiveTarget_().eventId,'The removal backup does not match its receipt.');
 const expected=JSON.parse(JSON.stringify(state.snap));for(const field of ['values','display']){for(const r of state.registrations){expected['Form responses 2'][field][r.i][1]='';expected['Form responses 2'][field][r.i][2]='';}expected['PLAYER STATUS DATA'][field][state.stored.i].splice(2,4,'','','','');}
 for(const title of ['Control',"PLAYER'S MASTER LIST",'Form responses 2','PLAYER STATUS DATA'])beautyRecoveryRequire_(beautyRecoverySame_(snap[title],expected[title]),'The removal is partial or other records changed. Keep its backup and inspect the differing cells; no deletion was repeated.');
 const entries=beautyRecoveryEntries_();beautyRecoveryRequire_(!entries.some(r=>r.tpid===j.tpid||key(r.name)===key(j.player)),'The Nakka entry is still present. No deletion was repeated.');
 const expectedNames=state.data.players.filter(r=>key(r.player||r.newPlayer)!==key(j.player)),actual=snap["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>r[0]||r[1]);
 beautyRecoveryRequire_(actual.length===expectedNames.length&&expectedNames.every(p=>actual.filter(r=>key(r[0]||r[1])===key(p.player||p.newPlayer)&&r[2]===p.status&&r[3]===p.consent&&String(r[4]).trim()===p.message&&r[5]===p.whereFrom).length===1),'The remaining player display differs from the backup.');
 return beautyRecoveryArchive_(ref,raw,actor,{eventId:state.event.id,player:j.player,backup:j.backup,removedEntry:j.tpid});
}
function beautyRecoveryService_(action,input,token){
 let lock,j,locked=false,journalStarted=false;
 try{
  beautyLiveLoginGuard_();const actor=beautyHubAuthRequire_(token);beautyContextAssert_();
  const fields={list:'_context',preview:'_context,kind,player',save:'_context,confirmed,ticket',recheck:'_context,ref'};
  beautyRecoveryRequire_(input&&!Array.isArray(input)&&fields[action]!==undefined&&Object.keys(input).sort().join(',')===fields[action]&&Object.values(input).every(v=>typeof v==='string'&&v.length<=180)&&input._context===beautyContextToken_(),'Invalid or stale recovery request. Reload the event.');
  lock=LockService.getScriptLock();beautyRecoveryRequire_(locked=lock.tryLock(1000),'Another operation is running. Wait for it to finish, then refresh Recovery.');
  beautyRecoveryRequire_(!PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_LEASE_),'A registration worker is still active. Wait for it to finish; no recovery write was started.');
  const props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache(),session=beautyLiveRemoveHash_(actor.sessionBinding||token),context=beautyContextToken_();
  if(action==='list'){
   const roster=beautyLiveMonitorRoster_(),entries=beautyRecoveryEntries_(),comparison=beautyLiveMonitorProject_(roster,entries,beautyQueueOpen_());
   return {success:true,context,items:beautyRecoveryInventory_(),transfer:comparison.comparison.hubOnly.filter(p=>p.status==='IN'),import:comparison.comparison.nakkaOnly,ambiguous:comparison.comparison.ambiguous,event:beautyLiveTarget_()};
  }
  if(action==='preview'){
   beautyRecoveryRequire_(['transfer','import'].includes(input.kind),'Choose Transfer or Import.');const {state,ss,version}=beautyRecoveryState_(input.kind,input.player);
   if(input.kind==='transfer'&&state.entry)return {success:true,outcome:'ALREADY_PRESENT',message:'Already in the selected Nakka event. Nothing was added.'};
   const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
   cache.put('beauty-recovery-preview:'+ticket,JSON.stringify({uid:actor.uid,session,context,kind:input.kind,player:input.player,version,expires}),300);
   return {success:true,outcome:'PREVIEW',ticket,expires,kind:input.kind,player:state.identity.name,identity:state.identity,event:state.context,message:input.kind==='transfer'?'Add this IN player to this Nakka event only. No league member will be created.':'Import this Nakka entry into this Hub event. Source NAKKA, status IN, consent N/A, blank message. Master list unchanged; original registration time unknown.'};
  }
  if(action==='recheck'){
   const item=beautyRecoveryInventory_().find(r=>r.ref===input.ref);beautyRecoveryRequire_(item&&item.canCheck,'This item requires owner inspection or is no longer pending. Refresh Recovery.');
   if(input.ref.startsWith(BEAUTY_RECOVERY_PREFIX_)){j=JSON.parse(props.getProperty(input.ref));beautyQueueWriteGuardWithoutRecovery_(j.player);beautyQueueLegacyBlockWithoutRecovery_(j.player);beautyRecoveryEvent_(j);j.state='PROCESSING';j.until=Date.now()+600000;journalStarted=true;beautyRecoverySave_(j);return beautyRecoveryRun_(j);}
   return beautyRecoveryLegacy_(input.ref,actor);
  }
  beautyRecoveryRequire_(input.confirmed==='true'&&/^[a-f0-9]{32}$/.test(input.ticket),'Review and confirm one player first.');
  const k='beauty-recovery-preview:'+input.ticket,review=JSON.parse(cache.get(k)||'null');cache.remove(k);
  beautyRecoveryRequire_(review&&review.uid===actor.uid&&review.session===session&&review.context===context&&Date.now()<review.expires,'The preview expired or belongs to a different session. Review again.');
  const {state,ss,version}=beautyRecoveryState_(review.kind,review.player);beautyRecoveryRequire_(version===review.version,'The event or player list changed. Review a fresh preview.');
  j={version:1,id:input.ticket,state:'PROCESSING',until:Date.now()+600000,kind:review.kind,event:state.context,player:state.identity.name,identity:state.identity,uid:actor.uid,createdAt:new Date().toISOString(),steps:{}};
  if(j.kind==='transfer'){j.beforeCount=state.entries.length;j.beforeEntries=beautyLiveRemoveHash_(state.entries);}else{j.entry=state.entry;j.plan=beautyRecoveryImportPlan_(state,ss);}
  beautyRecoveryRequire_(!props.getProperty(BEAUTY_RECOVERY_PREFIX_+j.id),'This confirmation was already used. Recheck the existing operation.');beautyRecoveryRoom_(j);beautyHubAuthRequire_(token);beautyContextAssert_();journalStarted=true;beautyRecoverySave_(j);return beautyRecoveryRun_(j);
 }catch(e){if(j&&journalStarted){j.state='REVIEW';j.failure=e.message;try{beautyRecoverySave_(j);}catch(ignored){}}return {success:false,code:e?.name==='HubAuthError'?'AUTH_REQUIRED':'RECOVERY_REVIEW',error:e.message||'Recovery could not be verified. No automatic repeat.',...(j&&journalStarted?{reference:BEAUTY_RECOVERY_PREFIX_+j.id}:{})};}
 finally{if(locked)lock.releaseLock();}
}
