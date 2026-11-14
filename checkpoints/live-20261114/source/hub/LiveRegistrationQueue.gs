/* Durable LIVE registration jobs. No trigger, new workbook or public staff route.
 * Hub polling drains queued jobs. A submission also runs its job when idle.
 * Only short acceptance/claim operations hold ScriptLock; external effects use
 * a verified lease. All other mutation paths check that lease under ScriptLock.
 */
var beautyQueueWorker_=null;
const BEAUTY_QUEUE_PREFIX_='BEAUTY_REG_JOB_';
const BEAUTY_QUEUE_LEASE_='BEAUTY_REG_WORKER_V1';
function beautyQueueHash_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function beautyQueueRead_(){
 const all=PropertiesService.getScriptProperties().getProperties(),jobs=[];
 for(const k of Object.keys(all).filter(k=>k.startsWith(BEAUTY_QUEUE_PREFIX_))){const j=JSON.parse(all[k]);if(j.version!==1||k!==BEAUTY_QUEUE_PREFIX_+j.id||!/^[a-f0-9]{32}$/.test(j.id)||!['QUEUED','PROCESSING','REVIEW','COMPLETE'].includes(j.state)||!j.event||typeof j.player!=='string'||!j.steps)throw Error('Registration queue record needs owner review.');jobs.push(j);}
 return jobs.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
}
function beautyQueueSave_(j){
 const p=PropertiesService.getScriptProperties(),k=BEAUTY_QUEUE_PREFIX_+j.id,raw=JSON.stringify(j);
 if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('Registration is too large for the queue. Shorten the message.');
 p.setProperty(k,raw);if(p.getProperty(k)!==raw)throw Error('Queue receipt could not be verified.');
}
function beautyQueueOpen_(){return beautyQueueRead_().filter(j=>j.state!=='COMPLETE');}
function beautyQueueWriteGuard_(player,allJobs=false){
 const p=PropertiesService.getScriptProperties();
 if(p.getProperty(BEAUTY_QUEUE_LEASE_))throw Error('A registration is processing. Try this change again shortly.');
 const jobs=beautyQueueOpen_(),key=beautyLiveRegistrationKey_;
 if(jobs.some(j=>allJobs||player&&key(j.player)===key(player)))throw Error('Review this registration in Needs Attention before changing it.');
}
function beautyQueueAssertWorker_(j){
 beautyContextAssert_();const t=beautyLiveTarget_(),p=PropertiesService.getScriptProperties(),lease=JSON.parse(p.getProperty(BEAUTY_QUEUE_LEASE_)||'null');
 if(!beautyQueueWorker_||!lease||lease.id!==j.id||lease.token!==beautyQueueWorker_.token||Date.now()>=lease.until||['eventId','leagueId','date','sheetId','revision','mode'].some(k=>t[k]!==j.event[k]))throw Error('Queue worker or event changed.');
}
function beautyQueueLegacyBlock_(player){
 const p=PropertiesService.getScriptProperties(),key=beautyLiveRegistrationKey_;
 for(const name of ['BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_STATUS_PENDING','BEAUTY_LIVE_REMOVE_PENDING']){
  const raw=p.getProperty(name);if(!raw)continue;const r=JSON.parse(raw);
  // Legacy receipts have no full replay payload. Preserve them, isolate only
  // when player + date are known; never silently migrate or clear them.
  if(!r.player||!r.eventDate||r.eventDate!==beautyLiveTarget_().date||key(r.player)===key(player))throw Error('This player or an unidentified earlier operation needs owner review.');
 }
 const jobs=p.getProperties();
 for(const name of Object.keys(jobs).filter(n=>n.startsWith('BEAUTY_CONSENT_PENDING_'))){const r=JSON.parse(p.getProperty(jobs[name])||'null');if(!r||key(r.player)===key(player))throw Error('This player has an unfinished consent change.');}
}
function beautyQueueAccept_(input,token){const started=Date.now();try{return beautyQueueAcceptWork_(input,token);}finally{try{console.log(JSON.stringify({kind:'BEAUTY_QUEUE_REQUEST_TIMING',totalMs:Date.now()-started}));}catch(ignored){}}}
function beautyQueueAcceptWork_(input,token){
 beautyLiveLoginGuard_();const actor=beautyLiveRegistrationActor_(token),t=beautyLiveTarget_(),key=beautyLiveRegistrationKey_;
 const fields=['eventDate','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
 if(!input||Array.isArray(input)||Object.keys(input).some(k=>!fields.includes(k))||Object.values(input).some(v=>typeof v!=='string')||input.eventDate!==t.date||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000||/^[=+@-]/.test((input.message||'').trim()))return {success:false,code:'INVALID',error:'Check registration fields.'};
 input={...input};if(input.selectedName==='MITT NAMN FINNS INTE I LISTAN'&&!input.identityChoice)input.newName=String(input.newName||'').toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
 let master,tonight,resolved;
 try{const s=beautyLiveRegistrationSheets_();master=beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(Boolean);tonight=beautyLiveRegistrationRows_(s.tonight,2).map(r=>r[0]||r[1]).filter(Boolean);resolved=BeautyLiveNameResolution_.resolve(input,master,tonight);}catch(e){return {success:false,code:'QUEUE_CHECK_FAILED',error:'Registration lists could not be checked. No request was accepted.'};}
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,code:'BUSY',error:'Queue is busy. No new request was accepted. Try again shortly.'};
 let job;
 try{
  beautyContextAssert_();const jobs=beautyQueueRead_(),fingerprint=beautyQueueHash_([t.revision,actor.source,input]);
  const replay=jobs.find(j=>j.fingerprint===fingerprint&&j.event.revision===t.revision&&j.uid===actor.uid);
  if(replay)return beautyQueueResult_(replay);
  // Identity is revalidated by the claimed worker before the first effect.
  if(!resolved.success)return resolved;
  const old=jobs.find(j=>j.event.eventId===t.eventId&&key(j.player)===key(resolved.player)&&j.state!=='COMPLETE');
  if(old)return {success:false,code:'PLAYER_QUEUED',error:'This player already has a saved registration request. Ask the organiser to check Needs Attention; do not submit again.'};
  beautyQueueLegacyBlock_(resolved.player);
  if(new Set([...tonight.map(key),...jobs.filter(j=>j.event.eventId===t.eventId&&j.state!=='COMPLETE').map(j=>key(j.player))]).size>=99)throw Error('Registration display capacity reached.');
  const p=PropertiesService.getScriptProperties();beautyQueueCapacity_(p.getProperties(),jobs);
  job={version:1,id:Utilities.getUuid().replace(/-/g,''),state:'QUEUED',event:{mode:t.mode,eventId:t.eventId,leagueId:t.leagueId,date:t.date,sheetId:t.sheetId,revision:t.revision},uid:actor.uid,source:actor.source||'HUB',player:resolved.player,isNew:resolved.isNew,input,fingerprint,createdAt:new Date().toISOString(),steps:{}};
  if(Utilities.newBlob(JSON.stringify(job)).getBytes().length>6800)throw Error('Shorten the registration message before submitting.');
  beautyQueueSave_(job);
 }catch(e){return {success:false,code:'QUEUE_CHECK_FAILED',error:e.message};}
 finally{lock.releaseLock();}
 const acceptedAt=Date.now();
 // Single attempt. No timer or trigger is required; other devices can enqueue.
 try{beautyQueueProcess_(null,false);}catch(e){}
 const saved=JSON.parse(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_PREFIX_+job.id)||'null');
 if(!saved)return {success:false,code:'QUEUE_UNCERTAIN',error:'Request outcome is uncertain. Ask the organiser to check before submitting again.'};
 try{console.log(JSON.stringify({kind:'BEAUTY_QUEUE_SUBMIT_TIMING',jobId:job.id,source:job.source,afterAcceptanceMs:Date.now()-acceptedAt,state:saved.state}));}catch(ignored){}
 return beautyQueueResult_(saved);
}
function beautyQueueResult_(j){const identity=j.state==='COMPLETE'&&/^[A-Za-z0-9_-]{1,80}$/.test(String(j.tpid||''))?{id:j.event.mode==='league'&&/^[A-Za-z0-9_-]{1,80}$/.test(String(j.lpid||''))?'league:'+j.event.leagueId+':'+j.lpid:'event:'+j.event.eventId+':'+j.tpid,eventId:j.event.eventId}:null;return {success:true,...(identity?{playerHubIdentity:identity}:{}),registrationEventContext:j.event.revision,accepted:true,queued:j.state!=='COMPLETE',queueId:j.id,queueState:j.state,player:j.player,registrationEventDate:j.event.date,readbackVerified:j.state==='COMPLETE',nakka:{entryConfirmed:j.state==='COMPLETE',needsAttention:j.state==='REVIEW',message:j.state==='COMPLETE'?'Registration and Nakka entry verified.':j.state==='REVIEW'?'Request saved. The organiser must review it; do not submit again.':'Request saved in the registration queue. Do not submit again.'}};}
function beautyQueueProcess_(id,recovery){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return null;
 const p=PropertiesService.getScriptProperties();let j,lease;
 try{
  beautyContextAssert_();const current=JSON.parse(p.getProperty(BEAUTY_QUEUE_LEASE_)||'null');
  if(current){
   if(Date.now()<current.until)return null;
   const stranded=JSON.parse(p.getProperty(BEAUTY_QUEUE_PREFIX_+current.id)||'null');
   if(!stranded)throw Error('Worker receipt needs owner review.');
   if(stranded.state!=='COMPLETE'){stranded.state='REVIEW';stranded.failure='Interrupted worker. Recheck saved effects before continuing.';beautyQueueSave_(stranded);}p.deleteProperty(BEAUTY_QUEUE_LEASE_);if(p.getProperty(BEAUTY_QUEUE_LEASE_)!==null)throw Error('Worker release uncertain.');
  }
  const t=beautyLiveTarget_(),jobs=beautyQueueRead_();j=id?jobs.find(x=>x.id===id):jobs.find(x=>x.state==='QUEUED'&&x.event.revision===t.revision);
  if(!j||j.state==='COMPLETE')return j||null;
  if(j.state!=='QUEUED'&&!(recovery&&j.state==='REVIEW'))return null;
  if(Object.keys(j.event).some(k=>j.event[k]!==t[k]))throw Error('This job belongs to another event context.');
  beautyQueueLegacyBlock_(j.player);
  lease={id:j.id,token:Utilities.getUuid().replace(/-/g,''),until:Date.now()+600000};
  p.setProperty(BEAUTY_QUEUE_LEASE_,JSON.stringify(lease));if(p.getProperty(BEAUTY_QUEUE_LEASE_)!==JSON.stringify(lease))throw Error('Worker claim not verified.');
  j.state='PROCESSING';j.startedAt=new Date().toISOString();j.timing={acceptedToStartMs:Math.max(0,Date.now()-Date.parse(j.createdAt)),phases:{}};j.failure=null;beautyQueueSave_(j);beautyQueueWorker_=lease;
 }finally{lock.releaseLock();}
 if(!j||!beautyQueueWorker_)return null;
 const workerStarted=Date.now();
 try{beautyQueueRun_(j);const complete={...j,state:'COMPLETE',completedAt:new Date().toISOString(),payloadProof:beautyQueueHash_({input:j.input,responseSerial:j.responseSerial,statusBeforeHash:j.statusBeforeHash})};delete complete.input;beautyQueueSave_(complete);j=complete;}
 catch(e){j.state='REVIEW';j.failure='Saved effects need verification at '+(j.stage||'preflight')+'. Recheck this job; do not register again.';try{beautyQueueSave_(j);}catch(ignored){}}
 finally{
  try{console.log(JSON.stringify({kind:'BEAUTY_QUEUE_WORKER_TIMING',jobId:j.id,source:j.source,state:j.state,stage:j.stage,workerMs:Date.now()-workerStarted,acceptedToStartMs:j.timing?.acceptedToStartMs,phases:j.timing?.phases||{}}));}catch(ignored){}
  beautyQueueWorker_=null;
  const end=LockService.getScriptLock();if(end.tryLock(5000)){try{const persisted=JSON.parse(p.getProperty(BEAUTY_QUEUE_PREFIX_+j.id)||'null');if(['COMPLETE','REVIEW'].includes(persisted?.state)&&p.getProperty(BEAUTY_QUEUE_LEASE_)===JSON.stringify(lease)){p.deleteProperty(BEAUTY_QUEUE_LEASE_);if(p.getProperty(BEAUTY_QUEUE_LEASE_)!==null)throw Error('Worker release uncertain.');}}finally{end.releaseLock();}}
 }
 return j;
}
function beautyQueueStep_(j,name,read,write){const started=Date.now();try{return beautyQueueStepEffect_(j,name,read,write);}finally{if(j.timing)j.timing.phases[name]=Date.now()-started;}}
function beautyQueueStepEffect_(j,name,read,write){
 beautyQueueAssertWorker_(j);j.stage=name;
 const prior=j.steps[name];
 if(read()){j.steps[name]='VERIFIED';beautyQueueSave_(j);return;}
 if(prior)throw Error('Previously attempted effect not verified; no replay.');
 j.steps[name]='INTENT';beautyQueueSave_(j);beautyQueueAssertWorker_(j);
 try{write();}catch(e){} // One write only. A lost response is resolved by readback.
 if(!read())throw Error('Effect not verified.');j.steps[name]='VERIFIED';beautyQueueSave_(j);
}
function beautyQueueRun_(j){
 const preflightStarted=Date.now();beautyQueueAssertWorker_(j);const key=beautyLiveRegistrationKey_,s=beautyLiveRegistrationSheets_();beautyLiveRegistrationEvent_();
 const names=()=>beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(n=>key(n)&&n!=='MITT NAMN FINNS INTE I LISTAN');
 const statusRows=()=>beautyLiveRegistrationRows_(s.store,6).map((r,i)=>({r,row:i+2})).filter(v=>key(v.r[0])===key(j.player));
 const existingNames=names().filter(n=>key(n)===key(j.player));if(existingNames.length>1||!j.isNew&&existingNames.length!==1||j.isNew&&!j.steps.master&&existingNames.length)throw Error('Master identity changed before processing.');
 const leagueBefore=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(j.player)),entriesBefore=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(j.player)||leagueBefore.length===1&&r.lpid&&String(r.lpid)===String(leagueBefore[0].lpid));
 if(leagueBefore.length>1||entriesBefore.length>1||leagueBefore.length===1&&!leagueBefore[0].lpid||entriesBefore.length&&(!entriesBefore[0].tpid||key(entriesBefore[0].name)!==key(j.player)||j.event.mode==='league'&&(!leagueBefore.length||entriesBefore[0].lpid&&String(entriesBefore[0].lpid)!==String(leagueBefore[0].lpid))))throw Error('Nakka identity needs review before saving.');
 if(j.responseSerial===undefined){
  const old=statusRows();if(old.length>1||old[0]&&s.store.getRange(old[0].row,1,1,6).getFormulas()[0].some(Boolean))throw Error('Status identity/formula needs review.');
  j.statusBeforeHash=beautyQueueHash_(old[0]?.r||null);j.alias=old[0]?.r[1]||'';j.status=old[0]?.r[2]||'IN';if(!['IN','OUT','STANDBY'].includes(j.status))throw Error('Invalid status.');
  // Never resurrect an intentionally OUT player automatically.
  if(j.status==='OUT')throw Error('OUT player requires organiser review before registration.');
  const wall=Utilities.formatDate(new Date(),'Europe/Berlin',"yyyy-MM-dd'T'HH:mm:ss");
  j.responseSerial=(Date.parse(wall+'Z')-Date.UTC(1899,11,30))/86400000;beautyQueueSave_(j);
 }
 const response=[j.responseSerial,j.isNew?'MITT NAMN FINNS INTE I LISTAN':j.player,j.isNew?j.player:'',j.input.consent,j.input.message||'',j.source];
 const responseMatches=()=>{const data=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Form responses 2'!A2:F")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');if(data.values!==undefined&&!Array.isArray(data.values)||data.values?.length>19999)throw Error('Incomplete response read.');const hits=(data.values||[]).filter(r=>typeof r[0]==='number'&&Math.abs(r[0]-response[0])<0.00000001&&Array.from({length:5},(_,i)=>String(r[i+1]??'')).every((v,i)=>v===response[i+1]));if(hits.length>1)throw Error('Duplicate response evidence.');return hits.length===1;};
 if(j.timing)j.timing.phases.preflight=Date.now()-preflightStarted;
 beautyQueueStep_(j,'response',responseMatches,()=>beautyLiveRegistrationAppend_("'Form responses 2'!A:F",response));
 const masterMatch=()=>{const hits=names().filter(n=>key(n)===key(j.player));if(hits.length>1)throw Error('Ambiguous master name.');return hits.length===1;};
 if(j.isNew){
  beautyQueueStep_(j,'master',masterMatch,()=>beautyLiveRegistrationAppend_("'PLAYER''S MASTER LIST'!A:A",[j.player]));
  const form=beautyLiveRegistrationForm_(),expected=()=>[...names().sort((a,b)=>a.localeCompare(b,'sv-SE')),'MITT NAMN FINNS INTE I LISTAN'];
  // Form choices are a derived projection of the current master, not a replay
  // of an add. Rebuild from current names so another new player is preserved.
  beautyQueueAssertWorker_(j);j.stage='backup-form';j.steps['backup-form']='INTENT';beautyQueueSave_(j);
  const choices=expected();form.question.setChoices(choices.map(n=>form.question.createChoice(n,n==='MITT NAMN FINNS INTE I LISTAN'?form.newSection:form.existingSection)));
  if(JSON.stringify(form.question.getChoices().map(c=>c.getValue()))!==JSON.stringify(expected()))throw Error('Form readback.');j.steps['backup-form']='VERIFIED';beautyQueueSave_(j);
 }else if(!masterMatch())throw Error('Master identity changed.');
 const expected=[j.player,j.alias||'',j.status,j.input.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ',j.input.message||'',j.source];
 beautyQueueStep_(j,'status',()=>{const rows=statusRows();if(rows.length>1)throw Error('Duplicate status.');return rows.length===1&&JSON.stringify(rows[0].r)===JSON.stringify(expected);},()=>{const rows=statusRows();if(beautyQueueHash_(rows[0]?.r||null)!==j.statusBeforeHash||rows.length>1)throw Error('Status changed.');if(rows[0])s.store.getRange(rows[0].row,3,1,4).setValues([expected.slice(2)]);else beautyLiveRegistrationAppend_("'PLAYER STATUS DATA'!A:F",expected);});
 // Rebuild only derived status column from current records. Never replay an add.
 beautyQueueAssertWorker_(j);j.stage='display';beautyQueueSave_(j);const displayStart=Date.now();try{beautyLiveRegistrationSync_(s,j.player);}finally{if(j.timing)j.timing.phases.display=Date.now()-displayStart;}j.steps.display='VERIFIED';beautyQueueSave_(j);
 let member;const leagueRead=()=>{if(j.event.mode==='tournament'){member={lpid:''};return true;}const hits=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(j.player));if(hits.length>1||hits.length===1&&!hits[0].lpid)throw Error('League identity ambiguous.');if(hits.length===1){if(j.lpid&&String(j.lpid)!==String(hits[0].lpid))throw Error('League identity changed.');member=hits[0];j.lpid=member.lpid;return true;}return false;};
 beautyQueueStep_(j,'league',leagueRead,()=>beautyLiveRegistrationApi_('league/entry/update',{lgid:j.event.leagueId,add:[{name:j.player}]}));
 beautyQueueStep_(j,'event',()=>{const hits=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(j.player)||member.lpid&&String(r.lpid)===String(member.lpid));if(hits.length>1)throw Error('Ambiguous event entry.');if(!hits.length)return false;const r=hits[0];if(!r.tpid||key(r.name)!==key(j.player)||r.lpid&&String(r.lpid)!==String(member.lpid)||j.tpid&&String(j.tpid)!==String(r.tpid))throw Error('Event identity changed.');j.tpid=r.tpid;return true;},()=>{beautyLiveRegistrationEvent_();beautyLiveRegistrationApi_('tournament/entry/update',{tdid:j.event.eventId,add:[{name:j.player,...(j.event.mode==='league'?{lpid:member.lpid}:{})}]});});
 beautyQueueAssertWorker_(j);j.stage='readback';beautyQueueSave_(j);const readbackStarted=Date.now();
 const result=beautyLiveDashboardRead_(),found=result.players.filter(r=>key(r.player||r.newPlayer)===key(j.player));
 if(!responseMatches()||!masterMatch()||JSON.stringify(statusRows()[0]?.r)!==JSON.stringify(expected)||found.length!==1||found[0].status!==j.status||found[0].consent!==expected[3]||found[0].message!==String(expected[4]).trim()||found[0].whereFrom!==j.source)throw Error('Final readback failed.');
 if(j.timing)j.timing.phases.readback=Date.now()-readbackStarted;
 j.steps.readback='VERIFIED';
}
function beautyQueueService_(action,input,token){
 try{
  beautyLiveLoginGuard_();beautyHubAuthRequire_(token);beautyContextAssert_();
  if(!input||Array.isArray(input)||input._context!==beautyContextToken_()||Object.keys(input).sort().join(',')!==(action==='recheck'?'_context,id':'_context')||!['list','pump','recheck'].includes(action)||action==='recheck'&&!/^[a-f0-9]{32}$/.test(input.id||''))throw Error('Invalid queue request. Reload the selected event.');
  const processed=action!=='list'?beautyQueueProcess_(action==='recheck'?input.id:null,action==='recheck'):null;
  const t=beautyLiveTarget_();return {success:true,processed:!!processed,context:t.revision,jobs:beautyQueueRead_().filter(j=>j.event.eventId===t.eventId&&j.state!=='COMPLETE').map(j=>({id:j.id,player:j.player,source:j.source,state:j.state,stage:j.stage||'queued',failure:j.failure||'',createdAt:j.createdAt})),legacy:!!PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REGISTRATION_PENDING')};
 }catch(e){return {success:false,code:'QUEUE_REVIEW',error:e.message};}
}

// Count raw UTF-8 keys/values, not an escaped JSON serialization of the store.
// Reserve every open job's remaining space plus the next job and worker receipt.
function beautyQueueCapacity_(properties,jobs){
 const bytes=s=>Utilities.newBlob(String(s)).getBytes().length;
 const stored=Object.entries(properties).reduce((n,[k,v])=>n+bytes(k)+bytes(v),0);
 const open=jobs.filter(j=>j.state!=='COMPLETE');
 const growth=open.reduce((n,j)=>n+Math.max(0,8500-bytes(properties[BEAUTY_QUEUE_PREFIX_+j.id]||'')),0);
 if(open.length>=40||stored+growth+8500+2048>450000)throw Error('Queue storage needs owner review before accepting more requests.');
 return {storedBytes:stored,reservedGrowthBytes:growth,openJobs:open.length};
}
