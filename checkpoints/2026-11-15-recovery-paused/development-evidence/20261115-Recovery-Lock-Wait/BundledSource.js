/* Real recovery core, fixed owner TEST workspace. Never promoted with these bindings. */
function beautyWorkspaceRecoveryConfig_(){return {sheetId:'1FvoMpJT78hFJmBIjY_SlLUd8BfOgG30vUR15Cvf_QnY',eventId:'t_jBaQ_2877',leagueId:'lg_M2wQ_4189',date:'2026-11-15',revision:'BEAUTY_RECOVERY_WORKSPACE_20261115_R1',mode:'league',title:'Beauty Recovery TEST 2026-11-15 R1'};}
function beautyWorkspaceRecoveryHash_(v){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v))).replace(/=+$/,'');}
function beautyWorkspaceRecoveryKey_(v){return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
function beautyWorkspaceRecoveryEnv_(token,connecting){
 const c=beautyWorkspaceRecoveryConfig_(),setup=beautyRecoveryWorkspaceIO_(),p=PropertiesService.getScriptProperties(),prefix='BWR1511_',hash=beautyWorkspaceRecoveryHash_;let ss;
 const guard=()=>{setup.guard();if(token!==null)beautyHubAuthRequire_(token);const j=setup.load();if(j?.state!=='READY'||j.sheetId!==c.sheetId||j.eventId!==c.eventId)throw Error('WORKSPACE_SETUP_MISMATCH');if(!connecting){const raw=p.getProperty(prefix+'CONNECTION');let a;try{a=JSON.parse(raw||'null');}catch(e){}if(a?.state!=='READY'||a.sheetId!==c.sheetId||a.eventId!==c.eventId)throw Error('Workspace connection is not verified. Return the owner setup log.');}return j;};
 const save=(key,value)=>{guard();if(!/^(CONNECTION|PREVIEW_[a-f0-9]{32}|JOB_[a-f0-9]{32}|ATTEMPT_[a-f0-9]{32})$/.test(key))throw Error('WORKSPACE_RECEIPT_KEY');const raw=JSON.stringify(value);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('WORKSPACE_RECEIPT_SIZE');p.setProperty(prefix+key,raw);if(p.getProperty(prefix+key)!==raw)throw Error('WORKSPACE_RECEIPT_READBACK');};
 const load=key=>{guard();const raw=p.getProperty(prefix+key);if(!raw)return null;try{return JSON.parse(raw);}catch(e){throw Error('A workspace receipt is unreadable. Preserve it for inspection.');}};
 const book=()=>{const j=guard();if(!ss)ss=SpreadsheetApp.openById(c.sheetId);if(ss.getId()!==c.sheetId||ss.getName()!==c.title+' — Workbook'||ss.getFormUrl()||ss.getSpreadsheetTimeZone()!=='Europe/Stockholm'||ss.getSpreadsheetLocale()!=='en_GB'||ss.getSheets().length!==5)throw Error('WORKSPACE_BOOK_IDENTITY');const headers={};for(const title of beautyRecoveryWorkspaceConfig_().tabs){const sh=ss.getSheetByName(title);if(!sh||sh.getRange('H1').getValue()!==c.revision||sh.getMaxRows()<1000||sh.getLastRow()>1000||sh.getLastColumn()>8)throw Error('WORKSPACE_TAB_IDENTITY');headers[title]=sh.getRange(1,1,1,6).getValues()[0];}if(hash(headers)!==j.headerHash||hash(ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,999,6).getFormulas())!==j.formulaHash)throw Error('WORKSPACE_TEMPLATE_CHANGED');const date=ss.getSheetByName('Control').getRange('A2').getValue();if(!(date instanceof Date)||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==c.date)throw Error('WORKSPACE_DATE_CHANGED');return ss;};
 const snapshot=()=>{const b=book(),out={};for(const title of beautyRecoveryWorkspaceConfig_().tabs){const sh=b.getSheetByName(title),r=sh.getRange(1,1,title==='Control'?2:1000,6);out[title]={id:sh.getSheetId(),values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return out;};
 const api=(path,body)=>{guard();if(body)throw Error('Use the guarded recovery write adapter.');if(!['tournament/get?tdid='+c.eventId+'&entry=0','tournament/entry/list?tdid='+c.eventId,'league/entry/list?lgid='+c.leagueId+'&count=1000'].includes(path))throw Error('WORKSPACE_GET_ONLY');return request(path);};
 const request=(path,body)=>{guard();const u=p.getProperty('N01_API_USER'),pw=p.getProperty('N01_API_PASSWORD');if(!u||!pw)throw Error('NAKKA_CREDENTIALS_MISSING');let r,d;try{r=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{method:body?'post':'get',headers:{Authorization:'Basic '+Utilities.base64Encode(u+':'+pw)},...(body?{contentType:'application/json',payload:JSON.stringify(body)}:{}),muteHttpExceptions:true,followRedirects:false});if(r.getResponseCode()!==200)throw Error();const text=r.getContentText();if(text.length>1000000)throw Error();d=JSON.parse(text);if(d.result!==0)throw Error();}catch(e){throw Error(body?'Provider reply not verified. Check the saved result; do not repeat.':'Nakka could not be read. Saved results are retained.');}guard();return d;};
 const event=()=>{const e=api('tournament/get?tdid='+c.eventId+'&entry=0').tournament;if(!e||e.tdid!==c.eventId||e.lgid!==c.leagueId||e.title!==c.title||![10,20].includes(e.status)||e.private!==1||e.entry_lock!==1||e.team_games!==0||!e.admin_id||e.t_date!==Date.parse(c.date+'T12:00:00Z')/1000)throw Error('The isolated event identity or pre-start status changed.');return {id:e.tdid,title:e.title,status:e.status,date:c.date};};
 const entries=data=>{if(!Array.isArray(data?.list)||data.list.length>=1000)throw Error('ENTRY_LIST_INCOMPLETE');const ids=new Set();return data.list.map(r=>{if(typeof r.name!=='string'||!r.name.trim()||!/^[A-Za-z0-9]{4}$/.test(r.tpid)||ids.has(r.tpid)||(r.lpid!=null&&r.lpid!==''&&(typeof r.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(r.lpid))))throw Error('ENTRY_IDENTITY');ids.add(r.tpid);return {name:r.name,tpid:r.tpid,lpid:r.lpid||''};});};
 const league=()=>{const data=api('league/entry/list?lgid='+c.leagueId+'&count=1000');if(!Array.isArray(data.list)||data.list.length>=1000)throw Error('LEAGUE_LIST_INCOMPLETE');const ids=new Set();return data.list.map(r=>{if(typeof r.name!=='string'||!/^[A-Za-z0-9]{4}$/.test(r.lpid)||ids.has(r.lpid))throw Error('LEAGUE_IDENTITY');ids.add(r.lpid);return {name:r.name,lpid:r.lpid};});};
 const jobs=()=>{guard();return Object.keys(p.getProperties()).filter(k=>/^BWR1511_JOB_[a-f0-9]{32}$/.test(k)).sort().map(k=>{try{const j=load(k.slice(prefix.length));if(!j||k!==prefix+'JOB_'+j.id||!['import','transfer'].includes(j.kind)||typeof j.player!=='string'||JSON.stringify(j.event)!==JSON.stringify(c))throw Error();return j;}catch(e){return {id:k.slice((prefix+'JOB_').length),state:'UNREADABLE',player:null};}});};
 const playerGuard=player=>{guard();for(const j of jobs()){if(j.state==='UNREADABLE')throw Error('A saved workspace receipt is unreadable. Owner inspection is needed before new repairs.');if(j.state!=='COMPLETE'&&beautyWorkspaceRecoveryKey_(j.player)===beautyWorkspaceRecoveryKey_(player))throw Error('This player has a saved repair. Use RECHECK SAVED RESULT.');}};
 const adapter=(kind,phase,id)=>{const rawKey='BEAUTY_RECOVERY_JOB_'+id;const props={getProperty:k=>{if(k!==rawKey)throw Error('JOB_ID');const j=load('JOB_'+id);return j?JSON.stringify(j):null;},setProperty:(k,text)=>{const j=JSON.parse(text);if(k!==rawKey||j.id!==id||j.kind!==kind||JSON.stringify(j.event)!==JSON.stringify(c))throw Error('JOB_ID');save('JOB_'+id,j);}};
  const attempt=type=>{guard();book();event();const j=load('JOB_'+id);if(phase!=='confirm'||j?.steps[type]!=='INTENT'||load('ATTEMPT_'+id))throw Error('No repeat write was sent. Inspect the saved result.');save('ATTEMPT_'+id,{id,kind,type,at:new Date().toISOString()});};
  const sheets=(path,body)=>{const j=load('JOB_'+id);if(kind!=='import'||path!==':batchUpdate'||j?.plan?.plans?.length!==2)throw Error('IMPORT_PLAN_REQUIRED');const expected={requests:j.plan.plans.map(x=>({updateCells:{range:{sheetId:x.sheetId,startRowIndex:x.start,endRowIndex:x.start+1,startColumnIndex:0,endColumnIndex:6},rows:[{values:x.values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}}))};if(JSON.stringify(body)!==JSON.stringify(expected))throw Error('IMPORT_PAYLOAD_CHANGED');for(const [i,title]of ['Form responses 2','PLAYER STATUS DATA'].entries()){const x=j.plan.plans[i],sh=book().getSheetByName(title);if(x.title!==title||x.sheetId!==sh.getSheetId()||x.start!==sh.getLastRow()||x.start<1||x.start>=99||x.capacity!==sh.getMaxRows())throw Error('IMPORT_TARGET_CHANGED');}attempt('records');Sheets.Spreadsheets.batchUpdate(body,c.sheetId);};
  const writeApi=(path,body)=>{if(!body)return api(path);const j=load('JOB_'+id),expected={tdid:c.eventId,add:[{name:j?.identity?.name,...(j?.identity?.lpid?{lpid:j.identity.lpid}:{})}]};if(kind!=='transfer'||path!=='tournament/entry/update'||!j.identity.lpid||JSON.stringify(body)!==JSON.stringify(expected))throw Error('TRANSFER_PAYLOAD_CHANGED');attempt('entry');return request(path,body);};
  return beautyWorkspaceExerciseAdapter_({PropertiesService:{getScriptProperties:()=>props},Utilities,SpreadsheetApp:{openById:requested=>{if(requested!==c.sheetId)throw Error('OWN_WORKBOOK_ONLY');return book();},flush:()=>SpreadsheetApp.flush()},beautyLiveTarget_:()=>{guard();return {...c};},beautyLiveContextEvent_:event,beautyLiveRemoveSnapshot_:snapshot,beautyLiveRemoveHash_:hash,beautyLiveRegistrationKey_:beautyWorkspaceRecoveryKey_,beautyLiveRemoveSerial_:beautyImportSerial_,beautyLiveRegistrationApi_:writeApi,beautyLiveRemoveEntries_:entries,beautyQueueWriteGuard_:playerGuard,beautyQueueLegacyBlock_:guard,beautyLiveRegistrationList_:league,beautyEventExternalWritesClosed_:()=>{book();event();},beautyEventSheets_:sheets,beautyLiveRegistrationSync_:(s,player)=>beautyWorkspaceRecoverySync_(s,player,book)},{kind,phase,id,load,guard});
 };
 guard();return {c,guard,book,snapshot,event,api,entries,league,save,load,jobs,adapter,setup};
}
function beautyWorkspaceRecoveryService_(action,input,token){
 let locked=false,lock;
 try{
  if(!input||Array.isArray(input))throw Error('Invalid recovery request.');const fields={list:'_context',preview:'_context,kind,player',confirm:'_context,ticket',recheck:'_context,ref'};
  if(!fields[action]||Object.keys(input).sort().join(',')!==fields[action]||Object.values(input).some(v=>typeof v!=='string'||v.length>180))throw Error('Invalid recovery request.');
  beautyHubAuthRequire_(token);if(input._context!==beautyContextToken_())throw Error('The selected Hub context changed. Reload before continuing.');
  lock=LockService.getScriptLock();
  const lockStarted=Date.now();locked=lock.tryLock(20000);
  console.log(JSON.stringify({diagnostic:'WORKSPACE_LOCK',action,acquired:locked,waitMs:Date.now()-lockStarted}));
  if(!locked)return {success:false,code:'WORKSPACE_BUSY',error:'The TEST project stayed busy for 20 seconds. This request did not start a repair. Use CHECK WORKSPACE to inspect earlier saved results; no repair was automatically repeated.'};
  beautyHubAuthRequire_(token);
  if(input._context!==beautyContextToken_())throw Error('The selected Hub context changed while waiting. Reload before continuing.');
  const e=beautyWorkspaceRecoveryEnv_(token,false),c=e.c;
  const response=extra=>({success:true,scope:'REAL_ISOLATED_WORKSPACE',workspace:c,context:input._context,checkedAt:new Date().toISOString(),...extra});
  if(action==='list'){e.book();const event=e.event(),entries=e.entries(e.api('tournament/entry/list?tdid='+c.eventId));return response({event,providerEntries:entries.length,jobs:e.jobs().map(j=>({id:j.id,kind:j.kind||'',player:j.player||'Receipt needs owner inspection',state:j.state,failure:j.failure||''})),message:'Separate recovery workspace. The main Hub event selection is unchanged.'});}
  if(action==='preview'){
   if(!['import','transfer'].includes(input.kind))throw Error('Choose transfer or import.');const id=Utilities.getUuid().replace(/-/g,''),core=(input.kind==='import'?beautyStandaloneImportCore_:beautyStandaloneTransferCore_)(e.adapter(input.kind,'preview',id)),s=core.state(input.kind,input.player);
   if(input.kind==='transfer'&&s.state.entry)throw Error('This player is already in Nakka. No transfer is needed.');
   const plan=input.kind==='import'?core.plan(s.state,s.ss):null;
   const preview={id,kind:input.kind,player:input.player,version:s.version,expires:Date.now()+600000,owner:Session.getActiveUser().getEmail().toLowerCase(),state:'READY',plan};e.save('PREVIEW_'+id,preview);
   return response({ticket:id,kind:input.kind,player:s.state.identity.name,message:(input.kind==='import'?'Import one Nakka entry into this separate workbook. Consent is N/A. Original registration time is unknown.':'Transfer this uniquely registered IN player into the separate Nakka event using the existing league identity.')+beautyWorkspaceExerciseNotice_(input.kind,input.player),expires:preview.expires});
  }
  let j,core;
  if(action==='confirm'){
   if(!/^[a-f0-9]{32}$/.test(input.ticket))throw Error('Invalid preview ticket.');const r=e.load('PREVIEW_'+input.ticket);if(!r||r.state!=='READY'||r.expires<=Date.now()||r.owner!==Session.getActiveUser().getEmail().toLowerCase()||e.load('JOB_'+r.id))throw Error('Preview expired or already used. Check saved results first.');
   core=(r.kind==='import'?beautyStandaloneImportCore_:beautyStandaloneTransferCore_)(e.adapter(r.kind,'confirm',r.id));const s=core.state(r.kind,r.player);if(s.version!==r.version)throw Error('The player or event changed. Make a fresh preview.');
   j={version:1,id:r.id,state:'PROCESSING',kind:r.kind,event:c,player:r.player,identity:s.state.identity,createdAt:new Date().toISOString(),steps:{},...(r.kind==='import'?{entry:s.state.entry,plan:r.plan}:{beforeCount:s.state.entries.length,beforeEntries:beautyWorkspaceRecoveryHash_(s.state.entries)})};
   e.save('PREVIEW_'+r.id,{...r,state:'CONSUMED'});core.save(j);
  }else{
   if(!/^[a-f0-9]{32}$/.test(input.ref))throw Error('Invalid saved result.');j=e.load('JOB_'+input.ref);if(!j||j.id!==input.ref||typeof j.player!=='string'||JSON.stringify(j.event)!==JSON.stringify(c)||!['import','transfer'].includes(j.kind)||!['INTENT','VERIFIED'].includes(j.steps?.[j.kind==='import'?'records':'entry']))throw Error('No attempted repair can be safely rechecked. Preserve the receipt for owner inspection.');
   core=(j.kind==='import'?beautyStandaloneImportCore_:beautyStandaloneTransferCore_)(e.adapter(j.kind,'recheck',j.id));
  }
  let detail;try{detail=core.run(j);}catch(err){j.state='REVIEW';j.failure=err.message||'Saved result needs review.';core.save(j);detail={success:false,outcome:'REVIEW',message:j.failure};}
  return response({ref:j.id,detail,message:detail.message||'Inspect the saved result. No automatic repeat.'});
 }catch(err){return {success:false,code:err?.name==='HubAuthError'?'AUTH_REQUIRED':'WORKSPACE_REVIEW',error:err?.name==='HubAuthError'?'Sign in to continue.':err.message||'Preserve the saved result for inspection.'};}
 finally{if(locked)lock.releaseLock();}
}
function beautyTestConnectRecoveryWorkspace20261115(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('WORKSPACE_BUSY');try{
  const e=beautyWorkspaceRecoveryEnv_(null,true),j=e.setup.load();e.setup.verifyOriginal(j);const b=e.book(),event=e.event(),current=e.load('CONNECTION');
  if(current&&current.state!=='READY')throw Error('Connection attempt needs read-only inspection. Do not repeat initialization.');
  if(!current){e.setup.verify(j);e.save('CONNECTION',{state:'INTENT',sheetId:e.c.sheetId,eventId:e.c.eventId});const control=b.getSheetByName('Control'),r=control.getRange('B2');if(r.getValue()!=='')throw Error('LAST_RESET_REVIEW');r.setValue(control.getRange('A2').getValue());SpreadsheetApp.flush();}
  const control=b.getSheetByName('Control');if(beautyImportSerial_(control.getRange('A2').getValue(),'Europe/Stockholm')!==beautyImportSerial_(control.getRange('B2').getValue(),'Europe/Stockholm'))throw Error('LAST_RESET_READBACK');
  e.setup.verifyOriginal(j);e.save('CONNECTION',{state:'READY',sheetId:e.c.sheetId,eventId:e.c.eventId,verifiedAt:new Date().toISOString()});
  const result={result:'TEST_RECOVERY_ADAPTER_CONNECTED',workspace:e.c,alreadyConnected:!!current,eventStatus:event.status,ownMasterList:true,linkedFormPresent:false,selectedEventUnchanged:true,productionChanged:false,repairPerformed:false,next:'Return this log. Then open Recovery > Separate recovery TEST workspace and CHECK WORKSPACE. Do not add players or repeat old Setup/Interrupt.'};console.log(JSON.stringify(result,null,2));return result;
 }finally{lock.releaseLock();}
}

function beautyTestReadRecoveryConnection20261115(){
 const e=beautyWorkspaceRecoveryEnv_(null,true),connection=e.load('CONNECTION'),b=e.book();
 const r={result:'TEST_RECOVERY_CONNECTION_READ_ONLY',state:connection?.state||'NOT_CONNECTED',workspace:e.c,resetDatePresent:b.getSheetByName('Control').getRange('B2').getValue()!=='',propertiesWritten:false,sheetsWritten:false,providerWrites:0,next:'Return this log. Do not repeat initialization or start a repair after an uncertain result.'};console.log(JSON.stringify(r,null,2));return r;
}

function beautyWorkspaceRecoverySync_(s,player,book){
 const beautyLiveRegistrationKey_=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const beautyLiveRegistrationRows_=(sh,width)=>{const ss=book();if(!['PLAYER STATUS DATA',"TONIGHT'S PLAYERS"].includes(sh.getName())||ss.getSheetByName(sh.getName()).getSheetId()!==sh.getSheetId()||sh.getRange('H1').getValue()!=='BEAUTY_RECOVERY_WORKSPACE_20261115_R1'||!Number.isInteger(width)||width<1||width>6)throw Error('FORMULA_READ_TARGET');return sh.getRange(2,1,99,width).getDisplayValues();};
 function beautyLiveRegistrationSync_(s,player) {
  const key=beautyLiveRegistrationKey_;
  for(let pass=0;pass<5;pass++){
    SpreadsheetApp.flush();if(pass)Utilities.sleep(1000);
    const displayRows=beautyLiveRegistrationRows_(s.tonight,1);
    const names=Array.from({length:99},(_,i)=>displayRows[i]?.[0]||'');
    if(names.filter(n=>key(n)===key(player)).length!==1)continue;
    const map=new Map();
    const snapshot=beautyLiveRegistrationRows_(s.store,6);
    for(const r of snapshot)if(key(r[0])){
      if(map.has(key(r[0])))throw Error('Duplicate status rows.');map.set(key(r[0]),['IN','OUT','STANDBY'].includes(r[2])?r[2]:'');
    }
    const values=names.map(n=>[map.get(key(n))||'']);
    s.tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
    const readback=beautyLiveRegistrationRows_(s.tonight,3);
    const after=Array.from({length:99},(_,i)=>readback[i]||['','','']);
    const current=beautyLiveRegistrationRows_(s.store,6);
    if(JSON.stringify(current)!==JSON.stringify(snapshot))continue;
    if(after.every((r,i)=>r[0]===names[i]&&r[2]===values[i][0])&&current.every(r=>!key(r[0])||map.get(key(r[0]))===(['IN','OUT','STANDBY'].includes(r[2])?r[2]:'')))return;
  }
  throw Error('Tonight display could not be verified.');
}
 beautyLiveRegistrationSync_(s,player);
}

/* Controlled synthetic fixtures for the connected recovery workspace only. */
function beautyWorkspaceExerciseNames_(){return {transferFault:'BEAUTY TEST R1 TRANSFER FAULT',transferCheck:'BEAUTY TEST R1 TRANSFER CHECK',importCheck:'BEAUTY TEST R1 IMPORT CHECK',importFault:'BEAUTY TEST R1 IMPORT FAULT'};}
function beautyWorkspaceExerciseReceipt_(value){
 const e=beautyWorkspaceRecoveryEnv_(null,false);e.guard();const p=PropertiesService.getScriptProperties(),key='BWR1511_EXERCISE';
 if(arguments.length){if(!value||value.version!==1||value.sheetId!==e.c.sheetId||value.eventId!==e.c.eventId)throw Error('EXERCISE_RECEIPT_TARGET');const raw=JSON.stringify(value);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('EXERCISE_RECEIPT_SIZE');p.setProperty(key,raw);if(p.getProperty(key)!==raw)throw Error('EXERCISE_RECEIPT_READBACK');return value;}
 const raw=p.getProperty(key);if(!raw)return null;let j;try{j=JSON.parse(raw);}catch(err){throw Error('EXERCISE_RECEIPT_UNREADABLE');}if(j?.version!==1||j.sheetId!==e.c.sheetId||j.eventId!==e.c.eventId)throw Error('EXERCISE_RECEIPT_TARGET');return j;
}
function beautyWorkspaceExerciseSeed_(io){
 io.guard();const prior=io.load();if(prior){if(prior.state!=='READY')throw Error('TEST_PLAYER_SETUP_REVIEW: do not repeat an uncertain setup; read its receipt.');return io.report(prior,true);}
 const j=io.preflight();j.state='LEAGUE_INTENT';io.save(j);
 try{io.createMembers(j);}catch(err){} // verify by GET; never replay the request
 io.verifyMembers(j);j.state='LEAGUE_READY';io.save(j);
 io.guard();io.assertEmptyBook(j);io.assertEmptyEvent(j);j.state='EVENT_INTENT';io.save(j);
 try{io.createEntries(j);}catch(err){}
 io.verifyEntries(j);j.state='EVENT_READY';io.save(j);
 io.guard();io.assertEmptyBook(j);j.state='SHEETS_INTENT';io.save(j);
 try{io.createRows(j);}catch(err){}
 io.verifyRows(j);j.state='SHEETS_READY';io.save(j);
 io.sync(j);io.verifyAll(j);j.state='READY';j.completedAt=new Date().toISOString();io.save(j);return io.report(j,false);
}
function beautyWorkspaceExerciseIO_(){
 const e=beautyWorkspaceRecoveryEnv_(null,false),c=e.c,names=beautyWorkspaceExerciseNames_(),all=Object.values(names),key=beautyWorkspaceRecoveryKey_,hash=beautyWorkspaceRecoveryHash_;let leagueAttempt=false,eventAttempt=false,sheetsAttempt=false;
 const receiptHash=()=>{const p=PropertiesService.getScriptProperties().getProperties();return hash(Object.fromEntries(Object.keys(p).filter(k=>/^(BFW1511_|BSI1511_|BST1411_|BPR1411_|BEAUTY_RECOVERY_JOB_|BWR1511_(JOB_|ATTEMPT_|PREVIEW_|CONNECTION))/.test(k)).sort().map(k=>[k,p[k]])));};
 const load=()=>beautyWorkspaceExerciseReceipt_(),save=j=>beautyWorkspaceExerciseReceipt_(j);
 const sorted=rows=>rows.slice().sort((a,b)=>a.lpid.localeCompare(b.lpid));
 const bookEmpty=j=>{const snap=e.snapshot();for(const t of ['Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"]){if(snap[t].values.slice(1).some(r=>r.some(v=>v!==''))||snap[t].formulas.flat().some(Boolean))throw Error('TEST_PLAYER_WORKBOOK_NOT_EMPTY');}if(snap["TONIGHT'S PLAYERS"].display.slice(1).some(r=>r.some(v=>v!=='')))throw Error('TEST_PLAYER_DISPLAY_NOT_EMPTY');if(j&&hash(snap.Control)!==j.control)throw Error('TEST_PLAYER_CONTROL_CHANGED');return snap;};
 const eventEmpty=()=>{e.event();if(e.entries(e.api('tournament/entry/list?tdid='+c.eventId)).length)throw Error('TEST_PLAYER_EVENT_NOT_EMPTY');};
 const original=j=>{e.guard();e.setup.verifyOriginal(e.setup.load());if(j&&receiptHash()!==j.receipts)throw Error('PRIOR_RECOVERY_RECEIPTS_CHANGED');};
 const verifyMembers=j=>{e.event();const list=e.league(),hits=list.filter(r=>all.some(n=>key(n)===key(r.name)));if(hits.length!==4||all.some(n=>hits.filter(r=>r.name===n).length!==1)||hash(sorted(list.filter(r=>!hits.includes(r))))!==j.leagueBefore||list.length!==j.leagueCount+4)throw Error('TEST_MEMBER_READBACK_REVIEW');const ids={};for(const [role,name]of Object.entries(names))ids[role]=hits.find(r=>r.name===name).lpid;if(j.members&&JSON.stringify(ids)!==JSON.stringify(j.members))throw Error('TEST_MEMBER_IDS_CHANGED');j.members=ids;};
 const verifyEntries=j=>{e.event();const entries=e.entries(e.api('tournament/entry/list?tdid='+c.eventId));if(entries.length!==2)throw Error('TEST_ENTRY_READBACK_REVIEW');const ids={};for(const role of ['importCheck','importFault']){const matches=entries.filter(r=>r.name===names[role]&&(!r.lpid||r.lpid===j.members[role]));if(matches.length!==1)throw Error('TEST_ENTRY_IDENTITY_REVIEW');ids[role]=matches[0].tpid;}if(j.entries&&JSON.stringify(ids)!==JSON.stringify(j.entries))throw Error('TEST_ENTRY_IDS_CHANGED');j.entries=ids;j.entryLeagueLinks=Object.fromEntries(['importCheck','importFault'].map(role=>[role,entries.find(r=>r.tpid===ids[role]).lpid?'MATCHED':'NOT_EXPOSED']));};
 const expectedRows=j=>({
  'Form responses 2':[names.transferFault,names.transferCheck].map(n=>[j.serial,n,'','N/A','','HUB']),
  'PLAYER STATUS DATA':[names.transferFault,names.transferCheck].map(n=>[n,'','IN','N/A','','HUB']),
  "PLAYER'S MASTER LIST":all.map(n=>[n,'','','','',''])
 });
 const verifyRows=j=>{const snap=e.snapshot(),rows=expectedRows(j);if(hash(snap.Control)!==j.control)throw Error('TEST_PLAYER_CONTROL_CHANGED');for(const [title,want]of Object.entries(rows)){const actual=snap[title].values.slice(1,1+want.length).map(r=>r.slice());if(title==='Form responses 2')for(const r of actual)r[0]=beautyImportSerial_(r[0],'Europe/Stockholm');if(JSON.stringify(actual)!==JSON.stringify(want)||snap[title].values.slice(1+want.length).some(r=>r.some(v=>v!==''))||snap[title].formulas.flat().some(Boolean))throw Error('TEST_PLAYER_ROWS_REVIEW');}return snap;};
 const writeApi=(path,body,j)=>{e.guard();e.book();e.event();const saved=load();let expected;
  if(path==='league/entry/update'){expected={lgid:c.leagueId,add:all.map(name=>({name}))};if(leagueAttempt||saved?.state!=='LEAGUE_INTENT'||saved.leagueBefore!==j.leagueBefore)throw Error('TEST_MEMBER_NO_REPEAT');const now=e.league();if(now.some(r=>all.some(n=>key(n)===key(r.name)))||hash(sorted(now))!==j.leagueBefore)throw Error('TEST_LEAGUE_CHANGED');leagueAttempt=true;}
  else if(path==='tournament/entry/update'){expected={tdid:c.eventId,add:['importCheck','importFault'].map(role=>({name:names[role],lpid:j.members[role]}))};if(eventAttempt||saved?.state!=='EVENT_INTENT'||JSON.stringify(saved.members)!==JSON.stringify(j.members))throw Error('TEST_ENTRY_NO_REPEAT');verifyMembers(j);eventEmpty();eventAttempt=true;}
  else throw Error('TEST_SETUP_ENDPOINT_BLOCKED');
  if(JSON.stringify(body)!==JSON.stringify(expected))throw Error('TEST_SETUP_PAYLOAD_BLOCKED');const p=PropertiesService.getScriptProperties(),u=p.getProperty('N01_API_USER'),pw=p.getProperty('N01_API_PASSWORD');if(!u||!pw)throw Error('NAKKA_CREDENTIALS_MISSING');
  // The intent was verified in Script Properties before this one request.
  UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{method:'post',contentType:'application/json',headers:{Authorization:'Basic '+Utilities.base64Encode(u+':'+pw)},payload:JSON.stringify(body),muteHttpExceptions:true,followRedirects:false});
 };
 const sync=()=>{const b=e.book();beautyWorkspaceRecoverySync_({store:b.getSheetByName('PLAYER STATUS DATA'),tonight:b.getSheetByName("TONIGHT'S PLAYERS")},names.transferFault,()=>e.book());};
 const verifyAll=j=>{verifyMembers(j);verifyEntries(j);const snap=verifyRows(j),shown=snap["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>r.some(Boolean));if(shown.length!==2||[names.transferFault,names.transferCheck].some(n=>shown.filter(r=>JSON.stringify(r)===JSON.stringify([n,'','IN','N/A','','HUB'])).length!==1))throw Error('TEST_PLAYER_DISPLAY_REVIEW');original(j);};
 const report=(j,already)=>({result:already?'TEST_PLAYERS_ALREADY_PREPARED':'TEST_RECOVERY_PLAYERS_READY',alreadyPrepared:already,workspace:c,players:names,createdByThisRun:already?{leagueMembers:0,eventEntries:0,sourceRows:0}:{leagueMembers:4,eventEntries:2,sourceRows:2},state:j.state,entryLeagueLinks:j.entryLeagueLinks||null,leagueLinksVerified:!!j.entryLeagueLinks&&Object.values(j.entryLeagueLinks).every(v=>v==='MATCHED'),ownMasterList:true,providerIsSynthetic:false,playersAreSynthetic:true,selectedEventUnchanged:true,productionChanged:false,repairPerformed:false,scope:already?'Saved setup receipt only; no reseeding or verification of later repairs.':'Native fixture setup verified. Real repair acceptance remains pending.',next:'Return this log before using the Hub repair buttons. Do not repeat setup or add players manually.'});
 return {guard:e.guard,load,save,verifyOriginal:original,preflight:()=>{original();if(e.jobs().length)throw Error('WORKSPACE_REPAIR_ALREADY_EXISTS');eventEmpty();const snap=bookEmpty(),list=e.league();if(list.some(r=>all.some(n=>key(n)===key(r.name))))throw Error('SYNTHETIC_NAMES_ALREADY_EXIST');const serial=beautyImportSerial_(snap.Control.values[1][0],'Europe/Stockholm');if(beautyImportSerial_(snap.Control.values[1][1],'Europe/Stockholm')!==serial)throw Error('TEST_RESET_DATE_CHANGED');return {version:1,sheetId:c.sheetId,eventId:c.eventId,createdAt:new Date().toISOString(),leagueBefore:hash(sorted(list)),leagueCount:list.length,control:hash(snap.Control),receipts:receiptHash(),serial};},assertEmptyBook:bookEmpty,assertEmptyEvent:eventEmpty,
 createMembers:j=>writeApi('league/entry/update',{lgid:c.leagueId,add:all.map(name=>({name}))},j),verifyMembers,
 createEntries:j=>writeApi('tournament/entry/update',{tdid:c.eventId,add:['importCheck','importFault'].map(role=>({name:names[role],lpid:j.members[role]}))},j),verifyEntries,
 createRows:j=>{e.guard();e.event();const saved=load();if(sheetsAttempt||saved?.state!=='SHEETS_INTENT'||saved.serial!==j.serial)throw Error('TEST_ROWS_NO_REPEAT');bookEmpty(j);const b=e.book(),requests=Object.entries(expectedRows(j)).map(([title,values])=>({updateCells:{range:{sheetId:b.getSheetByName(title).getSheetId(),startRowIndex:1,endRowIndex:1+values.length,startColumnIndex:0,endColumnIndex:6},rows:values.map(row=>({values:row.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))})),fields:'userEnteredValue'}}));sheetsAttempt=true;Sheets.Spreadsheets.batchUpdate({requests},c.sheetId);SpreadsheetApp.flush();},verifyRows,sync,verifyAll,report};
}
function beautyTestPrepareRecoveryPlayers20261115(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('WORKSPACE_BUSY');try{const r=beautyWorkspaceExerciseSeed_(beautyWorkspaceExerciseIO_());console.log(JSON.stringify(r,null,2));return r;}finally{lock.releaseLock();}
}
function beautyTestReadRecoveryPlayers20261115(){
 const e=beautyWorkspaceRecoveryEnv_(null,false),j=beautyWorkspaceExerciseReceipt_();e.book();const event=e.event(),entries=e.entries(e.api('tournament/entry/list?tdid='+e.c.eventId)),members=e.league(),names=beautyWorkspaceExerciseNames_(),snap=e.snapshot();
 const result={result:'TEST_RECOVERY_PLAYERS_READ_ONLY',state:j?.state||'NOT_PREPARED',workspace:e.c,eventStatus:event.status,players:Object.entries(names).map(([role,name])=>({role,name,leagueMatches:members.filter(r=>beautyWorkspaceRecoveryKey_(r.name)===beautyWorkspaceRecoveryKey_(name)).length,eventMatches:entries.filter(r=>beautyWorkspaceRecoveryKey_(r.name)===beautyWorkspaceRecoveryKey_(name)).length,sourceMatches:snap['Form responses 2'].values.slice(1).filter(r=>beautyWorkspaceRecoveryKey_(r[1])===beautyWorkspaceRecoveryKey_(name)).length,statusMatches:snap['PLAYER STATUS DATA'].values.slice(1).filter(r=>beautyWorkspaceRecoveryKey_(r[0])===beautyWorkspaceRecoveryKey_(name)).length})),propertiesWritten:false,sheetsWritten:false,providerWrites:0,next:'Return this report. Preserve any partial setup; do not repeat adds, delete receipts, or reseed.'};console.log(JSON.stringify(result,null,2));return result;
}
function beautyWorkspaceExerciseNotice_(kind,player){
 const j=beautyWorkspaceExerciseReceipt_(),n=beautyWorkspaceExerciseNames_();if(j?.state!=='READY')return '';
 if(kind==='transfer'&&player===n.transferFault)return ' CONTROLLED TEST: the add reply and immediate entry readback are deliberately interrupted. Expected result is REVIEW; inspect the saved result before rechecking.';
 if(kind==='import'&&player===n.importFault)return ' CONTROLLED TEST: the source-write reply and display refresh are deliberately interrupted. Expected result is REVIEW; recheck must not append the source again.';
 return '';
}
function beautyWorkspaceExerciseAdapter_(adapter,options){
 const j=beautyWorkspaceExerciseReceipt_();if(j?.state!=='READY')return adapter;const {kind,phase,id,load,guard}=options,n=beautyWorkspaceExerciseNames_();
 const matches=player=>{const job=load('JOB_'+id);return job&&job.player===player&&job.kind===kind;};
 if(phase==='confirm'&&kind==='transfer'){
  const api=adapter.beautyLiveRegistrationApi_;
  adapter.beautyLiveRegistrationApi_=(path,body)=>{guard();if(matches(n.transferFault)){
   if(!body&&path==='tournament/entry/list?tdid='+j.eventId&&load('ATTEMPT_'+id))throw Error('TEST_TRANSFER_READBACK_INTERRUPTED');
   if(body){api(path,body);throw Error('TEST_PROVIDER_REPLY_DISCARDED');}
  }return api(path,body);};
 }
 if(phase==='confirm'&&kind==='import'){
  const write=adapter.beautyEventSheets_,sync=adapter.beautyLiveRegistrationSync_;
  adapter.beautyEventSheets_=(path,body)=>{write(path,body);if(matches(n.importFault))throw Error('TEST_SHEETS_REPLY_DISCARDED');};
  adapter.beautyLiveRegistrationSync_=(s,player)=>{guard();if(matches(n.importFault))throw Error('TEST_IMPORT_DISPLAY_INTERRUPTED');return sync(s,player);};
 }
 return adapter;
}

/* Inspect provider IDs without credentials or mutations. A missing league link is not verified. */
function beautyTestInspectRecoveryEntryIds20261115(){
 const e=beautyWorkspaceRecoveryEnv_(null,false),j=beautyWorkspaceExerciseReceipt_(),names=beautyWorkspaceExerciseNames_();if(!j||!['EVENT_INTENT','EVENT_READY','SHEETS_INTENT','SHEETS_READY','READY'].includes(j.state))throw Error('SAVED_EVENT_ATTEMPT_REQUIRED');
 e.book();e.event();const league=e.league(),raw=e.api('tournament/entry/list?tdid='+e.c.eventId),entries=e.entries(raw);
 const players=['importCheck','importFault'].map(role=>{const matches=entries.filter(r=>r.name===names[role]),members=league.filter(r=>r.name===names[role]),entry=matches.length===1?matches[0]:null,original=entry?raw.list.find(r=>r.tpid===entry.tpid):null;return {role,name:names[role],eventMatches:matches.length,leagueMatches:members.length,eventPlayerId:entry?.tpid||null,expectedLeaguePlayerId:j.members?.[role]||null,currentLeaguePlayerId:members.length===1?members[0].lpid:null,returnedLeaguePlayerId:entry?.lpid||null,leagueIdFieldPresent:!!original&&Object.prototype.hasOwnProperty.call(original,'lpid'),leagueLinkStatus:entry?(entry.lpid?(entry.lpid===j.members?.[role]?'MATCHED':'CONFLICT'):'NOT_EXPOSED'):'ENTRY_REVIEW'};});
 const r={result:'TEST_RECOVERY_ENTRY_IDS_READ_ONLY',state:j.state,workspace:e.c,totalEventEntries:entries.length,players,propertiesWritten:false,sheetsWritten:false,providerWrites:0,next:'Return this report before resuming. NOT_EXPOSED does not prove a league link. Do not repeat setup or add players.'};console.log(JSON.stringify(r,null,2));return r;
}
function beautyWorkspaceExerciseResume_(io){
 io.guard();const j=io.load();if(!j)throw Error('SAVED_EVENT_ATTEMPT_REQUIRED');if(j.state==='READY')return io.report(j,true);
 if(!['EVENT_INTENT','EVENT_READY','SHEETS_INTENT','SHEETS_READY'].includes(j.state))throw Error('SETUP_STAGE_REQUIRES_OWNER_REVIEW');
 io.verifyOriginal(j);io.verifyMembers(j);io.verifyEntries(j);
 if(['EVENT_INTENT','EVENT_READY'].includes(j.state)){
  io.assertEmptyBook(j);j.state='EVENT_READY';io.save(j);j.state='SHEETS_INTENT';io.save(j);
  try{io.createRows(j);}catch(err){} // one source batch only; a later resume only reads its result
 }
 io.verifyRows(j);j.state='SHEETS_READY';io.save(j);io.sync(j);io.verifyAll(j);j.state='READY';j.completedAt=new Date().toISOString();io.save(j);
 const r=io.report(j,false);r.result='TEST_RECOVERY_PLAYERS_RESUMED';r.createdByThisRun=undefined;r.providerWriteAttempts=0;r.sourceSetupVerified=true;r.resumedExistingSetup=true;r.next='Return this log before using the Hub repair buttons. Do not repeat setup or interruption.';return r;
}
function beautyTestResumeRecoveryPlayers20261115(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('WORKSPACE_BUSY');try{const r=beautyWorkspaceExerciseResume_(beautyWorkspaceExerciseIO_());console.log(JSON.stringify(r,null,2));return r;}finally{lock.releaseLock();}
}
