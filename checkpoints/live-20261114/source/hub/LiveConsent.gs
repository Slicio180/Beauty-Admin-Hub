/* Organiser-only current-event consent override. Original form submissions remain
 * historical evidence. The existing status sheet feeds Tonight's Players.
 * Per-player audit/pending key: an unrelated pending consent edit does not block.
 */
function beautyLiveConsent_(input,token){
 beautyLiveLoginGuard_();
 let actor;try{actor=beautyHubAuthRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to change consent.'};}
 const fail=(code,error)=>({success:false,code,error});
 if(!input||Array.isArray(input)||Object.keys(input).sort().join(',')!=='consent,eventDate,expectedConsent,player,requestId'||Object.values(input).some(v=>typeof v!=='string')||!input.player.trim()||input.player.length>120||!['JA','NEJ','N/A'].includes(input.consent)||!['JA','NEJ','N/A','NOT ANSWERED',''].includes(input.expectedConsent)||!/^consent_[a-f0-9]{32}$/.test(input.requestId)||input.eventDate!==beautyLiveTarget_().date)return fail('INVALID','Reload the player before changing consent.');
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','Another operation is running. Try again shortly.');
 let attempted=false;
 try{
  beautyQueueWriteGuard_(input.player);
  const t=beautyLiveTarget_(),context=PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_EVENT_CONTEXT_V1'),props=PropertiesService.getScriptProperties(),key=beautyLiveRegistrationKey_,hash=beautyLiveRemoveHash_;
  const journal='BEAUTY_CONSENT_'+input.requestId,pending='BEAUTY_CONSENT_PENDING_'+hash({eventId:t.eventId,sheetId:t.sheetId,player:key(input.player)});
  const old=props.getProperty(journal);
  if(old){const prior=JSON.parse(old);if(prior.state==='VERIFIED'&&prior.uid===actor.uid&&prior.eventId===t.eventId&&prior.sheetId===t.sheetId&&prior.player===input.player&&prior.before===input.expectedConsent&&prior.after===input.consent)return {success:true,alreadySaved:true,readbackVerified:true,player:input.player,consent:prior.after,auditKey:journal};return fail('CONSENT_REVIEW','This consent request needs review. Reload before another change.');}
  if(props.getProperty(pending))return fail('CONSENT_REVIEW','This player has an unfinished consent save. Check its audit before another change.');
  for(const k of ['BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_STATUS_PENDING','BEAUTY_LIVE_REMOVE_PENDING']){
   const raw=props.getProperty(k);if(!raw)continue;let v;try{v=JSON.parse(raw);}catch(e){return fail('CONSENT_REVIEW','An unreadable operation needs review.');}
   if(!v.player||key(v.player)===key(input.player))return fail('CONSENT_REVIEW','An unfinished operation for this player needs review.');
  }
  const ss=SpreadsheetApp.openById(t.sheetId),before=beautyLiveRemoveSnapshot_(ss),store=ss.getSheetByName('PLAYER STATUS DATA');
  if(Utilities.formatDate(before.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')!==input.eventDate)return fail('STALE_EVENT','The sheet event changed.');
  const matches=before['PLAYER STATUS DATA'].display.map((r,i)=>({r,i})).slice(1).filter(x=>key(x.r[0])===key(input.player));
  const visible=before["TONIGHT'S PLAYERS"].display.map((r,i)=>({r,i})).slice(1).filter(x=>key(x.r[0]||x.r[1])===key(input.player));
  if(matches.length!==1||visible.length!==1)return fail('IDENTITY','The player must occur once in the event and status sheet.');
  const found=matches[0],shown=visible[0];
  if(found.r[3]!==input.expectedConsent||shown.r[3]!==input.expectedConsent)return fail('STALE_CONSENT','Consent changed since this list loaded. Reload before saving.');
  if(input.consent===input.expectedConsent)return {success:true,readbackVerified:true,player:input.player,consent:input.consent,unchanged:true};
  const cell=store.getRange(found.i+1,4);
  const record={state:'ATTEMPTED',uid:actor.uid,recordedAt:new Date().toISOString(),eventId:t.eventId,eventDate:t.date,sheetId:t.sheetId,player:input.player,row:found.i+1,before:input.expectedConsent,after:input.consent,beforeProof:hash(before),originalFormResponsesChanged:false,nakkaWrites:0};
  const save=()=>{const raw=JSON.stringify(record);props.setProperty(journal,raw);if(props.getProperty(journal)!==raw)throw Error('CONSENT_AUDIT');};
  beautyHubAuthRequire_(token);beautyContextAssert_();
  if(props.getProperty('BEAUTY_LIVE_EVENT_CONTEXT_V1')!==context||hash(beautyLiveRemoveSnapshot_(ss))!==record.beforeProof)return fail('STALE_CONSENT','The event data changed during review. Reload before saving.');
  save();props.setProperty(pending,journal);if(props.getProperty(pending)!==journal)throw Error('CONSENT_AUDIT');
  attempted=true;
  try{cell.setValue(input.consent);}catch(e){} // Read back an uncertain reply; never send a second write.
  SpreadsheetApp.flush();
  const after=beautyLiveRemoveSnapshot_(ss),planned=JSON.parse(JSON.stringify(before));
  for(const f of ['values','display']){planned['PLAYER STATUS DATA'][f][found.i][3]=input.consent;planned["TONIGHT'S PLAYERS"][f][shown.i][3]=input.consent;}
  if(JSON.stringify(after)!==JSON.stringify(planned)||cell.getDisplayValue()!==input.consent||props.getProperty('BEAUTY_LIVE_EVENT_CONTEXT_V1')!==context)throw Error('CONSENT_READBACK');
  record.state='VERIFIED';record.verifiedAt=new Date().toISOString();record.afterProof=hash(after);save();props.deleteProperty(pending);
  if(props.getProperty(pending)!==null)throw Error('CONSENT_AUDIT');
  return {success:true,readbackVerified:true,player:input.player,consent:input.consent,auditKey:journal};
 }catch(e){return fail(attempted?'CONSENT_UNCERTAIN':'CONSENT_CHECK_FAILED',attempted?'Consent may be saved. Reload and inspect the player; do not repeat the save.':'Consent could not be checked. No consent write was attempted.');}
 finally{lock.releaseLock();}
}
