/* Staff-visible, durable TEST attention records. Nakka checks are GET-only.
 * These records never replace, delete or bypass transfer/creation journals.
 */
function beautyHubAttentionKey_(date,name) {
  return ('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_')+date+'_'+beautyHubTransferHash_(name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'));
}
function beautyHubAttentionRemember_(name,date,result) {
  // Called only with the canonical committed registration or guarded transfer
  // result. Recording trouble cannot turn a saved registration into a retry.
  try {
    beautyHubTestGuard_();
    if(typeof name!=='string'||!name.trim()||name.length>120||!/^20\d\d-\d\d-\d\d$/.test(date))return false;
    const confirmed=result?.entryConfirmed===true||(result?.success===true&&result.readbackVerified===true&&['ALREADY_PRESENT','TRANSFERRED','ENTRY_VERIFIED_LINK_UNEXPOSED','PRESENT_AFTER_ATTEMPT','CURRENT_ENTRY_REVIEWED','REMOVED'].includes(result.status));
    const record={name,date,state:confirmed?'CLEAR':'ATTENTION',code:confirmed?'ENTRY_CONFIRMED':String(result?.code||'ENTRY_UNCONFIRMED').replace(/[^A-Z_]/g,'').slice(0,60),checkedAt:new Date().toISOString()};
    const props=PropertiesService.getScriptProperties(),key=beautyHubAttentionKey_(date,name),text=JSON.stringify(record);
    const previous=props.getProperty(key);
    if(previous){try{const old=JSON.parse(previous);if(old.name===record.name&&old.date===record.date&&old.state===record.state&&old.code===record.code)return true;}catch(e){}}
    props.setProperty(key,text);return props.getProperty(key)===text;
  } catch(e) { return false; }
}
function beautyHubAttentionRead_(data) {
  beautyHubTestGuard_();
  const date=data.eventDate,answer={available:true,eventDate:date,items:[],checkedAt:null,complete:false};
  if(!/^20\d\d-\d\d-\d\d$/.test(date||''))return {...answer,available:false};
  try {
    const props=PropertiesService.getScriptProperties(),prefix=('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_')+date+'_';
    const all=props.getProperties();
    for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))){
      const r=JSON.parse(all[key]);
      if(r.date!==date||typeof r.name!=='string'||!r.name||r.name.length>120||!['CLEAR','ATTENTION'].includes(r.state)||typeof r.code!=='string'||!/^[A-Z_]{1,60}$/.test(r.code))throw Error('record');
      if(r.state==='ATTENTION'){
        const diagnostic=beautyHubRegistrationDiagnosticRead_(r.name,date);
        answer.items.push({name:r.name,code:r.code,...(diagnostic?{registrationDiagnostic:diagnostic}:{})});
      }
    }
    const raw=props.getProperty(('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_CHECK_')+date);
    if(raw){const meta=JSON.parse(raw);answer.checkedAt=meta.checkedAt;answer.eventStatus=meta.eventStatus;answer.complete=meta.signature===beautyHubTransferHash_((data.players||[]).map(p=>({name:p.player||p.newPlayer,status:p.status})));}
    answer.items.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
    return answer;
  }catch(e){return {...answer,available:false,complete:false};}
}
function beautyHubAttentionRefresh_(input) {
  return beautyHubNakkaTimed_('diagnose',()=>beautyHubAttentionRefreshRun_(input));
}
function beautyHubAttentionRefreshRun_(input) {
  beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Unexpected attention input.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(0))return {success:false,code:'BUSY',message:'Another operation is running. The saved attention list is retained.'};
  let locked=true,diagnosis='CHECK_UNAVAILABLE';
  try {
    const date=beautyHubNakkaDate_().date,hub=beautyHubNakkaHubRows_(),props=PropertiesService.getScriptProperties();
    const target=beautyHubTransferTarget_();
    const fingerprint=()=>JSON.stringify(Object.entries(props.getProperties()).filter(([key])=>!/^beauty-hub-session:bhs_[a-f0-9]{64}$/.test(key)&&!key.startsWith('BEAUTY_PLAYER_RECOVERY_V1_')).sort(([a],[b])=>a.localeCompare(b)));
    const before=fingerprint();
    // Nakka GETs must not hold up registration or transfer writes.
    lock.releaseLock();locked=false;
    const match=beautyHubNakkaEvent_({});
    if(match.status!=='MATCHED'||match.event?.id!==beautyHubTransferTarget_()||match.event?.title!==beautyHubActiveTestTarget_().title||match.eventDate!==date){diagnosis=match.status==='NOT_FOUND'?'EVENT_DATE_MISMATCH':match.status==='STALE'?'STALE_CHECK':match.status==='AMBIGUOUS'?'EVENT_AMBIGUOUS':'EVENT_UNAVAILABLE';throw Error('target');}
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
    if(!user||!password)throw Error('credentials');
    const auth='Basic '+Utilities.base64Encode(user+':'+password);
    const [eventData,entryData,leagueData]=beautyHubNakkaReads_(auth,true),event=eventData.tournament;
    if(!event||event.tdid!==beautyHubTransferTarget_()||(event.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||event.title!==match.event.title||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('target');
    const entries=beautyHubTransferEntries_(entryData);
    const standalone=typeof beautyContextStandalone_==='function'&&beautyContextStandalone_();
    const league=standalone?hub.map(p=>({name:p.name,lpid:''})):leagueData.list;
    if(!Array.isArray(league)||league.length>=1000)throw Error('league');
    const ids=new Set();
    for(const r of league){if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>120||typeof r.lpid!=='string'||(!standalone&&(!/^[A-Za-z0-9]{4}$/.test(r.lpid)||ids.has(r.lpid))))throw Error('league');ids.add(r.lpid);}
    const normalize=n=>n.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
    // Include retained issues even if their Hub status has since become OUT.
    const retained=beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))});
    if(!retained.available)throw Error('record');
    const names=new Map(hub.filter(p=>p.status==='IN').map(p=>[normalize(p.name),p.name]));
    for(const item of retained.items)names.set(normalize(item.name),item.name);
    const decisions=[];
    for(const [key,name]of names){
      const h=hub.filter(p=>normalize(p.name)===key),l=league.filter(p=>normalize(p.name)===key),e=entries.filter(p=>normalize(p.name)===key||(l.length===1&&l[0].lpid&&p.lpid===l[0].lpid));
      let code='';
      if(h.length!==1)code='HUB_IDENTITY_REVIEW';
      else if(l.length!==1)code='LEAGUE_IDENTITY_REVIEW';
      else if(e.length!==1)code=e.length?'IDENTITY_CONFLICT':'MISSING_EVENT_ENTRY';
      else if(normalize(e[0].name)!==key||(e[0].lpid&&e[0].lpid!==l[0].lpid))code='IDENTITY_CONFLICT';
      if(!code){
        const creation=props.getProperty(('BEAUTY_NAKKA_LEAGUE_CREATE_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+beautyHubTransferHash_(key));
        if(creation){const c=JSON.parse(creation);if(c.state!=='VERIFIED'||c.name!==name||c.lpid!==l[0].lpid)code='LEAGUE_CREATION_REVIEW_REQUIRED';}
        const transfer=props.getProperty('BEAUTY_NAKKA_TRANSFER_'+beautyHubTransferTarget_()+'_'+(l[0].lpid||beautyHubTransferHash_(name)));
        if(transfer){
          const t=JSON.parse(transfer);
          if(t.event?.id!==beautyHubTransferTarget_()||t.event?.date!==date||t.identity?.name!==name||t.identity?.lpid!==l[0].lpid)code='TRANSFER_REVIEW_REQUIRED';
          else if(t.state==='ATTEMPTED'){
            if((!Number.isInteger(t.beforeCount)||entries.length!==t.beforeCount+1||beautyHubTransferHash_(entries.filter(r=>r.tpid!==e[0].tpid))!==t.beforeHash)&&
              !beautyHubTransferReviewMatch_(transfer,{event:{id:beautyHubTransferTarget_(),date},identity:{name,lpid:l[0].lpid},existing:e[0]}))code='TRANSFER_REVIEW_REQUIRED';
          }else if(!['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(t.state)||
            t.tpid!==e[0].tpid&&!beautyHubTransferReviewMatch_(transfer,{event:{id:beautyHubTransferTarget_(),date},identity:{name,lpid:l[0].lpid},existing:e[0]}))code='TRANSFER_REVIEW_REQUIRED';
        }
      }
      if(retained.items.some(item=>normalize(item.name)===key&&['REMOVE_UNCERTAIN','REMOVE_REVIEW_REQUIRED'].includes(item.code)))code='REMOVE_REVIEW_REQUIRED';
      decisions.push({name,code});
    }
    if(!lock.tryLock(0))return {success:false,code:'BUSY',message:'Registration or another operation is running. Saved alerts are retained.'};
    locked=true;
    beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
    if(beautyHubTransferTarget_()!==target||fingerprint()!==before){diagnosis='STALE_CHECK';throw Error('stale');}
    if(beautyHubNakkaDate_().date!==date||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub)){diagnosis='STALE_CHECK';throw Error('stale');}
    for(const d of decisions)if(!beautyHubAttentionRemember_(d.name,date,d.code?{code:d.code}:{entryConfirmed:true}))throw Error('save');
    const meta={checkedAt:new Date().toISOString(),signature:beautyHubTransferHash_(hub),eventStatus:event.status};
    props.setProperty(('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_CHECK_')+date,JSON.stringify(meta));
    return {success:true,eventDate:date,event:match.event,hubCount:hub.length,nakkaCount:entries.length,attention:beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))})};
  }catch(e){
    if(e.name==='HubAuthError')return {success:false,code:'AUTH_REQUIRED',message:'Sign in to continue.'};
    return {success:false,code:diagnosis,message:'The player check could not be completed. Saved alerts are retained. Check the event date and Nakka; no players were added.'};
  }finally{if(locked)lock.releaseLock();}
}


