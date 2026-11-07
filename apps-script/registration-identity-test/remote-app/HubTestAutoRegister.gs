/* AUD-096/098. Central Hub/mobile/kiosk registration -> fixed Nakka TEST only.
 * Separate legacy-project sync stays untouched. AUD-100 creates missing league
 * identities only after committed registration and fixed TEST target checks.
 */
const BEAUTY_HUB_NAKKA_AUTO_ENABLED_ = true;
// Invocation-local phase only; no provider bodies or credentials are recorded.
var beautyHubAutoStage_ = 'PRECHECK';
function beautyHubRegistrationDateCheck_(expected,recordedAt) {
  beautyHubTestGuard_();
  if(typeof expected!=='string'||!/^20\d\d-\d\d-\d\d$/.test(expected))return {success:false,code:'STALE_EVENT',error:'Reload the selected Hub event before registering.'};
  try{
    const selected=beautyHubNakkaDate_().date;
    if(selected!==expected)return {success:false,code:'STALE_EVENT',error:'The Hub event changed. Reload before registering.'};
    // The retained weekly model filters by actual submission day. Never write
    // a false timestamp or silently hide an advance entry under a future date.
    if(!(typeof beautyContextRead_==='function'&&beautyContextRead_())&&Utilities.formatDate(recordedAt,'Europe/Berlin','yyyy-MM-dd')!==expected)return {success:false,code:'REGISTRATION_DAY_MISMATCH',error:'This weekly TEST registration needs the Hub event date to match today. No registration was saved.'};
    return {success:true,eventDate:selected};
  }catch(e){return {success:false,code:'READ_FAILED',error:'The TEST event date could not be checked. No registration was saved.'};}
}
function beautyHubAutoRegistration_(input) {
  beautyHubTestGuard_();
  const registration=Object.assign({},input,{source:'HUB',_expectedEventDate:input.eventDate});delete registration.eventDate;
  // This call owns/releases the normal registration lock before any Nakka
  // work. A failed/conflicting registration must never initiate a transfer.
  const saved=submitRegistrationLocked_(registration);
  if(!saved||saved.success!==true)return saved;
  let nakka;
  if(typeof beautyHubRegistrationDiagnostic_==='function')beautyHubRegistrationDiagnostic_(saved.player,input.eventDate,'HUB',{code:'AUTO_STARTED'},'PRECHECK');
  try{nakka=beautyHubAutoSend_(saved,input.eventDate);}
  catch(e){nakka={status:'ATTENTION',code:e.name==='HubAuthError'?'AUTH_REQUIRED':'AUTO_EXCEPTION',entryConfirmed:false,identityVerified:false,message:'Registered in the Hub. Nakka could not be checked. Inspect the event before another action; do not register the player again.'};}
  if(typeof beautyHubRegistrationDiagnostic_==='function')beautyHubRegistrationDiagnostic_(saved.player,input.eventDate,'HUB',nakka,beautyHubAutoStage_);
  if(typeof beautyHubAttentionRemember_==='function')beautyHubAttentionRemember_(saved.player,input.eventDate,nakka);
  // A Nakka problem cannot turn a committed Sheet registration into a false
  // registration failure or cause the browser to repeat it.
  return Object.assign({},saved,{registrationEventDate:input.eventDate,nakka});
}
// Invocation-local ownership, never accepted from browser input. The complete
// automatic Nakka sequence owns one script lock; its guarded helpers borrow it.
var beautyHubAutoLock_ = null;
function beautyHubAutoLockHeld_(player) {
  return beautyHubAutoLock_!==null&&beautyHubAutoLock_.player===player;
}
function beautyHubAutoSend_(saved,eventDate) {
  beautyHubAutoStage_='PRECHECK';
  beautyHubTestGuard_();
  if(!saved||saved.success!==true||typeof saved.player!=='string'||typeof saved.existingPlayer!=='boolean')throw Error('Invalid saved registration.');
  if(BEAUTY_HUB_NAKKA_AUTO_ENABLED_!==true)return {status:'ATTENTION',code:'AUTO_DISABLED',entryConfirmed:false,identityVerified:false,message:'Registered in the Hub. Automatic Nakka transfer is disabled in TEST.'};
  if(beautyHubAutoLock_!==null)throw Error('Automatic registration is already running.');
  beautyHubNakkaAuthorize_(saved.player);
  const target=beautyHubTransferTarget_(),lock=LockService.getScriptLock();
  beautyHubAutoStage_='AUTO_LOCK';
  if(!lock.tryLock(30000))return {status:'ATTENTION',code:'TRANSFER_BUSY',entryConfirmed:false,identityVerified:false,message:'Registration is saved. Another operation did not finish in time; review Nakka before another action.'};
  try{
    beautyHubTestGuard_();beautyHubNakkaAuthorize_(saved.player);
    if(beautyHubTransferTarget_()!==target||beautyHubNakkaDate_().date!==eventDate)return {status:'ATTENTION',code:'STALE_EVENT',entryConfirmed:false,identityVerified:false,message:'Registration is saved for the original event. The selected event changed; no automatic add was started.'};
    beautyHubAutoLock_={player:saved.player};
    return beautyHubAutoSendRun_(saved,eventDate);
  }finally{beautyHubAutoLock_=null;lock.releaseLock();}
}
function beautyHubAutoSendRun_(saved,eventDate) {
  beautyHubAutoStage_='PRECHECK';
  beautyHubTestGuard_();
  const attention=(code,message,journal)=>({status:'ATTENTION',code,entryConfirmed:false,identityVerified:false,message,...(journal?{journal}: {})});
  if(BEAUTY_HUB_NAKKA_AUTO_ENABLED_!==true)return attention('AUTO_DISABLED','Registered in the Hub. Automatic Nakka transfer is disabled in TEST.');
  // Only the canonical result of a successful server-side registration may
  // establish a new identity; never accept a client name/flag as authority.
  const originalTarget=beautyHubTransferTarget_();
  let establishedIdentity=null;
  if(saved.existingPlayer!==true&&!(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_())){
    const established=beautyHubNewLeagueIdentityRetry_(saved,eventDate);
    establishedIdentity=established.lpid;
    if(established.success!==true)return attention(established.code,'Registered in the Hub. The new league identity could not be confirmed. Ask the organiser to review Nakka; do not register again.',established.journal);
  }
  beautyHubNakkaAuthorize_(saved.player);
  if(beautyHubNakkaDate_().date!==eventDate)return attention('STALE_EVENT','Registered for the original Hub date. The selected event changed, so no automatic Nakka add was started.');
  // Reuse all existing target/session/IN/league/duplicate/journal guards.
  // The registration action authorizes this automatic TEST path; the manual
  // transfer route retains its own acknowledgement for standalone transfers.
  beautyHubAutoStage_='EVENT_PREVIEW';
  let result=beautyHubNakkaTransfer_('preview',{player:saved.player});
  // Only these failures are guaranteed to precede the provider POST. Use a
  // fresh preview once; never replay a consumed ticket or an uncertain send.
  for(let attempt=0;attempt<2;attempt++){
    beautyHubNakkaAuthorize_(saved.player);
    if(beautyHubTransferTarget_()!==originalTarget||beautyHubNakkaDate_().date!==eventDate)return attention('STALE_EVENT','Registered for the original event. The selected event changed; no further automatic add was started.');
    if(attempt){beautyHubAutoStage_='EVENT_PREVIEW_RETRY';result=beautyHubNakkaTransfer_('preview',{player:saved.player});}
    // An existing Beauty master identity may also be absent from the league.
    // The same helper rejects ambiguity and verifies absence before creating.
    if(!establishedIdentity&&saved.existingPlayer===true&&result?.code==='LEAGUE_IDENTITY_REVIEW'&&!(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_())){
      const established=beautyHubNewLeagueIdentityRetry_(saved,eventDate);
      if(established.success!==true)return attention(established.code,'Registered in the Hub. The league identity needs review; do not register again.',established.journal);
      establishedIdentity=established.lpid;
      beautyHubAutoStage_='EVENT_PREVIEW';
      result=beautyHubNakkaTransfer_('preview',{player:saved.player});
    }
    if(establishedIdentity&&result?.success===true&&result.identity?.lpid!==establishedIdentity)return attention('LEAGUE_IDENTITY_REVIEW','Registered in the Hub. The new league identity changed before event transfer; review Nakka.');
    if(result?.success===true&&result.status==='PREVIEW'){
      if(result.event?.date!==eventDate||result.event?.id!==originalTarget)return attention('STALE_EVENT','Registered in the Hub. Nakka preview event changed; no add was confirmed.');
      if(typeof result.identity?.name!=='string'||result.identity.name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE')!==saved.player.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'))return attention('LEAGUE_IDENTITY_REVIEW','Registered in the Hub. The player identity needs review; no add was confirmed.');
      beautyHubAutoStage_='EVENT_SAVE';
      result=beautyHubNakkaTransfer_('save',{player:saved.player,ticket:result.ticket,confirmed:'true'});
    }
    if(result?.success!==false||!['TRANSFER_BUSY','STALE_TRANSFER'].includes(result.code))break;
  }
  if(result?.success===true&&['TRANSFERRED','ENTRY_VERIFIED_LINK_UNEXPOSED','ALREADY_PRESENT','PRESENT_AFTER_ATTEMPT'].includes(result.status)&&result.readbackVerified===true){
    return {status:result.status,entryConfirmed:true,identityVerified:result.identityVerified===true,
      message:typeof beautyContextStandalone_==='function'&&beautyContextStandalone_()?'Nakka tournament entry confirmed.':result.identityVerified===true?'Nakka TEST entry confirmed with its existing league link.':'Nakka TEST entry confirmed. The exact league ID is not returned by the API, so link verification remains unavailable.',
      ...(result.journal?{journal:result.journal}: {})};
  }
  return attention(result?.code||'NAKKA_UNAVAILABLE','Registered in the Hub. '+(result?.error||'Nakka entry could not be verified. Inspect the TEST event; do not register the player again.'),result?.journal);
}

