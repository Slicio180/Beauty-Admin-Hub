/* Owner-run, fixed TEST target; provider GET only. Never enables writes. */
function beautyTestNakkaRecoveryCheck20261114() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw Error('TEST_CHECK_BUSY');
  try {
    const binding = beautyTestRecoveryBindingCheck20261114();
    if (binding.result !== 'TEST_BINDING_READ_ONLY_VERIFIED') throw Error('TEST_BINDING_REQUIRED');
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty('BEAUTY_EVENT_CONTEXT_V1');
    const c = JSON.parse(raw || 'null');
    if (!c || c.revision !== '7badf194ceda4cff92e5a7205045b638' ||
        c.sheetId !== '17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE' ||
        c.leagueId !== 'lg_M2wQ_4189' || c.eventId !== 't_gINp_8026' ||
        c.date !== '2026-11-07' || c.mode !== 'league' || c.version !== 1) throw Error('TEST_CONTEXT_CHANGED');
    const user = props.getProperty('N01_API_USER'), password = props.getProperty('N01_API_PASSWORD');
    if (!user || !password) throw Error('NAKKA_CREDENTIALS_MISSING');
    let calls = 0;
    function get(path) {
      if (props.getProperty('BEAUTY_EVENT_CONTEXT_V1') !== raw) throw Error('TEST_CONTEXT_CHANGED');
      let response;
      try {
        calls++;
        response = UrlFetchApp.fetch('https://push.n01darts.com/api/v1/' + path, {
          method:'get', headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
          muteHttpExceptions:true, followRedirects:false
        });
      } catch (_) { throw Error('NAKKA_READ_UNAVAILABLE'); }
      if (response.getResponseCode() !== 200) throw Error('NAKKA_READ_HTTP_'+response.getResponseCode());
      let data;
      try { data = JSON.parse(response.getContentText()); } catch (_) { throw Error('NAKKA_READ_INVALID_JSON'); }
      if (!data || data.result !== 0) throw Error('NAKKA_READ_INVALID_RESULT');
      return data;
    }
    const league = get('league/get?lgid=lg_M2wQ_4189').league;
    if (!league || league.lgid !== c.leagueId || typeof league.title !== 'string' ||
        !/\bTEST\b/i.test(league.title) || !league.admin_id) throw Error('TEST_LEAGUE_IDENTITY_REVIEW');
    const event = get('tournament/get?tdid=t_gINp_8026&entry=0').tournament;
    if (!event || event.tdid !== c.eventId || event.lgid !== c.leagueId ||
        typeof event.title !== 'string' || !event.title.trim() || event.title !== c.title ||
        typeof event.t_date !== 'number' || !Number.isFinite(event.t_date) ||
        Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd') !== c.date ||
        !event.admin_id || !Number.isInteger(event.status)) throw Error('TEST_EVENT_IDENTITY_REVIEW');
    const after = beautyTestRecoveryBindingCheck20261114();
    if (after.result !== 'TEST_BINDING_READ_ONLY_VERIFIED' || props.getProperty('BEAUTY_EVENT_CONTEXT_V1') !== raw) throw Error('TEST_CONTEXT_CHANGED');
    const report = {result:'TEST_NAKKA_EVENT_READ_ONLY_VERIFIED',checkedAt:new Date().toISOString(),
      league:{id:league.lgid,title:league.title,adminAccessConfirmed:true},
      event:{id:event.tdid,title:event.title,date:c.date,status:event.status},
      nakkaCalls:calls,providerEventVerified:true,propertiesWritten:false,sheetsWritten:false,
      providerWrites:0,recoveryWritesEnabled:false,productionChanged:false,
      scope:'Event identity only; no transfer, import, roster or failure-recovery verification'};
    console.log(JSON.stringify(report,null,2)); return report;
  } finally { lock.releaseLock(); }
}

/* Owner-only readiness report. Fixed TEST project/league/workbook; GET only.
 * No event selection, setup, property write, receipt change or player write.
 */