// Separate original automatic-registration outcome: attention refresh and manual
// recovery never write this key, so they cannot replace the original stop code.
function beautyHubRegistrationDiagnosticKey_(name,date) {
  return 'BEAUTY_TEST_REG_DIAGNOSTIC_'+beautyHubTransferHash_(beautyHubAttentionKey_(date,name));
}
function beautyHubRegistrationDiagnostic_(name,date,source,result,stage) {
  try{
    beautyHubTestGuard_();
    if(typeof name!=='string'||!name.trim()||name.length>120||!/^20\d\d-\d\d-\d\d$/.test(date)||!['HUB','MOBIL','KIOSK'].includes(source))return false;
    const code=result?.entryConfirmed===true?'ENTRY_CONFIRMED':typeof result?.code==='string'&&/^[A-Z_]{1,60}$/.test(result.code)?result.code:'ENTRY_UNCONFIRMED';
    const stages=['AUTO_LOCK','PRECHECK','EVENT_PREVIEW','EVENT_PREVIEW_RETRY','EVENT_SAVE','LEAGUE_PRECHECK','LEAGUE_LOCK','LEAGUE_READ','LEAGUE_RECHECK','LEAGUE_JOURNAL','LEAGUE_WRITE','LEAGUE_READBACK'];
    const record={version:1,source,stage:stages.includes(stage)?stage:'UNKNOWN',code,recordedAt:new Date().toISOString()};
    const props=PropertiesService.getScriptProperties(),key=beautyHubRegistrationDiagnosticKey_(name,date),text=JSON.stringify(record);
    props.setProperty(key,text);return props.getProperty(key)===text;
  }catch(e){return false;}
}
function beautyHubRegistrationDiagnosticRead_(name,date) {
  try{
    const r=JSON.parse(PropertiesService.getScriptProperties().getProperty(beautyHubRegistrationDiagnosticKey_(name,date))||'null');
    if(r?.version!==1||!['HUB','MOBIL','KIOSK'].includes(r.source)||typeof r.stage!=='string'||!/^[_A-Z]{1,40}$/.test(r.stage)||typeof r.code!=='string'||!/^[_A-Z]{1,60}$/.test(r.code)||typeof r.recordedAt!=='string'||!Number.isFinite(Date.parse(r.recordedAt)))return null;
    return {source:r.source,stage:r.stage,code:r.code,recordedAt:r.recordedAt};
  }catch(e){return null;}
}

