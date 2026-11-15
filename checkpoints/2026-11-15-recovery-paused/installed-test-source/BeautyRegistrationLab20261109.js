/* TEST-only diagnostic. Added file; no automatic execution or deployment.
 * Manual entry point: beautyTestRegistrationLab20261109
 * Creates five uniquely named fixture tabs INSIDE the existing TEST workbook.
 * Existing event tabs, Script Properties and Nakka are never written.
 */
function beautyTestRegistrationLab20261109() {
  if(arguments.length)throw Error('LAB_STOP: no arguments allowed.');
  const config = {"build": "beauty-registration-lab-20261109-v2", "scriptId": "1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N", "context": {"version": 1, "mode": "league", "leagueId": "lg_M2wQ_4189", "eventId": "t_gINp_8026", "date": "2026-11-07", "title": "AIK Hub TEST 2026-11-07", "revision": "7badf194ceda4cff92e5a7205045b638", "sheetId": "17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE"}};
  const native = { sheets:SpreadsheetApp, properties:PropertiesService, script:ScriptApp, fetch:UrlFetchApp, utilities:Utilities };
  const expectedContext=config.context, created=[], writes=new Set();
  const report={check:'BEAUTY_TEST_REGISTRATION_LAB',build:config.build,startedUTC:new Date().toISOString(),
    scriptId:config.scriptId,spreadsheetId:expectedContext.sheetId,result:'IN_PROGRESS',
    originalEventTabsWritten:false,scriptPropertiesWritten:false,nakkaNetworkCalls:0,workbooksCreated:0,cases:[]};
  function assert(condition,message){if(!condition)throw Error('LAB_STOP: '+message);}
  function guard(){
    assert(native.script.getScriptId()===config.scriptId,'wrong script project');
    const raw=native.properties.getScriptProperties().getProperty('BEAUTY_EVENT_CONTEXT_V1');
    let actual;try{actual=JSON.parse(raw||'null');}catch(e){throw Error('LAB_STOP: invalid TEST context');}
    assert(actual&&Object.keys(expectedContext).every(k=>actual[k]===expectedContext[k]),'TEST event context changed');
  }
  function response(code,body){return {getResponseCode:()=>code,getContentText:()=>JSON.stringify(body)};}
  function safeMessage(value){return String(value||'').replace(/\b(Bearer|Basic)\s+\S+/gi,'$1 [redacted]').replace(/https?:\/\/\S+/g,'[URL]').slice(0,400);}
  let ss;
  try{
    guard(); ss=native.sheets.openById(expectedContext.sheetId);
    assert(ss.getId()===expectedContext.sheetId,'wrong TEST workbook');
    assert(ss.getName()==='Beauty TEST · AIK Hub TEST 2026-11-07 · 2026-11-07','TEST workbook title changed');
    assert(native.utilities.formatDate(ss.getSheetByName('Control').getRange('A2').getValue(),'Europe/Stockholm','yyyy-MM-dd')===expectedContext.date,'TEST Control date changed');
    // Check REST access before creating any fixture tabs.
    const preflight=native.fetch.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+expectedContext.sheetId+'/values/'+encodeURIComponent("'Control'!A2")+'?valueRenderOption=UNFORMATTED_VALUE',
      {method:'get',headers:{Authorization:'Bearer '+native.script.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});
    if(preflight.getResponseCode()!==200){
      try{const e=JSON.parse(preflight.getContentText()).error||{};report.apiError={status:e.status||'',message:safeMessage(e.message),reasons:[...(e.errors||[]),...(e.details||[])].map(x=>x.reason).filter(x=>typeof x==='string').slice(0,5)};}catch(ignored){}
      assert(false,'Sheets API preflight HTTP '+preflight.getResponseCode()+'; no fixture tabs created');
    }
    assert(JSON.parse(preflight.getContentText()).values?.[0]?.[0]===46333,'REST Control date differs');
    const prefix='BRT1109_'+native.utilities.getUuid().replace(/-/g,'').slice(0,12);
    const mapping={'Control':prefix+'_Control','Form responses 2':prefix+'_Responses',
      'PLAYER STATUS DATA':prefix+'_Status',"TONIGHT'S PLAYERS":prefix+'_Tonight',"PLAYER'S MASTER LIST":prefix+'_Master'};
    const fixtures={};
    for(const name of Object.keys(mapping)){
      guard();assert(!ss.getSheetByName(mapping[name]),'fixture name already exists');
      const sh=ss.insertSheet(mapping[name]);fixtures[name]=sh;
      created.push({name:sh.getName(),sheetId:sh.getSheetId()});
    }
    report.fixtureTabs=created;
    function owned(sh){guard();assert(created.some(x=>x.sheetId===sh.getSheetId()&&x.name===sh.getName()),'write target is not a new fixture tab');assert(sh.getParent().getId()===expectedContext.sheetId,'fixture workbook changed');writes.add(sh.getSheetId());return sh;}
    const today=native.utilities.formatDate(new Date(),'Europe/Stockholm','yyyy-MM-dd');
    const player='Beauty Registration Lab Fixture',message='Trailing space retained ';
    owned(fixtures.Control).getRange(1,1,2,2).setValues([['START DATE','LAST RESET'],
      [native.utilities.parseDate(today,'Europe/Stockholm','yyyy-MM-dd'),native.utilities.parseDate('2000-01-01','Europe/Stockholm','yyyy-MM-dd')]]);
    owned(fixtures['Form responses 2']).getRange(1,1,1,6).setValues([['TIMESTAMP','PLAYER','NEW PLAYER','CONSENT','MESSAGE','SOURCE']]);
    owned(fixtures['PLAYER STATUS DATA']).getRange(1,1,1,6).setValues([['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM']]);
    owned(fixtures["TONIGHT'S PLAYERS"]).getRange(1,1,1,6).setValues([['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM']]);
    owned(fixtures["PLAYER'S MASTER LIST"]).getRange(1,1,2,1).setValues([['PLAYER'],[player]]);
    function resetFixtures(){
      for(const name of ['Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS"])owned(fixtures[name]).getRange(2,1,99,6).clearContent();
      const tonight=owned(fixtures["TONIGHT'S PLAYERS"]),resp="'"+mapping['Form responses 2']+"'",status="'"+mapping['PLAYER STATUS DATA']+"'";
      // Existing-player fixture only. This is a real recalculating formula, not
      // a hand-filled display; new-player Form work is outside this lab's scope.
      // Whole-column references survive INSERT_ROWS at the first data row.
      // Exclude the header by row number; B2:B would shift to B3:B on append.
      tonight.getRange('A2').setFormula('=IFERROR(SORT(UNIQUE(FILTER('+resp+'!B:B,ROW('+resp+'!B:B)>1,'+resp+'!B:B<>"")),1,TRUE),"")');
      tonight.getRange(2,4,99,3).setFormulas(Array.from({length:99},(_,i)=>[4,5,6].map(col=>'=IF(A'+(i+2)+'="","",IFERROR(VLOOKUP(A'+(i+2)+','+status+'!A:F,'+col+',FALSE),""))')));
      native.sheets.flush();
    }
    function runCase(label,factory){
      report.phase=label+':SETUP';
      resetFixtures();guard();
      const props=new Map([['N01_API_USER','offline-fixture'],['N01_API_PASSWORD','offline-fixture']]);
      const provider={entries:[],writes:0},observedFailures=[],counts={sheetsReads:0,sheetsAppends:0,nakkaSimulatedReads:0,nakkaSimulatedWrites:0};
      const target={version:1,mode:'league',sheetId:expectedContext.sheetId,eventId:'t_beauty_lab_fixture',leagueId:'lg_beauty_lab_fixture',date:today,revision:'lab-20261109'};
      function mapRange(range){
        const m=/^'((?:[^']|'')+)'!(A2(?::[A-F])?|A:F|A:A)$/.exec(range);
        assert(m,'unsupported fixture range');const logical=m[1].replace(/''/g,"'");
        assert(Object.prototype.hasOwnProperty.call(mapping,logical),'unknown fixture range');
        return {logical,actual:"'"+mapping[logical]+"'!"+m[2]};
      }
      function fetchFixture(address,options){
        guard();const method=options.method||'get';
        const providerPrefix='https://push.n01darts.com/api/v1/';
        if(address.startsWith(providerPrefix)){
          // No provider network call occurs. Only this synthetic event and player
          // are accepted by the simulated provider.
          const route=address.slice(providerPrefix.length);
          if(method==='get'){
            counts.nakkaSimulatedReads++;
            if(route==='tournament/get?tdid='+target.eventId)return response(200,{result:0,tournament:{tdid:target.eventId,lgid:target.leagueId,team_games:0,status:10,t_date:native.utilities.parseDate(today,'Europe/Stockholm','yyyy-MM-dd').getTime()/1000}});
            if(route==='league/entry/list?lgid='+target.leagueId)return response(200,{result:0,list:[{name:player,lpid:'L001'}]});
            if(route==='tournament/entry/list?tdid='+target.eventId)return response(200,{result:0,list:provider.entries});
          }
          if(method==='post'&&route==='tournament/entry/update'){
            const payload=JSON.parse(options.payload);
            assert(payload.tdid===target.eventId&&payload.add?.length===1&&payload.add[0].name===player&&payload.add[0].lpid==='L001'&&provider.entries.length===0,'unexpected simulated provider write');
            provider.entries.push({name:player,lpid:'L001',tpid:'E001'});provider.writes++;counts.nakkaSimulatedWrites++;
            return response(200,{result:0});
          }
          throw Error('LAB_STOP: unapproved simulated provider route');
        }
        const prefix='https://sheets.googleapis.com/v4/spreadsheets/'+expectedContext.sheetId+'/values';
        assert(address.startsWith(prefix),'network target blocked');
        const suffix=address.slice(prefix.length),split=suffix.indexOf('?');
        assert(split>=0,'missing Sheets query');
        const route=suffix.slice(0,split),query=suffix.slice(split+1);
        let mapped;
        if(route===':batchGet'){
          assert(method==='get','batch mutation blocked');
          mapped=route+'?'+query.split('&').map(part=>{
            if(!part.startsWith('ranges='))return part;
            return 'ranges='+encodeURIComponent(mapRange(decodeURIComponent(part.slice(7))).actual);
          }).join('&');counts.sheetsReads++;
        }else{
          assert(route.startsWith('/'),'unsupported Sheets route');
          const decoded=decodeURIComponent(route.slice(1)),append=decoded.endsWith(':append');
          const range=mapRange(append?decoded.slice(0,-7):decoded);
          if(append){
            assert(method==='post'&&['Form responses 2','PLAYER STATUS DATA'].includes(range.logical),'append target blocked');
            assert(query==='valueInputOption=RAW&insertDataOption=INSERT_ROWS','unexpected append options');
            const values=JSON.parse(options.payload).values;
            assert(Array.isArray(values)&&values.length===1&&values[0].length===6,'unexpected append shape');
            owned(fixtures[range.logical]);counts.sheetsAppends++;
          }else{assert(method==='get','unexpected Sheets mutation');counts.sheetsReads++;}
          mapped='/'+encodeURIComponent(range.actual)+(append?':append':'')+'?'+query;
        }
        return native.fetch.fetch(prefix+mapped,{...options,followRedirects:false});
      }
      function wrapSheet(name){
        const sh=fixtures[name];assert(sh,'unapproved fixture sheet');
        return {getName:()=>name,getRange:(...args)=>{
          const range=sh.getRange(...args);
          return {getValue:()=>range.getValue(),getDisplayValues:()=>range.getDisplayValues(),getFormulas:()=>range.getFormulas(),
            setValues:values=>{owned(sh);assert(name==='TONIGHT\'S PLAYERS'&&JSON.stringify(args)==='[2,3,99,1]','native write outside display fixture');return range.setValues(values);}};
        }};
      }
      let locked=false;
      const env={
        SpreadsheetApp:{flush:()=>native.sheets.flush(),openById:id=>{assert(id===expectedContext.sheetId,'workbook access blocked');return {getId:()=>id,getSheetByName:wrapSheet};}},
        UrlFetchApp:{fetch:fetchFixture},ScriptApp:{getOAuthToken:()=>native.script.getOAuthToken()},Utilities:native.utilities,
        PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
        LockService:{getScriptLock:()=>({tryLock:timeout=>{assert(timeout===5000,'unexpected lock timeout');if(locked)return false;locked=true;return true;},releaseLock:()=>{locked=false;}})},
        BEAUTY_LIVE_BASE_:{sheetId:expectedContext.sheetId},beautyLiveLoginGuard_:guard,beautyContextAssert_:guard,
        beautyContextToken_:()=>target.revision,beautyLiveTarget_:()=>target,beautyContextStandalone_:()=>false,
        beautyHubAuthRequire_:()=>({uid:'TEST-LAB-FIXTURE'}),
        observeFailure:error=>observedFailures.push({name:String(error?.name||'Error').slice(0,60),message:safeMessage(error?.message)})
      };
      const api=factory(env),started=Date.now();
      report.phase=label+':REGISTER';
      const result=api.register({selectedName:player,eventDate:today,consent:'JA, JAG GODKÄNNER',message},'fixture-only');
      report.phase=label+':VERIFY';
      native.sheets.flush();
      const saved=fixtures['PLAYER STATUS DATA'].getRange(2,1,1,6).getDisplayValues()[0];
      const shown=fixtures["TONIGHT'S PLAYERS"].getRange(2,1,1,6).getDisplayValues()[0];
      const receipt=JSON.parse(props.get('BEAUTY_LIVE_REGISTRATION_PENDING')||'null');
      const caseReport={label,result:'CHECKING',registrationSuccess:result.success,registrationCode:result.code||null,
        receiptStage:receipt?.stage||null,receiptFailure:receipt?.failure||null,observedFailures,
        savedNameMatches:saved[0]===player,displayNameMatches:shown[0]===player,
        savedMessagePreserved:saved[4]===message,displayMessagePreserved:shown[4]===message,
        expectedMessageLength:message.length,savedMessageLength:saved[4]?.length,displayMessageLength:shown[4]?.length,
        fixtureDisplayFormula:fixtures["TONIGHT'S PLAYERS"].getRange('A2').getFormulas()[0][0],
        counts,elapsedMs:Date.now()-started};
      report.cases.push(caseReport);
      assert(saved[0]===player&&saved[4]===message&&shown[0]===player&&shown[4]===message,'fixture data readback changed');
      assert(fixtures['Form responses 2'].getLastRow()===2&&fixtures['PLAYER STATUS DATA'].getLastRow()===2,'unexpected fixture duplicate');
      assert(provider.writes===1&&provider.entries.length===1&&!locked,'provider fixture or lock mismatch');
      if(label==='DEPLOYED_BASELINE')assert(result.success===false&&result.code==='REGISTRATION_UNCERTAIN'&&receipt?.stage==='readback'&&receipt.failure==='Registration readback failed.','baseline did not reproduce expected whitespace failure');
      else assert(result.success===true&&result.readbackVerified===true&&receipt===null,'candidate did not finish cleanly');
      caseReport.result='PASS';return caseReport;
    }
    runCase('DEPLOYED_BASELINE',beautyLabBaselineFactory20261109_);
    runCase('CANDIDATE',beautyLabCandidateFactory20261109_);
    guard();report.result='PASS';
    report.limitations=['Nakka and pending receipts are simulated in memory; no provider mutation or live property change.',
      'Real Google Sheets reads, appends, formula recalculation and display writes use new fixture tabs only.',
      'Sequential single-player diagnostic, not concurrent load testing or a latency benchmark.',
      'Does not implement queueing, per-registration recovery or the permanent-workbook migration.'];
  }catch(error){report.result='STOPPED';report.error=safeMessage(error?.message||'Unexpected lab failure');if(report.cases.at(-1)?.result==='CHECKING')report.cases.at(-1).result='STOPPED';}
  report.fixtureTabs=created;report.fixtureTabIdsWritten=[...writes];report.finishedUTC=new Date().toISOString();
  console.log(JSON.stringify(report,null,2));
  console.log('RESULT: '+report.result+'; NO LIVE DATA OR NAKKA CHANGED. '+(created.length?'Fixture tabs remain for inspection.':'No fixture tabs created.'));
  return report;
}