function beautyTestRecoveryReadiness20261115(){
 const expected={scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',sheetId:'17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',leagueId:'lg_M2wQ_4189',eventId:'t_gINp_8026',date:'2026-11-07',revision:'7badf194ceda4cff92e5a7205045b638'};
 if(ScriptApp.getScriptId()!==expected.scriptId)throw Error('TEST_PROJECT_REQUIRED');
 if(Session.getActiveUser().getEmail().toLowerCase()!=='alessiotampella@gmail.com')throw Error('TEST_OWNER_REQUIRED');
 const props=PropertiesService.getScriptProperties(),raw=props.getProperty('BEAUTY_EVENT_CONTEXT_V1');let c;
 try{c=JSON.parse(raw||'null');}catch(e){throw Error('TEST_CONTEXT_REQUIRED');}
 if(!c||c.version!==1||c.mode!=='league'||Object.keys(expected).filter(k=>k!=='scriptId').some(k=>c[k]!==expected[k]))throw Error('TEST_CONTEXT_REQUIRED');
 const unchanged=()=>{if(props.getProperty('BEAUTY_EVENT_CONTEXT_V1')!==raw||props.getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'))throw Error('TEST_CONTEXT_CHANGED');};unchanged();
 const ss=SpreadsheetApp.openById(expected.sheetId);if(ss.getId()!==expected.sheetId)throw Error('TEST_WORKBOOK_REQUIRED');
 const required=['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"],tabs={};
 for(const name of required){const tab=ss.getSheetByName(name);if(!tab)throw Error('TEST_REQUIRED_TAB_MISSING');tabs[name]={rows:tab.getLastRow()};}
 const date=ss.getSheetByName('Control').getRange('A2').getValue();if(!(date instanceof Date)||!Number.isFinite(date.getTime())||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==expected.date)throw Error('TEST_WORKBOOK_DATE_CHANGED');
 const display=ss.getSheetByName("TONIGHT'S PLAYERS"),formulas=display.getRange(1,1,Math.max(1,Math.min(display.getLastRow(),20)),6).getFormulas();
 const workbook={id:ss.getId(),date:expected.date,tabs,linkedFormPresent:Boolean(ss.getFormUrl()),displayFormulaCellsInFirst20Rows:formulas.flat().filter(v=>typeof v==='string'&&v.startsWith('=')).length};
 const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');if(!user||!password)throw Error('NAKKA_CREDENTIALS_MISSING');
 let calls=0;const allowed=new Set(['league/get?lgid='+expected.leagueId,'league/tournament/list?lgid='+expected.leagueId+'&count=1000','tournament/get?tdid='+expected.eventId+'&entry=0']);
 const get=path=>{unchanged();if(!allowed.has(path)||++calls>9)throw Error('READ_SCOPE_BLOCKED');let response;
  try{response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false});}catch(e){throw Error('NAKKA_READ_UNAVAILABLE');}
  if(response.getResponseCode()!==200)throw Error('NAKKA_READ_HTTP');let value;try{const text=response.getContentText();if(text.length>1000000)throw Error();value=JSON.parse(text);}catch(e){throw Error('NAKKA_READ_LAYOUT');}if(value?.result!==0)throw Error('NAKKA_READ_RESULT');unchanged();return value;};
 const league=get('league/get?lgid='+expected.leagueId).league;if(!league||league.lgid!==expected.leagueId||typeof league.title!=='string'||!/^Beauty TEST\b/i.test(league.title)||!league.admin_id)throw Error('TEST_LEAGUE_REQUIRED');
 const validate=(e,id)=>{if(!e||e.tdid!==id||e.lgid!==expected.leagueId||typeof e.title!=='string'||!e.title.trim()||e.title.length>300||!Number.isInteger(e.status)||!Number.isFinite(e.t_date))throw Error('EVENT_LAYOUT');return {id:e.tdid,title:e.title,date:Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd'),status:e.status};};
 const selectedRaw=get('tournament/get?tdid='+expected.eventId+'&entry=0').tournament,selected=validate(selectedRaw,expected.eventId);if(selected.date!==expected.date||selected.title!==c.title||!selectedRaw.admin_id)throw Error('SELECTED_EVENT_CHANGED');
 const list=get('league/tournament/list?lgid='+expected.leagueId+'&count=1000').list;if(!Array.isArray(list)||list.length>=1000)throw Error('EVENT_LIST_INCOMPLETE');const ids=new Set();
 for(const e of list){if(!e||typeof e.tdid!=='string'||!/^t_[A-Za-z0-9_]{1,80}$/.test(e.tdid)||ids.has(e.tdid)||e.lgid!==expected.leagueId||typeof e.title!=='string'||e.title.length>300||!Number.isFinite(e.t_date))throw Error('EVENT_LIST_LAYOUT');ids.add(e.tdid);}
 const candidates=list.filter(e=>e.tdid!==expected.eventId&&/\bTEST\b/i.test(e.title)).sort((a,b)=>b.t_date-a.t_date||a.tdid.localeCompare(b.tdid));const inspected=[];
 for(const item of candidates.slice(0,3)){const detailPath='tournament/get?tdid='+item.tdid+'&entry=0';allowed.add(detailPath);const e=get(detailPath).tournament,r=validate(e,item.tdid);r.adminAccessConfirmed=Boolean(e.admin_id);r.singles=e.team_games===0;r.preStart=[10,20].includes(e.status);r.entryCount=null;r.emptyPreStartCandidate=false;
  if(r.adminAccessConfirmed&&r.singles&&r.preStart&&/\bTEST\b/i.test(r.title)){const entryPath='tournament/entry/list?tdid='+item.tdid;allowed.add(entryPath);const entries=get(entryPath).list;if(!Array.isArray(entries)||entries.length>=1000)throw Error('ENTRY_LIST_INCOMPLETE');r.entryCount=entries.length;r.emptyPreStartCandidate=entries.length===0;}inspected.push(r);}
 unchanged();const after=ss.getSheetByName('Control').getRange('A2').getValue();if(!(after instanceof Date)||Utilities.formatDate(after,'Europe/Stockholm','yyyy-MM-dd')!==expected.date)throw Error('TEST_WORKBOOK_DATE_CHANGED');
 const report={result:'TEST_RECOVERY_READINESS_READ_ONLY',checkedAt:new Date().toISOString(),selected,workbook,candidates:inspected,totalOtherTestEvents:candidates.length,uninspectedCount:Math.max(0,candidates.length-3),nakkaCalls:calls,propertiesWritten:false,sheetsWritten:false,providerWrites:0,eventSelected:false,recoveryWritesEnabled:false,scope:'Readiness only. Candidate events are not selected or authorised for repair; workbook/form isolation and recovery adapter still require implementation.'};
 console.log(JSON.stringify(report,null,2));return report;
}

/* Owner-run provisioning only. Normal Hub selection and recovery writes stay off. */
function beautyRecoveryWorkspaceConfig_(){return {scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',owner:'alessiotampella@gmail.com',oldSheet:'17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',oldEvent:'t_gINp_8026',league:'lg_M2wQ_4189',oldDate:'2026-11-07',revision:'7badf194ceda4cff92e5a7205045b638',date:'2026-11-15',title:'Beauty Recovery TEST 2026-11-15 R1',key:'BEAUTY_RECOVERY_WORKSPACE_20261115_R1',tabs:['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"]};}
function beautyRecoveryWorkspaceProvision_(io){
 io.guard();const old=io.load();
 if(old){if(old.state!=='READY')throw Error('SETUP_REVIEW_REQUIRED: preserve the existing setup receipt; do not repeat creation.');io.verify(old);return io.report(old,true);}
 const template=io.preflight(),j={version:1,state:'WORKBOOK_ATTEMPTED',original:template.original,createdAt:io.now()};
 io.save(j); // Must be durable before creating anything.
 const sheetId=io.createWorkbook();j.sheetId=sheetId;j.state='WORKBOOK_CREATED';io.save(j);
 io.initializeWorkbook(j,template);j.state='WORKBOOK_READY';io.save(j);
 io.guard();io.verifyOriginal(j);io.checkNoEvent();
 j.state='EVENT_ATTEMPTED';io.save(j);
 const result=io.createEvent();j.eventId=result.id;j.eventUrl=result.url;j.state='EVENT_CREATED';io.save(j);
 io.verify(j);j.state='READY';io.save(j);return io.report(j,false);
}
function beautyRecoveryWorkspaceIO_(){
 const c=beautyRecoveryWorkspaceConfig_(),p=PropertiesService.getScriptProperties();let pinned,postUsed=false;
 const fail=m=>{throw Error(m);};
 const guard=()=>{if(ScriptApp.getScriptId()!==c.scriptId||Session.getActiveUser().getEmail().toLowerCase()!==c.owner)fail('FIXED_TEST_OWNER_REQUIRED');const raw=p.getProperty('BEAUTY_EVENT_CONTEXT_V1');let x;try{x=JSON.parse(raw||'null');}catch(e){fail('TEST_CONTEXT_REQUIRED');}if(!x||x.version!==1||x.mode!=='league'||x.sheetId!==c.oldSheet||x.eventId!==c.oldEvent||x.leagueId!==c.league||x.date!==c.oldDate||x.revision!==c.revision||p.getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'))fail('TEST_CONTEXT_CHANGED');if(pinned&&pinned!==raw)fail('TEST_CONTEXT_CHANGED');pinned=raw;};
 const hash=v=>Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v))).replace(/=+$/,'');
 const load=()=>{const raw=p.getProperty(c.key);if(!raw)return null;try{const j=JSON.parse(raw);if(j.version!==1||!['WORKBOOK_ATTEMPTED','WORKBOOK_CREATED','WORKBOOK_READY','EVENT_ATTEMPTED','EVENT_CREATED','READY'].includes(j.state))throw Error();return j;}catch(e){fail('SETUP_RECEIPT_INVALID');}};
 const save=j=>{guard();const text=JSON.stringify(j);if(text.length>8000)fail('SETUP_RECEIPT_SIZE');p.setProperty(c.key,text);if(p.getProperty(c.key)!==text)fail('SETUP_RECEIPT_READBACK');};
 const validSheet=id=>typeof id==='string'&&/^[-\w]{20,150}$/.test(id)&&id!==c.oldSheet&&id!=='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';
 const validEvent=id=>typeof id==='string'&&/^t_[A-Za-z0-9_]{1,80}$/.test(id)&&id!==c.oldEvent;
 const set=()=>({title:c.title,details:'Isolated Beauty recovery validation. DO NOT USE LIVE.',status:20,t_date:Date.parse(c.date+'T12:00:00Z')/1000,lgid:c.league,kind:'darts',team_games:0,game_type:1,private:1,common_join:0,individual_pass:0,entry_lock:1,join_pass:Utilities.getUuid().replace(/-/g,''),rr_setting:{round_robin:1,robin_count:1,robin_player_count:4,limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01'},t_setting:{tournament:0},s2_setting:{tournament:0}});
 const api=(path,body)=>{guard();const j=load(),allowed=['league/get?lgid='+c.league,'league/tournament/list?lgid='+c.league+'&count=1000','tournament/get?tdid='+c.oldEvent+'&entry=0','tournament/entry/list?tdid='+c.oldEvent];if(j&&validEvent(j.eventId))allowed.push('tournament/get?tdid='+j.eventId+'&entry=0','tournament/entry/list?tdid='+j.eventId);
  if(body){if(path!=='tournament/create'||j?.state!=='EVENT_ATTEMPTED'||postUsed||body.set?.title!==c.title||body.set?.lgid!==c.league||body.set?.private!==1||body.set?.status!==20||body.entry_list?.length!==0)fail('SETUP_POST_BLOCKED');postUsed=true;}else if(!allowed.includes(path))fail('SETUP_GET_BLOCKED');
  const user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');if(!user||!password)fail('NAKKA_CREDENTIALS_MISSING');let response,data;
  try{response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{method:body?'post':'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},...(body?{contentType:'application/json',payload:JSON.stringify(body)}:{}),muteHttpExceptions:true,followRedirects:false});}catch(e){fail(body?'EVENT_CREATE_UNCERTAIN':'NAKKA_READ_UNAVAILABLE');}
  if(response.getResponseCode()!==200)fail(body?'EVENT_CREATE_UNVERIFIED':'NAKKA_READ_HTTP');try{const text=response.getContentText();if(text.length>1000000)throw Error();data=JSON.parse(text);}catch(e){fail('NAKKA_RESPONSE_LAYOUT');}if(data?.result!==0)fail(body?'EVENT_CREATE_UNVERIFIED':'NAKKA_READ_RESULT');guard();return data;};
 const original=()=>{guard();const ss=SpreadsheetApp.openById(c.oldSheet);if(ss.getId()!==c.oldSheet)fail('OLD_WORKBOOK_IDENTITY');const data={};for(const title of c.tabs){const sh=ss.getSheetByName(title);if(!sh||sh.getLastRow()>2000||sh.getLastColumn()>30)fail('OLD_WORKBOOK_LAYOUT');const r=sh.getDataRange();data[title]={id:sh.getSheetId(),values:r.getValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}const date=data.Control.values[1]?.[0];if(!(date instanceof Date)||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==c.oldDate)fail('OLD_WORKBOOK_DATE');const e=api('tournament/get?tdid='+c.oldEvent+'&entry=0').tournament,entries=api('tournament/entry/list?tdid='+c.oldEvent).list;if(e?.tdid!==c.oldEvent||e.lgid!==c.league||e.status!==40||!Array.isArray(entries)||entries.length>=1000)fail('OLD_EVENT_CHANGED');return {hash:hash({data,event:e,entries}),ss};};
 const verifyOriginal=j=>{if(original().hash!==j.original)fail('ORIGINAL_STATE_CHANGED');};
 const checkNoEvent=()=>{const league=api('league/get?lgid='+c.league).league;if(league?.lgid!==c.league||!league.admin_id||!/^Beauty TEST\b/i.test(league.title||''))fail('TEST_LEAGUE_REQUIRED');const list=api('league/tournament/list?lgid='+c.league+'&count=1000').list;if(!Array.isArray(list)||list.length>=1000)fail('TEST_EVENT_LIST_INCOMPLETE');for(const e of list){if(!e||e.lgid!==c.league||typeof e.title!=='string'||!/^t_[A-Za-z0-9_]{1,80}$/.test(e.tdid))fail('TEST_EVENT_LIST_LAYOUT');if(e.title===c.title)fail('SETUP_EVENT_ALREADY_EXISTS_REVIEW');}};
 const preflight=()=>{checkNoEvent();const o=original(),headers={},display=o.ss.getSheetByName("TONIGHT'S PLAYERS");for(const t of c.tabs){headers[t]=o.ss.getSheetByName(t).getRange(1,1,1,6).getValues()[0];if(headers[t].some(v=>typeof v==='string'&&/^[=+@]/.test(v)))fail('TEMPLATE_HEADER_REVIEW');}const formulas=display.getRange(2,1,999,6).getFormulas();
  if(!formulas.flat().some(Boolean))fail('TEMPLATE_FORMULAS_MISSING');for(const f of formulas.flat().filter(Boolean)){if(/IMPOR(T|TRANGE)|IMPORT|GOOGLEFINANCE|IMAGE\s*\(|https?:|\[[^\]]+\]/i.test(f))fail('EXTERNAL_FORMULA_BLOCKED');const refs=[...f.matchAll(/(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_ ]*))!/g)];for(const ref of refs)if(!c.tabs.includes((ref[1]||ref[2]).replace(/''/g,"'")))fail('FORMULA_REFERENCE_REVIEW');}
  return {original:o.hash,headers,formulas};};
 const newBook=j=>{guard();const saved=load();if(!validSheet(j.sheetId)||saved?.sheetId!==j.sheetId)fail('NEW_WORKBOOK_REQUIRED');const ss=SpreadsheetApp.openById(j.sheetId);if(ss.getId()!==j.sheetId||ss.getName()!==c.title+' — Workbook')fail('NEW_WORKBOOK_IDENTITY');return ss;};
 const initializeWorkbook=(j,t)=>{const ss=newBook(j);ss.setSpreadsheetTimeZone('Europe/Stockholm');ss.setSpreadsheetLocale('en_GB');const first=ss.getSheets();if(first.length!==1||first[0].getLastRow()!==0)fail('NEW_WORKBOOK_NOT_EMPTY');first[0].setName('Control');for(const title of c.tabs.slice(1))ss.insertSheet(title);for(const title of c.tabs){const sh=ss.getSheetByName(title);if(sh.getMaxRows()<1000)sh.insertRowsAfter(sh.getMaxRows(),1000-sh.getMaxRows());sh.getRange(1,1,1,6).setValues([t.headers[title]]);sh.getRange('H1').setValue(c.key);sh.setFrozenRows(1);}ss.getSheetByName('Control').getRange('A2').setValue(Utilities.parseDate(c.date,'Europe/Stockholm','yyyy-MM-dd'));ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,999,6).setFormulas(t.formulas);SpreadsheetApp.flush();j.formulaHash=hash(ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,999,6).getFormulas());if(j.formulaHash!==hash(t.formulas))fail('NEW_FORMULA_READBACK');j.headerHash=hash(t.headers);verifyWorkbook(j);};
 const verifyWorkbook=j=>{const ss=newBook(j);if(ss.getFormUrl())fail('UNEXPECTED_FORM_LINK');if(ss.getSheets().length!==5)fail('NEW_WORKBOOK_LAYOUT');const headers={};for(const title of c.tabs){const sh=ss.getSheetByName(title);if(!sh||sh.getRange('H1').getValue()!==c.key)fail('WORKBOOK_MARKER');headers[title]=sh.getRange(1,1,1,6).getValues()[0];if(!['Control',"TONIGHT'S PLAYERS"].includes(title)&&sh.getRange(2,1,999,6).getValues().flat().some(v=>v!==''))fail('NEW_SOURCE_ROWS_NOT_EMPTY');}if(hash(headers)!==j.headerHash)fail('NEW_HEADERS_CHANGED');const value=ss.getSheetByName('Control').getRange('A2').getValue();if(!(value instanceof Date)||Utilities.formatDate(value,'Europe/Stockholm','yyyy-MM-dd')!==c.date)fail('NEW_DATE_CHANGED');const display=ss.getSheetByName("TONIGHT'S PLAYERS");if(hash(display.getRange(2,1,999,6).getFormulas())!==j.formulaHash)fail('NEW_FORMULAS_CHANGED');if(display.getRange(2,1,999,6).getDisplayValues().flat().some(v=>v!==''))fail('NEW_DISPLAY_NOT_EMPTY');};
 const verify=j=>{guard();verifyOriginal(j);verifyWorkbook(j);if(!validEvent(j.eventId))fail('NEW_EVENT_REQUIRED');const e=api('tournament/get?tdid='+j.eventId+'&entry=0').tournament,entries=api('tournament/entry/list?tdid='+j.eventId).list;if(!e||e.tdid!==j.eventId||e.lgid!==c.league||e.title!==c.title||e.status!==20||e.private!==1||e.team_games!==0||e.entry_lock!==1||!e.admin_id||e.t_date!==Date.parse(c.date+'T12:00:00Z')/1000||!Array.isArray(entries)||entries.length)fail('NEW_EVENT_READBACK');guard();};
 return {guard,load,save,now:()=>new Date().toISOString(),preflight,verifyOriginal,checkNoEvent,createWorkbook:()=>{guard();if(load()?.state!=='WORKBOOK_ATTEMPTED')fail('WORKBOOK_CREATE_BLOCKED');const ss=SpreadsheetApp.create(c.title+' — Workbook');if(!validSheet(ss.getId()))fail('NEW_WORKBOOK_IDENTITY');return ss.getId();},initializeWorkbook,createEvent:()=>{const r=api('tournament/create',{set:set(),entry_list:[]});if(!validEvent(r.tdid))fail('EVENT_CREATE_ID_REVIEW');return {id:r.tdid,url:'https://n01darts.com/n01/league/season.php?id='+r.tdid};},verify,report:(j,already)=>({result:'TEST_RECOVERY_WORKSPACE_READY',alreadyPrepared:already,event:{id:j.eventId,title:c.title,date:c.date,status:20,private:true,url:j.eventUrl},workbook:{id:j.sheetId,url:'https://docs.google.com/spreadsheets/d/'+j.sheetId,sourceRows:0,linkedFormPresent:false,formulasVerified:true},originalStateVerified:true,selectedEventUnchanged:true,normalHubRecoveryConnected:false,recoveryWritesEnabled:false,productionChanged:false,next:'Return this log. Do not switch the Hub or add players yet; the isolated recovery adapter is the next dependency.'})};
}
function beautyTestCreateRecoveryWorkspace20261115(){
 const io=beautyRecoveryWorkspaceIO_();io.guard();const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('TEST_SETUP_BUSY');try{const report=beautyRecoveryWorkspaceProvision_(io);console.log(JSON.stringify(report,null,2));return report;}finally{lock.releaseLock();}
}
function beautyTestReadRecoveryWorkspace20261115(){
 const io=beautyRecoveryWorkspaceIO_();io.guard();const j=io.load();
 const report={result:j?.state==='READY'?'TEST_SETUP_RECEIPT_READY':'TEST_SETUP_RECEIPT_REVIEW',state:j?.state||'NOT_STARTED',sheetId:j?.sheetId||null,eventId:j?.eventId||null,createdAt:j?.createdAt||null,readOnly:true,scope:'Saved setup receipt only; no resource creation, deletion, selection or repair. Return this log before any uncertain setup retry.'};
 console.log(JSON.stringify(report,null,2));return report;
}