/* Player-centred recovery for the selected owner TEST Hub only.
 * Reuses the registration/transfer journals. Never appends registration rows.
 * No scheduled trigger: automatic work runs while an authenticated Hub is open.
 */
function beautyPlayerRecoveryKey_(name,date){return 'BEAUTY_PLAYER_RECOVERY_V1_'+beautyHubTransferHash_(beautyHubAttentionKey_(date,name));}
function beautyPlayerRecoveryPolicy_(code){
 const automatic=['REGISTRATION_DISPLAY_PENDING','MISSING_EVENT_ENTRY','TRANSFER_BUSY','STALE_TRANSFER','TRANSFER_UNCERTAIN','TRANSFER_REVIEW_REQUIRED','ENTRY_UNCONFIRMED','TRANSFER_FAILED','NAKKA_UNAVAILABLE','AUTO_EXCEPTION','AUTO_STARTED'];
 const transient=['TRANSFER_BUSY','BUSY','STALE_TRANSFER','NAKKA_UNAVAILABLE','CHECK_UNAVAILABLE'];
 const text={
  EVENT_REGISTRATION_CLOSED:['This registration is saved in Beauty, but the selected event no longer accepts registrations.','If this was a mistaken late registration, mark the player OUT in the Hub player list. Do not reopen the completed event or repeat the transfer.'],
  REGISTRATION_DISPLAY_PENDING:['The registration row saved, but its player status or display is incomplete.','Beauty will verify the saved row and finish safe missing fields without registering again.'],
  REGISTRATION_SOURCE_UNVERIFIED:['The registration attempt is recorded, but its spreadsheet row is not verified.','Do not register again. Copy the report for support so the saved attempt can be inspected.'],
  MISSING_EVENT_ENTRY:['Registration is saved, but the Nakka entry is missing.','Beauty will check the saved transfer before deciding whether an add is safe.'],
  TRANSFER_UNCERTAIN:['Nakka did not confirm the transfer. It may already have saved.','Beauty checks for the existing entry before doing anything else.'],
  TRANSFER_REVIEW_REQUIRED:['An earlier transfer needs its current result verified.','Review the current entry. Beauty retains the original record and will not repeat an uncertain add.'],
  LEAGUE_IDENTITY_REVIEW:['The league profile is missing or the name matches more than one profile.','Review the proposed profile. If there are duplicates, correct them in Nakka and return here.'],
  IDENTITY_CONFLICT:['The Nakka player details conflict or match more than one entry.','Open the event in Nakka and identify the correct player. Do not add another entry.'],
  HUB_IDENTITY_REVIEW:['The Beauty registration is missing or the name appears more than once.','Review the player list and the original registration before making changes.'],
  LEAGUE_CREATION_REVIEW_REQUIRED:['An earlier league-profile creation is not verified.','Inspect the existing league profile. Do not create another profile or register again.'],
  LEAGUE_CREATION_UNCERTAIN:['A league profile may have saved, but its reply was lost.','Inspect the existing profile; Beauty will not create another one automatically.'],
  REMOVE_REVIEW_REQUIRED:['An earlier removal is unresolved.','Inspect the player in Beauty and Nakka before changing anything. Keep the report for support.'],
  REMOVE_UNCERTAIN:['An earlier removal may have partly completed.','Inspect the player in Beauty and Nakka. Do not repeat the removal.'],
  PLAYER_NOT_ELIGIBLE:['This player is not one uniquely registered IN player.','Check the player’s registration and IN / OUT / STANDBY status first.'],
  TEST_TARGET_ONLY:['The selected event is not available for registration transfers.','Check the selected event, date and whether registration is still open.'],
  NAKKA_UNAVAILABLE:['Nakka cannot currently be reached.','The saved registration is retained. Beauty will check the connection again.'],
  RECOVERY_REPLY_UNKNOWN:['The recovery reply was not confirmed.','Beauty will inspect the saved entry. Do not register again.'],
  RECOVERY_UNAVAILABLE:['The result could not be checked.','The saved registration is retained. Copy the report if the problem persists.']
 };
 const message=text[code]||['Beauty has not verified this player’s registration in Nakka.','Review the saved result before making another change.'];
 return {automatic:automatic.includes(code),transient:transient.includes(code),problem:message[0],next:message[1]};
}
function beautyPlayerRecoveryLoad_(name,date){
 const raw=PropertiesService.getScriptProperties().getProperty(beautyPlayerRecoveryKey_(name,date));
 if(!raw)return null;let r;try{r=JSON.parse(raw);}catch(e){throw Error('RECOVERY_HISTORY_UNREADABLE');}
 if(r.version!==1||r.name!==name||r.date!==date||r.eventId!==beautyHubTransferTarget_()||!Array.isArray(r.history)||!['CHECKING','NEEDS_HELP','VERIFIED'].includes(r.state))throw Error('RECOVERY_HISTORY_UNREADABLE');return r;
}
function beautyPlayerRecoverySave_(r,code,state,source){
 const p=PropertiesService.getScriptProperties(),key=beautyPlayerRecoveryKey_(r.name,r.date);r.state=state;r.code=String(code||'RECOVERY_UNAVAILABLE').replace(/[^A-Z_]/g,'').slice(0,60);r.updatedAt=new Date().toISOString();
 r.history.push({at:r.updatedAt,code:r.code,state,source});r.history=r.history.slice(-20);
 const raw=JSON.stringify(r);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('RECOVERY_HISTORY_FULL');p.setProperty(key,raw);if(p.getProperty(key)!==raw)throw Error('RECOVERY_HISTORY_READBACK');return r;
}
function beautyPlayerRecoveryView_(data){
 const attention=beautyHubAttentionRead_(data),p=PropertiesService.getScriptProperties(),date=data.eventDate;
 // Repeat successful checks deliberately deduplicate individual records.
 // The completed roster check is the authority for their current freshness.
 const now=Date.now(),checkTime=Date.parse(attention.checkedAt);
 const freshRoster=attention.available&&attention.complete&&Number.isFinite(checkTime)&&checkTime<=now&&now-checkTime<120000;
 const pending=beautyRegistrationRecoveryPending_();
 const rows=(data.players||[]).map(p=>({name:p.player||p.newPlayer,status:p.status})).filter(p=>typeof p.name==='string'&&p.name);
 const names=new Map(rows.map(p=>[p.name,p]));for(const r of pending)names.set(r.name,{name:r.name,status:'PENDING'});for(const issue of attention.items||[])if(!names.has(issue.name))names.set(issue.name,{name:issue.name,status:'UNKNOWN'});
 const players=[];
 for(const row of names.values()){
  const pendingRegistration=pending.find(r=>r.name===row.name);const issue=pendingRegistration?{name:row.name,code:pendingRegistration.code||'REGISTRATION_DISPLAY_PENDING'}:(attention.items||[]).find(i=>i.name===row.name);let record=null,broken=false;try{record=beautyPlayerRecoveryLoad_(row.name,date);}catch(e){broken=true;}
  const retryable=record?.state==='NEEDS_HELP'&&beautyPlayerRecoveryPolicy_(record.code).transient&&(record.autoAttempts||0)<3;
  const retryDue=retryable&&Date.now()-Date.parse(record.updatedAt)>=30000;
  let code=issue?.code||record?.code||'',tone='unknown';
  let current=null;try{current=JSON.parse(p.getProperty(beautyHubAttentionKey_(date,row.name))||'null');}catch(e){broken=true;}
  const freshClear=current?.state==='CLEAR'&&current.date===date&&current.name===row.name&&((Date.parse(current.checkedAt)<=now&&now-Date.parse(current.checkedAt)<120000)||(freshRoster&&Date.parse(current.checkedAt)<=checkTime));
  const closedIssue=freshRoster&&[25,30,40].includes(attention.eventStatus)&&issue&&!pendingRegistration&&['MISSING_EVENT_ENTRY','LEAGUE_IDENTITY_REVIEW','TEST_TARGET_ONLY'].includes(issue.code);
  if(closedIssue)code='EVENT_REGISTRATION_CLOSED';
  if(broken){code='RECOVERY_HISTORY_UNREADABLE';tone='red';}
  else if(closedIssue)tone=row.status==='IN'?'red':'neutral';
  else if(issue){const eligible=beautyPlayerRecoveryPolicy_(code).automatic&&['IN','PENDING'].includes(row.status);tone=record?.state==='CHECKING'&&Date.now()-Date.parse(record.updatedAt)<360000?'orange':eligible&&(!record||record.state==='VERIFIED'||retryable)?'orange':'red';}
  else if(freshClear&&['IN','PENDING'].includes(row.status))tone='green';
  else if(record?.state==='CHECKING'){tone=Date.now()-Date.parse(record.updatedAt)<360000?'orange':'red';if(tone==='red')code='RECOVERY_REPLY_UNKNOWN';}
  else if(row.status!=='IN')tone='neutral';
  const policy=beautyPlayerRecoveryPolicy_(code);
  players.push({name:row.name,status:row.status,tone,code,problem:tone==='green'?'Nakka entry verified.':tone==='neutral'?'Not marked IN for transfer.':tone==='unknown'?'Current entry status is not yet verified.':policy.problem,next:policy.next,
   autoEligible:!!issue&&['IN','PENDING'].includes(row.status)&&policy.automatic&&(!record||record.state==='VERIFIED'||retryDue)&&!broken,
   history:record?.history||[],entry:record?.entry||null,original:beautyHubRegistrationDiagnosticRead_(row.name,date),checkedAt:freshRoster&&freshClear?attention.checkedAt:current?.checkedAt||null});
 }
 return {success:true,eventContext:beautyContextToken_(),eventDate:date,eventId:beautyHubTransferTarget_(),title:beautyHubActiveTestTarget_().title,players,system:attention.available?'':'Player checks are unavailable. Saved issues are retained.',checkedAt:new Date().toISOString()};
}
function beautyPlayerRecoveryService_(action,input){
 const failure=(code,message)=>({success:false,code,error:message||'Beauty could not verify the result. Your registration is retained.'});
 beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
 const fields={read:'',auto:'player',review:'player',confirm:'confirmed,kind,player,ticket'};
 if(!Object.prototype.hasOwnProperty.call(fields,action)||!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==fields[action]||Object.values(input).some(v=>typeof v!=='string'||v.length>180))return failure('INVALID_RECOVERY');
 if(action==='confirm'&&(input.confirmed!=='true'||!['transfer','league'].includes(input.kind)||!/^[a-f0-9]{32}$/.test(input.ticket)))return failure('INVALID_RECOVERY');
 if(action==='read')return beautyPlayerRecoveryView_(getBeautyHubData_());
 if(!input.player.trim()||input.player.length>120||/[\x00-\x1f\x7f]/.test(input.player))return failure('INVALID_RECOVERY');
 const context=beautyContextToken_(),date=beautyHubNakkaDate_().date,eventId=beautyHubTransferTarget_(),name=input.player;
 const guard=()=>{beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);if(context!==beautyContextToken_()||date!==beautyHubNakkaDate_().date||eventId!==beautyHubTransferTarget_())throw Error('STALE_EVENT');};
 let record,claimed=false;
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return failure('BUSY','Another registration is finishing. Beauty will check again.');
 try{
  guard();const view=beautyPlayerRecoveryView_(getBeautyHubData_()),player=view.players.find(p=>p.name===name);
  if(!player)return failure('PLAYER_NOT_FOUND');
  if(action==='auto'&&!player.autoEligible)return {...view,skipped:true};
  if(!['IN','PENDING'].includes(player.status))return {...view,guidance:{player:name,problem:player.problem,steps:['Check the player’s registration.','Set IN only if this player is attending.','Return here to check the entry.']}};
  if(player.code==='EVENT_REGISTRATION_CLOSED')return {...view,guidance:{player:name,code:player.code,problem:player.problem,steps:['Close this window and find this player in the Hub player list.','For a mistaken late registration, change IN to OUT. The original registration is retained.','Select the correct upcoming event before registering for it. Do not reopen this completed event.']}};
  record=beautyPlayerRecoveryLoad_(name,date)||{version:1,eventId,name,date,state:'CHECKING',history:[]};
  if(record.state==='CHECKING'&&record.owner&&Date.now()-Date.parse(record.updatedAt)<360000)return failure('BUSY','Beauty is already checking this player.');
  if(action==='auto')record.autoAttempts=record.state==='VERIFIED'?1:(record.autoAttempts||0)+1;
  record.owner=Utilities.getUuid();beautyPlayerRecoverySave_(record,'RECOVERY_STARTED','CHECKING',action);claimed=true;
 }catch(e){return failure(e.message);}finally{lock.releaseLock();}
 let result,kind='transfer';
 try{
  guard();
  const registration=beautyRegistrationRecoveryResume_(name);guard();
  if(!registration.success)result=registration;
  else
  if(action==='confirm'){
   if(input.confirmed!=='true'||!['transfer','league'].includes(input.kind)||!/^[a-f0-9]{32}$/.test(input.ticket))throw Error('INVALID_RECOVERY');
   kind=input.kind;result=kind==='league'?beautyHubLeagueRecovery_('save',{player:name,ticket:input.ticket,confirmed:'true'}):beautyHubNakkaTransfer_('save',{player:name,ticket:input.ticket,confirmed:'true'});
  }else{
   result=beautyHubNakkaTransfer_('preview',{player:name});guard();
   // Existing journal/identity/status guards remain the authority for every add.
   if(action==='auto'&&result.success&&result.status==='PREVIEW')result=beautyHubNakkaTransfer_('save',{player:name,ticket:result.ticket,confirmed:'true'});
   else if(action==='review'&&result.code==='LEAGUE_IDENTITY_REVIEW'){kind='league';result=beautyHubLeagueRecovery_('preview',{player:name});}
  }
  guard();
  const verified=result?.success===true&&(result.readbackVerified===true||result.entryConfirmed===true||result.nakka?.entryConfirmed===true);
  const code=verified?'ENTRY_CONFIRMED':result?.code||result?.status||'RECOVERY_UNAVAILABLE';
  const latest=beautyPlayerRecoveryLoad_(name,date);if(latest?.owner!==record.owner)throw Error('RECOVERY_SUPERSEDED');
  if(verified)record.entry={eventId,tpid:result.tpid||null,leaguePlayerId:result.identity?.lpid||null,leagueLinkVerified:result.identityVerified===true,originalOperationVerified:result.operationVerified===true};
  beautyPlayerRecoverySave_(record,code,verified?'VERIFIED':'NEEDS_HELP',action);
  if(verified)beautyHubAttentionRemember_(name,date,{entryConfirmed:true});
  const view=beautyPlayerRecoveryView_(getBeautyHubData_());
  if(!verified){const policy=beautyPlayerRecoveryPolicy_(code);
   view.guidance={player:name,problem:result?.error||result?.message||policy.problem,steps:result?.status==='REVIEW_EXISTING'?['Open the selected Nakka event and locate '+name+'.','Confirm that the entry shown here is this player.','Confirm below. Beauty records your review without adding another entry.']:result?.ticket?['Review the player and selected event below.','Confirm once. Beauty will perform the guarded action and verify its result.','Wait for the player to turn green.']:['Your saved registration or recovery record is retained.',policy.next,'After correcting the issue, choose Check after correction. If it remains unresolved, copy the report for support.'],
    event:result?.event||{id:eventId,date,title:view.title},identity:result?.identity||null,tpid:result?.tpid||null,
    ...(result?.ticket?{ticket:result.ticket,kind,expires:result.expires}:{}),code};
  }
  return view;
 }catch(e){
  try{guard();if(claimed&&beautyPlayerRecoveryLoad_(name,date)?.owner===record.owner)beautyPlayerRecoverySave_(record,'RECOVERY_REPLY_UNKNOWN','NEEDS_HELP',action);}catch(ignore){}
  return failure(e.name==='HubAuthError'?'AUTH_REQUIRED':'RECOVERY_UNAVAILABLE');
 }
}

