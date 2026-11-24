/* Ordinary registration/removal recovery in the isolated owner TEST project.
 * One owner clock trigger; existing receipts/journals remain the operation store.
 * This deliberately retains the existing ScriptLock across provider work.
 * The separate shorter-lock/speed design is NOT installed by this worker.
 */
var beautyBackgroundInvocation_ = null;
function beautyBackgroundConfig_() { return {
  scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',
  owner:'alessiotampella@gmail.com', sheetId:'1N0kp0f2kOQETylULYI685JDZH3bVKq9lG_NhoAba8lk',
  eventId:'t_GgaQ_0921', leagueId:'lg_M2wQ_4189', date:'2026-11-21',
  revision:'ac044ca8097c46e2b672c5917627fa2a',
  key:'BEAUTY_BACKGROUND_RECOVERY_V1', runKey:'BEAUTY_BACKGROUND_RUN_V1',
  handler:'beautyBackgroundClock_', leaseMs:600000, maxAttempts:3
}; }
function beautyBackgroundNeed_(ok,code) { if(!ok)throw Error(code); }
function beautyBackgroundEqual_(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
function beautyBackgroundScope_() {
  const c=beautyBackgroundConfig_(),need=beautyBackgroundNeed_;beautyHubTestGuard_();
  const x=beautyContextRead_();
  need(ScriptApp.getScriptId()===c.scriptId&&BEAUTY_IDENTITY_WRITES_ENABLED_===true,'BACKGROUND_TEST_ONLY');
  need(x?.mode==='league'&&['sheetId','eventId','leagueId','date','revision'].every(k=>x[k]===c[k]),'BACKGROUND_CONTEXT_CHANGED');
  need(!PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'),'BACKGROUND_CONTEXT_CHANGED');
  return x;
}
function beautyBackgroundOwner_() {
  const c=beautyBackgroundConfig_();
  beautyBackgroundNeed_(ScriptApp.getScriptId()===c.scriptId&&
    Session.getActiveUser().getEmail().toLowerCase()===c.owner&&
    Session.getEffectiveUser().getEmail().toLowerCase()===c.owner,'BACKGROUND_OWNER_REQUIRED');
}
function beautyBackgroundSave_(key,value) {
  const p=PropertiesService.getScriptProperties(),raw=JSON.stringify(value);
  beautyBackgroundNeed_(Utilities.newBlob(raw).getBytes().length<=8500,'BACKGROUND_RECORD_FULL');
  p.setProperty(key,raw);beautyBackgroundNeed_(p.getProperty(key)===raw,'BACKGROUND_SAVE_UNCERTAIN');return raw;
}
function beautyBackgroundTriggers_() {
  const c=beautyBackgroundConfig_();
  return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===c.handler);
}
function beautyBackgroundReadConfig_() {
  const c=beautyBackgroundConfig_(),raw=PropertiesService.getScriptProperties().getProperty(c.key);
  if(!raw)return null;let r;try{r=JSON.parse(raw);}catch(e){throw Error('BACKGROUND_CONFIG_REVIEW');}
  beautyBackgroundNeed_(r?.version===1&&r.owner===c.owner&&r.scriptId===c.scriptId&&
    ['INSTALLING','ENABLED','PAUSED'].includes(r.state)&&r.handler===c.handler,'BACKGROUND_CONFIG_REVIEW');
  return r;
}
// Only this owner editor action installs the trigger. No credentials are stored.
function beautyEnableBackgroundRecovery20261121() {
  beautyBackgroundOwner_();const c=beautyBackgroundConfig_(),context=beautyBackgroundScope_(),lock=LockService.getScriptLock();
  beautyBackgroundNeed_(lock.tryLock(1000),'BACKGROUND_BUSY');
  try {
    beautyBackgroundOwner_();beautyBackgroundScope_();
    const prior=beautyBackgroundReadConfig_(),owned=beautyBackgroundTriggers_();
    if(prior?.state==='ENABLED'&&beautyBackgroundEqual_(prior.context,context)&&owned.length===1&&owned[0].getUniqueId()===prior.triggerUid)
      return beautyReadBackgroundRecovery20261121();
    // A partially installed or paused worker is reviewed, never silently duplicated.
    beautyBackgroundNeed_(!prior&&!owned.length,'BACKGROUND_INSTALL_REVIEW');
    const [eventData]=beautyHubNakkaReads_(beautyPoolAuth_(),false),e=eventData.tournament;
    beautyBackgroundNeed_(e?.tdid===context.eventId&&e.lgid===context.leagueId&&e.title===context.title&&
      [10,20].includes(e.status)&&Utilities.formatDate(new Date(e.t_date*1000),'Europe/Berlin','yyyy-MM-dd')===context.date,'BACKGROUND_EVENT_REVIEW');
    beautyBackgroundScope_();
    const r={version:1,state:'INSTALLING',scriptId:c.scriptId,owner:c.owner,handler:c.handler,context,
      intervalMinutes:1,installedAt:new Date().toISOString(),triggerUid:null};
    beautyBackgroundSave_(c.key,r);
    const trigger=ScriptApp.newTrigger(c.handler).timeBased().everyMinutes(1).create();
    r.triggerUid=trigger.getUniqueId();
    beautyBackgroundNeed_(trigger.getEventType()===ScriptApp.EventType.CLOCK,'BACKGROUND_TRIGGER_REVIEW');
    const actual=beautyBackgroundTriggers_();
    beautyBackgroundNeed_(actual.length===1&&actual[0].getUniqueId()===r.triggerUid,'BACKGROUND_TRIGGER_REVIEW');
    beautyBackgroundScope_();r.state='ENABLED';beautyBackgroundSave_(c.key,r);
    return beautyReadBackgroundRecovery20261121();
  }finally{lock.releaseLock();}
}
// Rollback pauses authority before deleting only this worker's recorded trigger.
function beautyPauseBackgroundRecovery20261121() {
  beautyBackgroundOwner_();const c=beautyBackgroundConfig_(),lock=LockService.getScriptLock();
  beautyBackgroundNeed_(lock.tryLock(1000),'BACKGROUND_BUSY');
  try {
    const r=beautyBackgroundReadConfig_();beautyBackgroundNeed_(r,'BACKGROUND_NOT_INSTALLED');
    r.state='PAUSED';r.pausedAt=new Date().toISOString();beautyBackgroundSave_(c.key,r);
    for(const t of beautyBackgroundTriggers_())if(t.getUniqueId()===r.triggerUid)ScriptApp.deleteTrigger(t);
    return beautyReadBackgroundRecovery20261121();
  }finally{lock.releaseLock();}
}
function beautyReadBackgroundRecovery20261121() {
  beautyBackgroundOwner_();const c=beautyBackgroundConfig_(),p=PropertiesService.getScriptProperties();
  const report={result:'BACKGROUND_RECOVERY_READ_ONLY',config:beautyBackgroundReadConfig_(),
    triggers:beautyBackgroundTriggers_().map(t=>({id:t.getUniqueId(),handler:t.getHandlerFunction(),type:String(t.getEventType())})),
    lastRun:JSON.parse(p.getProperty(c.runKey)||'null'),writesPerformed:false};
  console.log(JSON.stringify(report,null,2));return report;
}
function beautyBackgroundReceiptIntent_(r) {
  return {version:r.version,name:r.name,date:r.date,eventId:r.eventId,sheetId:r.sheetId,context:r.context,
    row:r.row,recordedAt:r.recordedAt,selectedName:r.selectedName,newName:r.newName,consent:r.consent,
    message:r.message,source:r.source,existingPlayer:r.existingPlayer};
}
function beautyBackgroundReceipt_(name) {
  const raw=PropertiesService.getScriptProperties().getProperty(beautyRegistrationRecoveryKey_(name));let r;
  try{r=JSON.parse(raw||'null');}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}
  const x=beautyBackgroundScope_();
  beautyBackgroundNeed_(r?.version===1&&r.name===name&&r.context===x.revision&&r.sheetId===x.sheetId&&
    r.eventId===x.eventId&&r.date===x.date&&['INTENT','REVIEW','COMPLETE'].includes(r.state)&&
    ['HUB','KIOSK','MOBIL'].includes(r.source)&&typeof r.existingPlayer==='boolean'&&
    Number.isInteger(r.row)&&r.row>=2&&Number.isFinite(Date.parse(r.recordedAt)),'REGISTRATION_RECEIPT_UNREADABLE');
  return r;
}
// Invocation authority is established only by the private clock handler after
// checking the Google trigger UID, owner, exact context and locked durable claim.
function beautyBackgroundRequire_(player) {
  const i=beautyBackgroundInvocation_,c=beautyBackgroundConfig_(),need=beautyBackgroundNeed_;
  // Event lookups omit a player; they remain bound to this invocation's claim.
  if(player===undefined)player=i?.player;
  need(i&&i.lock?.hasLock()&&i.player===player&&Date.now()<i.expires,'BACKGROUND_CLAIM_REQUIRED');
  need(Session.getEffectiveUser().getEmail().toLowerCase()===c.owner,'BACKGROUND_OWNER_REQUIRED');
  need(beautyBackgroundEqual_(beautyBackgroundScope_(),i.context),'BACKGROUND_CONTEXT_CHANGED');
  const p=PropertiesService.getScriptProperties();
  need(p.getProperty(c.key)===i.configRaw,'BACKGROUND_AUTHORITY_CHANGED');
  const run=JSON.parse(p.getProperty(c.runKey)||'null');
  need(run?.state==='RUNNING'&&run.owner===i.owner&&run.triggerUid===i.triggerUid,'BACKGROUND_CLAIM_LOST');
  if(i.operation==='registration') {
    const r=beautyBackgroundReceipt_(player),record=beautyPlayerRecoveryLoad_(player,i.context.date);
    need(beautyHubTransferHash_(beautyBackgroundReceiptIntent_(r))===i.intentHash,'BACKGROUND_REGISTRATION_CHANGED');
    need(record?.owner===i.owner&&record.state==='CHECKING','BACKGROUND_CLAIM_LOST');
    // Any intervening removal for this registration takes precedence.
    need(!beautyRemovalRecoveryList_().some(x=>x.receipt.player===player&&
      (x.receipt.state==='ATTEMPTED'||Date.parse(x.receipt.recordedUTC)>=Date.parse(r.recordedAt))),'BACKGROUND_REMOVAL_PENDING');
  }
  return {uid:'test-background:'+c.owner,sessionBinding:i.owner};
}
function beautyBackgroundMutationRequire_(path,payload) {
  const i=beautyBackgroundInvocation_,need=beautyBackgroundNeed_;
  need(i?.operation==='registration','BACKGROUND_MUTATION_BLOCKED');beautyBackgroundRequire_(i.player);
  if(typeof beautyResilienceMutationGuard_==='function')beautyResilienceMutationGuard_();
  const league=path==='league/entry/update',event=path==='tournament/entry/update';
  need((league||event)&&payload&&Object.keys(payload).sort().join(',')===(league?'add,lgid':'add,tdid')&&
    (league?payload.lgid===i.context.leagueId:payload.tdid===i.context.eventId)&&
    Array.isArray(payload.add)&&payload.add.length===1&&payload.add[0]?.name===i.player&&
    Object.keys(payload.add[0]).sort().join(',')===(league?'name':'lpid,name')&&
    (league||/^[A-Za-z0-9]{4}$/.test(payload.add[0].lpid||'')),'BACKGROUND_MUTATION_BLOCKED');
}
function beautyBackgroundRegistrationAuthorize_(name) {
  if(beautyBackgroundInvocation_!==null)return beautyBackgroundRequire_(name);
  return beautyHubAuthRequire_(beautyHubRequestToken_);
}
// Only an expired, unchanged background claim may be closed without provider work.
// A later interactive claim, changed registration, or uncertain history is retained.
function beautyBackgroundExpiredClaim_(record,receipt,context,now) {
  const c=beautyBackgroundConfig_(),w=record?.worker,last=record?.history?.slice(-1)[0];
  if(record?.state!=='CHECKING'||typeof record.owner!=='string'||!record.owner||w?.version!==1||
    !Number.isInteger(w.attempts)||w.attempts<c.maxAttempts||record.autoAttempts!==w.attempts||
    !beautyBackgroundEqual_(w.context,context)||w.intentHash!==beautyHubTransferHash_(beautyBackgroundReceiptIntent_(receipt)))return null;
  const claimed=Date.parse(w.claimedAt),updated=Date.parse(record.updatedAt);
  if(!Number.isFinite(now)||!Number.isFinite(claimed)||!Number.isFinite(updated)||!Number.isFinite(w.leaseUntil)||
    claimed>updated||updated>now||w.leaseUntil<claimed||now<w.leaseUntil||now-updated<c.leaseMs||
    w.nextAt!==undefined&&(!Number.isFinite(w.nextAt)||now<w.nextAt)||
    last?.source!=='background'||last.code!=='RECOVERY_STARTED'||last.state!=='CHECKING'||last.at!==record.updatedAt)return null;
  return {recordHash:beautyHubTransferHash_(record),intentHash:w.intentHash,attempts:w.attempts};
}
function beautyBackgroundExhaustedRun_(item) {
  const i=beautyBackgroundInvocation_,need=beautyBackgroundNeed_;
  need(i?.operation==='registration-review','BACKGROUND_CLAIM_REQUIRED');
  const recheck=()=>{
    beautyBackgroundRequire_(item.name);
    const receipt=beautyBackgroundReceipt_(item.name),record=beautyPlayerRecoveryLoad_(item.name,i.context.date);
    const expired=beautyBackgroundExpiredClaim_(record,receipt,i.context,Date.now());
    need(expired&&expired.recordHash===item.recordHash&&expired.intentHash===item.intentHash,'BACKGROUND_EXHAUSTED_CLAIM_CHANGED');
    need(!beautyRemovalRecoveryList_().some(x=>x.receipt.player===item.name&&
      (x.receipt.state==='ATTEMPTED'||Date.parse(x.receipt.recordedUTC)>=Date.parse(receipt.recordedAt))),'BACKGROUND_REMOVAL_PENDING');
    return record;
  };
  let record=recheck();
  // Immutable before-image keeps the full history even when the normal rolling
  // recovery log is already at its twenty-row limit. This is evidence, not a queue.
  const backupKey='BEAUTY_BACKGROUND_EXHAUSTED_V1_'+beautyHubTransferHash_([i.context.eventId,i.context.revision,item.name,record.owner,record.worker.claimedAt]);
  const p=PropertiesService.getScriptProperties(),before=JSON.stringify(record),existing=p.getProperty(backupKey);
  if(existing===null)beautyBackgroundSave_(backupKey,record);
  else need(existing===before,'BACKGROUND_EXHAUSTED_BACKUP_CHANGED');
  need(p.getProperty(backupKey)===before,'BACKGROUND_EXHAUSTED_BACKUP_UNCERTAIN');
  record=recheck();record.worker.exhaustedBackup=backupKey;
  beautyPlayerRecoverySave_(record,'BACKGROUND_RETRY_EXHAUSTED','NEEDS_HELP','background-review');
  beautyHubAttentionRemember_(item.name,i.context.date,{code:'BACKGROUND_RETRY_EXHAUSTED'});
  return {operation:'registration-review',player:item.name,verified:false,code:'BACKGROUND_RETRY_EXHAUSTED',
    attempts:item.attempts,requiresReview:true,backup:backupKey,nakkaWrites:0};
}
function beautyBackgroundCandidates_(now) {
  const c=beautyBackgroundConfig_(),context=beautyBackgroundScope_(),p=PropertiesService.getScriptProperties();
  const removalHistory=beautyRemovalRecoveryList_(),removals=beautyRemovalRecoveryRows_({players:[]});
  const work=removals.filter(r=>r.autoEligible).map(r=>({operation:'removal',name:r.name,journal:r.journal,at:Date.parse(r.history[0].at)}));
  const prefix=beautyRegistrationRecoveryPrefix_(),keys=Object.keys(p.getProperties()).filter(k=>k.startsWith(prefix));
  beautyBackgroundNeed_(keys.length<=100,'BACKGROUND_HISTORY_REVIEW');
  for(const key of keys) {
    let raw;try{raw=JSON.parse(p.getProperty(key));}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}
    beautyBackgroundNeed_(typeof raw?.name==='string'&&key===beautyRegistrationRecoveryKey_(raw.name),'REGISTRATION_RECEIPT_UNREADABLE');
    const r=beautyBackgroundReceipt_(raw.name),age=now-Date.parse(r.recordedAt);
    if(age<60000)continue; // let the original synchronous registration finish
    if(removalHistory.some(x=>x.receipt.player===r.name&&(x.receipt.state==='ATTEMPTED'||Date.parse(x.receipt.recordedUTC)>=Date.parse(r.recordedAt))))continue;
    const recovery=beautyPlayerRecoveryLoad_(r.name,context.date),w=recovery?.worker;
    const attempts=Math.max(w?.attempts||0,recovery?.autoAttempts||0);
    beautyBackgroundNeed_(Number.isInteger(attempts)&&attempts>=0,'BACKGROUND_HISTORY_REVIEW');
    if(recovery?.state==='CHECKING'&&now-Date.parse(recovery.updatedAt)<c.leaseMs)continue;
    if(recovery?.state==='NEEDS_HELP'&&!['TRANSFER_BUSY','BUSY','STALE_TRANSFER','NAKKA_UNAVAILABLE','CHECK_UNAVAILABLE','TRANSFER_UNCERTAIN','TRANSFER_FAILED','AUTO_EXCEPTION','RECOVERY_REPLY_UNKNOWN','LEAGUE_CREATION_FAILED'].includes(recovery.code))continue;
    if(recovery?.state!=='VERIFIED'&&attempts>=c.maxAttempts){
      const expired=beautyBackgroundExpiredClaim_(recovery,r,context,now);
      if(expired)work.push({operation:'registration-review',name:r.name,at:Date.parse(recovery.updatedAt),...expired});
      continue;
    }
    if(w?.nextAt&&now<w.nextAt)continue;
    if(recovery?.state==='VERIFIED'&&now-Date.parse(recovery.updatedAt)<300000)continue;
    work.push({operation:'registration',name:r.name,at:Date.parse(recovery?.updatedAt||r.recordedAt)});
  }
  return work.sort((a,b)=>a.at-b.at||a.name.localeCompare(b.name));
}
function beautyBackgroundRegistrationRun_(name) {
  const i=beautyBackgroundInvocation_,r=beautyBackgroundReceipt_(name),date=i.context.date;
  const record=beautyPlayerRecoveryLoad_(name,date)||{version:1,eventId:i.context.eventId,name,date,state:'CHECKING',history:[]};
  const attempts=record.state==='VERIFIED'?1:Math.max(record.worker?.attempts||0,record.autoAttempts||0)+1;
  record.autoAttempts=attempts;
  record.owner=i.owner;record.worker={version:1,attempts,context:i.context,intentHash:beautyHubTransferHash_(beautyBackgroundReceiptIntent_(r)),
    claimedAt:new Date().toISOString(),leaseUntil:i.expires,nextAt:Date.now()+Math.min(300000,60000*2**(attempts-1))};
  i.intentHash=record.worker.intentHash;
  beautyPlayerRecoverySave_(record,'RECOVERY_STARTED','CHECKING','background');
  beautyBackgroundRequire_(name);
  if(typeof beautyResilienceWorkerClaim_==='function')beautyResilienceWorkerClaim_();
  let result;
  try {
    const registration=beautyRegistrationRecoveryResume_(name);beautyBackgroundRequire_(name);
    if(!registration.success)result=registration;
    else {
      // Reuse the ordinary no-replay league and event journals. Source flags
      // come from the durable registration, never a browser or trigger payload.
      beautyHubAutoLock_={player:name};
      try{result=beautyHubAutoSendRun_({success:true,player:name,existingPlayer:r.existingPlayer},date);}
      finally{beautyHubAutoLock_=null;}
    }
  }catch(e){result={success:false,code:/^(REGISTRATION|BACKGROUND)_[A-Z_]+$/.test(e.message)?e.message:'RECOVERY_REPLY_UNKNOWN'};}
  beautyBackgroundRequire_(name);
  const verified=result?.entryConfirmed===true,code=verified?'ENTRY_CONFIRMED':result?.code||'RECOVERY_UNAVAILABLE';
  if(typeof beautyResilienceWorkerResult_==='function')beautyResilienceWorkerResult_({operation:'registration',player:name,verified,code,attempts});
  record.worker.finishedAt=new Date().toISOString();record.worker.nextAt=Date.now()+(verified?300000:Math.min(300000,60000*2**(attempts-1)));
  beautyPlayerRecoverySave_(record,code,verified?'VERIFIED':'NEEDS_HELP','background');
  beautyHubAttentionRemember_(name,date,verified?{entryConfirmed:true}:{code});
  return {operation:'registration',player:name,verified,code,attempts};
}
function beautyBackgroundRemovalRun_(item) {
  const authorize=()=>beautyBackgroundRequire_(item.name);
  const io=beautyRemovalRecoveryIO_(item.journal,authorize,true);
  try{const r=beautyRemovalRecoveryExecute_(io);return {operation:'removal',player:item.name,verified:r.readbackVerified===true,code:'REMOVAL_VERIFIED',journal:item.journal,nakkaWrites:0};}
  catch(e){const code=/^REMOVE_[A-Z_]+$/.test(e.message)?e.message:'REMOVE_PROVIDER_UNAVAILABLE';try{io.fail(code);}catch(ignore){}return {operation:'removal',player:item.name,verified:false,code,journal:item.journal,nakkaWrites:0};}
}
// Private: cannot be invoked through google.script.run. No editor-run wrapper.
function beautyBackgroundClock_(event) {
  const clockStarted=Date.now();
  const c=beautyBackgroundConfig_(),p=PropertiesService.getScriptProperties(),need=beautyBackgroundNeed_;
  // Unrecognised calls exit before any write or provider access.
  need(ScriptApp.getScriptId()===c.scriptId&&Session.getEffectiveUser().getEmail().toLowerCase()===c.owner,'BACKGROUND_OWNER_REQUIRED');
  const config=beautyBackgroundReadConfig_();
  need(config?.state==='ENABLED'&&typeof event?.triggerUid==='string'&&event.triggerUid===config.triggerUid,'BACKGROUND_TRIGGER_REQUIRED');
  const triggers=beautyBackgroundTriggers_();need(triggers.length===1&&triggers[0].getUniqueId()===event.triggerUid&&triggers[0].getEventType()===ScriptApp.EventType.CLOCK,'BACKGROUND_TRIGGER_REQUIRED');
  const lockStarted=Date.now(),lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  const lockAcquired=Date.now();let run,operationStarted;
  try {
    need(beautyBackgroundEqual_(beautyBackgroundReadConfig_(),config),'BACKGROUND_AUTHORITY_CHANGED');
    const context=beautyBackgroundScope_();need(beautyBackgroundEqual_(context,config.context),'BACKGROUND_CONTEXT_CHANGED');
    const previous=JSON.parse(p.getProperty(c.runKey)||'null');
    if(previous?.state==='RUNNING'&&Date.now()<previous.leaseUntil)return;
    const selectionStarted=Date.now(),items=beautyBackgroundCandidates_(selectionStarted),selectedAt=Date.now(),item=items[0];
    if(!item){if(!previous||Date.now()-Date.parse(previous.finishedAt||previous.startedAt)>=300000)beautyBackgroundSave_(c.runKey,{state:'IDLE',triggerUid:event.triggerUid,finishedAt:new Date().toISOString()});return;}
    run={state:'RUNNING',owner:Utilities.getUuid(),triggerUid:event.triggerUid,context,
      startedAt:new Date().toISOString(),leaseUntil:Date.now()+c.leaseMs,operation:item.operation,player:item.name,
      timing:{clockStartedAt:new Date(clockStarted).toISOString(),authorityMs:lockStarted-clockStarted,lockWaitMs:lockAcquired-lockStarted,
        lockedSetupMs:selectionStarted-lockAcquired,selectionMs:selectedAt-selectionStarted}};
    beautyBackgroundSave_(c.runKey,run);
    beautyBackgroundInvocation_={owner:run.owner,triggerUid:event.triggerUid,context,player:item.name,operation:item.operation,
      expires:run.leaseUntil,lock,configRaw:p.getProperty(c.key)};
    operationStarted=Date.now();run.timing.claimSetupMs=operationStarted-selectedAt;
    const result=item.operation==='registration-review'?beautyBackgroundExhaustedRun_(item):item.operation==='removal'?beautyBackgroundRemovalRun_(item):beautyBackgroundRegistrationRun_(item.name);
    run.timing.operationMs=Date.now()-operationStarted;
    need(beautyBackgroundEqual_(beautyBackgroundScope_(),context)&&p.getProperty(c.key)===beautyBackgroundInvocation_.configRaw,'BACKGROUND_CONTEXT_CHANGED');
    run.state='FINISHED';run.finishedAt=new Date().toISOString();run.result=result;run.timing.beforeResultSaveMs=Date.now()-clockStarted;beautyBackgroundSave_(c.runKey,run);
    console.log(JSON.stringify({type:'BEAUTY_BACKGROUND_RESULT',...run}));
  }catch(e){
    const code=/^(BACKGROUND|REGISTRATION|REMOVE)_[A-Z_]+$/.test(e.message)?e.message:'BACKGROUND_CHECK_UNAVAILABLE';
    if(run){run.state='NEEDS_HELP';run.code=code;run.finishedAt=new Date().toISOString();if(operationStarted!==undefined)run.timing.operationMs=Date.now()-operationStarted;run.timing.beforeResultSaveMs=Date.now()-clockStarted;beautyBackgroundSave_(c.runKey,run);}
    else beautyBackgroundSave_(c.runKey,{state:'PAUSED_CHECK',code,triggerUid:event.triggerUid,finishedAt:new Date().toISOString()});
  }finally{beautyBackgroundInvocation_=null;beautyHubAutoLock_=null;try{SpreadsheetApp.flush();}finally{lock.releaseLock();}}
}
