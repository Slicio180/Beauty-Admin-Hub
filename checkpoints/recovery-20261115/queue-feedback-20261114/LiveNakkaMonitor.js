/* Authenticated read-only comparison. Processing jobs are progress, not failures. */
function beautyLiveMonitorRoster_(){
 const ranges=["'Control'!A2","'TONIGHT''S PLAYERS'!A2:B","'PLAYER STATUS DATA'!A2:C"];
 const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
 if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==3||beautyLiveDate_(data.valueRanges[0].values?.[0]?.[0])!==beautyLiveTarget_().date)throw Error('Monitor sheet/date read failed.');
 for(const part of data.valueRanges){if(part.values!==undefined&&(!Array.isArray(part.values)||part.values.length>19999||part.values.some(r=>!Array.isArray(r))))throw Error('Incomplete monitor rows.');}
 const key=beautyLiveRegistrationKey_,statuses=new Map();
 for(const r of data.valueRanges[2].values||[]){if(!key(r[0]))continue;if(statuses.has(key(r[0])))throw Error('Duplicate status records.');statuses.set(key(r[0]),String(r[2]||''));}
 return (data.valueRanges[1].values||[]).map(r=>({name:String(r[0]||r[1]||'').trim(),status:statuses.get(key(r[0]||r[1]))||''})).filter(r=>r.name).sort((a,b)=>a.name.localeCompare(b.name)||a.status.localeCompare(b.status));
}
function beautyLiveMonitorProject_(roster,entries,jobs){
 const key=beautyLiveRegistrationKey_,map=new Map(),comparison={matched:[],hubOnly:[],nakkaOnly:[],ambiguous:[],outNotInNakka:[]},issues=[];
 for(const p of roster){const k=key(p.name);if(!map.has(k))map.set(k,{name:p.name,hub:[],nakka:[]});map.get(k).hub.push(p);}
 for(const p of entries){const k=key(p.name);if(!map.has(k))map.set(k,{name:p.name,hub:[],nakka:[]});map.get(k).nakka.push(p);}
 const pending=new Map(jobs.map(j=>[key(j.player),j]));
 for(const r of map.values()){
  const row={name:r.name,hubCount:r.hub.length,nakkaCount:r.nakka.length,status:r.hub[0]?.status||''},job=pending.get(key(r.name));
  if(r.hub.length>1||r.nakka.length>1){comparison.ambiguous.push(row);issues.push({name:r.name,kind:'duplicate',message:'Duplicate names need organiser review.'});}
  else if(!r.nakka.length&&row.status==='OUT')comparison.outNotInNakka.push(row);
  else if(!r.nakka.length){comparison.hubOnly.push(row);if(!job)issues.push({name:r.name,kind:'mismatch',message:'Registered in the Hub but not found in this Nakka event.'});}
  else if(!r.hub.length){comparison.nakkaOnly.push(row);if(!job)issues.push({name:r.name,kind:'mismatch',message:'Present in Nakka but not registered in this Hub event.'});}
  else comparison.matched.push(row);
 }
 for(const j of jobs.filter(j=>j.state==='REVIEW')){
  const existing=issues.find(i=>key(i.name)===key(j.player));
  if(existing)existing.message+=' Registration also needs rechecking.';
  else issues.push({name:j.player,kind:'queue',jobId:j.id,message:j.failure||'Registration needs rechecking.'});
 }
 for(const rows of Object.values(comparison))rows.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
 return {comparison,issues};
}
function beautyLiveNakkaMonitor(input,token){
 const started=Date.now();let outcome='CHECK_UNAVAILABLE';
 try{
  beautyLiveLoginGuard_();beautyHubAuthRequire_(token);const target=beautyLiveTarget_();
  if(!input||Array.isArray(input)||Object.keys(input).join(',')!=='_context'||input._context!==target.revision)throw Error('STALE_EVENT');
  const jobs=()=>beautyQueueOpen_().filter(j=>j.event.revision===target.revision).map(j=>({id:j.id,player:j.player,state:j.state,failure:j.failure||''}));
  const pending=()=>['BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_STATUS_PENDING','BEAUTY_LIVE_REMOVE_PENDING'].filter(k=>PropertiesService.getScriptProperties().getProperty(k));
  const p1=pending(),q1=jobs(),roster=beautyLiveMonitorRoster_(),checked=beautyLiveEventRead_(),entries=beautyLiveRegistrationList_('event');
  if(entries.length>2000||entries.some(p=>!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!p.tpid))throw Error('INVALID_LIST');
  const after=beautyLiveMonitorRoster_(),q2=jobs(),p2=pending();beautyHubAuthRequire_(token);beautyContextAssert_();
  if(JSON.stringify(roster)!==JSON.stringify(after)||JSON.stringify(p1)!==JSON.stringify(p2)||JSON.stringify(q1)!==JSON.stringify(q2)){outcome='CHECK_IN_PROGRESS';return {success:false,code:outcome,context:target.revision,error:'Registrations changed during this check. Checking again shortly.'};}
  const result=beautyLiveMonitorProject_(roster,entries,q2),labels={BEAUTY_LIVE_REGISTRATION_PENDING:'Unfinished registration',BEAUTY_LIVE_STATUS_PENDING:'Unfinished status change',BEAUTY_LIVE_REMOVE_PENDING:'Unfinished removal'};
  for(const p of p2)result.issues.push({name:labels[p],kind:'legacy',message:'An older operation receipt needs owner review. It has not been replayed or cleared.'});
  outcome='VERIFIED';return {success:true,context:target.revision,event:checked.event,eventDate:target.date,checkedAt:new Date().toISOString(),hubCount:roster.length,nakkaCount:entries.length,...result,pending:p2.length,queueJobs:q2,processing:q2.filter(j=>j.state!=='REVIEW').length};
 }catch(e){outcome=e?.name==='HubAuthError'?'AUTH_REQUIRED':'CHECK_UNAVAILABLE';return {success:false,code:outcome,error:'The selected event and player lists could not be verified. Sign in or check again. No player changes were made.'};}
 finally{try{console.log(JSON.stringify({kind:'BEAUTY_MONITOR_TIMING',totalMs:Date.now()-started,outcome}));}catch(ignored){}}
}