var beautyRegistrationRecoveryActive_=null;
function beautyRegistrationRecoveryPrefix_(){return 'BEAUTY_REGISTRATION_RECOVERY_V1_'+beautyHubTransferHash_({sheet:SHEET_ID,event:beautyHubTransferTarget_(),date:beautyHubNakkaDate_().date})+'_';}
function beautyRegistrationRecoveryKey_(name){return beautyRegistrationRecoveryPrefix_()+beautyHubTransferHash_(BeautyNameResolution.key(name));}
function beautyRegistrationRecoveryWrite_(r){const p=PropertiesService.getScriptProperties(),raw=JSON.stringify(r);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('REGISTRATION_RECEIPT_SIZE');p.setProperty(beautyRegistrationRecoveryKey_(r.name),raw);if(p.getProperty(beautyRegistrationRecoveryKey_(r.name))!==raw)throw Error('REGISTRATION_RECEIPT_READBACK');}
function beautyRegistrationRecoveryBegin_(sheet,decision,recordedAt,selectedName,newName,consent,message,source){
 beautyHubTestGuard_();const raw=PropertiesService.getScriptProperties().getProperty(beautyRegistrationRecoveryKey_(decision.player));let old;
 if(raw){try{old=JSON.parse(raw);}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}if(old.state!=='COMPLETE'){beautyRegistrationRecoveryActive_=old;throw Error('REGISTRATION_PENDING');}}
 const r={version:1,name:decision.player,date:beautyHubNakkaDate_().date,eventId:beautyHubTransferTarget_(),sheetId:SHEET_ID,context:beautyContextToken_(),state:'INTENT',row:sheet.getLastRow()+1,recordedAt:recordedAt.toISOString(),selectedName,newName,consent,message,source,existingPlayer:!decision.isNew};
 beautyRegistrationRecoveryWrite_(r);beautyRegistrationRecoveryActive_=r;
}
function beautyRegistrationRecoverySource_(r){
 beautyHubTestGuard_();if(r.version!==1||r.sheetId!==SHEET_ID||r.eventId!==beautyHubTransferTarget_()||r.date!==beautyHubNakkaDate_().date||r.context!==beautyContextToken_()||!Number.isInteger(r.row)||r.row<2)throw Error('REGISTRATION_CONTEXT_CHANGED');
 const ss=beautyHubSpreadsheet_(),sh=ss.getSheetByName(RESPONSE_SHEET),v=sh.getRange(r.row,1,1,6).getValues()[0];
 if(!(v[0] instanceof Date)||v[0].toISOString()!==r.recordedAt||JSON.stringify(v.slice(1))!==JSON.stringify([r.selectedName,r.selectedName===NEW_PLAYER_OPTION?r.newName:'',r.consent,r.message,r.source]))throw Error('REGISTRATION_SOURCE_UNVERIFIED');return ss;
}
function beautyRegistrationRecoveryFinish_(){const r=beautyRegistrationRecoveryActive_;if(!r)return;beautyRegistrationRecoverySource_(r);r.state='COMPLETE';r.completedAt=new Date().toISOString();beautyRegistrationRecoveryWrite_(r);beautyRegistrationRecoveryActive_=null;}
function beautyRegistrationRecoveryCatch_(e){const r=beautyRegistrationRecoveryActive_;beautyRegistrationRecoveryActive_=null;if(!r)throw e;
 let sourceVerified=false;try{beautyRegistrationRecoverySource_(r);sourceVerified=true;}catch(ignore){}
 r.state='REVIEW';r.code=sourceVerified?'REGISTRATION_DISPLAY_PENDING':'REGISTRATION_SOURCE_UNVERIFIED';try{beautyRegistrationRecoveryWrite_(r);}catch(ignore){}
 beautyHubAttentionRemember_(r.name,r.date,{code:r.code});
 return {success:sourceVerified,player:r.name,existingPlayer:r.existingPlayer,registrationPending:true,code:r.code,error:'Your registration needs an organiser check. Do not submit it again.'};
}
function beautyRegistrationRecoveryPending_(){
 const prefix=beautyRegistrationRecoveryPrefix_(),all=PropertiesService.getScriptProperties().getProperties(),out=[];
 for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))){let r;try{r=JSON.parse(all[key]);}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}if(r.state!=='COMPLETE'){if(typeof r.name!=='string'||r.version!==1||r.eventId!==beautyHubTransferTarget_())throw Error('REGISTRATION_RECEIPT_UNREADABLE');out.push(r);}}
 return out;
}
function beautyRegistrationRecoveryResume_(name){
 beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {success:false,code:'BUSY'};
 try{
  const r=beautyRegistrationRecoveryPending_().find(r=>r.name===name);if(!r)return {success:true};
  const ss=beautyRegistrationRecoverySource_(r),key=BeautyNameResolution.key,read=title=>{const sh=ss.getSheetByName(title);if(!sh)throw Error('REGISTRATION_SHEET_MISSING');return sh.getLastRow()<2?[]:sh.getRange(2,1,sh.getLastRow()-1,6).getDisplayValues();};
  const stored=read('PLAYER STATUS DATA').filter(x=>key(x[0])===key(name)),shown=read("TONIGHT'S PLAYERS").filter(x=>key(x[0]||x[1])===key(name));
  if(stored.length>1||shown.length!==1)throw Error('REGISTRATION_DISPLAY_REVIEW');
  const consent=r.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ';
  if(stored.length&&([stored[0][2]].some(v=>v&&!['IN'].includes(v))||[3,4,5].some((i)=>stored[0][i]!==''&&stored[0][i]!==[consent,r.message,r.source][i-3])))throw Error('REGISTRATION_STATUS_CHANGED');
  const masters=read(MASTER_SHEET).filter(x=>key(x[0])===key(name));if(masters.length>1)throw Error('REGISTRATION_IDENTITY_CONFLICT');
  if(!masters.length){if(r.existingPlayer)throw Error('REGISTRATION_MASTER_CHANGED');addPlayerToMasterList_(name);}
  // Only fill absent or matching fields. Never append the response a second time.
  updatePlayerStatusData_(name,r.consent,r.message,r.source);syncTonightStatusDisplay_(name);
  beautyRegistrationRecoverySource_(r);
  const after=read('PLAYER STATUS DATA').filter(x=>key(x[0])===key(name)),visible=read("TONIGHT'S PLAYERS").filter(x=>key(x[0]||x[1])===key(name));
  if(after.length!==1||after[0][2]!=='IN'||after[0][3]!==consent||after[0][4]!==r.message||after[0][5]!==r.source||visible.length!==1||visible[0][2]!=='IN')throw Error('REGISTRATION_DISPLAY_REVIEW');
  r.state='COMPLETE';r.completedAt=new Date().toISOString();beautyRegistrationRecoveryWrite_(r);beautyHubAttentionRemember_(name,r.date,{code:'MISSING_EVENT_ENTRY'});return {success:true};
 }catch(e){return {success:false,code:/^REGISTRATION_[A-Z_]+$/.test(e.message)?e.message:'REGISTRATION_DISPLAY_REVIEW',error:'The saved registration needs review. No response row was appended.'};}finally{lock.releaseLock();}
}
