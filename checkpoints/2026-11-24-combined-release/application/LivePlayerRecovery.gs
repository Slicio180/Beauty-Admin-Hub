/* Approved player-centred recovery, adapted to LIVE's existing queue/journals.
 * Automatic work runs only from an authenticated, visible Hub. No trigger.
 * An uncertain write is inspected through its original receipt, never replayed.
 */
const BEAUTY_LIVE_PLAYER_RECOVERY_='BEAUTY_LIVE_PLAYER_RECOVERY_V1_';
function beautyLivePlayerRecoveryGuard_(context,token){
 beautyLiveLoginGuard_();const actor=beautyHubAuthRequire_(token);beautyContextAssert_();
 if(!context||context!==beautyContextToken_())throw Error('STALE_EVENT');return actor;
}
function beautyLivePlayerRecoveryKey_(name){const t=beautyLiveTarget_();return BEAUTY_LIVE_PLAYER_RECOVERY_+beautyQueueHash_([t.sheetId,t.eventId,t.date,t.revision,beautyLiveRegistrationKey_(name)]);}
function beautyLivePlayerRecoveryLoad_(name){
 const raw=PropertiesService.getScriptProperties().getProperty(beautyLivePlayerRecoveryKey_(name));if(!raw)return null;
 const r=JSON.parse(raw),t=beautyLiveTarget_();
 if(r.version!==1||r.name!==name||r.eventId!==t.eventId||r.date!==t.date||r.context!==t.revision||!['CHECKING','NEEDS_HELP','VERIFIED'].includes(r.state)||!Array.isArray(r.history))throw Error('RECOVERY_HISTORY_UNREADABLE');return r;
}
function beautyLivePlayerRecoverySave_(r,code,state,source){
 const t=beautyLiveTarget_();if(r.context!==t.revision||r.eventId!==t.eventId||r.date!==t.date)throw Error('STALE_EVENT');
 const p=PropertiesService.getScriptProperties(),key=beautyLivePlayerRecoveryKey_(r.name),old=p.getProperty(key)||'';
 r.code=String(code||'RECOVERY_UNAVAILABLE').replace(/[^A-Z_]/g,'').slice(0,60);r.state=state;r.updatedAt=new Date().toISOString();
 r.history.push({at:r.updatedAt,code:r.code,state,source});r.history=r.history.slice(-20);
 const raw=JSON.stringify(r),bytes=s=>Utilities.newBlob(s).getBytes().length;
 if(bytes(raw)>8500)throw Error('RECOVERY_HISTORY_FULL');
 const room=beautyQueueCapacity_(p.getProperties(),beautyQueueRead_());
 if(room.storedBytes+room.reservedGrowthBytes+Math.max(0,bytes(raw)-bytes(old))+17000>=430000)throw Error('RECOVERY_HISTORY_FULL');
 p.setProperty(key,raw);if(p.getProperty(key)!==raw)throw Error('RECOVERY_HISTORY_READBACK');return r;
}
function beautyLivePlayerRecoveryPolicy_(code){
 const automatic=['REGISTRATION_REVIEW','SAVED_OPERATION_REVIEW','MISSING_EVENT_ENTRY'];
 const transient=['BUSY','CHECK_UNAVAILABLE','NAKKA_UNAVAILABLE','STALE_CHECK'];
 const messages={
  AUTO_RETRY_LIMIT:['Automatic retries stopped.','Review the original request, correct the reported issue, then use Check after correction. Do not register the player again.'],
  EVENT_REGISTRATION_CLOSED:['Registration is closed.','The event is closed. Review the saved registration under Advanced; no transfer or event reopening will be attempted.'],
  REGISTRATION_REVIEW:['The saved registration needs checking.','Beauty will check the original request and complete only safe missing steps.'],
  SAVED_OPERATION_REVIEW:['A saved operation needs checking.','Beauty will verify its existing result without repeating an uncertain write.'],
  MISSING_EVENT_ENTRY:['The player is missing from Nakka.','Beauty will verify the registered player before transferring them.'],
  LEAGUE_IDENTITY_REVIEW:['The league profile needs review.','Review the player before creating a missing league profile.'],
  LEAGUE_CREATION_REVIEW_REQUIRED:['A league profile may already have been created.','Inspect the existing profile; no uncertain profile creation will be repeated.'],
  IDENTITY_CONFLICT:['More than one identity matches this player.','Correct duplicate or conflicting names in Nakka, then resolve this issue again.'],
  HUB_IDENTITY_REVIEW:['The Hub registration needs review.','Check the original registration and the player’s IN / OUT status.'],
  REMOVE_REVIEW_REQUIRED:['The removal needs review.','Resolve the saved removal; do not remove the player again.'],
  PLAYER_NOT_ELIGIBLE:['The player is not marked IN.','Check the player list before requesting a transfer.'],
  RECOVERY_REPLY_UNKNOWN:['The saved result is still unconfirmed.','Resolve the existing issue. Do not register the player again.'],
  CHECK_UNAVAILABLE:['The event could not be checked.','The saved registration is retained. Beauty will check again.'],
  BUSY:['Another operation is finishing.','Beauty will check again shortly.']
 };
 const m=messages[code]||['The saved result needs review.','Open Advanced for the saved report. Do not repeat the original registration.'];
 return {automatic:automatic.includes(code),transient:transient.includes(code),problem:m[0],next:m[1]};
}
function beautyLivePlayerRecoverySource_(){
 const t=beautyLiveTarget_(),data=beautyLiveDashboardRead_(true),jobs=beautyQueueRead_().filter(j=>j.event.revision===t.revision),items=beautyRecoveryInventory_();
 return {data,jobs,items,signature:beautyQueueHash_([t.revision,data.players,jobs.map(j=>[j.id,j.state,j.stage,j.steps,j.tpid,j.lpid,j.background||null]),items])};
}
function beautyLivePlayerRecoverySnapshot_(context,token,fresh){
 beautyLivePlayerRecoveryGuard_(context,token);const source=beautyLivePlayerRecoverySource_(),t=beautyLiveTarget_(),cache=CacheService.getScriptCache(),key='beauty-live-player-check:'+beautyQueueHash_([context,source.signature]);
 if(!fresh){try{const cached=JSON.parse(cache.get(key)||'null');if(cached&&cached.context===context&&Date.now()-Date.parse(cached.checkedAt)<30000)return {...source,...cached};}catch(ignored){}}
 const provider=beautyLiveContextEvent_(t),entries=beautyRecoveryEntries_(),league=t.mode==='league'?beautyLiveRegistrationList_('league'):[];
 if(!Array.isArray(league)||league.length>=2000||!Array.isArray(entries)||entries.length>=2000)throw Error('CHECK_UNAVAILABLE');
 const ids=new Set();for(const row of league){if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||typeof row.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(row.lpid)||ids.has(row.lpid))throw Error('CHECK_UNAVAILABLE');ids.add(row.lpid);}
 beautyLivePlayerRecoveryGuard_(context,token);const after=beautyLivePlayerRecoverySource_();if(after.signature!==source.signature)throw Error('STALE_CHECK');
 const checked={context,provider,entries,league,checkedAt:new Date().toISOString()};const raw=JSON.stringify(checked);if(Utilities.newBlob(raw).getBytes().length<95000)cache.put(key,raw,30);
 return {...source,...checked};
}
function beautyLivePlayerRecoveryView_(snap){
 const t=beautyLiveTarget_(),key=beautyLiveRegistrationKey_,now=Date.now(),rows=snap.data.players.map(p=>({name:p.player||p.newPlayer,status:p.status}));
 const names=new Map(rows.map(r=>[key(r.name),r.name]));for(const j of snap.jobs.filter(j=>j.state!=='COMPLETE'))names.set(key(j.player),j.player);
 for(const i of snap.items.filter(i=>i.date===t.date&&i.player!=='Event / pool operation'))names.set(key(i.player),i.player);
 const history=PropertiesService.getScriptProperties().getProperties();for(const k of Object.keys(history).filter(k=>k.startsWith(BEAUTY_LIVE_PLAYER_RECOVERY_))){try{const r=JSON.parse(history[k]);if(r.context===t.revision&&r.eventId===t.eventId&&r.date===t.date&&r.entry?.removed&&r.state==='VERIFIED')names.set(key(r.name),r.name);}catch(ignored){}}
 const players=[];
 for(const [normal,name] of names){
  const h=rows.filter(r=>key(r.name)===normal),jobs=snap.jobs.filter(j=>key(j.player)===normal&&j.state!=='COMPLETE'),items=snap.items.filter(i=>key(i.player)===normal&&i.date===t.date);
  const l=snap.league.filter(r=>key(r.name)===normal),entries=snap.entries.filter(r=>key(r.name)===normal||l.length===1&&r.lpid===l[0].lpid);
  const status=h.length===1?(h[0].status|| (jobs.length?'PENDING':'UNKNOWN')):jobs.length?'PENDING':'UNKNOWN';let record=null,broken=false;
  try{record=beautyLivePlayerRecoveryLoad_(name);}catch(e){broken=true;}
  let code='',tone='unknown',entry=null,operation=null;
  if(broken)code='RECOVERY_HISTORY_UNREADABLE';
  else if(jobs.length>1||items.length>1||h.length>1||l.length>1||entries.length>1)code='IDENTITY_CONFLICT';
  else if(jobs.length){const j=jobs[0];operation={kind:'queue',id:j.id};code=j.state==='REVIEW'?'REGISTRATION_REVIEW':'REGISTRATION_PROCESSING';}
  else if(items.length){const item=items[0];operation={kind:'saved',ref:item.ref,savedKind:item.kind};code=item.kind==='removal'?'REMOVE_REVIEW_REQUIRED':item.canCheck&&!item.processing?'SAVED_OPERATION_REVIEW':'SAVED_OPERATION_CHECKING';}
  else if(!h.length&&record?.state==='VERIFIED'&&record.entry?.removed){code='REMOVAL_CONFIRMED';entry=record.entry;}
  else if(h.length!==1)code='HUB_IDENTITY_REVIEW';
  else if(record?.state==='VERIFIED'&&record.entry?.savedState&&record.entry.sourceHash===beautyQueueHash_(snap.data.players.filter(p=>key(p.player||p.newPlayer)===normal))) {code='SAVED_STATE_CONFIRMED';entry=record.entry;}
  else if(status!=='IN')code='PLAYER_NOT_ELIGIBLE';
  else if(entries.length===1){
   if(key(entries[0].name)!==normal||t.mode==='league'&&(l.length!==1||entries[0].lpid&&entries[0].lpid!==l[0].lpid))code='IDENTITY_CONFLICT';
   else{code='ENTRY_CONFIRMED';entry={eventId:t.eventId,tpid:entries[0].tpid,leaguePlayerId:l[0]?.lpid||null,leagueLinkVerified:!!entries[0].lpid&&entries[0].lpid===l[0]?.lpid};}
  }else if(![10,20].includes(snap.provider.status))code='EVENT_REGISTRATION_CLOSED';
  else if(t.mode==='league'&&l.length!==1)code=record?.leagueIntent?'LEAGUE_CREATION_REVIEW_REQUIRED':'LEAGUE_IDENTITY_REVIEW';
  else code='MISSING_EVENT_ENTRY';
  // A saved operation always outranks a name match. Unconfirmed league creation
  // also remains unresolved until its own evidence has been verified.
  if(record?.leagueIntent?.state==='INTENT')code='LEAGUE_CREATION_REVIEW_REQUIRED';
  if(code==='ENTRY_CONFIRMED'&&record?.state==='NEEDS_HELP'&&record.code==='RECOVERY_REPLY_UNKNOWN')code='RECOVERY_REPLY_UNKNOWN';
  if(code==='REGISTRATION_REVIEW'&&((jobs[0]?.background?.attempts||0)>=3||(record?.autoAttempts||0)>=3))code='AUTO_RETRY_LIMIT';
  if(jobs.length&&![10,20].includes(snap.provider.status))code='EVENT_REGISTRATION_CLOSED';
  const policy=beautyLivePlayerRecoveryPolicy_(code),retryable=record?.state==='NEEDS_HELP'&&beautyLivePlayerRecoveryPolicy_(record.code).transient&&(record.autoAttempts||0)<3;
  const retryDue=retryable&&now-Date.parse(record.updatedAt)>=30000;
  const active=record?.state==='CHECKING'&&now-Date.parse(record.updatedAt)<360000;
  const eligible=['IN','PENDING'].includes(status)&&policy.automatic&&!broken;
  const autoEligible=eligible&&(!record||record.state==='VERIFIED'||retryDue)&&!active;
  if(['ENTRY_CONFIRMED','REMOVAL_CONFIRMED','SAVED_STATE_CONFIRMED'].includes(code))tone='green';
  else if(code==='PLAYER_NOT_ELIGIBLE')tone='neutral';
  else if(active||code==='REGISTRATION_PROCESSING'||code==='SAVED_OPERATION_CHECKING'||autoEligible||retryable&&eligible)tone='orange';
  else tone='red';
  if(record?.state==='CHECKING'&&!active&&code!=='ENTRY_CONFIRMED'){tone='red';code='RECOVERY_REPLY_UNKNOWN';}
  players.push({name,status,tone,code,problem:code==='REMOVAL_CONFIRMED'?'Removal verified.':code==='SAVED_STATE_CONFIRMED'?'Saved change verified.':tone==='green'?'Nakka entry verified.':policy.problem,next:policy.next,autoEligible,history:record?.history||[],entry,original:record?.original||null,checkedAt:snap.checkedAt,operation});
 }
 return {success:true,eventContext:t.revision,eventDate:t.date,eventId:t.eventId,title:snap.provider.title,players,system:snap.items.some(i=>!i.canCheck||i.date!==t.date)?'An older or event-level operation needs organiser review. Open Advanced for the existing recovery tools.':'',checkedAt:snap.checkedAt};
}
function beautyLivePlayerRecoveryClaim_(view,name,action,context,token){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BUSY');
 try{
  beautyLivePlayerRecoveryGuard_(context,token);if(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_LEASE_))throw Error('BUSY');const player=view.players.find(p=>p.name===name);if(!player)throw Error('PLAYER_NOT_FOUND');
  let r=beautyLivePlayerRecoveryLoad_(name);if(r?.state==='CHECKING'&&Date.now()-Date.parse(r.updatedAt)<360000)throw Error('BUSY');
  if(action==='auto'&&!player.autoEligible)return null;
  r=r||{version:1,name,eventId:view.eventId,date:view.eventDate,context,state:'NEEDS_HELP',history:[],original:{code:player.code,operation:player.operation,recordedAt:new Date().toISOString()}};
  if(action==='auto')r.autoAttempts=r.state==='VERIFIED'?1:(r.autoAttempts||0)+1;
  r.owner=Utilities.getUuid();return beautyLivePlayerRecoverySave_(r,'RECOVERY_STARTED','CHECKING',action);
 }finally{lock.releaseLock();}
}
function beautyLivePlayerRecoveryFinish_(record,code,verified,action,context,token){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BUSY');
 try{beautyLivePlayerRecoveryGuard_(context,token);const current=beautyLivePlayerRecoveryLoad_(record.name);if(current?.owner!==record.owner)throw Error('RECOVERY_SUPERSEDED');return beautyLivePlayerRecoverySave_(record,code,verified?'VERIFIED':'NEEDS_HELP',action);}finally{lock.releaseLock();}
}
function beautyLivePlayerRecoveryFillStatus_(id,record,context,token){
 // Recover only missing fields in an existing source row, using the unique
 // original response. Never append a response, create a status row or change OUT.
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BUSY');
 try{
  beautyLivePlayerRecoveryGuard_(context,token);if(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_LEASE_))throw Error('BUSY');
  const j=beautyQueueRead_().find(j=>j.id===id);if(!j||j.state!=='REVIEW'||j.event.revision!==context||j.player!==record.name||j.status!=='IN'||!j.input||!Number.isFinite(j.responseSerial))return;
  const s=beautyLiveRegistrationSheets_(),key=beautyLiveRegistrationKey_,rows=beautyLiveRegistrationRows_(s.store,6).map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(j.player));
  if(rows.length!==1)return;const current=rows[0],expected=[j.player,j.alias||'',j.status,j.input.consent==='JA, JAG GODKÄNNER'?'JA':j.input.consent==='NEJ, JAG GODKÄNNER INTE'?'NEJ':null,j.input.message||'',j.source];
  if(!expected[3]||!['HUB','KIOSK','MOBIL'].includes(j.source)||current.r[0]!==j.player||current.r[1]!==expected[1]||current.r.slice(2).some((v,i)=>v!==''&&v!==expected[i+2])||s.store.getRange(current.row,1,1,6).getFormulas()[0].some(Boolean))throw Error('HUB_IDENTITY_REVIEW');
  if(JSON.stringify(current.r)===JSON.stringify(expected))return;
  const response=[j.responseSerial,j.isNew?'MITT NAMN FINNS INTE I LISTAN':j.player,j.isNew?j.player:'',j.input.consent,j.input.message||'',j.source];
  const data=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Form responses 2'!A2:F")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(data.values)||data.values.length>=20000||data.values.filter(r=>Number.isFinite(r[0])&&Math.abs(r[0]-response[0])<1e-8&&Array.from({length:5},(_,i)=>String(r[i+1]??'')).every((v,i)=>v===response[i+1])).length!==1)throw Error('REGISTRATION_SOURCE_UNVERIFIED');
  if(beautyLiveRegistrationRows_(s.master,1).filter(r=>key(r[0])===key(j.player)).length!==1)throw Error('HUB_IDENTITY_REVIEW');
  const proof={job:id,row:current.row,response:beautyQueueHash_(response),before:beautyQueueHash_(current.r),expected:beautyQueueHash_(expected)};
  if(record.statusRepair&&(!['INTENT','VERIFIED'].includes(record.statusRepair.state)||record.statusRepair.expected!==proof.expected||record.statusRepair.response!==proof.response||record.statusRepair.row!==proof.row))throw Error('REGISTRATION_SOURCE_UNVERIFIED');
  record.statusRepair={...proof,state:'INTENT'};beautyLivePlayerRecoverySave_(record,'REGISTRATION_DISPLAY_PENDING','CHECKING','source');
  beautyLivePlayerRecoveryGuard_(context,token);if(JSON.stringify(beautyLiveRegistrationRows_(s.store,6)[current.row-2])!==JSON.stringify(current.r))throw Error('STALE_CHECK');
  // Idempotent fill of verified missing fields; source name/alias are untouched.
  s.store.getRange(current.row,3,1,4).setValues([expected.slice(2)]);SpreadsheetApp.flush();
  if(JSON.stringify(beautyLiveRegistrationRows_(s.store,6)[current.row-2])!==JSON.stringify(expected))throw Error('REGISTRATION_DISPLAY_PENDING');
  record.statusRepair.state='VERIFIED';beautyLivePlayerRecoverySave_(record,'REGISTRATION_SOURCE_VERIFIED','CHECKING','source');
 }finally{lock.releaseLock();}
}
function beautyLivePlayerRecoveryLeagueState_(name){
 const t=beautyLiveTarget_(),provider=beautyLiveContextEvent_(t);if(t.mode!=='league'||![10,20].includes(provider.status))throw Error('EVENT_REGISTRATION_CLOSED');
 beautyQueueWriteGuard_(name);beautyQueueLegacyBlock_(name);
 const {snap}=beautyRecoverySnapshot_(),rows=beautyRecoveryRows_(snap,name),key=beautyLiveRegistrationKey_;
 if(rows.shown.length!==1||rows.stored.length!==1||rows.shown[0][2]!=='IN'||rows.stored[0][2]!=='IN'||name.length>60||/^[=+@-]/.test(name)||/[\x00-\x1f\x7f]/.test(name))throw Error('HUB_IDENTITY_REVIEW');
 if(snap["PLAYER'S MASTER LIST"].display.slice(1).filter(r=>key(r[0])===key(name)).length!==1)throw Error('HUB_IDENTITY_REVIEW');
 const league=beautyLiveRegistrationList_('league'),entries=beautyRecoveryEntries_();
 if(league.length>=2000||league.some(r=>!r?.name||!/^[A-Za-z0-9]{4}$/.test(r.lpid||''))||league.filter(r=>key(r.name)===key(name)).length>1||entries.some(r=>key(r.name)===key(name)))throw Error('IDENTITY_CONFLICT');
 return {target:t,provider,league,rows,version:beautyQueueHash_([t,rows,league,entries])};
}
function beautyLivePlayerRecoveryLeague_(action,name,input,record,context,token){
 const actor=beautyLivePlayerRecoveryGuard_(context,token),cache=CacheService.getScriptCache(),session=beautyQueueHash_(actor.sessionBinding||token),key=beautyLiveRegistrationKey_;
 if(action==='review'){
  const state=beautyLivePlayerRecoveryLeagueState_(name),hits=state.league.filter(p=>key(p.name)===key(name));
  if(record.leagueIntent){
   const intent=record.leagueIntent;if(hits.length!==1)throw Error('LEAGUE_CREATION_REVIEW_REQUIRED');
   if(state.league.length!==intent.beforeCount+1||beautyQueueHash_(state.league.filter(p=>p.lpid!==hits[0].lpid))!==intent.beforeHash){
    const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;cache.put('beauty-live-profile-preview:'+ticket,JSON.stringify({name,context,session,uid:actor.uid,version:state.version,expires,reviewExisting:true,lpid:hits[0].lpid,intentHash:beautyQueueHash_(intent)}),300);
    return {success:true,outcome:'PREVIEW',ticket,expires,kind:'league',code:'REVIEW_PROFILE',identity:{name,lpid:hits[0].lpid},event:{id:state.target.eventId,date:state.target.date,title:state.provider.title}};
   }
   intent.state='VERIFIED';intent.lpid=hits[0].lpid;beautyLivePlayerRecoverySave_(record,'LEAGUE_PROFILE_VERIFIED','CHECKING','review');return {success:true,outcome:'PROFILE_VERIFIED'};
  }
  if(hits.length===1)return {success:true,outcome:'PROFILE_VERIFIED'};
  const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
  cache.put('beauty-live-profile-preview:'+ticket,JSON.stringify({name,context,session,uid:actor.uid,version:state.version,expires}),300);
  return {success:true,outcome:'PREVIEW',ticket,expires,kind:'league',code:'LEAGUE_IDENTITY_REVIEW',event:{id:state.target.eventId,date:state.target.date,title:state.provider.title}};
 }
 const cacheKey='beauty-live-profile-preview:'+input.ticket,review=JSON.parse(cache.get(cacheKey)||'null');cache.remove(cacheKey);
 if(!review||review.name!==name||review.context!==context||review.session!==session||review.uid!==actor.uid||Date.now()>=review.expires||input.confirmed!=='true')throw Error('STALE_REVIEW');
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BUSY');
 try{
  beautyLivePlayerRecoveryGuard_(context,token);const state=beautyLivePlayerRecoveryLeagueState_(name);
  if(state.version!==review.version)throw Error('STALE_REVIEW');
  if(review.reviewExisting){
   const member=state.league.filter(p=>key(p.name)===key(name));if(!record.leagueIntent||beautyQueueHash_(record.leagueIntent)!==review.intentHash||member.length!==1||member[0].lpid!==review.lpid)throw Error('STALE_REVIEW');
   record.leagueIntent.state='VERIFIED';record.leagueIntent.lpid=review.lpid;record.leagueIntent.currentProfileReviewed=true;record.leagueIntent.operationAttributionVerified=false;
   beautyLivePlayerRecoverySave_(record,'CURRENT_PROFILE_REVIEWED','CHECKING','confirm');return {success:true,outcome:'PROFILE_VERIFIED'};
  }
  if(record.leagueIntent)throw Error('STALE_REVIEW');
  record.leagueIntent={state:'INTENT',beforeCount:state.league.length,beforeHash:beautyQueueHash_(state.league),at:new Date().toISOString()};
  beautyLivePlayerRecoverySave_(record,'LEAGUE_CREATION_STARTED','CHECKING','confirm');
  beautyLivePlayerRecoveryGuard_(context,token);
  try{beautyLiveRegistrationApi_('league/entry/update',{lgid:state.target.leagueId,add:[{name}]});}catch(ignored){}
  const after=beautyLiveRegistrationList_('league'),hits=after.filter(p=>key(p.name)===key(name));
  if(hits.length!==1||!/^[A-Za-z0-9]{4}$/.test(hits[0].lpid||'')||after.length!==state.league.length+1||beautyQueueHash_(after.filter(p=>p.lpid!==hits[0].lpid))!==record.leagueIntent.beforeHash)throw Error('LEAGUE_CREATION_REVIEW_REQUIRED');
  record.leagueIntent.state='VERIFIED';record.leagueIntent.lpid=hits[0].lpid;beautyLivePlayerRecoverySave_(record,'LEAGUE_PROFILE_VERIFIED','CHECKING','confirm');return {success:true,outcome:'PROFILE_VERIFIED'};
 }finally{lock.releaseLock();}
}
function beautyLivePlayerRecoveryEntryReviewState_(name,ref){
 if(!ref||!ref.startsWith(BEAUTY_RECOVERY_PREFIX_))throw Error('SAVED_OPERATION_REVIEW');
 const raw=PropertiesService.getScriptProperties().getProperty(ref),job=JSON.parse(raw||'null'),key=beautyLiveRegistrationKey_;
 if(!job||job.kind!=='transfer'||job.player!==name||job.state==='COMPLETE'||job.state==='PROCESSING'&&Date.now()<job.until)throw Error('SAVED_OPERATION_REVIEW');
 beautyRecoveryEvent_(job);beautyQueueWriteGuardWithoutRecovery_(name);beautyQueueLegacyBlockWithoutRecovery_(name);
 if(beautyRecoveryJobs_().filter(j=>j.state!=='COMPLETE'&&key(j.player)===key(name)).length!==1)throw Error('SAVED_OPERATION_REVIEW');
 const {snap}=beautyRecoverySnapshot_(),rows=beautyRecoveryRows_(snap,name),entries=beautyRecoveryEntries_(),hits=entries.filter(e=>key(e.name)===key(name)||job.identity.lpid&&e.lpid===job.identity.lpid);
 if(rows.shown.length!==1||rows.stored.length!==1||rows.shown[0][2]!=='IN'||rows.stored[0][2]!=='IN'||hits.length!==1||key(hits[0].name)!==key(name)||hits[0].lpid&&hits[0].lpid!==job.identity.lpid||job.tpid&&job.tpid!==hits[0].tpid)throw Error('IDENTITY_CONFLICT');
 const member=job.event.mode==='league'?beautyRecoveryUnique_(beautyLiveRegistrationList_('league'),name):{name,lpid:''};if(member.lpid!==job.identity.lpid)throw Error('IDENTITY_CONFLICT');
 return {raw,job,entry:hits[0],member,version:beautyQueueHash_([raw,rows,hits[0],member])};
}
function beautyLivePlayerRecoveryEntryReview_(name,ref,context,token){
 const actor=beautyLivePlayerRecoveryGuard_(context,token),state=beautyLivePlayerRecoveryEntryReviewState_(name,ref),ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
 CacheService.getScriptCache().put('beauty-live-transfer-review:'+ticket,JSON.stringify({name,context,session:beautyQueueHash_(actor.sessionBinding||token),expires,mode:'entryReview',ref,version:state.version}),300);
 return {success:true,outcome:'PREVIEW',code:'REVIEW_EXISTING',ticket,expires,kind:'transfer',tpid:state.entry.tpid,identity:state.member,event:{id:state.job.event.eventId,date:state.job.event.date,title:beautyLiveContextEvent_(beautyLiveTarget_()).title}};
}
function beautyLivePlayerRecoveryConfirmEntry_(review,context,token){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('BUSY');
 try{
  const actor=beautyLivePlayerRecoveryGuard_(context,token),state=beautyLivePlayerRecoveryEntryReviewState_(review.name,review.ref);
  if(state.version!==review.version)throw Error('STALE_REVIEW');
  return beautyRecoveryArchive_(review.ref,state.raw,actor,{eventId:state.job.event.eventId,player:review.name,tpid:state.entry.tpid,leaguePlayerId:state.member.lpid,leagueLinkVerified:!!state.entry.lpid,currentStateVerified:true,explicitPlayerReview:true});
 }finally{lock.releaseLock();}
}
function beautyLivePlayerRecoveryService_(action,input,token){
 const fail=(code)=>({success:false,code,error:beautyLivePlayerRecoveryPolicy_(code).problem});let record,context,name;
 try{
  const fields={read:'_context',auto:'_context,player',review:'_context,player',confirm:'_context,confirmed,kind,player,ticket'};
  if(!input||Array.isArray(input)||!Object.prototype.hasOwnProperty.call(fields,action)||Object.keys(input).sort().join(',')!==fields[action]||Object.values(input).some(v=>typeof v!=='string'||v.length>180))return fail('INVALID_RECOVERY');
  context=input._context;beautyLivePlayerRecoveryGuard_(context,token);
  if(action!=='read'&&(!input.player.trim()||input.player.length>120||/[\x00-\x1f\x7f]/.test(input.player)))return fail('INVALID_RECOVERY');
  if(action==='confirm'&&(input.confirmed!=='true'||!['transfer','league'].includes(input.kind)||!/^[a-f0-9]{32}$/.test(input.ticket)))return fail('INVALID_RECOVERY');
  const snapshot=beautyLivePlayerRecoverySnapshot_(context,token,action!=='read'),view=beautyLivePlayerRecoveryView_(snapshot);
  if(action==='read')return view;
  name=input.player;const player=view.players.find(p=>p.name===name);if(!player)return fail('PLAYER_NOT_FOUND');
  if(action==='auto'&&!player.autoEligible)return {...view,skipped:true};
  if(player.code==='EVENT_REGISTRATION_CLOSED'||!['IN','PENDING'].includes(player.status)&&!player.operation)return {...view,guidance:{player:name,code:player.code,problem:player.problem,steps:[player.next]}};
  record=beautyLivePlayerRecoveryClaim_(view,name,action,context,token);if(!record)return {...view,skipped:true};
  beautyLivePlayerRecoveryGuard_(context,token);let result,kind='transfer';
  if(action==='confirm'){
   kind=input.kind;
   let review;if(kind==='transfer'){const cache=CacheService.getScriptCache(),k='beauty-live-transfer-review:'+input.ticket;review=JSON.parse(cache.get(k)||'null');cache.remove(k);const actor=beautyLivePlayerRecoveryGuard_(context,token);if(!review||review.name!==name||review.context!==context||review.session!==beautyQueueHash_(actor.sessionBinding||token)||Date.now()>=review.expires)throw Error('STALE_REVIEW');}
   result=kind==='league'?beautyLivePlayerRecoveryLeague_('confirm',name,input,record,context,token):review?.mode==='entryReview'?beautyLivePlayerRecoveryConfirmEntry_(review,context,token):beautyRecoveryService_('save',{_context:context,ticket:input.ticket,confirmed:'true'},token);
  }else if(player.operation?.kind==='queue'){
   beautyLivePlayerRecoveryFillStatus_(player.operation.id,record,context,token);
   result=beautyQueueService_('recheck',{_context:context,id:player.operation.id},token);
   if(result?.success)result={...result,outcome:result.recheck?.id===player.operation.id?result.recheck.outcome:'REVIEW'};
  }else if(player.operation?.kind==='saved'){
   result=beautyRecoveryService_('recheck',{_context:context,ref:player.operation.ref},token);
   if(action==='review'&&!result?.success&&player.operation.ref.startsWith(BEAUTY_RECOVERY_PREFIX_)){try{result=beautyLivePlayerRecoveryEntryReview_(name,player.operation.ref,context,token);}catch(ignored){}}
  }
  else if(['LEAGUE_IDENTITY_REVIEW','LEAGUE_CREATION_REVIEW_REQUIRED'].includes(player.code)){kind='league';result=beautyLivePlayerRecoveryLeague_('review',name,input,record,context,token);}
  else{
   result=beautyRecoveryService_('preview',{_context:context,kind:'transfer',player:name},token);
   if(action==='review'&&result?.success&&result.outcome==='PREVIEW'){const actor=beautyLivePlayerRecoveryGuard_(context,token);CacheService.getScriptCache().put('beauty-live-transfer-review:'+result.ticket,JSON.stringify({name,context,session:beautyQueueHash_(actor.sessionBinding||token),expires:result.expires}),300);}
   if(action==='auto'&&result?.success&&result.outcome==='PREVIEW'){
    beautyLivePlayerRecoveryGuard_(context,token);result=beautyRecoveryService_('save',{_context:context,ticket:result.ticket,confirmed:'true'},token);
   }
  }
  beautyLivePlayerRecoveryGuard_(context,token);
  const fresh=beautyLivePlayerRecoverySnapshot_(context,token,true),current=beautyLivePlayerRecoveryView_(fresh).players.find(p=>p.name===name);
  const removed=result?.success===true&&result.outcome==='COMPLETE'&&player.code==='REMOVE_REVIEW_REQUIRED'&&!fresh.items.some(i=>i.ref===player.operation?.ref)&&!fresh.data.players.some(p=>beautyLiveRegistrationKey_(p.player||p.newPlayer)===beautyLiveRegistrationKey_(name));
  const savedState=result?.success===true&&result.outcome==='COMPLETE'&&['status','consent'].includes(player.operation?.savedKind)&&!fresh.items.some(i=>i.ref===player.operation?.ref)&&fresh.data.players.filter(p=>beautyLiveRegistrationKey_(p.player||p.newPlayer)===beautyLiveRegistrationKey_(name)).length===1;
  const entryConfirmed=current?.code==='ENTRY_CONFIRMED'||current?.code==='RECOVERY_REPLY_UNKNOWN'&&current.entry;
  const verified=removed||savedState||result?.success===true&&['COMPLETE','ALREADY_PRESENT','PROFILE_VERIFIED'].includes(result.outcome)&&!!entryConfirmed;
  // PROFILE_VERIFIED is a completed profile step, not a completed event entry.
  const profileReady=result?.success&&result.outcome==='PROFILE_VERIFIED'&&current?.code==='MISSING_EVENT_ENTRY';
  const code=removed?'REMOVAL_CONFIRMED':savedState?'SAVED_STATE_CONFIRMED':verified?'ENTRY_CONFIRMED':profileReady?'MISSING_EVENT_ENTRY':result?.outcome==='PREVIEW'?(kind==='league'?'LEAGUE_IDENTITY_REVIEW':'MISSING_EVENT_ENTRY'):current?.code==='ENTRY_CONFIRMED'?'RECOVERY_REPLY_UNKNOWN':current?.code||'RECOVERY_REPLY_UNKNOWN';
  record.entry=removed?{removed:true,eventId:view.eventId,reference:result.reference}:savedState?{savedState:true,eventId:view.eventId,reference:result.reference,sourceHash:beautyQueueHash_(fresh.data.players.filter(p=>beautyLiveRegistrationKey_(p.player||p.newPlayer)===beautyLiveRegistrationKey_(name)))}:verified?current.entry:record.entry||null;
  beautyLivePlayerRecoveryFinish_(record,code,verified||profileReady,action,context,token);
  const next=beautyLivePlayerRecoveryView_(fresh);
  if(!verified&&!profileReady){next.guidance={player:name,code:result?.ticket&&result.code?result.code:code,problem:beautyLivePlayerRecoveryPolicy_(code).problem,steps:[beautyLivePlayerRecoveryPolicy_(code).next],...(result?.ticket?{ticket:result.ticket,expires:result.expires,kind,event:result.event||{id:next.eventId,date:next.eventDate,title:next.title},identity:result.identity||null,tpid:result.tpid||null}:{})};}
  return next;
 }catch(e){
  const code=e?.name==='HubAuthError'?'AUTH_REQUIRED':/^([A-Z_]+)$/.test(e.message||'')?e.message:'CHECK_UNAVAILABLE';
  if(record){try{beautyLivePlayerRecoveryFinish_(record,code,false,action,context,token);}catch(ignored){}}
  return fail(code);
 }
}
