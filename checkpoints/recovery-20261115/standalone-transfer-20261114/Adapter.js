/* Fixed standalone Nakka TEST. Only one synthetic entry may be added.
 * Original TEST event binding and original event tabs are never written.
 */
function beautyStandaloneConfig_(){return {eventId:'t_xeWf_2939',leagueId:'',mode:'tournament',date:'2026-11-14',title:'Beauty Recovery TEST 2026-11-14.',sheetId:'17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',revision:'standalone-recovery-20261114',player:'BEAUTY TEST TRANSFER 1411'};}
function beautyStandaloneKeys_(){return {baseline:'BST1411_BASELINE',preview:'BST1411_PREVIEW',job:'BST1411_JOB',attempt:'BST1411_PROVIDER_ATTEMPT',result:'BST1411_RESULT'};}
function beautyStandaloneGuard_(){beautyPartialNativeOwner_();const p=PropertiesService.getScriptProperties();if(p.getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'))throw Error('EVENT_SWITCH_PENDING');return beautyStandaloneConfig_();}
function beautyStandaloneLocked_(fn){beautyStandaloneGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('STANDALONE_TEST_BUSY');try{return fn();}finally{lock.releaseLock();}}
function beautyStandaloneProperty_(key,value){if(!Object.values(beautyStandaloneKeys_()).includes(key))throw Error('TEST_PROPERTY_ONLY');beautyStandaloneGuard_();const p=PropertiesService.getScriptProperties();if(value===undefined)return p.getProperty(key);const text=JSON.stringify(value);if(Utilities.newBlob(text).getBytes().length>8500)throw Error('TEST_RECEIPT_SIZE');p.setProperty(key,text);if(p.getProperty(key)!==text)throw Error('TEST_RECEIPT_READBACK');return text;}
function beautyStandaloneGet_(key){const raw=beautyStandaloneProperty_(key);return raw?JSON.parse(raw):null;}
function beautyStandaloneReadApi_(path){
 beautyStandaloneGuard_();if(!['tournament/get?tdid=t_xeWf_2939&entry=0','tournament/entry/list?tdid=t_xeWf_2939'].includes(path))throw Error('TEST_GET_ONLY');
 const p=PropertiesService.getScriptProperties(),u=p.getProperty('N01_API_USER'),pw=p.getProperty('N01_API_PASSWORD');if(!u||!pw)throw Error('NAKKA_CREDENTIALS_MISSING');
 let r;try{r=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(u+':'+pw)},muteHttpExceptions:true,followRedirects:false});}catch(e){throw Error('TEST_PROVIDER_UNAVAILABLE');}
 if(r.getResponseCode()!==200)throw Error('TEST_PROVIDER_HTTP_'+r.getResponseCode());let d;try{d=JSON.parse(r.getContentText());}catch(e){throw Error('TEST_PROVIDER_JSON');}if(!d||d.result!==0)throw Error('TEST_PROVIDER_RESULT');return d;
}
function beautyStandaloneEvent_(){const c=beautyStandaloneGuard_(),e=beautyStandaloneReadApi_('tournament/get?tdid=t_xeWf_2939&entry=0').tournament;
 if(!e||e.tdid!==c.eventId||(e.lgid||'')!==''||e.title!==c.title||!e.admin_id||e.team_games!==0||typeof e.t_date!=='number'||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==c.date||![10,20].includes(e.status))throw Error('STANDALONE_TEST_EVENT_REVIEW');
 return {tdid:e.tdid,lgid:'',title:e.title,status:e.status,t_date:e.t_date,updateTime:e.updateTime};
}
function beautyStandaloneMap_(){return {Control:'BST1411_Control','Form responses 2':'BST1411_Responses','PLAYER STATUS DATA':'BST1411_Status',"TONIGHT'S PLAYERS":'BST1411_Display',"PLAYER'S MASTER LIST":'BST1411_Master'};}
function beautyStandaloneMarker_(){return 'BEAUTY_STANDALONE_TRANSFER_V1:t_xeWf_2939';}
function beautyStandaloneTab_(ss,title){const name=beautyStandaloneMap_()[title];if(!name)throw Error('TEST_TAB_ONLY');const sh=ss.getSheetByName(name);if(!sh||sh.getRange('H1').getValue()!==beautyStandaloneMarker_())throw Error('STANDALONE_FIXTURE_MARKER');return sh;}
function beautyStandaloneSnapshot_(ss){const out={};for(const title of Object.keys(beautyStandaloneMap_())){const sh=beautyStandaloneTab_(ss,title),r=sh.getRange(1,1,10,6);out[title]={id:sh.getSheetId(),values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return out;}
function beautyStandalonePreserved_(ss){const b=beautyStandaloneGet_(beautyStandaloneKeys_().baseline);if(!b||beautyPartialNativeOriginalHash_(ss)!==b.original||beautyPartialNativeHash_(beautyStandaloneSnapshot_(ss))!==b.fixture)throw Error('STANDALONE_PRESERVATION_REVIEW');}
function beautyStandaloneSetup_(ss){
 const keys=beautyStandaloneKeys_(),b=beautyStandaloneGet_(keys.baseline);if(b){beautyStandalonePreserved_(ss);return;}
 if(beautyStandaloneGet_(keys.job)||beautyStandaloneGet_(keys.attempt)||beautyStandaloneGet_(keys.preview))throw Error('SETUP_RECEIPT_REVIEW');
 const original=beautyPartialNativeOriginalHash_(ss),map=beautyStandaloneMap_();
 // Never overwrite existing or partially created tabs: owner inspection is required.
 if(Object.values(map).some(n=>ss.getSheetByName(n)))throw Error('EXISTING_FIXTURE_REVIEW');
 const c=beautyStandaloneConfig_(),date=new Date('2026-11-14T12:00:00Z');
 for(const [title,name] of Object.entries(map)){
  beautyStandaloneGuard_();const rows=Array.from({length:10},()=>Array(6).fill(''));
  rows[0]=title==='Control'?['START DATE','LAST RESET','','','','']:title==='Form responses 2'?['Timestamp','PLAYER','NEW NAME','CONSENT','MESSAGE','SOURCE']:['PLAYER','OLD NAME','STATUS','CONSENT','MESSAGE','SOURCE'];
  if(title==='Control')rows[1]=[date,date,'','','',''];
  else if(title==='Form responses 2')rows[1]=[date,c.player,'','JA, JAG GODKÄNNER','Synthetic TEST only.   ','TEST'];
  else if(title==="PLAYER'S MASTER LIST")rows[1][0]=c.player;
  else rows[1]=[c.player,'','IN','JA','Synthetic TEST only.   ','TEST'];
  const sh=ss.insertSheet(name);sh.getRange('H1').setValue(beautyStandaloneMarker_());sh.getRange(1,1,10,6).setValues(rows);
 }
 SpreadsheetApp.flush();if(beautyPartialNativeOriginalHash_(ss)!==original)throw Error('ORIGINALS_CHANGED');
 beautyStandaloneProperty_(keys.baseline,{original,fixture:beautyPartialNativeHash_(beautyStandaloneSnapshot_(ss)),createdAt:new Date().toISOString()});
}
function beautyStandaloneAdapter_(ss){
 const c=beautyStandaloneConfig_(),keys=beautyStandaloneKeys_();
 const hash=beautyPartialNativeHash_,guard=()=>beautyStandaloneGuard_();
 const props={getProperty:k=>{if(!/^BEAUTY_RECOVERY_JOB_[a-f0-9]{32}$/.test(k))throw Error('JOB_KEY');const j=beautyStandaloneGet_(keys.job);if(j&&k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('JOB_ID');return j?JSON.stringify(j):null;},setProperty:(k,text)=>{const j=JSON.parse(text);if(k!=='BEAUTY_RECOVERY_JOB_'+j.id||j.kind!=='transfer'||j.player!==c.player||j.event.eventId!==c.eventId)throw Error('JOB_ID');beautyStandaloneProperty_(keys.job,j);}};
 function api(path,payload){
  if(!payload)return beautyStandaloneReadApi_(path);
  guard();beautyStandalonePreserved_(ss);beautyStandaloneEvent_();
  if(path!=='tournament/entry/update'||JSON.stringify(payload)!==JSON.stringify({tdid:c.eventId,add:[{name:c.player}]}))throw Error('TEST_ADD_ONLY');
  const j=beautyStandaloneGet_(keys.job);if(!j||j.kind!=='transfer'||j.steps.entry!=='INTENT'||beautyStandaloneGet_(keys.attempt))throw Error('TEST_NO_REPEAT');
  // Durable, single-attempt barrier before the actual network call.
  beautyStandaloneProperty_(keys.attempt,{jobId:j.id,eventId:c.eventId,player:c.player,at:new Date().toISOString(),count:1});
  const p=PropertiesService.getScriptProperties(),u=p.getProperty('N01_API_USER'),pw=p.getProperty('N01_API_PASSWORD');if(!u||!pw)throw Error('NAKKA_CREDENTIALS_MISSING');
  try {UrlFetchApp.fetch('https://push.n01darts.com/api/v1/tournament/entry/update',{method:'post',contentType:'application/json',headers:{Authorization:'Basic '+Utilities.base64Encode(u+':'+pw)},payload:JSON.stringify(payload),muteHttpExceptions:true,followRedirects:false});}catch(e){}
  // Deliberately discard the reply. The production transfer core must verify by GET.
  throw Error('TEST_DISCARDED_PROVIDER_REPLY');
 }
 return {PropertiesService:{getScriptProperties:()=>props},Utilities,SpreadsheetApp:{openById:id=>{if(id!==c.sheetId)throw Error('TEST_BOOK_ONLY');guard();return ss;}},
  beautyLiveTarget_:()=>{beautyStandaloneGuard_();return {...c};},beautyLiveContextEvent_:()=>beautyStandaloneEvent_(),
  beautyLiveRemoveSnapshot_:()=>beautyStandaloneSnapshot_(ss),beautyLiveRemoveHash_:hash,
  beautyLiveRegistrationKey_:s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'),
  beautyLiveRegistrationApi_:api,beautyLiveRemoveEntries_:beautyStandaloneEntries_,
  beautyQueueWriteGuard_:guard,beautyQueueLegacyBlock_:guard,
  beautyLiveRegistrationList_:()=>{throw Error('NO_LEAGUE_CALLS');}};
}
function beautyStandaloneEntries_(data){if(!data||!Array.isArray(data.list)||data.list.length>=1000)throw Error('ENTRY_LAYOUT');const ids=new Set();return data.list.map(r=>{if(!r||typeof r.name!=='string'||!r.name.trim()||!/^[A-Za-z0-9]{4}$/.test(r.tpid)||ids.has(r.tpid)||(r.lpid!=null&&r.lpid!==''))throw Error('ENTRY_IDENTITY');ids.add(r.tpid);return {name:r.name,tpid:r.tpid,lpid:''};});}
function beautyStandaloneOutput_(r){console.log(JSON.stringify(r,null,2));return r;}
function beautyTestStandaloneTransferPreview20261114(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),c=beautyStandaloneConfig_(),keys=beautyStandaloneKeys_();beautyStandaloneEvent_();
 if(beautyStandaloneGet_(keys.job)||beautyStandaloneGet_(keys.attempt))throw Error('USE_STANDALONE_RECHECK');
 const entries=beautyStandaloneEntries_(beautyStandaloneReadApi_('tournament/entry/list?tdid=t_xeWf_2939'));if(entries.length)throw Error('EMPTY_STANDALONE_TEST_REQUIRED');
 beautyStandaloneSetup_(ss);const core=beautyStandaloneTransferCore_(beautyStandaloneAdapter_(ss)),s=core.state('transfer',c.player);
 const review={ticket:Utilities.getUuid().replace(/-/g,''),version:s.version,expires:Date.now()+600000,owner:Session.getActiveUser().getEmail().toLowerCase()};beautyStandaloneProperty_(keys.preview,review);
 return beautyStandaloneOutput_({result:'STANDALONE_TRANSFER_PREVIEW_READY',event:{id:c.eventId,title:c.title,date:c.date,mode:c.mode},player:c.player,providerWrites:0,originalEventTabsUnchanged:true,hubBindingChanged:false,confirmation:'Run beautyTestStandaloneTransferConfirm20261114 within 10 minutes to add this one synthetic entry. Its reply will be discarded deliberately; saved state is verified by readback.',scope:'Production transfer state/step/run core with isolated native TEST adapter; not Hub UI or import verification'});
 });}