function beautyLabBaselineFactory20261109_(env) {
  const {SpreadsheetApp,UrlFetchApp,PropertiesService,LockService,Utilities,ScriptApp,BEAUTY_LIVE_BASE_,beautyLiveLoginGuard_,beautyContextAssert_,beautyContextToken_,beautyLiveTarget_,beautyContextStandalone_,beautyHubAuthRequire_}=env;
  const beautyLiveRegistrationActor_=()=>({uid:'TEST-LAB-FIXTURE',source:'HUB'});
  const FormApp={openById(){throw Error('LAB_STOP: Google Form access is disabled.');}};
function beautyLiveSheetsRead_(path,masterOnly=false) {
  beautyLiveLoginGuard_();
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+(masterOnly?BEAUTY_LIVE_BASE_.sheetId:beautyLiveTarget_().sheetId)+path,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('LIVE spreadsheet read failed (HTTP '+r.getResponseCode()+').');
  return JSON.parse(r.getContentText());
}
function beautyLiveDate_(value) {
  if(typeof value==='number'&&Number.isFinite(value))return new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000).toISOString().slice(0,10);
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null;
}
function beautyLiveDashboardRead_() {
  const ranges=["'Control'!A2","'TONIGHT''S PLAYERS'!A2:F","'PLAYER STATUS DATA'!A2:C"];
  const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==3)throw Error('Incomplete spreadsheet response.');
  const date=beautyLiveDate_(data.valueRanges[0].values?.[0]?.[0]);
  if(date!==beautyLiveTarget_().date)throw Error('The registration date changed. Reload the selected event.');
  const clean=v=>String(v??'').trim();
  const players=(data.valueRanges[1].values||[]).map(r=>({player:clean(r[0]),newPlayer:clean(r[1]),status:clean(r[2]),consent:clean(r[3]),message:clean(r[4]),whereFrom:clean(r[5])})).filter(p=>p.player||p.newPlayer);
  const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const statuses=new Map();
  for(const row of data.valueRanges[2].values||[]){const name=key(row[0]);if(!name)continue;if(statuses.has(name))throw Error('Duplicate player status records need review.');statuses.set(name,clean(row[2]));}
  for(const player of players)player.status=statuses.get(key(player.player||player.newPlayer))||'';
  return {success:true,mode:'live-status',readOnly:false,statusWritesEnabled:true,eventContext:beautyContextToken_(),eventDate:date,eventDateDisplay:date,players,playerCount:players.length,masterPlayers:beautyLiveRegistrationRows_(SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName("PLAYER'S MASTER LIST"),1).map(r=>r[0]).filter(n=>n&&n!=='MITT NAMN FINNS INTE I LISTAN').sort((a,b)=>a.localeCompare(b,'sv-SE')),updatedAt:new Date().toISOString(),activeEvent:{mode:beautyLiveTarget_().mode,leagueId:beautyLiveTarget_().leagueId,eventId:beautyLiveTarget_().eventId,date},attention:{available:false,complete:false,eventDate:date,items:[]}};
}
function beautyLiveEventRead_() {
  const target=beautyLiveTarget_();
  const control=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Control'!A2")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(beautyLiveDate_(control.values?.[0]?.[0])!==target.date)throw Error('The registration date changed.');
  const r=UrlFetchApp.fetch('https://lbc.n01darts.com/n01/tournament/n01_tournament.php?cmd=get_data&tdid='+target.eventId,{method:'get',muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('Nakka event read failed.');
  const payload=JSON.parse(r.getContentText()),event=payload.tournament||payload;
  const date=Number.isFinite(event.t_date)?Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd'):null;
  if(event.tdid!==target.eventId||(event.lgid||'')!==target.leagueId||date!==target.date||event.team_games!==0||typeof event.title!=='string'||!event.title.trim()||event.title.length>300)throw Error('Nakka event identity mismatch.');
  return {success:true,status:'MATCHED',readOnly:true,eventDate:date,checkedAt:new Date().toISOString(),event:{id:event.tdid,title:event.title,date,url:'https://n01darts.com/n01/'+(target.mode==='tournament'?'tournament/comp':'league/season')+'.php?id='+target.eventId},message:'Selected public event verified. Administrative API access has not been checked.'};
}
function beautyHubTest(action,input,token) {
  beautyLiveLoginGuard_();
  try{beautyHubAuthRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};}
  if(typeof action==='string'&&action.startsWith('context:'))return beautyLiveContextService_(action.slice(8),input,token);
  if(['eveningsetup','eveningprepare','eveningsave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan'].includes(action))return beautyLivePlanner_(action,input,token);
  if(['register','status'].includes(action)&&PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return {success:false,code:'REMOVE_REVIEW',error:'Review the unfinished removal before another change.'};
  if(action==='removepreview'||action==='removesave'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRemove_(action==='removepreview'?'preview':'save',clean,token);
  }
  if(action==='register'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRegister_(clean,token);
  }
  if(action==='status'){
    if(PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REGISTRATION_PENDING'))return {success:false,code:'REGISTRATION_REVIEW_REQUIRED',error:'Review the pending registration before another save.'};
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveStatus_(clean,token);
  }
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='_context'))return {success:false,code:'LIVE_VIEW_ONLY',error:'This operation is not enabled.'};
  if(!['read','nakkaevent','nakkahealth'].includes(action))return {success:false,code:'LIVE_VIEW_ONLY',error:'This operation is not enabled. Event operations are not enabled.'};
  try{
    if(action==='read')return beautyLiveDashboardRead_();
    const event=beautyLiveEventRead_();
    if(action==='nakkaevent')return event;
    return {status:'OK',message:'Public Nakka event and registration date verified. Administrative API access not checked.',timestamp:event.checkedAt};
  }catch(e){
    if(action==='nakkahealth')return {status:'UNAVAILABLE',message:'The selected event and registration date could not be verified.',timestamp:new Date().toISOString()};
    return {success:false,code:'LIVE_READ_FAILED',error:e.message};
  }
}

var BeautyLiveNameResolution_ = (() => {
  const NEW = 'MITT NAMN FINNS INTE I LISTAN';
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const key = value => clean(value).toLocaleLowerCase('sv-SE');
  const error = (code, message) => ({ success: false, code, error: message });
  function resolve(input, master, tonight) {
    const selected = clean(input.selectedName);
    const entered = clean(selected === NEW ? input.newName : selected);
    if (!entered || entered.length > 120 || /^[=+@-]/.test(entered) || /[\x00-\x1f\x7f]/.test(entered)) {
      return error('INVALID_NAME', 'Enter a valid full name.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Several player records have this name. Please ask the organiser for help.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Select your name or add a new player.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Choose who you are.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'The selected name has changed. Start again with your name.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'This name is already on the list.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Enter your middle name, nickname or another identifying detail.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'The name and identifying detail are too long.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'This name with that detail already exists. Select it if it is you, or enter a different detail.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Confirm how your name will be displayed.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'You are already registered for this event.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();
/* LIVE registration. Selected event; staff authentication or restricted player actor.
 * ScriptLock serialises Hub and paired player routes in this project.
 * A pending receipt blocks retries after any uncertain multi-service write.
 */
function beautyLiveRegistrationSetup_() {
  beautyLiveLoginGuard_();
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/forms']);
  beautyLiveRegistrationSheets_();
  beautyLiveRegistrationForm_();
  beautyLiveRegistrationEvent_();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_SETUP',result:'READY_FOR_REGISTRATION_REVIEW',writesPerformed:false}));
}
function beautyLiveRegistrationReview_() {
  beautyLiveLoginGuard_();
  const p=PropertiesService.getScriptProperties();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECEIPT',pending:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_PENDING')||'null'),last:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_LAST')||'null')},null,2));
}
function beautyLiveRegistrationKey_(v) { return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'); }
function beautyLiveRegistrationRows_(sheet, width) {
  // Read through the same service used for RAW appends; do not reuse getLastRow caches.
  if(!Number.isInteger(width)||width<1||width>6)throw Error('Invalid read width.');
  SpreadsheetApp.flush();
  const name=sheet.getName();
  if(!["PLAYER'S MASTER LIST",'PLAYER STATUS DATA',"TONIGHT'S PLAYERS",'Form responses 2'].includes(name))throw Error('Unexpected registration sheet.');
  const range="'"+name.replace(/'/g,"''")+"'!A2:"+String.fromCharCode(64+width);
  const data=beautyLiveSheetsRead_('/values/'+encodeURIComponent(range)+'?valueRenderOption=FORMATTED_VALUE',name==="PLAYER'S MASTER LIST");
  if(data.values!==undefined&&!Array.isArray(data.values))throw Error('Incomplete sheet read.');
  const rows=data.values||[];
  if(rows.length>19999||rows.some(r=>!Array.isArray(r)||r.length>width))throw Error('Sheet exceeds reviewed size.');
  return rows.map(r=>Array.from({length:width},(_,i)=>String(r[i]??'')));
}
function beautyLiveRegistrationSheets_() {
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);
  if(ss.getId()!==beautyLiveTarget_().sheetId)throw Error('Wrong sheet.');
  const out={};
  for(const [key,name] of Object.entries({control:'Control',master:"PLAYER'S MASTER LIST",responses:'Form responses 2',store:'PLAYER STATUS DATA',tonight:"TONIGHT'S PLAYERS"})){
    out[key]=(key==='master'?SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId):ss).getSheetByName(name);if(!out[key])throw Error('Required sheet missing.');
  }
  const date=out.control.getRange('A2').getValue();
  if(!(date instanceof Date)||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==beautyLiveTarget_().date)throw Error('Event date changed.');
  const heads=out.store.getRange(1,1,1,6).getDisplayValues()[0];
  if(heads[0]!=='PLAYER'||heads[1]!=='OLD NAME'||heads[2]!=='STATUS'||heads[3]!=='FOTO&VIDEO'||heads[4]!=='MEDDELANDE'||heads[5]!=='WHERE FROM')throw Error('Status layout changed.');
  if(out.tonight.getRange(2,3,99,1).getFormulas().some(r=>r[0]))throw Error('Status formulas found.');
  const names=beautyLiveRegistrationRows_(out.tonight,2);
  if(names.slice(99).some(r=>r.some(Boolean)))throw Error('Registration display capacity reached.');
  return out;
}
function beautyLiveRegistrationApi_(path, payload) {
  beautyLiveLoginGuard_();beautyContextAssert_();
  if(payload){const t=beautyLiveTarget_();if(payload.tdid!==undefined&&payload.tdid!==t.eventId||payload.lgid!==undefined&&(t.mode!=='league'||payload.lgid!==t.leagueId))throw Error('Wrong event write target.');}
  const p=PropertiesService.getScriptProperties(),user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');
  if(!user||!password)throw Error('Nakka credentials missing.');
  const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{
    method:payload?'post':'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
    ...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{}),muteHttpExceptions:true,followRedirects:false
  });
  if(response.getResponseCode()!==200)throw Error('Nakka request failed.');
  const data=JSON.parse(response.getContentText());if(data.result!==0)throw Error('Nakka did not confirm request.');return data;
}
function beautyLiveRegistrationEvent_() {
  const t=beautyLiveTarget_(),e=beautyLiveRegistrationApi_('tournament/get?tdid='+t.eventId).tournament;
  if(!e||e.tdid!==t.eventId||(e.lgid||'')!==t.leagueId||e.team_games!==0||![10,20,25].includes(e.status)||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==t.date)throw Error('Nakka event is not open for registration.');
}
function beautyLiveRegistrationList_(kind) {
  if(kind==='league'&&beautyContextStandalone_())return [];
  const t=beautyLiveTarget_(),data=beautyLiveRegistrationApi_(kind==='league'?'league/entry/list?lgid='+t.leagueId:'tournament/entry/list?tdid='+t.eventId);
  if(!Array.isArray(data.list))throw Error('Incomplete Nakka list.');return data.list;
}
function beautyLiveRegistrationForm_() {
  const form=FormApp.openById('1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ');
  const questions=[];
  for(const [type,cast] of [[FormApp.ItemType.LIST,'asListItem'],[FormApp.ItemType.MULTIPLE_CHOICE,'asMultipleChoiceItem']]){
    for(const item of form.getItems(type)){const q=item[cast]();if(q.getTitle().trim()==='VÄLJ DITT NAMN')questions.push(q);}
  }
  const sections=form.getItems(FormApp.ItemType.PAGE_BREAK);
  if(questions.length!==1||sections.length<2)throw Error('Backup form layout changed.');
  return {question:questions[0],newSection:sections[0].asPageBreakItem(),existingSection:sections[1].asPageBreakItem()};
}
function beautyLiveRegistrationAppend_(range,values) {
  // RAW avoids interpreting a name/message as a spreadsheet formula.
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+(range==="'PLAYER''S MASTER LIST'!A:A"?BEAUTY_LIVE_BASE_.sheetId:beautyLiveTarget_().sheetId)+'/values/'+encodeURIComponent(range)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{
    method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:[values]}),muteHttpExceptions:true,followRedirects:false
  });
  if(r.getResponseCode()!==200)throw Error('Sheet append response uncertain.');
  const data=JSON.parse(r.getContentText());if(data.updates?.updatedRows!==1)throw Error('Sheet append not confirmed.');
}
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
function beautyLiveRegister_(input,token) {
  beautyLiveLoginGuard_();const user=typeof beautyLiveRegistrationActor_==='function'?beautyLiveRegistrationActor_(token):beautyHubAuthRequire_(token),source=user.source||'HUB',key=beautyLiveRegistrationKey_;
  const fail=(code,error)=>({success:false,code,error});
  const allowed=['eventDate','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
  if(!input||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k))||Object.values(input).some(v=>typeof v!=='string')||input.eventDate!==beautyLiveTarget_().date||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000)return fail('INVALID','Check registration fields.');
  input={...input};
  if(input.selectedName==='MITT NAMN FINNS INTE I LISTAN'&&!input.identityChoice)input.newName=String(input.newName||'').toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','Another Hub operation is running.');
  const p=PropertiesService.getScriptProperties(),pending='BEAUTY_LIVE_REGISTRATION_PENDING';let attempted=false,journal;
  try {
    beautyContextAssert_();
    if(p.getProperty(pending)||p.getProperty('BEAUTY_LIVE_STATUS_PENDING')||p.getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return fail('REGISTRATION_REVIEW_REQUIRED','A previous save needs review. Do not repeat registration.');
    const s=beautyLiveRegistrationSheets_(),master=()=>beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(n=>key(n)&&n!=='MITT NAMN FINNS INTE I LISTAN');
    const tonight=()=>beautyLiveRegistrationRows_(s.tonight,2).map(r=>r[0]||r[1]).filter(Boolean);
    if(tonight().length>=99)throw Error('Registration display capacity reached.');
    const resolved=BeautyLiveNameResolution_.resolve(input,master(),tonight());if(!resolved.success)return resolved;
    const player=resolved.player;
    if(/^[=+@-]/.test((input.message||'').trim()))return fail('INVALID','Start the message with ordinary text.');
    beautyLiveRegistrationEvent_();
    const league=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    const entries=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(player)||(league.length===1&&r.lpid&&String(r.lpid)===String(league[0].lpid)));
    if(league.length>1||entries.length>1)return fail('AMBIGUOUS_NAME','Duplicate Nakka identities need review.');
    if(league.length===1&&!league[0].lpid)throw Error('League identity missing.');
    if(!beautyContextStandalone_()&&entries.length&&(!league.length||key(entries[0].name)!==key(player)||(entries[0].lpid&&String(entries[0].lpid)!==String(league[0].lpid))))return fail('AMBIGUOUS_NAME','Nakka player identity needs review.');
    const rows=beautyLiveRegistrationRows_(s.store,6),matches=rows.map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(matches.length>1)return fail('AMBIGUOUS_NAME','Duplicate status identities need review.');
    const old=matches[0];if(old&&s.store.getRange(old.row,1,1,6).getFormulas()[0].some(Boolean))throw Error('Formula in source record.');
    const status=old?.r[2]||'IN';if(!['IN','OUT','STANDBY'].includes(status))throw Error('Unexpected status.');
    const form=resolved.isNew?beautyLiveRegistrationForm_():null;
    beautyLiveRegistrationSheets_();
    const again=BeautyLiveNameResolution_.resolve(input,master(),tonight());
    if(!again.success||again.player!==player||again.isNew!==resolved.isNew)return fail('STALE_IDENTITY','Player list changed. Reload.');
    journal={state:'ATTEMPTED',stage:'response',uid:user.uid,source,eventId:beautyLiveTarget_().eventId,player,eventDate:input.eventDate,recordedUTC:new Date().toISOString()};
    const stage=value=>{journal.stage=value;p.setProperty(pending,JSON.stringify(journal));if(p.getProperty(pending)!==JSON.stringify(journal))throw Error('Receipt not saved.');};
    stage('response');attempted=true;
    // Native timestamp serial (same date basis as spreadsheet's Europe/Berlin zone).
    const wall=Utilities.formatDate(new Date(),'Europe/Berlin',"yyyy-MM-dd'T'HH:mm:ss");
    const serial=(Date.parse(wall+'Z')-Date.UTC(1899,11,30))/86400000;
    beautyLiveRegistrationAppend_("'Form responses 2'!A:F",[serial,resolved.isNew?'MITT NAMN FINNS INTE I LISTAN':player,resolved.isNew?player:'',input.consent,input.message||'',source]);
    return beautyLiveRegistrationFinish_({source,s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending});
  }catch(e){if(attempted&&journal)beautyLiveRegistrationFailure_(p,pending,journal,e);return fail(attempted?'REGISTRATION_UNCERTAIN':'REGISTRATION_CHECK_FAILED',attempted?'Registration may be partly saved. Do not submit again. Review the saved registration receipt.':'Registration checks failed. No registration write was attempted.');}
  finally{lock.releaseLock();}
}

