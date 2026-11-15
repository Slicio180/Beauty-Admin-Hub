/* Queue UI pilot — fixed Google TEST project and three dedicated fixture tabs.
 * Original event records, master list, Nakka and original handlers are untouched.
 * This pilot uses the original pure identity resolver and actual Hub auth.
 */
function beautyQueueUiConfig_(){return {"build": "beauty-queue-ui-20261109-v1", "scriptId": "1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N", "context": {"version": 1, "mode": "league", "leagueId": "lg_M2wQ_4189", "eventId": "t_gINp_8026", "date": "2026-11-07", "title": "AIK Hub TEST 2026-11-07", "revision": "7badf194ceda4cff92e5a7205045b638", "sheetId": "17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE"}, "headUrl": "https://script.google.com/macros/s/AKfycbzxCh96nXkHmSzYJOiO3NI3l0UJvFCeAJv1t-eBgII/exec"};}
function beautyQueueUiGuard_(){
 const c=beautyQueueUiConfig_();beautyHubTestGuard_();
 if(ScriptApp.getScriptId()!==c.scriptId)throw Error('QUEUE_UI_PROJECT');
 const current=beautyContextRead_();if(!current||Object.keys(c.context).some(k=>current[k]!==c.context[k]))throw Error('QUEUE_UI_CONTEXT');
 return c;
}
function beautyQueueUiBook_(){
 const c=beautyQueueUiGuard_(),ss=SpreadsheetApp.openById(c.context.sheetId);
 if(ss.getId()!==c.context.sheetId||ss.getName()!=='Beauty TEST · AIK Hub TEST 2026-11-07 · 2026-11-07'||Utilities.formatDate(ss.getSheetByName('Control').getRange('A2').getValue(),'Europe/Stockholm','yyyy-MM-dd')!==c.context.date)throw Error('QUEUE_UI_WORKBOOK');
 return ss;
}
function beautyQueueUiMarker_(){const c=beautyQueueUiConfig_();return JSON.stringify({build:c.build,scriptId:c.scriptId,context:c.context,fixtureOnly:true});}
function beautyTestQueueUiSetup20261109(){
 const c=beautyQueueUiGuard_(),ss=beautyQueueUiBook_(),lock=LockService.getScriptLock(),created=[];
 if(!lock.tryLock(5000))throw Error('QUEUE_UI_BUSY');
 try{
  for(const name of ['BQUI1109_Jobs','BQUI1109_Records','BQUI1109_Display']){
   let sh=ss.getSheetByName(name);
   if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,4).setValues([['REQUEST ID',name==='BQUI1109_Jobs'?'DURABLE JOB JSON':'REGISTRATION JSON','QUEUE UI TEST ONLY',beautyQueueUiMarker_()]]);created.push(name);}
   if(sh.getRange('D1').getDisplayValue()!==beautyQueueUiMarker_())throw Error('QUEUE_UI_MARKER');
  }
  SpreadsheetApp.flush();
 }finally{lock.releaseLock();}
 const deployment=c.headUrl;
 const report={check:'BEAUTY_QUEUE_UI_SETUP',build:c.build,result:'READY',scriptId:c.scriptId,spreadsheetId:c.context.sheetId,createdTabs:created,originalEventTabsWritten:false,nakkaNetworkCalls:0,workbooksCreated:0,
  pages:['queuehub','queuekiosk','queuemobile'].map(page=>({page,url:deployment?deployment+'?page='+page:null})),note:'Open through TEST deployment / Test deployments. Provider is simulated. Original event pages are unchanged.'};
 console.log(JSON.stringify(report,null,2));return report;
}
function beautyQueueUiIo_(name){
 if(!['BQUI1109_Jobs','BQUI1109_Records','BQUI1109_Display'].includes(name))throw Error('QUEUE_UI_TAB');
 const c=beautyQueueUiGuard_(),ss=beautyQueueUiBook_(),sh=ss.getSheetByName(name);
 if(!sh||sh.getRange('D1').getDisplayValue()!==beautyQueueUiMarker_())throw Error('QUEUE_UI_SETUP_REQUIRED');
 function call(row,values){
  beautyQueueUiGuard_();if(!Number.isInteger(row)||row<0||row===1||row>501)throw Error('QUEUE_UI_RANGE');
  if(values!==undefined&&(!row||!Array.isArray(values)||values.length!==2||values.some(v=>typeof v!=='string')))throw Error('QUEUE_UI_VALUES');
  const a1="'"+name+"'!"+(row?'A'+row+':B'+row:'A2:B501'),write=values!==undefined;
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+c.context.sheetId+'/values/'+encodeURIComponent(a1)+'?'+(write?'valueInputOption=RAW&includeValuesInResponse=true&responseValueRenderOption=UNFORMATTED_VALUE':'valueRenderOption=UNFORMATTED_VALUE'),
   {method:write?'put':'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},...(write?{contentType:'application/json',payload:JSON.stringify({range:a1,majorDimension:'ROWS',values:[values]})}:{}),muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('QUEUE_UI_SHEETS_HTTP_'+r.getResponseCode());const data=JSON.parse(r.getContentText());
  if(write){if(data.updatedRows!==1||data.updatedCells!==2)throw Error('QUEUE_UI_WRITE_UNCERTAIN');return data.updatedData?.values?.[0]||[];}
  if(data.values!==undefined&&!Array.isArray(data.values))throw Error('QUEUE_UI_READ');return data.values||[];
 }
 return {readRows:()=>call(0),readRow:r=>call(r)[0]||[],writeRow:(r,values)=>call(r,values)};
}
function beautyQueueUiQueue_(){return beautyQueueCore20261109_(beautyQueueStore20261109_(beautyQueueUiIo_('BQUI1109_Jobs'),LockService.getScriptLock()),()=>Date.now(),()=>Utilities.getUuid().replace(/-/g,''));}
function beautyQueueUiEvent_(){const c=beautyQueueUiConfig_();return {mode:'league',leagueId:'lg_queue_ui_fixture',eventId:'t_queue_ui_fixture',date:c.context.date,revision:c.build,sheetId:c.context.sheetId};}
function beautyQueueUiMaster_(jobs){return [...new Set(Array.from({length:20},(_,i)=>'Queue Test '+String(i+1).padStart(2,'0')).concat(jobs.map(j=>j.request.player)))].sort((a,b)=>a.localeCompare(b,'sv-SE'));}
function beautyQueueUiError_(e){
 const known=['QUEUE_BUSY_NOT_ACCEPTED','QUEUE_WRITE_UNCERTAIN','REQUEST_ID_REUSED','QUEUE_UI_SETUP_REQUIRED','QUEUE_UI_CONTEXT','QUEUE_UI_BUSY','RECOVERY_INVALID','RECOVERY_CONFIRMATION','RECOVERY_EVENT_CHANGED','RECOVERY_IN_PROGRESS','RECOVERY_REVIEW_CHANGED','RECOVERY_AUDIT_LIMIT','RECOVERY_DISPLAY_CONFLICT','RECOVERY_READBACK_UNCERTAIN'];
 return {success:false,code:e?.name==='HubAuthError'?'AUTH_REQUIRED':known.includes(e?.message)?e.message:'QUEUE_UNAVAILABLE',error:'The TEST queue could not confirm this request. Keep the same request reference and check again.',retryable:['QUEUE_BUSY_NOT_ACCEPTED','QUEUE_UI_BUSY'].includes(e?.message)};
}
function beautyQueueUiPublic_(j){return {success:true,accepted:true,requestId:j.request.requestId,player:j.request.player,registrationEventDate:j.request.event.date,queueState:j.state,queueFailure:j.failure,queueRecovered:j.recovery?.state==='COMPLETE',queueSaved:j.outcomes.save.state==='VERIFIED',providerSimulated:true,nakka:{entryConfirmed:false,simulated:true,message:'QUEUE TEST: Nakka is simulated.'}};}
function beautyQueueUiContext(){
 try{beautyQueueUiGuard_();const q=beautyQueueUiQueue_();return {success:true,registrationAvailable:true,names:beautyQueueUiMaster_(q.list()).concat(BeautyNameResolution.newPlayerOption),eventDate:beautyQueueUiEvent_().date,eventContext:beautyQueueUiEvent_().revision,eventTitle:'QUEUE TEST · inga Nakka-ändringar'};}catch(e){return beautyQueueUiError_(e);}
}
function beautyQueueUiEnqueue_(source,input){
 beautyQueueUiGuard_();
 const allowed=['requestId','eventDate','_context','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
 if(!input||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)||typeof input[k]!=='string')||!/^bqui_[a-f0-9]{64}$/.test(input.requestId||'')||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000) return {success:false,code:'INVALID',error:'Check registration fields.'};
 const event=beautyQueueUiEvent_();if(input._context!==event.revision||input.eventDate!==event.date)return {success:false,code:'STALE_EVENT',error:'Reload the queue TEST event.'};
 const q=beautyQueueUiQueue_(),jobs=q.list(),old=jobs.find(j=>j.request.requestId===input.requestId);
 const normalized={...input};if(input.selectedName===BeautyNameResolution.newPlayerOption)normalized.newName=String(input.newName||'').trim().toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
 // On a lost reply, resolve the original accepted identity without treating itself
 // as a duplicate. The immutable request comparison below still rejects edits.
 const others=old?jobs.filter(j=>j.request.requestId!==old.request.requestId):jobs;
 const master=beautyQueueUiMaster_(others),tonight=others.map(j=>j.request.player);
 let decision=BeautyNameResolution.resolve(normalized,master,tonight);
 if(old){
  // The original selected fixture name/new name must still resolve to the same
  // identity; suppress only the duplicate introduced by this exact request.
  if(!decision.success&&decision.code==='UNKNOWN_PLAYER'&&normalized.selectedName===old.request.player)decision={success:true,player:old.request.player};
 }
 if(!decision.success)return decision;
 const playerId='name:'+Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,BeautyNameResolution.key(decision.player)).map(b=>(b&255).toString(16).padStart(2,'0')).join('');
 const request={requestId:input.requestId,event,playerId,player:decision.player,source,consent:input.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ',message:input.message||''};
 const saved=q.enqueue(request);
 if(saved.duplicate)return {success:false,code:'ALREADY_REGISTERED',error:'This player already has a saved request for this event.'};
 return beautyQueueUiPublic_(saved.job);
}
function beautyQueueUiMobile(input){try{return beautyQueueUiEnqueue_('MOBIL',input);}catch(e){return beautyQueueUiError_(e);}}
function beautyQueueUiKiosk(input){try{return beautyQueueUiEnqueue_('KIOSK',input);}catch(e){return beautyQueueUiError_(e);}}
function beautyQueueUiStatus(requestId){
 try{beautyQueueUiGuard_();if(!/^bqui_[a-f0-9]{64}$/.test(requestId||''))throw Error('INVALID');const rows=beautyQueueUiQueue_().list(),j=rows.find(x=>x.request.requestId===requestId);return j?beautyQueueUiPublic_(j):{success:true,accepted:false,requestId,queueState:'NOT_FOUND'};}catch(e){return beautyQueueUiError_(e);}
}
function beautyQueueUiStatuses(requestIds){
 try{beautyQueueUiGuard_();if(!Array.isArray(requestIds)||requestIds.length>25||requestIds.some(id=>!/^bqui_[a-f0-9]{64}$/.test(id)))throw Error('INVALID');return {success:true,items:beautyQueueUiQueue_().list().filter(j=>requestIds.includes(j.request.requestId)).map(beautyQueueUiPublic_)};}catch(e){return beautyQueueUiError_(e);}
}
function beautyQueueUiNames(){beautyQueueUiGuard_();return beautyQueueUiIo_('BQUI1109_Display').readRows().map(row=>JSON.parse(row[1]).player).sort((a,b)=>a.localeCompare(b,'sv-SE'));}
function beautyQueueUiHub(action,input,token){
 try{
  beautyQueueUiGuard_();beautyHubAuthRequire_(token);
  if(action==='register')return beautyQueueUiEnqueue_('HUB',input);
  if(['queue:review','queue:resolve'].includes(action))return beautyQueueUiRecovery_(action,input,token);
  const q=beautyQueueUiQueue_(),jobs=q.list(),event=beautyQueueUiEvent_();
  if(action==='read'){
   const records=beautyQueueUiIo_('BQUI1109_Records').readRows().filter(row=>row.length).map(row=>JSON.parse(row[1]));
   const players=records.map(r=>({player:r.player,newPlayer:/^Queue Test (0[1-9]|1[0-9]|20)$/.test(r.player)?'':r.player,status:'IN',consent:r.consent,message:r.message,whereFrom:r.source,registeredAt:(()=>{const job=jobs.find(j=>j.request.player===r.player&&j.request.event.eventId===r.eventId);return job&&Number.isFinite(job.createdAt)?new Date(job.createdAt).toISOString():null;})()}));
   return {success:true,mode:'test',eventDate:event.date,eventDateDisplay:event.date,eventContext:event.revision,activeEvent:{...event,title:'QUEUE TEST · Nakka simulation'},players,playerCount:players.length,masterPlayers:beautyQueueUiMaster_(jobs).concat(BeautyNameResolution.newPlayerOption),updatedAt:new Date().toISOString(),attention:beautyQueueUiAttention_(jobs),queueItems:jobs.map(beautyQueueUiPublic_)};
  }
  if(action==='queue:list')return {success:true,items:jobs.map(beautyQueueUiPublic_)};
  if(action==='context:list')return {success:true,connections:[],active:{...event,title:'QUEUE TEST'},context:event.revision};
  if(action==='attentionrefresh')return {success:true,attention:beautyQueueUiAttention_(jobs)};
  if(action==='nakkahealth')return {success:true,status:'UNAVAILABLE',message:'QUEUE TEST: Nakka is simulated.',timestamp:new Date().toISOString()};
  if(action==='nakkaevent')return {success:true,status:'MATCHED',eventDate:event.date,event:{id:event.eventId,title:'QUEUE TEST · no provider changes',date:event.date,url:''}};
  return {success:false,code:'BLOCKED',error:'Only registration and queue status are available in this TEST view.'};
 }catch(e){return beautyQueueUiError_(e);}
}
function beautyQueueUiProcess(requestId){
 try{
  beautyQueueUiGuard_();if(!/^bqui_[a-f0-9]{64}$/.test(requestId||''))throw Error('INVALID');
  const q=beautyQueueUiQueue_(),jobs=q.list();if(!jobs.some(j=>j.request.requestId===requestId))throw Error('REQUEST_MISSING');
  // Deliberate pilot pacing, shared across the three views. Kept in fixture E1,
  // not Script Properties. This is a correctness pilot, not a speed release.
  const gate=LockService.getScriptLock();if(!gate.tryLock(5000))throw Error('QUEUE_UI_BUSY');
  try{const sh=beautyQueueUiBook_().getSheetByName('BQUI1109_Jobs'),next=Number(sh.getRange('E1').getValue())||0;
   if(next>Date.now())return {success:true,processed:null,providerSimulated:true,paced:true};
   sh.getRange('E1').setValue(Date.now()+30000);SpreadsheetApp.flush();
  }finally{gate.releaseLock();}

  function persist(name,request,operationId){
   const io=beautyQueueUiIo_(name),index=jobs.findIndex(j=>j.request.requestId===request.requestId);if(index<0)throw Error('QUEUE_UI_ID');
   const values=[request.requestId,JSON.stringify({eventId:request.event.eventId,player:request.player,consent:request.consent,message:request.message,source:request.source})];
   const before=io.readRow(index+2);if(before.length&&JSON.stringify(before)!==JSON.stringify(values))throw Error('QUEUE_UI_RECORD_CHANGED');
   if(!before.length&&JSON.stringify(io.writeRow(index+2,values))!==JSON.stringify(values))throw Error('QUEUE_UI_RECORD_UNCERTAIN');
   if(JSON.stringify(io.readRow(index+2))!==JSON.stringify(values))throw Error('QUEUE_UI_RECORD_UNCERTAIN');
   return {verified:true,recordId:operationId};
  }
  const result=q.processNext({save:(r,id)=>persist('BQUI1109_Records',r,id),provider:(r,id)=>{
   // Intentionally no Nakka fetch. One fixture name injects an uncertain result.
   if(r.player==='Queue Test 01')throw Error('SIMULATED_PROVIDER_UNCERTAIN');return {verified:true,recordId:'simulated:'+id};
  },display:(r,id)=>{if(r.player==='Queue Test 02')throw Error('SIMULATED_DISPLAY_UNCERTAIN');return persist('BQUI1109_Display',r,id);}});
  return {success:true,processed:result?beautyQueueUiPublic_(result):null,providerSimulated:true};
 }catch(e){return beautyQueueUiError_(e);}
}