function beautyTestStandaloneTransferConfirm20261114(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),c=beautyStandaloneConfig_(),keys=beautyStandaloneKeys_();beautyStandalonePreserved_(ss);
 if(beautyStandaloneGet_(keys.job)||beautyStandaloneGet_(keys.attempt))throw Error('USE_STANDALONE_RECHECK');
 const review=beautyStandaloneGet_(keys.preview);if(!review||review.consumed||Date.now()>=review.expires||review.owner!==Session.getActiveUser().getEmail().toLowerCase())throw Error('FRESH_PREVIEW_REQUIRED');
 const core=beautyStandaloneTransferCore_(beautyStandaloneAdapter_(ss)),s=core.state('transfer',c.player);if(s.version!==review.version||s.state.entries.length)throw Error('STALE_PREVIEW');
 beautyStandaloneProperty_(keys.preview,{...review,consumed:true});
 const job={version:1,id:review.ticket,state:'PROCESSING',kind:'transfer',event:s.state.context,player:c.player,identity:s.state.identity,createdAt:new Date().toISOString(),steps:{},beforeCount:0,beforeEntries:beautyPartialNativeHash_([])};
 core.save(job);return beautyStandaloneRunReport_(ss,core,job,'CONFIRM');
 });}
function beautyStandaloneRunReport_(ss,core,job,phase){
 let result;try{result=core.run(job);}catch(e){job.state='REVIEW';job.failure=e.message;core.save(job);result={success:false,outcome:'REVIEW',error:e.message};}
 beautyStandalonePreserved_(ss);const keys=beautyStandaloneKeys_(),report={result:result.success?'STANDALONE_TRANSFER_VERIFIED':'STANDALONE_TRANSFER_REVIEW',phase,player:job.player,eventId:job.event.eventId,jobId:job.id,providerWriteAttempts:beautyStandaloneGet_(keys.attempt)?.count||0,replyDiscardedForTest:true,originalEventTabsUnchanged:true,fixtureSourceUnchanged:true,hubBindingChanged:false,productionChanged:false,detail:result,scope:'Real provider entry and production transfer core through isolated TEST adapter; UI/import/full recovery remain pending'};
 beautyStandaloneProperty_(keys.result,report);return beautyStandaloneOutput_(report);
}
function beautyTestStandaloneTransferRecheck20261114(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),keys=beautyStandaloneKeys_(),job=beautyStandaloneGet_(keys.job);if(!job||job.kind!=='transfer'||job.event.eventId!=='t_xeWf_2939'||job.player!==beautyStandaloneConfig_().player)throw Error('NO_MATCHING_TEST_RECEIPT');
 // Recheck cannot initiate an unattempted write.
 if(job.steps.entry!=='INTENT'&&job.steps.entry!=='VERIFIED')throw Error('NO_PROVIDER_INTENT_INSPECT_RECEIPT');
 return beautyStandaloneRunReport_(ss,beautyStandaloneTransferCore_(beautyStandaloneAdapter_(ss)),job,'RECHECK');
 });}
