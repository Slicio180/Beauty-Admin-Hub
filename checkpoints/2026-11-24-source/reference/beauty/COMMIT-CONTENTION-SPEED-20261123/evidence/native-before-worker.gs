/* Ordinary registration/removal recovery in the isolated owner TEST project.
 * One owner clock trigger; existing receipts/journals remain the operation store.
 * Verified registrations with a definitive transfer journal use a read-only
 * recheck: provider GETs run outside ScriptLock, then a fresh guarded commit.
 * Repairs, uncertain transfers and removals retain their original locked path.
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
  return beautyBackgroundReceiptValidate_(r,name,beautyBackgroundScope_());
}
// Selection can validate its one property snapshot without re-reading every
// receipt or resolving the same registration key a second time. Operation
// admission still calls beautyBackgroundReceipt_ and all existing live guards.
function beautyBackgroundReceiptValidate_(r,name,x) {
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
  const prefix=beautyRegistrationRecoveryPrefix_(),snapshot=p.getProperties(),keys=Object.keys(snapshot).filter(k=>k.startsWith(prefix));
  beautyBackgroundNeed_(keys.length<=100,'BACKGROUND_HISTORY_REVIEW');
  for(const key of keys) {
    let raw;try{raw=JSON.parse(snapshot[key]);}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}
    beautyBackgroundNeed_(typeof raw?.name==='string'&&key===beautyRegistrationRecoveryKey_(raw.name,prefix),'REGISTRATION_RECEIPT_UNREADABLE');
    const r=beautyBackgroundReceiptValidate_(raw,raw.name,context),age=now-Date.parse(r.recordedAt);
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
  work.sort((a,b)=>a.at-b.at||a.name.localeCompare(b.name));
  // Snapshot evidence never grants mutation authority. Reject a changed context
  // or selected receipt before the clock creates its durable operation claim.
  beautyBackgroundNeed_(beautyBackgroundEqual_(beautyBackgroundScope_(),context),'BACKGROUND_CONTEXT_CHANGED');
  const selected=work[0];
  if(selected&&selected.operation!=='removal'){
    const key=beautyRegistrationRecoveryKey_(selected.name);
    beautyBackgroundNeed_(p.getProperty(key)===snapshot[key],'BACKGROUND_SELECTION_CHANGED');
  }
  return work;
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
// Read-only fast path, admitted only for a previously VERIFIED registration
// with one definitive transfer journal. All other jobs keep the original path.
function beautyBackgroundVerifiedPrepare_(name,context,lock) {
  beautyBackgroundNeed_(lock?.hasLock(),'BACKGROUND_CLAIM_REQUIRED');
  const record=beautyPlayerRecoveryLoad_(name,context.date);
  if(record?.state!=='VERIFIED')return null;
  const receipt=beautyBackgroundReceipt_(name);
  if(receipt.state!=='COMPLETE')return null;
  const p=PropertiesService.getScriptProperties(),all=p.getProperties(),normalize=BeautyNameResolution.key;
  const prefix='BEAUTY_NAKKA_TRANSFER_'+context.eventId+'_',matches=[];
  for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))) {
    let value;try{value=JSON.parse(all[key]);}catch(e){return null;}
    if(typeof value?.identity?.name!=='string')return null;
    if(normalize(value.identity.name)===normalize(name))matches.push({key,value});
  }
  if(matches.length!==1)return null;
  const {key:journalKey,value:journal}=matches[0],lpid=journal.identity?.lpid;
  if(!['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(journal.state)||
    journal.event?.id!==context.eventId||journal.event?.date!==context.date||
    !/^[A-Za-z0-9]{4}$/.test(lpid||'')||!/^[A-Za-z0-9]{4}$/.test(journal.tpid||'')||journalKey!==prefix+lpid)return null;
  const creationKey='BEAUTY_NAKKA_LEAGUE_CREATE_'+context.leagueId+'_'+beautyHubTransferHash_(normalize(name));
  if(all[creationKey]){let creation;try{creation=JSON.parse(all[creationKey]);}catch(e){return null;}
    if(creation?.state!=='VERIFIED'||creation.name!==name||creation.lpid!==lpid)return null;}
  const reviewKey='BEAUTY_NAKKA_REVIEW_'+context.eventId+'_'+lpid;
  // Staff-reconciled entries and uncertain journals keep their full original
  // review rules. This path never attributes or rewrites an earlier transfer.
  if(all[reviewKey])return null;
  const receiptKey=beautyRegistrationRecoveryKey_(name),recoveryKey=beautyPlayerRecoveryKey_(name,context.date);
  if(all[receiptKey]!==JSON.stringify(receipt)||all[recoveryKey]!==JSON.stringify(record))return null;
  const attentionKey=beautyHubAttentionKey_(context.date,name);
  if(all[attentionKey]){let attention;try{attention=JSON.parse(all[attentionKey]);}catch(e){return null;}
    if(attention.state!=='CLEAR'||attention.code!=='ENTRY_CONFIRMED')return null;}
  return {name,context,receipt,record,journal,transferPrefix:prefix,transferSetHash:beautyBackgroundVerifiedTransfers_(all,prefix),keys:{receiptKey,recoveryKey,journalKey,creationKey,reviewKey,attentionKey},
    raw:Object.fromEntries([receiptKey,recoveryKey,journalKey,creationKey,reviewKey,attentionKey].map(k=>[k,all[k]??null]))};
}
function beautyBackgroundVerifiedTransfers_(all,prefix) {
  return beautyHubTransferHash_(Object.entries(all).filter(([key])=>key.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b)));
}
function beautyBackgroundVerifiedGuard_(s) {
  const i=beautyBackgroundInvocation_,need=beautyBackgroundNeed_,c=beautyBackgroundConfig_();
  need(i?.operation==='registration-recheck'&&i.player===s.name,'BACKGROUND_CLAIM_REQUIRED');
  // Read-only authority has the same actual-lock, owner, lease and live context
  // requirements as the ordinary guard. Batch its saved records once per guard;
  // never reuse this snapshot across a Sheet read or the unlocked provider phase.
  need(i.lock?.hasLock()&&Date.now()<i.expires,'BACKGROUND_CLAIM_REQUIRED');
  need(Session.getEffectiveUser().getEmail().toLowerCase()===c.owner,'BACKGROUND_OWNER_REQUIRED');
  need(beautyBackgroundEqual_(beautyBackgroundScope_(),i.context),'BACKGROUND_CONTEXT_CHANGED');
  need(beautyBackgroundEqual_(i.context,s.context),'BACKGROUND_CONTEXT_CHANGED');
  const all=PropertiesService.getScriptProperties().getProperties();
  need(all[c.key]===i.configRaw,'BACKGROUND_AUTHORITY_CHANGED');
  const runRaw=all[c.runKey]??null,run=JSON.parse(runRaw||'null');
  need(run?.state==='RUNNING'&&run.owner===i.owner&&run.triggerUid===i.triggerUid&&
    typeof i.recheckRunRaw==='string'&&runRaw===i.recheckRunRaw,'BACKGROUND_CLAIM_LOST');
  need(beautyBackgroundVerifiedTransfers_(all,s.transferPrefix)===s.transferSetHash,'BACKGROUND_RECHECK_CHANGED');
  for(const key of Object.keys(s.raw))need((all[key]??null)===s.raw[key],'BACKGROUND_RECHECK_CHANGED');
  need(!beautyRemovalRecoveryList_().some(x=>x.receipt.player===s.name&&
    (x.receipt.state==='ATTEMPTED'||Date.parse(x.receipt.recordedUTC)>=Date.parse(s.receipt.recordedAt))),'BACKGROUND_REMOVAL_PENDING');
}
function beautyBackgroundVerifiedLocal_(s,timing,phase) {
  const steps=timing?(timing[phase+'SheetSteps']={}):{};
  const measure=(label,fn)=>{const started=Date.now();try{return fn();}finally{steps[label]=(steps[label]||0)+Date.now()-started;}};
  const ss=beautyRegistrationRecoverySource_(s.receipt,measure);
  beautyRegistrationProjectionVerified_(s.receipt,ss,measure);
}
function beautyBackgroundVerifiedRead_(s) {
  const i=beautyBackgroundInvocation_,need=beautyBackgroundNeed_;
  need(i?.operation==='registration-recheck'&&i.player===s.name&&!i.lock.hasLock()&&Date.now()<i.expires,'BACKGROUND_READ_CLAIM_REQUIRED');
  need(beautyBackgroundEqual_(beautyBackgroundScope_(),s.context),'BACKGROUND_CONTEXT_CHANGED');
  // These three fixed GETs never call any transfer/save/fixture adapter. Existing
  // mutation authorization remains unavailable throughout this unlocked phase.
  const paths=['tournament/get?tdid='+s.context.eventId+'&entry=0',
    'tournament/entry/list?tdid='+s.context.eventId,'league/entry/list?lgid='+s.context.leagueId+'&count=1000'];
  paths.forEach(beautyTestNakkaReadGuard_);
  const auth=beautyPoolAuth_();
  const responses=UrlFetchApp.fetchAll(paths.map(path=>({url:'https://push.n01darts.com/api/v1/'+path,
    method:'get',headers:{Authorization:auth},muteHttpExceptions:true,followRedirects:false})));
  need(Array.isArray(responses)&&responses.length===3,'BACKGROUND_RECHECK_UNAVAILABLE');
  return responses.map(beautyHubTransferDecode_);
}
function beautyBackgroundVerifiedDecision_(s,data) {
  const need=beautyBackgroundNeed_,x=s.context,key=BeautyNameResolution.key;
  const [eventData,entryData,leagueData]=data,e=eventData?.tournament;
  need(e?.tdid===x.eventId&&e.lgid===x.leagueId&&e.title===x.title&&[10,20,25,30,40].includes(e.status)&&
    Number.isFinite(e.t_date)&&Number.isFinite(e.updateTime)&&
    Utilities.formatDate(new Date(e.t_date*1000),'Europe/Berlin','yyyy-MM-dd')===x.date,'BACKGROUND_RECHECK_EVENT_CHANGED');
  const entries=beautyHubTransferEntries_(entryData),league=leagueData?.list,ids=new Set();
  need(Array.isArray(league)&&league.length<1000,'BACKGROUND_RECHECK_UNAVAILABLE');
  for(const r of league){need(r&&typeof r.name==='string'&&r.name.trim()&&r.name.length<=120&&!/[\x00-\x1f\x7f]/.test(r.name)&&
    typeof r.lpid==='string'&&/^[A-Za-z0-9]{4}$/.test(r.lpid)&&!ids.has(r.lpid),'BACKGROUND_RECHECK_UNAVAILABLE');ids.add(r.lpid);}
  const identities=league.filter(r=>key(r.name)===key(s.name));
  if(identities.length!==1||identities[0].name!==s.journal.identity.name||identities[0].lpid!==s.journal.identity.lpid)
    return {verified:false,code:'LEAGUE_IDENTITY_REVIEW'};
  const identity=identities[0],found=entries.filter(r=>key(r.name)===key(s.name)||r.lpid===identity.lpid);
  if(found.length>1||found.some(r=>key(r.name)!==key(s.name)||(r.lpid&&r.lpid!==identity.lpid)))return {verified:false,code:'IDENTITY_CONFLICT'};
  if(found.length!==1||found[0].tpid!==s.journal.tpid)return {verified:false,code:'TRANSFER_REVIEW_REQUIRED'};
  return {verified:true,code:'ENTRY_CONFIRMED',identityVerified:found[0].lpid===identity.lpid};
}
function beautyBackgroundVerifiedRun_(s,run,clockStarted,operationStarted) {
  const i=beautyBackgroundInvocation_,p=PropertiesService.getScriptProperties(),c=beautyBackgroundConfig_();
  const timing=run.timing;let releasedAt=null,reacquiredAt=null,decision,readFailure=null;
  const codeOf=e=>/^(BACKGROUND|REGISTRATION)_[A-Z_]+$/.test(e.message)?e.message:'BACKGROUND_RECHECK_UNAVAILABLE';
  const owned=()=>{
    if(!i.lock.hasLock()||Date.now()>=i.expires||p.getProperty(c.key)!==i.configRaw||
      Session.getEffectiveUser().getEmail().toLowerCase()!==c.owner)return false;
    const raw=p.getProperty(c.runKey);if(raw!==i.recheckRunRaw)return false;
    const latest=JSON.parse(raw||'null');
    return latest?.state==='RUNNING'&&latest.owner===i.owner&&latest.triggerUid===i.triggerUid&&
      beautyBackgroundEqual_(beautyBackgroundScope_(),i.context);
  };
  const finish=result=>{
    timing.operationMs=Date.now()-operationStarted;
    timing.providerUnlockedMs=releasedAt===null?0:(reacquiredAt??Date.now())-releasedAt;
    timing.beforeResultSaveMs=Date.now()-clockStarted;
    run.state='FINISHED';run.finishedAt=new Date().toISOString();run.result={operation:'registration-recheck',player:s.name,nakkaWrites:0,...result};
    const saveStarted=Date.now();
    if(owned())beautyBackgroundSave_(c.runKey,run);
    else run.result={...run.result,committed:false};
    timing.resultSaveMs=Date.now()-saveStarted; // terminal log only; no extra write
    console.log(JSON.stringify({type:'BEAUTY_BACKGROUND_RESULT',...run}));
  };
  const measure=(field,fn)=>{const start=Date.now();try{return fn();}finally{timing[field]=(timing[field]||0)+Date.now()-start;}};
  const localCheck=phase=>{
    measure(phase+'GuardMs',()=>beautyBackgroundVerifiedGuard_(s));
    measure(phase+'SheetsMs',()=>beautyBackgroundVerifiedLocal_(s,timing,phase));
    measure(phase+'GuardMs',()=>beautyBackgroundVerifiedGuard_(s));
  };
  try {
    localCheck('prepare');
    // The durable run is the read-only claim. The previous VERIFIED player
    // record is retained until a fresh commit; a terminated read cannot strand
    // the player in CHECKING or consume a repair attempt.
    SpreadsheetApp.flush();releasedAt=Date.now();timing.lockedBeforeReadMs=releasedAt-operationStarted;
    i.lock.releaseLock();
    const readStarted=Date.now();
    try{decision=beautyBackgroundVerifiedDecision_(s,beautyBackgroundVerifiedRead_(s));}
    catch(e){readFailure=codeOf(e);}
    timing.providerReadMs=Date.now()-readStarted;
    const reacquireStarted=Date.now();
    if(!i.lock.tryLock(1000)){
      timing.commitLockWaitMs=Date.now()-reacquireStarted;
      finish({verified:false,code:'BACKGROUND_RECHECK_COMMIT_BUSY',committed:false,lastVerifiedRetained:true});return;
    }
    reacquiredAt=Date.now();timing.commitLockWaitMs=reacquiredAt-reacquireStarted;
    localCheck('commit');
    const playerSaveStarted=Date.now();
    const record=s.record;
    record.worker={...(record.worker||{}),nextAt:Date.now()+300000,
      lastRecheck:{at:new Date().toISOString(),code:readFailure||decision.code,owner:i.owner}};
    if(readFailure){
      // Keep the last successful timestamp/history and attention bytes. A failed
      // GET supplies no new verification. Delay another ordinary recheck five minutes.
      beautyBackgroundSave_(s.keys.recoveryKey,record);
      timing.playerSaveMs=Date.now()-playerSaveStarted;
      timing.lockedCommitMs=Date.now()-reacquiredAt;
      finish({verified:false,code:readFailure,committed:true,lastVerifiedRetained:true});return;
    }
    if(!beautyHubAttentionRemember_(s.name,s.context.date,decision.verified?{entryConfirmed:true}:{code:decision.code}))throw Error('BACKGROUND_RECHECK_ATTENTION_UNCERTAIN');
    beautyPlayerRecoverySave_(record,decision.code,decision.verified?'VERIFIED':'NEEDS_HELP','background-recheck');
    timing.playerSaveMs=Date.now()-playerSaveStarted;
    timing.lockedCommitMs=Date.now()-reacquiredAt;
    finish({...decision,committed:true,attempts:0});
  }catch(e){
    // A superseded/expired claim, changed receipt/journal or local player edit
    // never overwrites that newer player state. The next ordinary tick owns retry.
    try{finish({verified:false,code:codeOf(e),committed:false,lastVerifiedRetained:true});}
    catch(ignore){console.log(JSON.stringify({type:'BEAUTY_BACKGROUND_RECHECK_DEFERRED',owner:i.owner,code:'BACKGROUND_RECHECK_SAVE_UNCERTAIN'}));}
  }
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
    const recheck=item.operation==='registration'?beautyBackgroundVerifiedPrepare_(item.name,context,lock):null;
    run={state:'RUNNING',owner:Utilities.getUuid(),triggerUid:event.triggerUid,context,
      startedAt:new Date().toISOString(),leaseUntil:Date.now()+c.leaseMs,operation:recheck?'registration-recheck':item.operation,player:item.name,
      timing:{clockStartedAt:new Date(clockStarted).toISOString(),authorityMs:lockStarted-clockStarted,lockWaitMs:lockAcquired-lockStarted,
        lockedSetupMs:selectionStarted-lockAcquired,selectionMs:selectedAt-selectionStarted,selectionMode:'batched-keys-v2',workerMode:'verified-recheck-sheets-v3'}};
    const claimedRunRaw=beautyBackgroundSave_(c.runKey,run);
    beautyBackgroundInvocation_={owner:run.owner,triggerUid:event.triggerUid,context,player:item.name,operation:run.operation,
      expires:run.leaseUntil,lock,configRaw:p.getProperty(c.key)};
    operationStarted=Date.now();run.timing.claimSetupMs=operationStarted-selectedAt;
    if(recheck){beautyBackgroundInvocation_.recheckRunRaw=claimedRunRaw;beautyBackgroundVerifiedRun_(recheck,run,clockStarted,operationStarted);return;}
    const result=item.operation==='registration-review'?beautyBackgroundExhaustedRun_(item):item.operation==='removal'?beautyBackgroundRemovalRun_(item):beautyBackgroundRegistrationRun_(item.name);
    run.timing.operationMs=Date.now()-operationStarted;
    need(beautyBackgroundEqual_(beautyBackgroundScope_(),context)&&p.getProperty(c.key)===beautyBackgroundInvocation_.configRaw,'BACKGROUND_CONTEXT_CHANGED');
    run.state='FINISHED';run.finishedAt=new Date().toISOString();run.result=result;run.timing.beforeResultSaveMs=Date.now()-clockStarted;beautyBackgroundSave_(c.runKey,run);
    console.log(JSON.stringify({type:'BEAUTY_BACKGROUND_RESULT',...run}));
  }catch(e){
    const code=/^(BACKGROUND|REGISTRATION|REMOVE)_[A-Z_]+$/.test(e.message)?e.message:'BACKGROUND_CHECK_UNAVAILABLE';
    if(run){run.state='NEEDS_HELP';run.code=code;run.finishedAt=new Date().toISOString();if(operationStarted!==undefined)run.timing.operationMs=Date.now()-operationStarted;run.timing.beforeResultSaveMs=Date.now()-clockStarted;beautyBackgroundSave_(c.runKey,run);}
    else beautyBackgroundSave_(c.runKey,{state:'PAUSED_CHECK',code,triggerUid:event.triggerUid,finishedAt:new Date().toISOString()});
  }finally{beautyBackgroundInvocation_=null;beautyHubAutoLock_=null;if(lock.hasLock()){try{SpreadsheetApp.flush();}finally{lock.releaseLock();}}}
}
