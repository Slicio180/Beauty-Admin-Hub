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