function beautyLiveRegistrationFailure_(p,pending,journal,error) {
  // Keep the original attempted stage; never clear a receipt on a failed write.
  const known=['Master readback failed.','Sheet append response uncertain.','Sheet append not confirmed.','Form choices not verified.','Status record changed during registration.','Tonight display could not be verified.','League write not verified.','Event entry not verified.','Registration readback failed.'];
  const detail=known.includes(String(error.message))?String(error.message):'Service or verification failure; inspect execution.';
  try{p.setProperty(pending,JSON.stringify({...journal,failure:detail,failedUTC:new Date().toISOString()}));}catch(ignored){}
}
function beautyLiveRegistrationFinish_(c) {
  const {s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending}=c;
  const key=beautyLiveRegistrationKey_,source=c.source||'HUB';
    if(resolved.isNew){
      stage('master');
      if(!master().some(n=>key(n)===key(player)))beautyLiveRegistrationAppend_("'PLAYER''S MASTER LIST'!A:A",[player]);
      if(master().filter(n=>key(n)===key(player)).length!==1)throw Error('Master readback failed.');
      // Append preserves concurrent names; sort choices without clearing the master.
      stage('backup-form');
      const names=master().sort((a,b)=>a.localeCompare(b,'sv-SE'));
      form.question.setChoices([...names.map(n=>form.question.createChoice(n,form.existingSection)),form.question.createChoice('MITT NAMN FINNS INTE I LISTAN',form.newSection)]);
      if(JSON.stringify(form.question.getChoices().map(c=>c.getValue()))!==JSON.stringify([...names,'MITT NAMN FINNS INTE I LISTAN']))throw Error('Form choices not verified.');
    }
    stage('status');
    const fresh=beautyLiveRegistrationRows_(s.store,6).map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(JSON.stringify(fresh)!==JSON.stringify(matches))throw Error('Status record changed during registration.');
    const consent=input.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ';
    if(old)s.store.getRange(old.row,3,1,4).setValues([[status,consent,input.message||'',source]]);
    else beautyLiveRegistrationAppend_("'PLAYER STATUS DATA'!A:F",[player,'',status,consent,input.message||'',source]);
    stage('display');beautyLiveRegistrationSync_(s,player);
    stage('nakka');beautyLiveRegistrationSheets_();beautyLiveRegistrationEvent_();
    let members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    if(members.length>1)throw Error('Ambiguous league identity.');
    if(!members.length&&!beautyContextStandalone_()){beautyLiveRegistrationApi_('league/entry/update',{lgid:beautyLiveTarget_().leagueId,add:[{name:player}]});members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));}
    if(beautyContextStandalone_())members=[{name:player,lpid:''}];
    if(members.length!==1||!beautyContextStandalone_()&&!members[0].lpid)throw Error('League write not verified.');
    const matchingEntry=r=>key(r.name)===key(player)||(r.lpid&&String(r.lpid)===String(members[0].lpid));
    journal.leaguePlayerId=members[0].lpid;stage('nakka-event');
    let eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);
    if(!eventPlayers.length){beautyLiveRegistrationEvent_();beautyLiveRegistrationApi_('tournament/entry/update',{tdid:beautyLiveTarget_().eventId,add:[{name:player,...(beautyContextStandalone_()?{}:{lpid:members[0].lpid})}]});eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);}
    if(eventPlayers.length!==1||key(eventPlayers[0].name)!==key(player)||!eventPlayers[0].tpid||(!beautyContextStandalone_()&&eventPlayers[0].lpid&&String(eventPlayers[0].lpid)!==String(members[0].lpid)))throw Error('Event entry not verified.');
    const leagueLinkVerified=!!eventPlayers[0].lpid;
    journal.eventEntryId=eventPlayers[0].tpid;journal.leagueLinkVerified=leagueLinkVerified;
    stage('readback');beautyLiveRegistrationSheets_();
    const result=beautyLiveDashboardRead_(),found=result.players.filter(r=>key(r.player||r.newPlayer)===key(player));
    const final=beautyLiveRegistrationRows_(s.store,6).filter(r=>key(r[0])===key(player));
    if(found.length!==1||final.length!==1||final[0][1]!== (old?.r[1]||'')||final[0][2]!==status||final[0][3]!==consent||final[0][4]!== (input.message||'')||final[0][5]!==source||found[0].status!==status||found[0].consent!==consent||found[0].message!==(input.message||'')||found[0].whereFrom!==source)throw Error('Registration readback failed.');
    p.setProperty('BEAUTY_LIVE_REGISTRATION_LAST',JSON.stringify({...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString()}));p.deleteProperty(pending);
    if(p.getProperty(pending)!==null)throw Error('Receipt clear failed.');
    return {success:true,player,registrationEventDate:input.eventDate,readbackVerified:true,nakka:{entryConfirmed:true,leagueLinkVerified,message:beautyContextStandalone_()?'Nakka tournament entry verified.':leagueLinkVerified?'Nakka entry verified.':'Nakka entry verified. Its readback does not expose the league link.'}};
}

  const originalFailure=beautyLiveRegistrationFailure_;
  beautyLiveRegistrationFailure_=function(...args){env.observeFailure?.(args[3]);return originalFailure(...args);};
  return {register:beautyLiveRegister_,dashboard:beautyLiveDashboardRead_};
}

