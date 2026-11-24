/* One owner-bound clock for the existing LIVE queue and selected event.
 * Installation is explicit; deploying source alone does not create a trigger.
 * No browser session or credential is copied into the worker configuration.
 */
const BEAUTY_BACKGROUND_CONFIG_='BEAUTY_COMBINED_BACKGROUND_V1';
const BEAUTY_BACKGROUND_RUN_='BEAUTY_COMBINED_BACKGROUND_RUN_V1';
var beautyCombinedWorker_=null;
function beautyBackgroundOwner_(){
 beautyLiveLoginGuard_();
 if(Session.getEffectiveUser().getEmail()!=='alessiotampella@gmail.com'||Session.getActiveUser().getEmail()!=='alessiotampella@gmail.com')throw Error('BACKGROUND_OWNER_REQUIRED');
}
function beautyBackgroundScope_(){const c=beautyLiveTarget_();return {version:1,mode:c.mode,sheetId:c.sheetId,eventId:c.eventId,leagueId:c.leagueId,date:c.date,title:c.title,revision:c.revision};}
function beautyBackgroundSave_(key,value){
 const p=PropertiesService.getScriptProperties(),raw=JSON.stringify(value);
 if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('BACKGROUND_RECORD_CAPACITY');
 p.setProperty(key,raw);if(p.getProperty(key)!==raw)throw Error('BACKGROUND_SAVE_UNCERTAIN');
}
function beautyInstallCombinedBackground(){
 beautyBackgroundOwner_();const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BACKGROUND_BUSY');
 try{const p=PropertiesService.getScriptProperties(),existing=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_CONFIG_)||'null');
 const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='beautyCombinedBackgroundClock');
 if(existing){
  if(existing.projectId!==ScriptApp.getScriptId()||existing.owner!=='alessiotampella@gmail.com'||triggers.length!==1||!['INSTALLING','PAUSED','ENABLED'].includes(existing.state)||existing.state!=='INSTALLING'&&String(triggers[0].getUniqueId())!==existing.triggerUid)throw Error('BACKGROUND_INSTALL_REVIEW');
  const config={...existing,state:'ENABLED',triggerUid:String(triggers[0].getUniqueId())};
  if(JSON.stringify(config)!==JSON.stringify(existing))beautyBackgroundSave_(BEAUTY_BACKGROUND_CONFIG_,config);
  return {state:'ENABLED',triggerCount:1,created:false};
 }
 if(triggers.length)throw Error('BACKGROUND_INSTALL_REVIEW');
 // Intent survives an uncertain trigger-creation reply. Never create twice.
 beautyBackgroundSave_(BEAUTY_BACKGROUND_CONFIG_,{version:1,state:'INSTALLING',projectId:ScriptApp.getScriptId(),owner:'alessiotampella@gmail.com'});
 const trigger=ScriptApp.newTrigger('beautyCombinedBackgroundClock').timeBased().everyMinutes(1).create();
 const config={version:1,state:'ENABLED',projectId:ScriptApp.getScriptId(),owner:'alessiotampella@gmail.com',triggerUid:String(trigger.getUniqueId())};
 beautyBackgroundSave_(BEAUTY_BACKGROUND_CONFIG_,config);return {state:'ENABLED',triggerCount:1,created:true};
 }finally{lock.releaseLock();}
}
function beautyPauseCombinedBackground(){
 beautyBackgroundOwner_();const p=PropertiesService.getScriptProperties(),c=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_CONFIG_)||'null');
 if(!c||c.projectId!==ScriptApp.getScriptId())throw Error('BACKGROUND_CONFIG_REVIEW');
 beautyBackgroundSave_(BEAUTY_BACKGROUND_CONFIG_,{...c,state:'PAUSED'});return {state:'PAUSED'};
}
function beautyCombinedBackgroundRequire_(){
 beautyLiveLoginGuard_();const p=PropertiesService.getScriptProperties(),c=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_CONFIG_)||'null');
 if(!beautyCombinedWorker_||c?.state!=='ENABLED'||c.projectId!==ScriptApp.getScriptId()||c.owner!==Session.getEffectiveUser().getEmail()||c.triggerUid!==beautyCombinedWorker_.triggerUid||
    p.getProperty(BEAUTY_BACKGROUND_RUN_)!==beautyCombinedWorker_.raw||Date.now()>=beautyCombinedWorker_.until||beautyContextToken_()!==beautyCombinedWorker_.context.revision)throw Error('BACKGROUND_AUTHORITY_CHANGED');
}
function beautyCombinedRetryDecision_(job,now){
 if(!job||job.state!=='REVIEW'||!job.input)return false;
 const r=job.background||{};
 if((r.attempts||0)>=3||Number.isFinite(r.nextAt)&&now<r.nextAt)return false;
 // No step with uncertain intent is replayed. The existing queue engine reads
 // the original effects before considering any missing step.
 return true;
}
function beautyCombinedBackgroundClock(e){
 const p=PropertiesService.getScriptProperties();let lock,run;
 try{
  beautyLiveLoginGuard_();const config=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_CONFIG_)||'null');
  if(config?.state!=='ENABLED'||config.projectId!==ScriptApp.getScriptId()||config.owner!==Session.getEffectiveUser().getEmail()||!e||String(e.triggerUid)!==config.triggerUid)return;
  lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  const old=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_RUN_)||'null');
  if(old?.state==='RUNNING'&&Date.now()<old.until)return;
  const context=beautyBackgroundScope_();run={version:1,state:'RUNNING',id:Utilities.getUuid(),context,triggerUid:config.triggerUid,startedAt:new Date().toISOString(),until:Date.now()+600000};
  beautyBackgroundSave_(BEAUTY_BACKGROUND_RUN_,run);beautyCombinedWorker_={...run,raw:JSON.stringify(run)};
  lock.releaseLock();lock=null;
  beautyCombinedBackgroundRequire_();
  const queueLease=JSON.parse(p.getProperty(BEAUTY_QUEUE_LEASE_)||'null');
  if(queueLease){
   if(Date.now()>=queueLease.until){
    // The original queue converts the interrupted receipt to REVIEW before
    // releasing its expired lease. It never replays the uncertain step.
    const recovered=beautyQueueProcess_(null,false);
    run.result={kind:'interrupted-registration',state:recovered?.state||'RECHECK_SCHEDULED'};
   }else run.result={kind:'registration',state:'BUSY'};
   return;
  }
  // The existing queue owns its normal short claim/lease and no-replay rules.
  const all=beautyQueueRead_(),eligible=all.filter(j=>j.event.revision===context.revision);
  let job=eligible.find(j=>j.state==='QUEUED');
  if(!job)job=eligible.find(j=>beautyCombinedRetryDecision_(j,Date.now()));
  if(job){
   if(job.state==='REVIEW'){
    lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;beautyCombinedBackgroundRequire_();
    const current=JSON.parse(p.getProperty(BEAUTY_QUEUE_PREFIX_+job.id)||'null');
    if(!current||beautyQueueHash_(current)!==beautyQueueHash_(job)||!beautyCombinedRetryDecision_(current,Date.now()))return;
    current.background={attempts:(current.background?.attempts||0)+1,nextAt:Date.now()+120000};beautyQueueSave_(current);job=current;
    lock.releaseLock();lock=null;
   }
   // Drain a bounded burst with the original per-job claim, never a global
   // network lock. Stop before another job when time, authority or work changes.
   const drainStarted=Date.now();let processed=0,result;
   do{
    beautyCombinedBackgroundRequire_();
    result=beautyQueueProcess_(job.id,job.state==='REVIEW');
    if(result)processed++;
    if(!result||result.state!=='COMPLETE'||processed>=3||Date.now()-drainStarted>=120000)break;
    beautyCombinedBackgroundRequire_();
    job=beautyQueueRead_().find(j=>j.state==='QUEUED'&&j.event.revision===context.revision);
   }while(job);
   run.result={kind:'registration',state:result?.state||'DEFERRED',processed};
  }else if(eligible.some(j=>j.state==='REVIEW'&&(j.background?.attempts||0)<3)){
   // Preserve the retry window; a discovery read must not delay the next retry.
   run.result={kind:'registration-backoff'};
  }else{
   lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;beautyCombinedBackgroundRequire_();
   if(p.getProperty(BEAUTY_QUEUE_LEASE_))return;
   const pending=JSON.parse(p.getProperty('BEAUTY_LIVE_REMOVE_PENDING')||'null');
   if(pending?.recoveryVersion===1&&pending.context?.revision===context.revision&&pending.recovery?.state!=='NEEDS_HELP'&&(pending.recovery?.attempts||0)<3&&(!pending.recovery?.nextAt||Date.now()>=pending.recovery.nextAt)){
    const result=beautyLiveRemovalReconcile_('BEAUTY_LIVE_REMOVE_PENDING',p.getProperty('BEAUTY_LIVE_REMOVE_PENDING'),{uid:'owner-clock'},true);run.result={kind:'removal',state:result?.outcome||'REVIEW'};
   }else if(context.mode==='league'&&beautyNakkaImportDue_(Date.now())){
    // Read-only provider discovery may be slow. The adapter takes its own
    // lock only when a candidate needs a fresh guarded commit.
    lock.releaseLock();lock=null;
    run.result={kind:'import',...beautyLiveInboundScan_()};
   }else run.result={kind:'idle'};
  }
  beautyCombinedBackgroundRequire_();run.state='FINISHED';run.finishedAt=new Date().toISOString();beautyBackgroundSave_(BEAUTY_BACKGROUND_RUN_,run);
 }catch(error){
  if(run&&beautyCombinedWorker_&&p.getProperty(BEAUTY_BACKGROUND_RUN_)===beautyCombinedWorker_.raw){
   run.state='REVIEW';run.finishedAt=new Date().toISOString();run.result={code:/^[A-Z][A-Z0-9_]{2,70}$/.test(error.message||'')?error.message:'BACKGROUND_CHECK_UNAVAILABLE'};
   try{beautyBackgroundSave_(BEAUTY_BACKGROUND_RUN_,run);}catch(ignored){}
  }
 }finally{
  if(run&&beautyCombinedWorker_&&p.getProperty(BEAUTY_BACKGROUND_RUN_)===beautyCombinedWorker_.raw){
   run.state='FINISHED';run.finishedAt=new Date().toISOString();run.result=run.result||{kind:'deferred'};
   try{beautyBackgroundSave_(BEAUTY_BACKGROUND_RUN_,run);}catch(ignored){}
  }
  if(lock)lock.releaseLock();beautyCombinedWorker_=null;
 }
}
function beautyCombinedBackgroundRead(){
 beautyBackgroundOwner_();const p=PropertiesService.getScriptProperties(),config=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_CONFIG_)||'null'),run=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_RUN_)||'null');
 return {state:config?.state||'NOT_INSTALLED',projectId:ScriptApp.getScriptId(),triggerCount:ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='beautyCombinedBackgroundClock').length,lastRun:run?{state:run.state,startedAt:run.startedAt,finishedAt:run.finishedAt,result:run.result}:null,writesPerformed:false};
}
