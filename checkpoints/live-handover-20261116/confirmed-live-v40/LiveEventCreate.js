/* Approved find/create flow for LIVE. Drafts do not change the active event.
 * One durable creation intent; uncertain creation is read back, never repeated.
 * Existing LIVE archive/switch code is the only writer of event workspace data. */
const BEAUTY_LIVE_CREATE_PREFIX_='BEAUTY_LIVE_CREATE_V1_';
function beautyLiveCreateKey_(leagueId,date){if(!/^lg_[A-Za-z0-9_]{1,80}$/.test(leagueId)||!beautyHubEventDateValid_(date))throw Error('Choose a saved league and date.');return BEAUTY_LIVE_CREATE_PREFIX_+leagueId+'_'+date;}
function beautyLiveEventCreatePending_(leagueId,date){const raw=PropertiesService.getScriptProperties().getProperty(beautyLiveCreateKey_(leagueId,date));if(!raw)return false;try{return JSON.parse(raw).state!=='VERIFIED';}catch(e){return true;}}
function beautyLiveCreateStore_(key,j){
 const p=PropertiesService.getScriptProperties(),raw=JSON.stringify(j),bytes=s=>Utilities.newBlob(s).getBytes().length,old=p.getProperty(key)||'',all=p.getProperties(),room=beautyQueueCapacity_(all,beautyQueueRead_());
 if(bytes(raw)>8500||room.storedBytes+room.reservedGrowthBytes+Math.max(0,bytes(raw)-bytes(old))+17000>=430000)throw Error('Event history storage needs review.');
 p.setProperty(key,raw);if(p.getProperty(key)!==raw)throw Error('Event receipt could not be verified.');
}
function beautyLiveCreateTemplate_(){
 const game={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01',limit_rounds:1,rounds:13,overkill:0,game_setting:[],schedule:[]};
 return {rr_setting:{...game,round_robin:1,robin_count:1,robin_player_count:4,point_w:2,point_d:1,point_l:0},t_setting:{...game,tournament:1,t_player_count:16,t3:0},s2_setting:{...game,tournament:1,t_player_count:16,t3:0}};
}
function beautyLiveCreateSource_(context,token){
 beautyLiveLoginGuard_();const actor=beautyHubAuthRequire_(token),current=beautyLiveTarget_();
 if(current.revision!==context||current.sheetId!==BEAUTY_LIVE_BASE_.sheetId)throw Error('The selected event changed. Reopen Event Setup.');
 beautyLivePendingSwitch_();beautyEventExternalWritesClosed_();const snapshot=beautyEventRead_(current);
 return {actor,current,source:beautyEventHash_(snapshot)};
}
function beautyLiveCreateVerify_(j){
 const events=beautyLiveContextFind_(j.leagueId,j.date);if(events.length!==1||j.createdId&&events[0].id!==j.createdId)throw Error('The new event could not be identified uniquely. Open Advanced and inspect the league.');
 const target={mode:'league',leagueId:j.leagueId,eventId:events[0].id,date:j.date},event=beautyLiveContextEvent_(target);
 for(const key of ['title','status','t_date','lgid','team_games','game_type','private','common_join','individual_pass','join_pass'])if(event[key]!==j.set[key])throw Error('The created event settings need review.');
 if(!beautyHubCreateFormatMatches_(event,j.set))throw Error('The created match format needs review.');
 const entries=beautyLiveRegistrationApi_('tournament/entry/list?tdid='+target.eventId).list;
 if(!Array.isArray(entries)||entries.length||event.entry_list?.length)throw Error('The event is no longer empty. Review it in Nakka.');
 for(const key of Object.keys(event))if(/_(table|result|rank)$/.test(key)&&!beautyPoolEmpty_(event[key]))throw Error('The event already contains play data.');
 return {...target,version:1,sheetId:BEAUTY_LIVE_BASE_.sheetId,title:event.title,revision:j.targetRevision};
}
function beautyLiveCreateFinish_(key,j,token,allowSwitch){
 const actor=beautyHubAuthSessionRequire_(token),p=PropertiesService.getScriptProperties();
 const pending=JSON.parse(p.getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1')||'null');
 if(pending){
  if(!j.target||JSON.stringify(pending.target)!==JSON.stringify(j.target)||pending.beforeContext!==JSON.stringify(j.before))throw Error('A different event switch needs review.');
  const finished=beautyEventSwitchRecover_(actor);j.state='VERIFIED';j.finishedAt=new Date().toISOString();beautyLiveCreateStore_(key,j);return {...finished,outcome:'SELECTED',event:j.target,message:'Event created and selected.'};
 }
 const current=beautyLiveTarget_();
 if(j.target&&current.eventId===j.target.eventId&&current.revision===j.target.revision){
  // A previously verified creation/switch reply was lost. Do not require it to
  // remain empty after players have subsequently registered for the event.
  beautyLiveContextEvent_(current);j.state='VERIFIED';j.finishedAt=new Date().toISOString();beautyLiveCreateStore_(key,j);return {success:true,outcome:'SELECTED',active:current,context:current.revision,event:current,message:'Event created and selected.'};
 }
 if(current.revision!==j.before.revision)throw Error('The selected event changed. Open the created event from League / Tournament.');
 beautyLivePendingSwitch_();
 const target=beautyLiveCreateVerify_(j);j.createdId=target.eventId;j.target=target;j.state='CREATED_VERIFIED';beautyLiveCreateStore_(key,j);
 if(!allowSwitch||beautyEventHash_(beautyEventRead_(current))!==j.beforeSource)return {success:true,outcome:'CREATED',event:target,message:'Event created. The current player list changed; open the new event when ready.'};
 beautyHubAuthRequire_(token);beautyLivePendingSwitch_();beautyEventExternalWritesClosed_();
 const result=beautyEventSwitch_(target,actor);j.state='VERIFIED';j.finishedAt=new Date().toISOString();beautyLiveCreateStore_(key,j);
 return {...result,outcome:'SELECTED',event:target,message:'Event created and selected.'};
}
function beautyLiveEventCreateService_(action,input,token){
 let lock,j,key,attempted=false;
 try{
  beautyLiveLoginGuard_();const actor=beautyHubAuthSessionRequire_(token),fields={draft:'_context,date,leagueId',prepare:'_context,date,leagueId,settings,title',confirm:'_context,confirmed,ticket',resolve:'_context,date,leagueId'};
  if(!input||Array.isArray(input)||fields[action]===undefined||Object.keys(input).sort().join(',')!==fields[action]||Object.values(input).some(v=>typeof v!=='string'||v.length>4000))throw Error('Invalid event request.');
  const props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache(),session=beautyQueueHash_(actor.sessionBinding||token);
  if(action==='resolve'){
   key=beautyLiveCreateKey_(input.leagueId,input.date);const raw=props.getProperty(key);j=JSON.parse(raw||'null');
   if(!j||j.version!==1||j.leagueId!==input.leagueId||j.date!==input.date||!['ATTEMPTED','CREATED_VERIFIED','VERIFIED'].includes(j.state)||![j.before?.revision,j.target?.revision].includes(input._context))throw Error('No matching saved event creation.');
   attempted=true;lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Another event operation is running.');
   beautyHubAuthSessionRequire_(token);if(props.getProperty(key)!==raw)throw Error('The saved creation changed. Resolve it again.');
   return beautyLiveCreateFinish_(key,j,token,true);
  }
  const current=beautyLiveTarget_();if(current.revision!==input._context)throw Error('The selected event changed. Reopen Event Setup.');
  if(action==='draft'){
   key=beautyLiveCreateKey_(input.leagueId,input.date);const events=beautyLiveContextFind_(input.leagueId,input.date);
   return {success:true,eventContext:current.revision,events,creationPending:beautyLiveEventCreatePending_(input.leagueId,input.date),date:input.date,leagueId:input.leagueId};
  }
  lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Another event operation is running.');
  const source=beautyLiveCreateSource_(input._context,token);
  if(action==='prepare'){
   key=beautyLiveCreateKey_(input.leagueId,input.date);if(props.getProperty(key))throw Error('A creation is already saved for this date. Resolve the existing issue.');
   if(beautyLiveContextFind_(input.leagueId,input.date).length)throw Error('An event already exists for this date. Open it from League / Tournament.');
   const title=input.title.trim();if(!title||title.length>60||/[\x00-\x1f\x7f<>]/.test(title)||/^[=+@-]/.test(title))throw Error('Enter an event name of 1–60 characters.');
   const configured=beautyHubCreateMatchSettings_(input.settings,beautyLiveCreateTemplate_());
   const set={title,status:20,t_date:Date.parse(input.date+'T12:00:00Z')/1000,lgid:input.leagueId,kind:'darts',team_games:0,game_type:5,private:0,join_pass:'AIK',common_join:1,individual_pass:0,...configured.set};
   const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
   const review={uid:actor.uid,session,context:current.revision,before:current,beforeSource:source.source,leagueId:input.leagueId,date:input.date,set,format:configured.format,summary:configured.summary,expires};
   const raw=JSON.stringify(review);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('Event settings are too large.');cache.put('beauty-live-create:'+ticket,raw,300);
   return {success:true,ticket,expires,event:{title,date:input.date,league:input.leagueId,format:configured.format,matchSettings:configured.summary},archive:{title:current.title,date:current.date},message:'Create this event and open it in the Hub. The current event registrations will be kept in event history.'};
  }
  if(input.confirmed!=='true'||!/^[a-f0-9]{32}$/.test(input.ticket))throw Error('Review and confirm the event first.');
  const cacheKey='beauty-live-create:'+input.ticket,review=JSON.parse(cache.get(cacheKey)||'null');
  if(!review||review.uid!==actor.uid||review.session!==session||review.context!==current.revision||review.beforeSource!==source.source||Date.now()>=review.expires)throw Error('The review expired or the current event changed. Review again.');
  key=beautyLiveCreateKey_(review.leagueId,review.date);if(props.getProperty(key)){j=JSON.parse(props.getProperty(key));attempted=true;throw Error('This creation already has a saved result. Resolve it instead of creating again.');}
  if(beautyLiveContextFind_(review.leagueId,review.date).length)throw Error('An event was added for this date. Open the existing event.');
  // Check once more after Nakka lookup, immediately before recording the intent.
  const final=beautyLiveCreateSource_(input._context,token);if(final.source!==review.beforeSource)throw Error('The current player list changed. Review again.');
  cache.remove(cacheKey);j={version:1,state:'ATTEMPTED',uid:actor.uid,leagueId:review.leagueId,date:review.date,before:review.before,beforeSource:review.beforeSource,set:review.set,format:review.format,summary:review.summary,targetRevision:Utilities.getUuid().replace(/-/g,''),startedAt:new Date().toISOString()};beautyLiveCreateStore_(key,j);attempted=true;
  let result;try{result=beautyLiveRegistrationApi_('tournament/create',{set:j.set});}catch(e){throw Error('The creation reply was not received. Resolve the saved issue; do not create again.');}
  if(!/^t_[A-Za-z0-9_]{1,80}$/.test(result.tdid||''))throw Error('The creation reply could not be verified. Resolve the saved issue.');
  j.createdId=result.tdid;beautyLiveCreateStore_(key,j);return beautyLiveCreateFinish_(key,j,token,true);
 }catch(e){return {success:false,code:e?.name==='HubAuthError'?'AUTH_REQUIRED':attempted?'EVENT_CREATE_UNVERIFIED':'EVENT_CREATE_REVIEW',uncertain:attempted,error:e.reviewMessage||e.message||'Event setup could not be checked.',...(attempted&&j?{creation:{leagueId:j.leagueId,date:j.date,reference:key}}:{})};}
 finally{if(lock)lock.releaseLock();}
}