function beautyLabCandidateFactory20261109_(env) {
  const {SpreadsheetApp,UrlFetchApp,PropertiesService,LockService,Utilities,ScriptApp,BEAUTY_LIVE_BASE_,beautyLiveLoginGuard_,beautyContextAssert_,beautyContextToken_,beautyLiveTarget_,beautyContextStandalone_,beautyHubAuthRequire_}=env;
  const beautyLiveRegistrationActor_=()=>({uid:'TEST-LAB-FIXTURE',source:'HUB'});
  const FormApp={openById(){throw Error('LAB_STOP: Google Form access is disabled.');}};
function beautyLiveSheetsRead_(path,masterOnly=false) {
  beautyLiveLoginGuard_();
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+(masterOnly?BEAUTY_LIVE_BASE_.sheetId:beautyLiveTarget_().sheetId)+path,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('LIVE spreadsheet read failed (HTTP '+r.getResponseCode()+').');
  return JSON.parse(r.getContentText());
}
function beautyLiveDate_(value) {
  if(typeof value==='number'&&Number.isFinite(value))return new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000).toISOString().slice(0,10);
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null;
}
function beautyLiveDashboardRead_(includeMaster=true) {
  const ranges=["'Control'!A2","'TONIGHT''S PLAYERS'!A2:F","'PLAYER STATUS DATA'!A2:C"];
  const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==3)throw Error('Incomplete spreadsheet response.');
  const date=beautyLiveDate_(data.valueRanges[0].values?.[0]?.[0]);
  if(date!==beautyLiveTarget_().date)throw Error('The registration date changed. Reload the selected event.');
  const clean=v=>String(v??'').trim();
  const players=(data.valueRanges[1].values||[]).map(r=>({player:clean(r[0]),newPlayer:clean(r[1]),status:clean(r[2]),consent:clean(r[3]),message:String(r[4]??''),whereFrom:clean(r[5])})).filter(p=>p.player||p.newPlayer);
  const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const statuses=new Map();
  for(const row of data.valueRanges[2].values||[]){const name=key(row[0]);if(!name)continue;if(statuses.has(name))throw Error('Duplicate player status records need review.');statuses.set(name,clean(row[2]));}
  for(const player of players)player.status=statuses.get(key(player.player||player.newPlayer))||'';
  return {success:true,mode:'live-status',readOnly:false,statusWritesEnabled:true,eventContext:beautyContextToken_(),eventDate:date,eventDateDisplay:date,players,playerCount:players.length,masterPlayers:includeMaster?beautyLiveRegistrationRows_(SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName("PLAYER'S MASTER LIST"),1).map(r=>r[0]).filter(n=>n&&n!=='MITT NAMN FINNS INTE I LISTAN').sort((a,b)=>a.localeCompare(b,'sv-SE')):[],updatedAt:new Date().toISOString(),activeEvent:{mode:beautyLiveTarget_().mode,leagueId:beautyLiveTarget_().leagueId,eventId:beautyLiveTarget_().eventId,date},attention:{available:false,complete:false,eventDate:date,items:[]}};
}
function beautyLiveEventRead_() {
  const target=beautyLiveTarget_();
  const control=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Control'!A2")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(beautyLiveDate_(control.values?.[0]?.[0])!==target.date)throw Error('The registration date changed.');
  const r=UrlFetchApp.fetch('https://lbc.n01darts.com/n01/tournament/n01_tournament.php?cmd=get_data&tdid='+target.eventId,{method:'get',muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('Nakka event read failed.');
  const payload=JSON.parse(r.getContentText()),event=payload.tournament||payload;
  const date=Number.isFinite(event.t_date)?Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd'):null;
  if(event.tdid!==target.eventId||(event.lgid||'')!==target.leagueId||date!==target.date||event.team_games!==0||typeof event.title!=='string'||!event.title.trim()||event.title.length>300)throw Error('Nakka event identity mismatch.');
  return {success:true,status:'MATCHED',readOnly:true,eventDate:date,checkedAt:new Date().toISOString(),event:{id:event.tdid,title:event.title,date,url:'https://n01darts.com/n01/'+(target.mode==='tournament'?'tournament/comp':'league/season')+'.php?id='+target.eventId},message:'Selected public event verified. Administrative API access has not been checked.'};
}
function beautyHubTest(action,input,token) {
  beautyLiveLoginGuard_();
  try{beautyHubAuthRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};}
  if(typeof action==='string'&&action.startsWith('context:'))return beautyLiveContextService_(action.slice(8),input,token);
  if(['eveningsetup','eveningprepare','eveningsave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan'].includes(action))return beautyLivePlanner_(action,input,token);
  if(['register','status'].includes(action)&&PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return {success:false,code:'REMOVE_REVIEW',error:'Review the unfinished removal before another change.'};
  if(action==='removepreview'||action==='removesave'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRemove_(action==='removepreview'?'preview':'save',clean,token);
  }
  if(action==='register'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRegister_(clean,token);
  }
  if(action==='status'){
    if(PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REGISTRATION_PENDING'))return {success:false,code:'REGISTRATION_REVIEW_REQUIRED',error:'Review the pending registration before another save.'};
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveStatus_(clean,token);
  }
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='_context'))return {success:false,code:'LIVE_VIEW_ONLY',error:'This operation is not enabled.'};
  if(!['read','nakkaevent','nakkahealth'].includes(action))return {success:false,code:'LIVE_VIEW_ONLY',error:'This operation is not enabled. Event operations are not enabled.'};
  try{
    if(action==='read')return beautyLiveDashboardRead_();
    const event=beautyLiveEventRead_();
    if(action==='nakkaevent')return event;
    return {status:'OK',message:'Public Nakka event and registration date verified. Administrative API access not checked.',timestamp:event.checkedAt};
  }catch(e){
    if(action==='nakkahealth')return {status:'UNAVAILABLE',message:'The selected event and registration date could not be verified.',timestamp:new Date().toISOString()};
    return {success:false,code:'LIVE_READ_FAILED',error:e.message};
  }
}

var BeautyLiveNameResolution_ = (() => {
  const NEW = 'MITT NAMN FINNS INTE I LISTAN';
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const key = value => clean(value).toLocaleLowerCase('sv-SE');
  const error = (code, message) => ({ success: false, code, error: message });
  function resolve(input, master, tonight) {
    const selected = clean(input.selectedName);
    const entered = clean(selected === NEW ? input.newName : selected);
    if (!entered || entered.length > 120 || /^[=+@-]/.test(entered) || /[\x00-\x1f\x7f]/.test(entered)) {
      return error('INVALID_NAME', 'Enter a valid full name.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Several player records have this name. Please ask the organiser for help.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Select your name or add a new player.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Choose who you are.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'The selected name has changed. Start again with your name.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'This name is already on the list.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Enter your middle name, nickname or another identifying detail.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'The name and identifying detail are too long.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'This name with that detail already exists. Select it if it is you, or enter a different detail.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Confirm how your name will be displayed.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'You are already registered for this event.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();
/* LIVE registration. Selected event; staff authentication or restricted player actor.
 * ScriptLock serialises Hub and paired player routes in this project.
 * A pending receipt blocks retries after any uncertain multi-service write.
 */
function beautyLiveRegistrationSetup_() {
  beautyLiveLoginGuard_();
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/forms']);
  beautyLiveRegistrationSheets_();
  beautyLiveRegistrationForm_();
  beautyLiveRegistrationEvent_();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_SETUP',result:'READY_FOR_REGISTRATION_REVIEW',writesPerformed:false}));
}
function beautyLiveRegistrationReview_() {
  beautyLiveLoginGuard_();
  const p=PropertiesService.getScriptProperties();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECEIPT',pending:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_PENDING')||'null'),last:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_LAST')||'null')},null,2));
}
function beautyLiveRegistrationKey_(v) { return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'); }
function beautyLiveRegistrationRows_(sheet, width) {
  // Read through the same service used for RAW appends; do not reuse getLastRow caches.
  if(!Number.isInteger(width)||width<1||width>6)throw Error('Invalid read width.');
  SpreadsheetApp.flush();
  const name=sheet.getName();
  if(!["PLAYER'S MASTER LIST",'PLAYER STATUS DATA',"TONIGHT'S PLAYERS",'Form responses 2'].includes(name))throw Error('Unexpected registration sheet.');
  const range="'"+name.replace(/'/g,"''")+"'!A2:"+String.fromCharCode(64+width);
  const data=beautyLiveSheetsRead_('/values/'+encodeURIComponent(range)+'?valueRenderOption=FORMATTED_VALUE',name==="PLAYER'S MASTER LIST");
  if(data.values!==undefined&&!Array.isArray(data.values))throw Error('Incomplete sheet read.');
  const rows=data.values||[];
  if(rows.length>19999||rows.some(r=>!Array.isArray(r)||r.length>width))throw Error('Sheet exceeds reviewed size.');
  return rows.map(r=>Array.from({length:width},(_,i)=>String(r[i]??'')));
}
function beautyLiveRegistrationSheets_() {
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);
  if(ss.getId()!==beautyLiveTarget_().sheetId)throw Error('Wrong sheet.');
  const out={};
  for(const [key,name] of Object.entries({control:'Control',master:"PLAYER'S MASTER LIST",responses:'Form responses 2',store:'PLAYER STATUS DATA',tonight:"TONIGHT'S PLAYERS"})){
    out[key]=(key==='master'?SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId):ss).getSheetByName(name);if(!out[key])throw Error('Required sheet missing.');
  }
  const date=out.control.getRange('A2').getValue();
  if(!(date instanceof Date)||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==beautyLiveTarget_().date)throw Error('Event date changed.');
  const heads=out.store.getRange(1,1,1,6).getDisplayValues()[0];
  if(heads[0]!=='PLAYER'||heads[1]!=='OLD NAME'||heads[2]!=='STATUS'||heads[3]!=='FOTO&VIDEO'||heads[4]!=='MEDDELANDE'||heads[5]!=='WHERE FROM')throw Error('Status layout changed.');
  if(out.tonight.getRange(2,3,99,1).getFormulas().some(r=>r[0]))throw Error('Status formulas found.');
  const names=beautyLiveRegistrationRows_(out.tonight,2);
  if(names.slice(99).some(r=>r.some(Boolean)))throw Error('Registration display capacity reached.');
  return out;
}
function beautyLiveRegistrationApi_(path, payload) {
  beautyLiveLoginGuard_();beautyContextAssert_();
  if(payload){const t=beautyLiveTarget_();if(payload.tdid!==undefined&&payload.tdid!==t.eventId||payload.lgid!==undefined&&(t.mode!=='league'||payload.lgid!==t.leagueId))throw Error('Wrong event write target.');}
  const p=PropertiesService.getScriptProperties(),user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');
  if(!user||!password)throw Error('Nakka credentials missing.');
  const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{
    method:payload?'post':'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
    ...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{}),muteHttpExceptions:true,followRedirects:false
  });
  if(response.getResponseCode()!==200)throw Error('Nakka request failed.');
  const data=JSON.parse(response.getContentText());if(data.result!==0)throw Error('Nakka did not confirm request.');return data;
}
function beautyLiveRegistrationEvent_() {
  const t=beautyLiveTarget_(),e=beautyLiveRegistrationApi_('tournament/get?tdid='+t.eventId).tournament;
  if(!e||e.tdid!==t.eventId||(e.lgid||'')!==t.leagueId||e.team_games!==0||![10,20,25].includes(e.status)||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==t.date)throw Error('Nakka event is not open for registration.');
}
function beautyLiveRegistrationList_(kind) {
  if(kind==='league'&&beautyContextStandalone_())return [];
  const t=beautyLiveTarget_(),data=beautyLiveRegistrationApi_(kind==='league'?'league/entry/list?lgid='+t.leagueId:'tournament/entry/list?tdid='+t.eventId);
  if(!Array.isArray(data.list))throw Error('Incomplete Nakka list.');return data.list;
}
function beautyLiveRegistrationForm_() {
  const form=FormApp.openById('1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ');
  const questions=[];
  for(const [type,cast] of [[FormApp.ItemType.LIST,'asListItem'],[FormApp.ItemType.MULTIPLE_CHOICE,'asMultipleChoiceItem']]){
    for(const item of form.getItems(type)){const q=item[cast]();if(q.getTitle().trim()==='VÄLJ DITT NAMN')questions.push(q);}
  }
  const sections=form.getItems(FormApp.ItemType.PAGE_BREAK);
  if(questions.length!==1||sections.length<2)throw Error('Backup form layout changed.');
  return {question:questions[0],newSection:sections[0].asPageBreakItem(),existingSection:sections[1].asPageBreakItem()};
}
function beautyLiveRegistrationAppend_(range,values) {
  // RAW avoids interpreting a name/message as a spreadsheet formula.
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+(range==="'PLAYER''S MASTER LIST'!A:A"?BEAUTY_LIVE_BASE_.sheetId:beautyLiveTarget_().sheetId)+'/values/'+encodeURIComponent(range)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{
    method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:[values]}),muteHttpExceptions:true,followRedirects:false
  });
  if(r.getResponseCode()!==200)throw Error('Sheet append response uncertain.');
  const data=JSON.parse(r.getContentText());if(data.updates?.updatedRows!==1)throw Error('Sheet append not confirmed.');
}
// Two fresh ranges from the selected event in one request. Before/after reads
// remain separate; batchGet is not treated as a transaction or a cache.
function beautyLiveRegistrationDisplayRead_(s, width) {
  if(![1,3].includes(width)||s.tonight.getName()!=="TONIGHT'S PLAYERS"||s.store.getName()!=='PLAYER STATUS DATA')throw Error('Unexpected display read.');
  const ranges=["'TONIGHT''S PLAYERS'!A2:"+String.fromCharCode(64+width),"'PLAYER STATUS DATA'!A2:F"];
  SpreadsheetApp.flush();
  const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE');
  if(!data||!Array.isArray(data.valueRanges)||data.valueRanges.length!==2)throw Error('Incomplete display read.');
  return data.valueRanges.map((part,index)=>{
    if(!part||typeof part!=='object'||Array.isArray(part)||(part.majorDimension!==undefined&&part.majorDimension!=='ROWS')||(part.values!==undefined&&!Array.isArray(part.values)))throw Error('Incomplete display read.');
    const rows=part.values||[],columns=index===0?width:6;
    if(rows.length>19999||rows.some(r=>!Array.isArray(r)||r.length>columns))throw Error('Sheet exceeds reviewed size.');
    return rows.map(r=>Array.from({length:columns},(_,i)=>String(r[i]??'')));
  });
}
function beautyLiveRegistrationSync_(s,player) {
  const key=beautyLiveRegistrationKey_;
  for(let pass=0;pass<5;pass++){
    SpreadsheetApp.flush();if(pass)Utilities.sleep(1000);
    const [displayRows,snapshot]=beautyLiveRegistrationDisplayRead_(s,1);
    const names=Array.from({length:99},(_,i)=>displayRows[i]?.[0]||'');
    if(names.filter(n=>key(n)===key(player)).length!==1)continue;
    const map=new Map();

    for(const r of snapshot)if(key(r[0])){
      if(map.has(key(r[0])))throw Error('Duplicate status rows.');map.set(key(r[0]),['IN','OUT','STANDBY'].includes(r[2])?r[2]:'');
    }
    const values=names.map(n=>[map.get(key(n))||'']);
    s.tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
    const [readback,current]=beautyLiveRegistrationDisplayRead_(s,3);
    const after=Array.from({length:99},(_,i)=>readback[i]||['','','']);

    if(JSON.stringify(current)!==JSON.stringify(snapshot))continue;
    if(after.every((r,i)=>r[0]===names[i]&&r[2]===values[i][0])&&current.every(r=>!key(r[0])||map.get(key(r[0]))===(['IN','OUT','STANDBY'].includes(r[2])?r[2]:'')))return;
  }
  throw Error('Tonight display could not be verified.');
}
function beautyLiveRegister_(input,token) {
  beautyLiveLoginGuard_();const user=typeof beautyLiveRegistrationActor_==='function'?beautyLiveRegistrationActor_(token):beautyHubAuthRequire_(token),source=user.source||'HUB',key=beautyLiveRegistrationKey_;
  const fail=(code,error)=>({success:false,code,error});
  const allowed=['eventDate','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
  if(!input||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k))||Object.values(input).some(v=>typeof v!=='string')||input.eventDate!==beautyLiveTarget_().date||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000)return fail('INVALID','Check registration fields.');
  input={...input};
  if(input.selectedName==='MITT NAMN FINNS INTE I LISTAN'&&!input.identityChoice)input.newName=String(input.newName||'').toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','Another Hub operation is running.');
  const p=PropertiesService.getScriptProperties(),pending='BEAUTY_LIVE_REGISTRATION_PENDING';let attempted=false,journal;
  try {
    beautyContextAssert_();
    if(p.getProperty(pending)||p.getProperty('BEAUTY_LIVE_STATUS_PENDING')||p.getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return fail('REGISTRATION_REVIEW_REQUIRED','A previous save needs review. Do not repeat registration.');
    const s=beautyLiveRegistrationSheets_(),master=()=>beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(n=>key(n)&&n!=='MITT NAMN FINNS INTE I LISTAN');
    const tonight=()=>beautyLiveRegistrationRows_(s.tonight,2).map(r=>r[0]||r[1]).filter(Boolean);
    if(tonight().length>=99)throw Error('Registration display capacity reached.');
    const resolved=BeautyLiveNameResolution_.resolve(input,master(),tonight());if(!resolved.success)return resolved;
    const player=resolved.player;
    if(/^[=+@-]/.test((input.message||'').trim()))return fail('INVALID','Start the message with ordinary text.');
    beautyLiveRegistrationEvent_();
    const league=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    const entries=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(player)||(league.length===1&&r.lpid&&String(r.lpid)===String(league[0].lpid)));
    if(league.length>1||entries.length>1)return fail('AMBIGUOUS_NAME','Duplicate Nakka identities need review.');
    if(league.length===1&&!league[0].lpid)throw Error('League identity missing.');
    if(!beautyContextStandalone_()&&entries.length&&(!league.length||key(entries[0].name)!==key(player)||(entries[0].lpid&&String(entries[0].lpid)!==String(league[0].lpid))))return fail('AMBIGUOUS_NAME','Nakka player identity needs review.');
    const rows=beautyLiveRegistrationRows_(s.store,6),matches=rows.map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(matches.length>1)return fail('AMBIGUOUS_NAME','Duplicate status identities need review.');
    const old=matches[0];if(old&&s.store.getRange(old.row,1,1,6).getFormulas()[0].some(Boolean))throw Error('Formula in source record.');
    const status=old?.r[2]||'IN';if(!['IN','OUT','STANDBY'].includes(status))throw Error('Unexpected status.');
    const form=resolved.isNew?beautyLiveRegistrationForm_():null;
    beautyLiveRegistrationSheets_();
    const again=BeautyLiveNameResolution_.resolve(input,master(),tonight());
    if(!again.success||again.player!==player||again.isNew!==resolved.isNew)return fail('STALE_IDENTITY','Player list changed. Reload.');
    journal={state:'ATTEMPTED',stage:'response',uid:user.uid,source,eventId:beautyLiveTarget_().eventId,player,eventDate:input.eventDate,recordedUTC:new Date().toISOString()};
    const stage=value=>{journal.stage=value;p.setProperty(pending,JSON.stringify(journal));if(p.getProperty(pending)!==JSON.stringify(journal))throw Error('Receipt not saved.');};
    stage('response');attempted=true;
    // Native timestamp serial (same date basis as spreadsheet's Europe/Berlin zone).
    const wall=Utilities.formatDate(new Date(),'Europe/Berlin',"yyyy-MM-dd'T'HH:mm:ss");
    const serial=(Date.parse(wall+'Z')-Date.UTC(1899,11,30))/86400000;
    beautyLiveRegistrationAppend_("'Form responses 2'!A:F",[serial,resolved.isNew?'MITT NAMN FINNS INTE I LISTAN':player,resolved.isNew?player:'',input.consent,input.message||'',source]);
    return beautyLiveRegistrationFinish_({source,s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending});
  }catch(e){if(attempted&&journal)beautyLiveRegistrationFailure_(p,pending,journal,e);return fail(attempted?'REGISTRATION_UNCERTAIN':'REGISTRATION_CHECK_FAILED',attempted?'Registration may be partly saved. Do not submit again. Review the saved registration receipt.':'Registration checks failed. No registration write was attempted.');}
  finally{lock.releaseLock();}
}