/* Staff-only recovery for the two deliberate fixture failures. Never a Nakka adapter. */
function beautyQueueUiAttention_(jobs){return {available:true,complete:true,eventDate:beautyQueueUiEvent_().date,checkedAt:new Date().toISOString(),items:jobs.filter(j=>j.state==='ATTENTION').map(j=>({name:j.request.player,code:'QUEUE_REVIEW',requestId:j.request.requestId,registrationDiagnostic:{source:j.request.source,stage:j.failure,code:j.failure,recordedAt:new Date(j.updatedAt).toISOString()}}))};}
function beautyQueueUiRecoveryHash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value)).map(b=>(b&255).toString(16).padStart(2,'0')).join('');}
function beautyQueueUiRecoveryRead_(id){
 if(!/^bqui_[a-f0-9]{64}$/.test(id||''))throw Error('RECOVERY_INVALID');
 const jobs=beautyQueueUiQueue_().list(),index=jobs.findIndex(j=>j.request.requestId===id);if(index<0)throw Error('REQUEST_MISSING');
 const job=jobs[index],r=job.request;
 if(JSON.stringify(r.event)!==JSON.stringify(beautyQueueUiEvent_()))throw Error('RECOVERY_EVENT_CHANGED');
 const expected=[id,JSON.stringify({eventId:r.event.eventId,player:r.player,consent:r.consent,message:r.message,source:r.source})];
 const record=beautyQueueUiIo_('BQUI1109_Records').readRow(index+2),display=beautyQueueUiIo_('BQUI1109_Display').readRow(index+2);
 const same=v=>JSON.stringify(v)===JSON.stringify(expected);
 const supported=job.state==='ATTENTION'&&job.claim===null&&job.outcomes.save.state==='VERIFIED'&&((r.player==='Queue Test 01'&&job.failure==='PROVIDER_UNCERTAIN'&&job.outcomes.provider.state==='INTENT'&&job.outcomes.display.state==='PENDING')||(r.player==='Queue Test 02'&&job.failure==='DISPLAY_UNCERTAIN'&&job.outcomes.provider.state==='VERIFIED'&&job.outcomes.display.state==='INTENT'));
 const busy=job.recovery?.state==='INTENT'&&Date.now()<job.recovery.expiresAt;
 const eligible=supported&&same(record)&&(!display.length||same(display))&&!busy;
 return {job,index,expected,record,display,eligible,busy,fingerprint:beautyQueueUiRecoveryHash_({job,record,display})};
}
function beautyQueueUiRecovery_(action,input,token){
 const actor=beautyHubAuthRequire_(token);beautyQueueUiGuard_();
 if(!input||Object.keys(input).some(k=>!['requestId','fingerprint','confirmed'].includes(k)))throw Error('RECOVERY_INVALID');
 const view=beautyQueueUiRecoveryRead_(input.requestId),j=view.job;
 if(action==='queue:review')return {success:true,providerSimulated:true,requestId:input.requestId,player:j.request.player,eventDate:j.request.event.date,queueState:j.state,failure:j.failure,eligible:view.eligible,fingerprint:view.fingerprint,recordVerified:JSON.stringify(view.record)===JSON.stringify(view.expected),displayStatus:!view.display.length?'MISSING':JSON.stringify(view.display)===JSON.stringify(view.expected)?'VERIFIED':'CONFLICT',busy:view.busy,audit:j.recovery||null,plan:'Keep the saved registration unchanged. Verify the simulated provider outcome, restore only the missing TEST display row, and archive the resolution in this request. No Nakka calls.'};
 if(action!=='queue:resolve'||input.confirmed!=='RESOLVE_SIMULATED_REQUEST')throw Error('RECOVERY_CONFIRMATION');
 if(j.state==='COMPLETE'&&j.recovery?.state==='COMPLETE')return {success:true,alreadyResolved:true,requestId:input.requestId,audit:j.recovery,providerSimulated:true};
 if(!view.eligible||input.fingerprint!==view.fingerprint)throw Error(view.busy?'RECOVERY_IN_PROGRESS':'RECOVERY_REVIEW_CHANGED');
 const io=beautyQueueUiIo_('BQUI1109_Jobs'),store=beautyQueueStore20261109_(io,LockService.getScriptLock()),operation=Utilities.getUuid().replace(/-/g,'');
 const intent=store.transaction(tx=>{
  const current=tx.list().find(x=>x.request.requestId===input.requestId);
  if(JSON.stringify(current)!==JSON.stringify(j))throw Error('RECOVERY_REVIEW_CHANGED');
  if((current.recovery?.attempts?.length||0)>=5||current.history.length>17)throw Error('RECOVERY_AUDIT_LIMIT');
  current.recovery={...(current.recovery||{auditId:'recovery:'+input.requestId,before:{revision:current.revision,state:current.state,failure:current.failure,outcomes:JSON.parse(JSON.stringify(current.outcomes))},attempts:[]}),state:'INTENT',token:operation,expiresAt:Date.now()+600000,providerSimulated:true};
  current.recovery.attempts.push({at:new Date().toISOString(),actor:actor.uid,action:'RESOLVE_SIMULATED_REQUEST',reviewFingerprint:view.fingerprint,displayBefore:view.display.length?'VERIFIED':'MISSING'});
  current.revision++;current.updatedAt=Date.now();current.history.push({at:current.updatedAt,event:'RECOVERY_INTENT'});tx.put(current,j.revision);return current;
 });
 // A durable audit intent exists before any display repair. Uncertain replies are read back, never blindly repeated.
 beautyHubAuthRequire_(token);beautyQueueUiGuard_();
 const displayIo=beautyQueueUiIo_('BQUI1109_Display');
 let actual=displayIo.readRow(view.index+2);
 if(actual.length&&JSON.stringify(actual)!==JSON.stringify(view.expected))throw Error('RECOVERY_DISPLAY_CONFLICT');
 if(!actual.length){try{displayIo.writeRow(view.index+2,view.expected);}catch(e){}actual=displayIo.readRow(view.index+2);}
 if(JSON.stringify(actual)!==JSON.stringify(view.expected)||JSON.stringify(beautyQueueUiIo_('BQUI1109_Records').readRow(view.index+2))!==JSON.stringify(view.expected))throw Error('RECOVERY_READBACK_UNCERTAIN');
 beautyHubAuthRequire_(token);beautyQueueUiGuard_();
 const finished=store.transaction(tx=>{
  const current=tx.list().find(x=>x.request.requestId===input.requestId);
  if(current.revision!==intent.revision||current.recovery?.token!==operation||Date.now()>=current.recovery.expiresAt)throw Error('RECOVERY_REVIEW_CHANGED');
  for(const step of ['provider','display'])if(current.outcomes[step].state!=='VERIFIED')current.outcomes[step]={...current.outcomes[step],state:'VERIFIED',recordId:'simulated-recovery:'+input.requestId+':'+step};
  current.state='COMPLETE';current.failure=null;current.claim=null;current.recovery.state='COMPLETE';current.recovery.completedAt=new Date().toISOString();current.recovery.completedBy=actor.uid;current.recovery.recordProof=beautyQueueUiRecoveryHash_(view.expected);current.recovery.displayProof=beautyQueueUiRecoveryHash_(actual);current.recovery.after={state:'COMPLETE',outcomes:JSON.parse(JSON.stringify(current.outcomes))};
  current.revision++;current.updatedAt=Date.now();current.history.push({at:current.updatedAt,event:'RECOVERY_COMPLETE'});tx.put(current,intent.revision);return current;
 });
 return {success:true,requestId:input.requestId,audit:finished.recovery,providerSimulated:true,playerRecordsChanged:false,nakkaCalls:0};
}