/* MYSELF/USER_ACCESSING Google TEST boundary remains unchanged. These public
 * player RPCs do not confer Hub staff access or accept Hub session credentials.
 */
function getTestRegistrationContext() {
  beautyHubTestGuard_();
  if(arguments.length)throw Error('Unexpected registration context input.');
  const eventDate=beautyHubNakkaDate_().date,names=getPlayerNames();
  if(!Array.isArray(names)||names.length>10000||names.some(n=>typeof n!=='string'||n.length>120))throw Error('Invalid TEST player list.');
  return {success:true,eventDate,names,eventContext:typeof beautyContextToken_==='function'?beautyContextToken_():'legacy',eventTitle:typeof beautyContextRead_==='function'?beautyContextRead_()?.title||'':'',registrationAvailable:(typeof beautyContextRead_==='function'&&!!beautyContextRead_()?.eventId)||eventDate===Utilities.formatDate(new Date(),'Europe/Berlin','yyyy-MM-dd')};
}
function submitKioskRegistration(input) {return beautyHubPlayerRegistration_('KIOSK',input);}
function beautyHubPlayerContextError_(){const e=Error('AUTH_REQUIRED');e.name='HubAuthError';throw e;}
function beautyHubPlayerContextRequire_(phase,source,date) {
  beautyHubTestGuard_();
  const c=beautyHubPlayerContext_;
  if(!c||!['MOBIL','KIOSK'].includes(source)||c.source!==source||c.phase!==phase||c.eventDate!==date||
     !Number.isFinite(c.expires)||Date.now()>=c.expires||typeof c.nonce!=='string'||!/^[a-f0-9]{32}$/.test(c.nonce)||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyHubPlayerContextError_();
  return c;
}
function beautyHubPlayerTransferRequire_(player) {
  const c=beautyHubPlayerContext_;
  beautyHubPlayerContextRequire_('TRANSFER',c?.source,c?.eventDate);
  if(typeof c.player!=='string'||!c.player||(player!==undefined&&player!==c.player))beautyHubPlayerContextError_();
  return {uid:'test-registration:'+c.source,sessionBinding:c.nonce};
}
function beautyHubPlayerRegistration_(source,input) {
  if(typeof beautyContextBind_==='function'){try{input=beautyContextBind_(input,true);}catch(e){return {success:false,code:'STALE_EVENT',error:'Speltävlingen har ändrats. Ladda om sidan.'};}}
  beautyHubTestGuard_();
  if(BEAUTY_IDENTITY_WRITES_ENABLED_!==true)return {success:false,code:'BLOCKED',error:'TEST-registreringen är avstängd.'};
  const allowed=['eventDate','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
  if(!['MOBIL','KIOSK'].includes(source)||!input||typeof input!=='object'||Array.isArray(input)||
     Object.keys(input).some(k=>!allowed.includes(k)||typeof input[k]!=='string')||!/^20\d\d-\d\d-\d\d$/.test(input.eventDate||'')||beautyHubPlayerContext_!==null)
    return {success:false,code:'INVALID',error:'Ladda om TEST-sidan innan du anmäler dig.'};
  const registration=Object.assign({},input,{source,_expectedEventDate:input.eventDate});delete registration.eventDate;
  beautyHubPlayerContext_={source,eventDate:input.eventDate,phase:'REGISTER',nonce:Utilities.getUuid().replace(/-/g,''),expires:Date.now()+120000};
  try{
    const saved=submitRegistrationLocked_(registration);
    if(!saved||saved.success!==true){
      if(['STALE_EVENT','REGISTRATION_DAY_MISMATCH','READ_FAILED'].includes(saved?.code))return Object.assign({},saved,{error:'Speldatumet ändrades eller stämmer inte med dagens datum. Ladda om sidan. Ingen anmälan sparades.'});
      return saved;
    }
    beautyHubPlayerContext_.phase='TRANSFER';beautyHubPlayerContext_.player=saved.player;
    let nakka;
    if(typeof beautyHubRegistrationDiagnostic_==='function')beautyHubRegistrationDiagnostic_(saved.player,input.eventDate,source,{code:'AUTO_STARTED'},'PRECHECK');
    try{nakka=beautyHubAutoSend_(saved,input.eventDate);}
    catch(e){nakka={status:'ATTENTION',code:e.name==='HubAuthError'?'AUTH_REQUIRED':'AUTO_EXCEPTION',entryConfirmed:false,identityVerified:false,message:'Registreringen är sparad. Be arrangören kontrollera Nakka. Anmäl dig inte igen.'};}
    if(typeof beautyHubRegistrationDiagnostic_==='function')beautyHubRegistrationDiagnostic_(saved.player,input.eventDate,source,nakka,beautyHubAutoStage_);
    if(typeof beautyHubAttentionRemember_==='function')beautyHubAttentionRemember_(saved.player,input.eventDate,nakka);
    // Return player-facing facts only. Staff messages and journal identifiers
    // stay in the guarded server; the Hub still requires a real staff session.
    return {success:true,player:saved.player,registrationEventDate:input.eventDate,nakka:{entryConfirmed:nakka.entryConfirmed===true,identityVerified:nakka.identityVerified===true,needsAttention:nakka.entryConfirmed!==true}};
  }finally{beautyHubPlayerContext_=null;}
}

/* AUD-100: durable, no-retry new league identity creation. No public RPC.
 * This adds a permanent member to lg_M2wQ_4189, then the caller uses the
 * existing guarded TEST event transfer. No update/remove/retry payloads.
 */
function beautyHubNewLeagueIdentityRetry_(saved,eventDate) {
  const target=beautyHubTransferTarget_();
  let result=beautyHubNewLeagueIdentity_(saved,eventDate);
  if(result.success===false&&['TRANSFER_BUSY','STALE_TRANSFER'].includes(result.code)){
    if(beautyHubTransferTarget_()!==target||beautyHubNakkaDate_().date!==eventDate)return {success:false,code:'STALE_EVENT'};
    result=beautyHubNewLeagueIdentity_(saved,eventDate);
  }
  return result;
}
function beautyHubNewLeagueIdentity_(saved,eventDate,review) {
  beautyHubAutoStage_='LEAGUE_PRECHECK';
  const fail=(code,journal)=>({success:false,code,...(journal?{journal}:{})});
  beautyHubTestGuard_();
  if(BEAUTY_HUB_NAKKA_AUTO_ENABLED_!==true||BEAUTY_HUB_NAKKA_TRANSFER_ENABLED_!==true||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)return fail('AUTO_DISABLED');
  if(!saved||saved.success!==true||typeof saved.existingPlayer!=='boolean'||typeof saved.player!=='string'||!saved.player.trim()||saved.player.length>60||/[\x00-\x1f\x7f]/.test(saved.player))return fail('LEAGUE_IDENTITY_REVIEW');
  beautyHubAutoStage_='LEAGUE_LOCK';
  const lock=review||beautyHubAutoLockHeld_(saved.player)?null:LockService.getScriptLock();if(lock&&!lock.tryLock(30000))return fail('TRANSFER_BUSY');
  let journal=null,attempted=false;
  try{
    const account=beautyHubNakkaAuthorize_(saved.player);
    if(beautyHubRegistrationDateCheck_(eventDate,new Date()).success!==true)return fail('STALE_EVENT');
    const props=PropertiesService.getScriptProperties(),user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
    if(!user||!password)return fail('NAKKA_UNAVAILABLE');
    const auth='Basic '+Utilities.base64Encode(user+':'+password);
    beautyHubAutoStage_='LEAGUE_READ';
    const state=beautyHubTransferState_(saved.player,auth,true);
    if(state.event.date!==eventDate)return fail('STALE_EVENT');
    if(review&&(review.version!==beautyHubTransferHash_(state)||review.eventId!==state.event.id))return fail('STALE_TRANSFER');
    const normalized=saved.player.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
    journal=('BEAUTY_NAKKA_LEAGUE_CREATE_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+beautyHubTransferHash_(normalized);
    const prior=props.getProperty(journal);
    if(prior){
      let old;try{old=JSON.parse(prior);}catch(e){}
      // An uncertain creation stays review-only even if a same-name member
      // later appears. Name presence alone cannot prove which ID was created.
      if(old?.state!=='VERIFIED'||old.name!==saved.player||!state.identity.lpid||old.lpid!==state.identity.lpid)return fail('LEAGUE_CREATION_REVIEW_REQUIRED',journal);
      return {success:true,lpid:state.identity.lpid,created:false};
    }
    if(state.identity.lpid)return {success:true,lpid:state.identity.lpid,created:false};
    // Never create a second identity to attach an existing unlinked event name.
    if(state.existing)return fail('IDENTITY_CONFLICT');
    beautyHubAutoStage_='LEAGUE_RECHECK';
    const latest=beautyHubTransferState_(saved.player,auth,true);
    if(beautyHubTransferHash_(latest)!==beautyHubTransferHash_(state))return fail('STALE_TRANSFER');
    beautyHubNakkaAuthorize_(saved.player);
    if(beautyHubRegistrationDateCheck_(eventDate,new Date()).success!==true||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(state.hub))return fail('STALE_EVENT');
    beautyHubAutoStage_='LEAGUE_JOURNAL';
    const record={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:account.uid,event:state.event,name:saved.player,league:(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),beforeHash:beautyHubTransferHash_(state.league),beforeCount:state.league.length};
    props.setProperty(journal,JSON.stringify(record));if(props.getProperty(journal)!==JSON.stringify(record))throw Error('journal');
    attempted=true;
    beautyHubAutoStage_='LEAGUE_WRITE';
    const result=beautyHubTransferFetch_('league/entry/update',auth,{lgid:(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),add:[{name:saved.player}]});
    const added=result.added;
    if(!Array.isArray(added)||added.length!==1||added[0]?.name!==saved.player||typeof added[0]?.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(added[0].lpid)||(result.updated||0)!==0||(result.removed||0)!==0||state.league.some(p=>p.lpid===added[0].lpid))throw Error('receipt');
    beautyHubAutoStage_='LEAGUE_READBACK';
    const after=beautyHubTransferState_(saved.player,auth,true),lpid=added[0].lpid;
    if(after.event.date!==eventDate||after.identity.name!==saved.player||after.identity.lpid!==lpid||after.league.length!==state.league.length+1||beautyHubTransferHash_(after.league.filter(p=>p.lpid!==lpid))!==record.beforeHash)throw Error('readback');
    record.state='VERIFIED';record.lpid=lpid;record.verifiedUTC=new Date().toISOString();
    props.setProperty(journal,JSON.stringify(record));if(props.getProperty(journal)!==JSON.stringify(record))throw Error('journal');
    return {success:true,lpid,created:true};
  }catch(e){return fail(attempted?'LEAGUE_CREATION_UNCERTAIN':e.name==='HubAuthError'?'AUTH_REQUIRED':e.name==='HubTransferError'?e.message:'LEAGUE_CREATION_FAILED',journal);}
  finally{if(lock)lock.releaseLock();}
}

/* Staff-only recovery of an already saved IN registration. Preview is read-only;
 * confirmation creates one missing league profile, then uses the guarded event
 * transfer. No registration append, journal reset or uncertain-request replay. */
function beautyHubLeagueRecovery_(action,input) {
  const fail=(code,message)=>({success:false,code,error:message||'League recovery stopped. Inspect the current entry and history; do not register again.'});
  beautyHubTestGuard_();
  if(beautyHubPlayerContext_!==null)return fail('AUTH_REQUIRED','Staff sign-in is required.');
  try{beautyHubAuthRequire_(beautyHubRequestToken_);}catch(e){return fail('AUTH_REQUIRED','Staff sign-in is required.');}
  if(!['preview','save'].includes(action)||!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==(action==='preview'?'player':'confirmed,player,ticket')||Object.values(input).some(v=>typeof v!=='string')||!input.player.trim()||input.player.length>60||/[\x00-\x1f\x7f]/.test(input.player)||(action==='save'&&(input.confirmed!=='true'||!/^[a-f0-9]{32}$/.test(input.ticket))))return fail('INVALID_TRANSFER');
  if(BEAUTY_HUB_NAKKA_AUTO_ENABLED_!==true||BEAUTY_HUB_NAKKA_TRANSFER_ENABLED_!==true||BEAUTY_IDENTITY_WRITES_ENABLED_!==true||typeof beautyContextStandalone_==='function'&&beautyContextStandalone_())return fail('TRANSFER_DISABLED');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('TRANSFER_BUSY','Another operation is running. Close this review and check again shortly.');
  let completed;
  try{
    const account=beautyHubAuthRequire_(beautyHubRequestToken_),session=beautyHubTransferHash_(beautyHubRequestToken_),cache=CacheService.getScriptCache(),props=PropertiesService.getScriptProperties();
    let reviewed;
    if(action==='save'){
      const key='beauty-league-recovery:'+input.ticket;
      try{reviewed=JSON.parse(cache.get(key)||'null');}catch(e){}
      cache.remove(key);
      if(!reviewed||reviewed.uid!==account.uid||reviewed.session!==session||reviewed.player!==input.player||Date.now()>=reviewed.expires)return fail('STALE_TRANSFER','Review expired or changed. Open a fresh review.');
    }
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');if(!user||!password)return fail('NAKKA_UNAVAILABLE');
    const state=beautyHubTransferState_(input.player,'Basic '+Utilities.base64Encode(user+':'+password),true);
    if(state.identity.name!==input.player||state.identity.lpid||state.existing)return fail('IDENTITY_CONFLICT','A league profile or event entry already exists. Close this review and check the player again.');
    const league=typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189';
    const journal='BEAUTY_NAKKA_LEAGUE_CREATE_'+league+'_'+beautyHubTransferHash_(input.player.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'));
    if(props.getProperty(journal))return fail('LEAGUE_CREATION_REVIEW_REQUIRED','An earlier league creation record exists. Its result needs review; no new profile will be created.');
    const normalize=n=>n.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
    for(const [key,value] of Object.entries(props.getProperties())){
      if(!key.startsWith('BEAUTY_NAKKA_TRANSFER_'+state.event.id+'_'))continue;
      let old;try{old=JSON.parse(value);}catch(e){return fail('TRANSFER_REVIEW_REQUIRED');}
      if(typeof old?.identity?.name!=='string'||normalize(old.identity.name)===normalize(input.player))return fail('TRANSFER_REVIEW_REQUIRED','An earlier event transfer record needs review. No new league profile will be created.');
    }
    const version=beautyHubTransferHash_(state);
    if(action==='preview'){
      const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
      cache.put('beauty-league-recovery:'+ticket,JSON.stringify({uid:account.uid,session,player:input.player,eventId:state.event.id,version,expires}),300);
      return {success:true,status:'CREATE_LEAGUE_PREVIEW',player:input.player,event:state.event,identity:state.identity,leagueId:league,ticket,expires,message:'This player has no profile in the selected TEST league and no earlier creation record. Confirming creates one league profile and adds this saved IN registration to the TEST event.'};
    }
    if(reviewed.version!==version||reviewed.eventId!==state.event.id)return fail('STALE_TRANSFER','The event or player lists changed. Review again before creating a profile.');
    const saved={success:true,existingPlayer:true,player:input.player};
    const created=beautyHubNewLeagueIdentity_(saved,state.event.date,reviewed);
    if(created.success!==true)return fail(created.code);
    completed={saved,date:state.event.date,eventId:state.event.id};
  }catch(e){return fail(e.name==='HubAuthError'?'AUTH_REQUIRED':e.name==='HubTransferError'?e.message:'NAKKA_UNAVAILABLE');}
  finally{lock.releaseLock();}
  // Transfer owns its own lock and rechecks the target. Never append to Sheets.
  if(beautyHubTransferTarget_()!==completed.eventId||beautyHubNakkaDate_().date!==completed.date)return fail('STALE_EVENT','League profile created and verified. The event changed; no event transfer was started.');
  let result;
  try{result=beautyHubAutoSend_(completed.saved,completed.date);}catch(e){return fail('TRANSFER_UNCERTAIN','League profile created and verified. Event transfer could not be confirmed. Check Nakka before another action.');}
  if(typeof beautyHubAttentionRemember_==='function')beautyHubAttentionRemember_(input.player,completed.date,result);
  return {success:result.entryConfirmed===true,status:'LEAGUE_RECOVERY_RESULT',code:result.code,readbackVerified:result.entryConfirmed===true,message:result.entryConfirmed?'League profile and TEST event entry confirmed. The original Hub registration was kept.':'League profile created and verified. '+result.message};
}