function beautyLiveRegistrationFailure_(p,pending,journal,error) {
  // Keep the original attempted stage; never clear a receipt on a failed write.
  const known=['Master readback failed.','Sheet append response uncertain.','Sheet append not confirmed.','Form choices not verified.','Status record changed during registration.','Tonight display could not be verified.','League write not verified.','Event entry not verified.','Registration readback failed.'];
  const detail=known.includes(String(error.message))?String(error.message):'Service or verification failure; inspect execution.';
  try{p.setProperty(pending,JSON.stringify({...journal,failure:detail,failedUTC:new Date().toISOString()}));}catch(ignored){}
}
function beautyLiveRegistrationFinish_(c) {
  const {s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending}=c;
  const key=beautyLiveRegistrationKey_,source=c.source||'HUB';
    if(resolved.isNew){
      stage('master');
      if(!master().some(n=>key(n)===key(player)))beautyLiveRegistrationAppend_("'PLAYER''S MASTER LIST'!A:A",[player]);
      if(master().filter(n=>key(n)===key(player)).length!==1)throw Error('Master readback failed.');
      // Append preserves concurrent names; sort choices without clearing the master.
      stage('backup-form');
      const names=master().sort((a,b)=>a.localeCompare(b,'sv-SE'));
      form.question.setChoices([...names.map(n=>form.question.createChoice(n,form.existingSection)),form.question.createChoice('MITT NAMN FINNS INTE I LISTAN',form.newSection)]);
      if(JSON.stringify(form.question.getChoices().map(c=>c.getValue()))!==JSON.stringify([...names,'MITT NAMN FINNS INTE I LISTAN']))throw Error('Form choices not verified.');
    }
    stage('status');
    const fresh=beautyLiveRegistrationRows_(s.store,6).map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(JSON.stringify(fresh)!==JSON.stringify(matches))throw Error('Status record changed during registration.');
    const consent=input.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ';
    if(old)s.store.getRange(old.row,3,1,4).setValues([[status,consent,input.message||'',source]]);
    else beautyLiveRegistrationAppend_("'PLAYER STATUS DATA'!A:F",[player,'',status,consent,input.message||'',source]);
    stage('display');beautyLiveRegistrationSync_(s,player);
    stage('nakka');beautyLiveRegistrationSheets_();beautyLiveRegistrationEvent_();
    let members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    if(members.length>1)throw Error('Ambiguous league identity.');
    if(!members.length&&!beautyContextStandalone_()){beautyLiveRegistrationApi_('league/entry/update',{lgid:beautyLiveTarget_().leagueId,add:[{name:player}]});members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));}
    if(beautyContextStandalone_())members=[{name:player,lpid:''}];
    if(members.length!==1||!beautyContextStandalone_()&&!members[0].lpid)throw Error('League write not verified.');
    const matchingEntry=r=>key(r.name)===key(player)||(r.lpid&&String(r.lpid)===String(members[0].lpid));
    journal.leaguePlayerId=members[0].lpid;stage('nakka-event');
    let eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);
    if(!eventPlayers.length){beautyLiveRegistrationEvent_();beautyLiveRegistrationApi_('tournament/entry/update',{tdid:beautyLiveTarget_().eventId,add:[{name:player,...(beautyContextStandalone_()?{}:{lpid:members[0].lpid})}]});eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);}
    if(eventPlayers.length!==1||key(eventPlayers[0].name)!==key(player)||!eventPlayers[0].tpid||(!beautyContextStandalone_()&&eventPlayers[0].lpid&&String(eventPlayers[0].lpid)!==String(members[0].lpid)))throw Error('Event entry not verified.');
    const leagueLinkVerified=!!eventPlayers[0].lpid;
    journal.eventEntryId=eventPlayers[0].tpid;journal.leagueLinkVerified=leagueLinkVerified;
    stage('readback');beautyLiveRegistrationSheets_();
    const result=beautyLiveDashboardRead_(false),found=result.players.filter(r=>key(r.player||r.newPlayer)===key(player));
    const final=beautyLiveRegistrationRows_(s.store,6).filter(r=>key(r[0])===key(player));
    if(found.length!==1||final.length!==1||final[0][1]!== (old?.r[1]||'')||final[0][2]!==status||final[0][3]!==consent||final[0][4]!== (input.message||'')||final[0][5]!==source||found[0].status!==status||found[0].consent!==consent||found[0].message!==(input.message||'')||found[0].whereFrom!==source)throw Error('Registration readback failed.');
    p.setProperty('BEAUTY_LIVE_REGISTRATION_LAST',JSON.stringify({...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString()}));p.deleteProperty(pending);
    if(p.getProperty(pending)!==null)throw Error('Receipt clear failed.');
    return {success:true,player,registrationEventDate:input.eventDate,readbackVerified:true,nakka:{entryConfirmed:true,leagueLinkVerified,message:beautyContextStandalone_()?'Nakka tournament entry verified.':leagueLinkVerified?'Nakka entry verified.':'Nakka entry verified. Its readback does not expose the league link.'}};
}

  const originalFailure=beautyLiveRegistrationFailure_;
  beautyLiveRegistrationFailure_=function(...args){env.observeFailure?.(args[3]);return originalFailure(...args);};
  return {register:beautyLiveRegister_,dashboard:beautyLiveDashboardRead_};
}

