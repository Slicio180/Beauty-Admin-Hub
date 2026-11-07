/* Identity TEST: date-matched TEST event selection and explicitly reviewed creation. */
function beautyHubNakkaDate_() {
  const ss = (typeof beautyHubSpreadsheet_==='function'?beautyHubSpreadsheet_():SpreadsheetApp.openById(SHEET_ID));
  if (ss.getId() !== SHEET_ID) throw new Error('identity');
  const zone = ss.getSpreadsheetTimeZone();
  if (zone !== 'Europe/Berlin') throw new Error('zone');
  const cell = ss.getSheetByName('Control').getRange('A2');
  const value = cell.getValue();
  if (cell.getFormula() || !(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('date');
  return {date: Utilities.formatDate(value, zone, 'yyyy-MM-dd'), zone: zone};
}
function beautyHubNakkaEvent_(input) {
  if(typeof beautyContextRead_==='function'&&beautyContextRead_()){beautyHubTestGuard_();beautyHubNakkaAuthorize_();if(!input||Object.keys(input).length)throw Error('Unexpected event input.');return beautyContextMatch_();}
  beautyHubTestGuard_();
  beautyHubNakkaAuthorize_();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Unexpected event input.');
  const answer = (status, message, date, event) => ({success:true, status:status, message:message,
    eventDate:date || '', event:event || null, readOnly:true, checkedAt:new Date().toISOString()});
  let selected;
  try { selected = beautyHubNakkaDate_(); } catch(e) { return answer('UNAVAILABLE','The TEST event date could not be read.'); }
  const props = PropertiesService.getScriptProperties();
  const user = props.getProperty('N01_API_USER'), password = props.getProperty('N01_API_PASSWORD');
  if (!user || !password) return answer('UNAVAILABLE','Nakka API credentials are not configured.',selected.date);
  let response;
  try {
    response = UrlFetchApp.fetch(('https://push.n01darts.com/api/v1/league/tournament/list?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'&count=100'), {
      method:'get', headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
      muteHttpExceptions:true, followRedirects:false
    });
  } catch(e) { return answer('UNAVAILABLE','Nakka events could not be reached.',selected.date); }
  const code = response.getResponseCode();
  if (code !== 200) return answer('UNAVAILABLE',code === 401 || code === 403 ? 'Nakka authentication failed.' : 'Nakka event lookup failed (HTTP '+code+').',selected.date);
  let data;
  try { data = JSON.parse(response.getContentText()); } catch(e) { return answer('UNAVAILABLE','Nakka returned an unreadable event response.',selected.date); }
  if (!data || data.result !== 0 || !Array.isArray(data.list) || data.list.length >= 100)
    return answer('UNAVAILABLE','The Nakka event list is invalid or may be incomplete. No event selected.',selected.date);
  const matches = [];
  for (const event of data.list) {
    if (!event || typeof event !== 'object' || Array.isArray(event))
      return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    // Undated events cannot match a calendar date. Do not coerce strings.
    if (event.t_date === undefined || event.t_date === null || event.t_date === '' || event.t_date === 0) continue;
    if (typeof event.t_date !== 'number' || !Number.isFinite(event.t_date) || event.t_date < 0)
      return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    const date = new Date(event.t_date * 1000);
    if (!Number.isFinite(date.getTime())) return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    if (Utilities.formatDate(date,selected.zone,'yyyy-MM-dd') === selected.date) matches.push(event);
  }
  beautyHubNakkaAuthorize_();
  try { if (beautyHubNakkaDate_().date !== selected.date) return answer('STALE','The Hub date changed during lookup. Check again.'); }
  catch(e) { return answer('UNAVAILABLE','The TEST event date could not be rechecked.'); }
  // A live Monday tournament can share this date. It must never become the TEST target.
  if (matches.some(event => typeof event.tdid !== 'string' || !/^t_[A-Za-z0-9_]{1,80}$/.test(event.tdid)))
    return answer('UNAVAILABLE','The matching Nakka event details need review.',selected.date);
  const targets=matches.filter(event=>event.tdid==='t_QHaG_7792'||/^AIK Hub TEST(?: |$)/.test(event.title||''));
  if(!targets.length)return answer('NOT_FOUND','No TEST event exists for this date. You can review creating one.',selected.date);
  if(targets.length!==1)return answer('AMBIGUOUS','More than one TEST event matches this date. Select the intended event in Nakka before continuing.',selected.date);
  const match=targets[0];
  if(match.tdid==='t_QHaG_7792'&&match.title!=='Beauty Registration TEST event DO NOT USE LIVE')return answer('UNAVAILABLE','Original TEST identity changed.',selected.date);
  if(data.list.filter(e=>e.tdid===match.tdid).length!==1||match.lgid!==undefined&&match.lgid!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''))return answer('UNAVAILABLE','Event identity needs review.',selected.date);
  const binding={id:match.tdid,title:match.title,date:selected.date};
  props.setProperty(('BEAUTY_SELECTED_TEST_EVENT'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),JSON.stringify(binding));
  const matchedAnswer=answer('MATCHED','The dedicated TEST event matches the selected Hub date. No players have been synced.',selected.date,
    {id:match.tdid,title:match.title,date:selected.date,url:(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_()?'https://n01darts.com/n01/tournament/comp.php?id=':'https://n01darts.com/n01/league/season.php?id=')+encodeURIComponent(match.tdid)});
  matchedAnswer.creationReviewRequired=beautyHubCreationNeedsReview_(selected.date,binding);return matchedAnswer;
}

/* Compare names only. Equal names are not proof of permanent player identity. */
function beautyHubNakkaCompareNames_(hub, nakka) {
  const key = value => value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const groups = new Map();
  for (const [side, rows] of [['hub',hub],['nakka',nakka]]) {
    for (const row of rows) {
      const k = key(row.name);
      if (!groups.has(k)) groups.set(k,{hub:[],nakka:[]});
      groups.get(k)[side].push(row);
    }
  }
  const result = {both:[],hubOnly:[],nakkaOnly:[],ambiguous:[]};
  for (const [k, group] of groups) {
    if (group.hub.length > 1 || group.nakka.length > 1) {
      result.ambiguous.push({name:(group.hub[0]||group.nakka[0]).name,hubCount:group.hub.length,nakkaCount:group.nakka.length});
    } else if (group.hub.length && group.nakka.length) result.both.push({name:group.hub[0].name,status:group.hub[0].status});
    else if (group.hub.length) result.hubOnly.push({name:group.hub[0].name,status:group.hub[0].status});
    else result.nakkaOnly.push({name:group.nakka[0].name});
  }
  for (const rows of Object.values(result)) rows.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
  return result;
}
function beautyHubNakkaHubRows_() {
  const ss = (typeof beautyHubSpreadsheet_==='function'?beautyHubSpreadsheet_():SpreadsheetApp.openById(SHEET_ID));
  if (ss.getId() !== SHEET_ID) throw new Error('identity');
  const sheet = ss.getSheetByName("TONIGHT'S PLAYERS");
  const count = sheet.getLastRow();
  if (count > 1001) throw new Error('size');
  // Read headers and roster together, freshly on every call.
  const rows = sheet.getRange(1,1,Math.max(1,count),3).getDisplayValues();
  if (JSON.stringify(rows[0]) !== JSON.stringify(['PLAYERS','NEW PLAYERS','STATUS'])) throw new Error('headers');
  if (count < 2) return [];
  return rows.slice(1).filter(row=>row[0]||row[1]).map(row=>{
    const name = String(row[0]||row[1]||'').trim();
    if (!name || name.length > 120 || /[\x00-\x1f\x7f]/.test(name)) throw new Error('name');
    return {name:name,status:String(row[2]||'').trim().slice(0,40)};
  });
}
function beautyHubNakkaCompare_(input) {
  beautyHubTestGuard_();
  beautyHubNakkaAuthorize_();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Unexpected comparison input.');
  const eventResult = beautyHubNakkaEvent_({});
  if (eventResult.status !== 'MATCHED') return eventResult;
  const fail = message => ({success:true,status:'UNAVAILABLE',message:message,eventDate:eventResult.eventDate,event:null,readOnly:true,checkedAt:new Date().toISOString()});
  let hub;
  try { hub = beautyHubNakkaHubRows_(); } catch(e) { return fail('The TEST player list could not be read safely.'); }
  const props = PropertiesService.getScriptProperties(),user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
  if (!user||!password) return fail('Nakka API credentials are not configured.');
  let response,data;
  try {
    response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/tournament/entry/list?tdid='+encodeURIComponent(eventResult.event.id),{
      method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false});
    if(response.getResponseCode()!==200)return fail('Nakka event players could not be read (HTTP '+response.getResponseCode()+').');
    data=JSON.parse(response.getContentText());
  } catch(e) { return fail('Nakka returned no readable player list.'); }
  if (!data||data.result!==0||!Array.isArray(data.list)||data.list.length>1000) return fail('Nakka returned an invalid or oversized player list.');
  const nakka=[];
  for (const row of data.list) {
    if (!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||/[\x00-\x1f\x7f]/.test(row.name))return fail('A Nakka player name needs review.');
    nakka.push({name:row.name.trim()});
  }
  beautyHubNakkaAuthorize_();
  try {
    if(beautyHubNakkaDate_().date!==eventResult.eventDate||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub))
      return {success:true,status:'STALE',message:'The Hub date or players changed during comparison. Compare again.',event:null,readOnly:true,checkedAt:new Date().toISOString()};
  } catch(e) { return fail('The TEST player list could not be rechecked.'); }
  return Object.assign({},eventResult,{status:'COMPARED',message:'Name comparison only. All Hub statuses are included. No players have been synced.',hubCount:hub.length,nakkaCount:nakka.length,
    comparison:beautyHubNakkaCompareNames_(hub,nakka),checkedAt:new Date().toISOString()});
}


function beautyHubActiveTestTarget_(){
 if(typeof beautyContextRead_==='function'&&beautyContextRead_())return beautyContextTarget_();
 const selected=beautyHubNakkaDate_(),v=JSON.parse(PropertiesService.getScriptProperties().getProperty(('BEAUTY_SELECTED_TEST_EVENT'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''))||'null');
 if(!v||v.date!==selected.date||!/^t_[A-Za-z0-9_]{1,80}$/.test(v.id)||!(v.id==='t_QHaG_7792'&&v.title==='Beauty Registration TEST event DO NOT USE LIVE'||/^AIK Hub TEST(?: |$)/.test(v.title||'')))throw Error('Check the Nakka event for the selected Hub date before continuing.');
 return v;
}

/* Nakka omits disabled formats from tournament/get; absence is not an enabled stage. */
function beautyHubCreateFormatMatches_(event,expected){
 for(const [key,flag]of [['rr_setting','round_robin'],['t_setting','tournament'],['s2_setting','tournament']]){
  const wanted=expected[key],actual=event[key];
  if(wanted?.[flag]===0){if(actual!=null&&actual[flag]!==0)return false;}
  else if(!wanted||!actual||!beautyPoolEqual_(actual,wanted))return false;
 }
 return true;
}
function beautyHubCreationNeedsReview_(date,event){
 try{
 const props=PropertiesService.getScriptProperties(),raw=props.getProperty(('BEAUTY_CREATE_EVENT_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date),journal=JSON.parse(raw||'null');
 if(journal?.state!=='ATTEMPTED'||journal.title!==event.title)return false;
 const reviewed=JSON.parse(props.getProperty(('BEAUTY_CREATE_REVIEW_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date)||'null');
 return !(reviewed?.eventId===event.id&&reviewed.journalHash===beautyPoolHash_(journal));
 }catch(e){return true;}
}
/* Provider GETs only. Preserve the original ATTEMPTED journal; record a separate review. */
function beautyHubReviewCreatedEvent_(input){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another event operation is running.'};
 try{
  const account=beautyHubAuthRequire_(beautyHubRequestToken_);if(!input||Object.keys(input).length)throw Error('input');
  const date=beautyHubNakkaDate_().date,props=PropertiesService.getScriptProperties(),raw=props.getProperty(('BEAUTY_CREATE_EVENT_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date),journal=JSON.parse(raw||'null');
  if(journal?.state!=='ATTEMPTED'||journal.date!==date)throw Error('journal');
  const before=beautyTournamentReadAudit_(journal.audit);
  if(before.kind!=='EVENT_CREATE_BEFORE'||before.uid!==account.uid||before.date!==date||before.title!==journal.title||!beautyPoolEqual_(before.matchSettings,journal.matchSettings))throw Error('audit');
  const found=beautyHubNakkaEvent_({});if(found.status!=='MATCHED'||found.event?.title!==journal.title)throw Error('selection');
  const auth=beautyPoolAuth_(),event=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(found.event.id),auth).tournament;
  const wanted={tdid:found.event.id,title:journal.title,status:20,t_date:Date.parse(date+'T12:00:00Z')/1000,lgid:(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),team_games:0,game_type:5,private:0,join_pass:'AIK',common_join:1,individual_pass:0};
  for(const k of Object.keys(wanted))if(event?.[k]!==wanted[k])throw Error('metadata');
  const entries=beautyHubTransferFetch_('tournament/entry/list?tdid='+encodeURIComponent(event.tdid),auth).list;
  if(!Array.isArray(entries)||entries.length||event.entry_list?.length)throw Error('entries');
  for(const k of Object.keys(event))if(/_(table|result|rank)$/.test(k)&&!beautyPoolEmpty_(event[k]))throw Error('play');
  let scope='FULL_FORMAT';
  if(before.settings){if(!beautyHubCreateFormatMatches_(event,before.settings))throw Error('settings');}
  else{
   // Older audits retain reviewed text, not the inherited template. Qualify only
   // the exact RR-only options visible in that review; never claim full readback.
   if(before.format!=='Round Robin only'||before.matchSettings?.length!==3||before.matchSettings[1]!=='Slutspel 1: off'||before.matchSettings[2]!=='Slutspel 2: off'||event.t_setting?.tournament===1||event.s2_setting?.tournament===1)throw Error('legacy format');
   const rr=event.rr_setting;if(rr?.round_robin!==1||rr.limit!==1||rr.drawMode!==0||rr.match_type!=='01'||rr.startScore!==501||!Number.isInteger(rr.limit_leg_count)||rr.limit_leg_count<1||rr.limit_leg_count>99||!Array.isArray(rr.game_setting)||rr.game_setting.length||![0,1].includes(rr.limit_rounds))throw Error('legacy rules');
   const n=rr.limit_leg_count;if(rr.limit_rounds===1&&(!Number.isInteger(rr.rounds)||rr.rounds<1||rr.rounds>99))throw Error('limit');
   const text='Groups: first to '+n+' '+(n===1?'leg':'legs')+' · '+(rr.limit_rounds===1?rr.rounds*3+' darts per player per leg ('+rr.rounds+' rounds)':'No dart limit');
   if(before.matchSettings[0]!==text)throw Error('review text');scope='REVIEWED_OPTIONS_ONLY';
  }
  beautyHubAuthRequire_(beautyHubRequestToken_);
  const again=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(event.tdid),auth).tournament;
  if(!beautyPoolEqual_(event,again)||beautyHubNakkaDate_().date!==date||props.getProperty(('BEAUTY_CREATE_EVENT_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date)!==raw)throw Error('changed');
  const receipt=beautyPoolAudit_({kind:'EVENT_CREATE_EXISTING_REVIEW',uid:account.uid,beforeAudit:journal.audit,date,eventId:event.tdid,scope,matchSettings:before.matchSettings});
  props.setProperty(('BEAUTY_CREATE_REVIEW_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date,JSON.stringify({eventId:event.tdid,journalHash:beautyPoolHash_(journal),receipt,scope}));
  return {success:true,readbackVerified:true,scope,receipt,message:scope==='FULL_FORMAT'?'Existing TEST event settings and empty registration verified. No event recreated.':'Existing TEST event reviewed match options and empty registration verified. The older audit cannot prove every inherited setting. No event recreated.'};
 }catch(e){return {success:false,error:'Existing event review did not match its original approval. No Nakka changes made. Keep the original creation journal and inspect the event.'};}
 finally{lock.releaseLock();}
}

/* New-event match options only. Never copy entries, play data or client provider fields. */
// Clean configuration only: creation must work after all historical TEST events are deleted.
function beautyHubCleanFormatBase_(){
 const game={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01',limit_rounds:1,rounds:13,overkill:0,game_setting:[],schedule:[]};
 return {rr_setting:{...game,round_robin:1,robin_count:1,robin_player_count:4,point_w:2,point_d:1,point_l:0},t_setting:{...game,tournament:1,t_player_count:16,t3:0},s2_setting:{...game,tournament:1,t_player_count:16,t3:0}};
}
function beautyHubCreateMatchSettings_(raw,template){
 const fail=message=>{throw {reviewMessage:message};};
 if(typeof raw!=='string'||raw.length>4000)fail('Invalid match settings. Review the event setup again.');
 let input;try{input=JSON.parse(raw);}catch(e){fail('Match settings are unreadable. Review the event setup again.');}
 const object=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
 if(!object(input,['groups','stage1','stage2']))fail('Invalid match settings. Review the event setup again.');
 if(!input.groups&&!input.stage1&&!input.stage2)fail('Choose Round Robin or at least one Slutspel.');
 const integer=(n,label)=>{if(!Number.isInteger(n)||n<1||n>99)fail(label+' must be a whole number from 1 to 99.');return n;};
 const set={},summary=[];
 for(const [key,provider,title] of [['groups','rr_setting','Groups'],['stage1','t_setting','Slutspel 1'],['stage2','s2_setting','Slutspel 2']]){
  const value=input[key],knockout=key!=='groups',keys=knockout?['legs','maxDarts','finalLegs','thirdPlace','thirdPlaceLegs']:['legs','maxDarts'];
  if(value===null){set[provider]=beautyPoolCopy_(template[provider]);Object.assign(set[provider],knockout?{tournament:0,t3:0}:{round_robin:0});summary.push(title+': off');continue;}
  if(knockout&&Object.prototype.hasOwnProperty.call(value||{},'slots'))keys.push('slots');
  if(!object(value,keys))fail('Invalid '+title+' settings. Review the event setup again.');
  if(knockout&&(!input.groups||value.slots!==undefined)&&(!Number.isInteger(value.slots)||value.slots<2||value.slots>128||(value.slots&(value.slots-1))))fail(title+' bracket size must be a power of two from 2 to 128.');
  const legs=integer(value.legs,title+' legs');
  if(value.maxDarts!==null&&(!Number.isInteger(value.maxDarts)||value.maxDarts<3||value.maxDarts>297||value.maxDarts%3!==0))fail(title+' dart limit must be a multiple of 3, from 3 to 297, or disabled.');
  const limited=value.maxDarts!==null,rounds=limited?value.maxDarts/3:15;
  const setting=beautyPoolCopy_(template[provider]);
  Object.assign(setting,knockout?{tournament:1,...(value.slots!==undefined?{t_player_count:value.slots}:{})}:{round_robin:1});
  Object.assign(setting,{limit:1,limit_leg_count:legs,drawMode:0,limit_rounds:limited?1:0,rounds,game_setting:[]});
  let text=title+': first to '+legs+' '+(legs===1?'leg':'legs');
  if(knockout){
   const finalLegs=integer(value.finalLegs,title+' final legs'),thirdLegs=integer(value.thirdPlaceLegs,title+' third-place legs');
   if(typeof value.thirdPlace!=='boolean')fail(title+' third-place choice must be on or off.');
   setting.t3=value.thirdPlace&&setting.t_player_count!==2?1:0;
   const override=(round,count)=>({round,limit:1,limit_leg_count:count,drawMode:0,startScore:setting.startScore||501,match_type:setting.match_type||'01',roundLimit:limited?1:0,maxRound:rounds,overkill:setting.overkill||0});
   if(finalLegs!==legs)setting.game_setting.push(override(-1,finalLegs));
   if(setting.t3===1)setting.game_setting.push(override(-3,thirdLegs));
   text+=' · Final: first to '+finalLegs+' · Third place: '+(setting.t3===1?'first to '+thirdLegs:'off')+(!input.groups||value.slots!==undefined?' · '+setting.t_player_count+' bracket slots':'');
  }
  text+=' · '+(limited?value.maxDarts+' darts per player per leg ('+rounds+' rounds)':'No dart limit');
  set[provider]=setting;summary.push(text);
 }
 const stages=[input.stage1?'Slutspel 1':'',input.stage2?'Slutspel 2':''].filter(Boolean).join(' and ');
 return {set,summary,format:input.groups?(stages?'Round Robin + '+stages:'Round Robin only'):stages+' only'};
}

/* Explicit find-or-create review. Changing the date never creates an event. */
function beautyHubCreateEvent_(action,input){
 if(!['prepare','confirm'].includes(action))return {success:false,error:'Invalid event action.'};
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another event operation is running.'};
 let attempted=false;const fail=message=>{throw {reviewMessage:message};};
 try{
  const account=beautyHubAuthRequire_(beautyHubRequestToken_),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache();
  const keys=action==='prepare'?(Object.prototype.hasOwnProperty.call(input||{},'settings')?'settings,title':'title'):'confirmed,ticket';
  if(!input||Object.keys(input).sort().join(',')!==keys||Object.values(input).some(v=>typeof v!=='string'))fail('Invalid event request.');
  const date=beautyHubNakkaDate_().date,key=('BEAUTY_CREATE_EVENT_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+date;
  if(props.getProperty(key))fail('An event creation is already recorded for this date. Check Nakka and its audit; do not create again.');
  const found=beautyHubNakkaEvent_({});if(found.status!=='NOT_FOUND')fail('An event already exists or the lookup is incomplete. Check Nakka again.');
  const auth=beautyPoolAuth_(),session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_);
  if(action==='prepare'){
   if(!(typeof beautyContextRead_==='function'&&beautyContextRead_()?typeof input.title==='string'&&input.title.trim():/^AIK Hub TEST(?: |$)/.test(input.title))||input.title.length>60||/[\x00-\x1f<>]/.test(input.title))fail('Start the event name with "AIK Hub TEST" (maximum 60 characters).');
   const template=beautyHubCleanFormatBase_();
   const set={title:input.title,status:20,t_date:Date.parse(date+'T12:00:00Z')/1000,lgid:(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),kind:'darts',team_games:0,game_type:5,private:0,join_pass:'AIK',common_join:1,individual_pass:0};
   for(const k of ['rr_setting','t_setting','s2_setting'])if(template[k])set[k]=beautyPoolCopy_(template[k]);
   const configured=beautyHubCreateMatchSettings_(input.settings!==undefined?input.settings:JSON.stringify({groups:{legs:2,maxDarts:39},stage1:{legs:2,finalLegs:3,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2},stage2:{legs:2,finalLegs:2,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2}}),template);
   if(configured)Object.assign(set,configured.set);
   const ticket=Utilities.getUuid().replace(/-/g,'');cache.put(('beauty-create:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+ticket,JSON.stringify({uid:account.uid,session,date,set,matchSettings:configured?.summary||[],format:configured?.format||'Round Robin + Slutspel 1 and 2',expires:Date.now()+300000}),300);
   return {success:true,ticket,event:{title:set.title,date,format:configured?.format||'Round Robin + Slutspel 1 and 2',league:set.lgid,status:'Accepting entries',private:false,...(configured?{matchSettings:configured.summary}:{})},message:'Review this new TEST event. Existing players, results and brackets will not be copied.'};
  }
  const review=JSON.parse(cache.get(('beauty-create:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket)||'null');
  if(input.confirmed!=='true'||!review||review.uid!==account.uid||review.session!==session||review.date!==date||Date.now()>=review.expires)fail('Review expired. Review again to continue.');
  cache.remove(('beauty-create:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket);
  beautyHubAuthRequire_(beautyHubRequestToken_);
  const audit=beautyPoolAudit_({kind:'EVENT_CREATE_BEFORE',uid:account.uid,date,title:review.set.title,format:review.format||'RR_TWO_KNOCKOUTS',league:(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+''),matchSettings:review.matchSettings||[],settings:{rr_setting:review.set.rr_setting,t_setting:review.set.t_setting,s2_setting:review.set.s2_setting}});
  const marker=JSON.stringify({state:'ATTEMPTED',audit,date,title:review.set.title,matchSettings:review.matchSettings||[]});props.setProperty(key,marker);if(props.getProperty(key)!==marker)throw Error('Could not verify the creation journal.');
  attempted=true;
  const result=beautyHubTransferFetch_('tournament/create',auth,{set:review.set});
  if(!/^t_[A-Za-z0-9_]{1,80}$/.test(result.tdid||'')||result.tdid==='t_QHaG_7792')throw Error('Creation receipt is invalid.');
  const event=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(result.tdid),auth).tournament;
  for(const k of ['title','status','t_date','lgid','team_games','game_type','private','common_join','individual_pass','join_pass'])if(event?.[k]!==review.set[k])throw Error('Created event readback differs.');
  const entries=beautyHubTransferFetch_('tournament/entry/list?tdid='+encodeURIComponent(result.tdid),auth).list;
  if(!Array.isArray(entries)||entries.length||event.tdid!==result.tdid||event.entry_list?.length)throw Error('Created event identity or entries differ.');
  if(!beautyHubCreateFormatMatches_(event,review.set))throw Error('Created format differs.');
  for(const k of Object.keys(event))if(/_(table|result|rank)$/.test(k)&&!beautyPoolEmpty_(event[k]))throw Error('Created event contains unexpected play data.');
  if(beautyHubNakkaDate_().date!==date)throw Error('Date changed during creation.');
  if(typeof beautyContextCreated_==='function')beautyContextCreated_(event);
  const matched=beautyHubNakkaEvent_({});if(matched.status!=='MATCHED'||matched.event?.id!==result.tdid)throw Error('Created event selection could not be verified.');
  const receipt=beautyPoolAudit_({kind:'EVENT_CREATE_READBACK',audit,date,event:{id:event.tdid,title:event.title,status:event.status},matchSettings:review.matchSettings||[]});
  props.setProperty(key,JSON.stringify({state:'VERIFIED',audit,receipt,date,id:result.tdid,matchSettings:review.matchSettings||[]}));
  return {success:true,event:matched.event,audit,receipt,message:'TEST event created once in Nakka and selected in Hub. No players or pools were sent.'};
 }catch(e){return {success:false,uncertain:attempted,error:attempted?'Event creation is unverified. Inspect Nakka and the creation journal. Do not retry.':(e.reviewMessage||'Could not review the event. Sign in again, then check Nakka and review again.')};}
 finally{lock.releaseLock();}
}

/* One staff-facing view of the selected evening; native values, never last-form defaults. */
function beautyHubEveningSnapshot_(auth){
 const found=beautyHubNakkaEvent_({});if(found.status!=='MATCHED')throw {reviewMessage:found.message||'Find the evening event first.'};
 const event=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(found.event.id),auth).tournament,date=beautyHubNakkaDate_().date;
 if(event?.tdid!==found.event.id||event.title!==found.event.title||(event.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||event.team_games!==0||!Number.isFinite(event.updateTime)||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('event');
 const config={},rows=[],enabled=[];let supported=true;
 for(const [key,provider,title,flag]of [['groups','rr_setting','Groups','round_robin'],['stage1','t_setting','Slutspel 1','tournament'],['stage2','s2_setting','Slutspel 2','tournament']]){
  const s=event[provider];if(s?.[flag]!==1){config[key]=null;rows.push({title,text:'Off'});continue;}enabled.push(title);
  const overrides=s.game_setting||[],baseLimit=s.limit_rounds??0,maxDarts=baseLimit===1?s.rounds*3:null;
  const valid=Number.isInteger(s.limit_leg_count)&&s.limit_leg_count>=1&&s.limit_leg_count<=99&&s.limit===1&&(s.drawMode??0)===0&&[0,1].includes(baseLimit)&&(maxDarts===null||Number.isInteger(maxDarts)&&maxDarts>=3&&maxDarts<=297)&&Array.isArray(overrides)&&overrides.every(r=>key!=='groups'&&[-1,-3].includes(r.round)&&(r.limit??1)===1&&(r.drawMode??0)===0&&(r.roundLimit??baseLimit)===baseLimit&&(baseLimit===0||(r.maxRound??s.rounds)===s.rounds));
  supported=supported&&valid;
  const final=Array.isArray(overrides)?overrides.find(r=>r.round===-1):null,bronze=Array.isArray(overrides)?overrides.find(r=>r.round===-3):null;
  config[key]={legs:s.limit_leg_count,maxDarts,...(key==='groups'?{}:{finalLegs:final?.limit_leg_count||s.limit_leg_count,thirdPlace:s.t3===1,thirdPlaceLegs:bronze?.limit_leg_count||s.limit_leg_count,slots:s.t_player_count})};
  let text=s.limit===1?'First to '+s.limit_leg_count+' '+(s.limit_leg_count===1?'leg':'legs'):s.limit===2?'First to '+s.limit_set_count+' sets · '+s.limit_set_leg_count+' legs per set':'Native match schedule';
  text+=' · '+(maxDarts===null?'No dart limit':maxDarts+' darts per player per leg ('+s.rounds+' rounds)');
  if(key!=='groups')text+=' · Final: '+config[key].finalLegs+' legs · Third place: '+(s.t3===1?config[key].thirdPlaceLegs+' legs':'off')+' · '+s.t_player_count+' bracket slots';
  if(!valid)text+=' · Additional native rules';rows.push({title,text});
 }
 const format=(config.groups?'Round Robin':'')+((config.stage1||config.stage2)?(config.groups?' + ':'')+[config.stage1?'Slutspel 1':'',config.stage2?'Slutspel 2':''].filter(Boolean).join(' and '):'')+(config.groups&&!config.stage1&&!config.stage2?' only':'');
 const props=PropertiesService.getScriptProperties(),pending=JSON.parse(props.getProperty('BEAUTY_EVENT_SETTINGS_'+event.tdid)||'null');
 const played=Object.keys(event).some(k=>/_(table|result|rank)$/.test(k)&&!beautyPoolEmpty_(event[k]));
 const blocked=found.creationReviewRequired?'Verify the existing event below before changing settings.':pending?.state==='ATTEMPTED'?'A settings change is unverified. Inspect Nakka before another save.':![10,20,25].includes(event.status)?'The event has started or finished. Edit match settings in Nakka Control.':played||props.getProperty('BEAUTY_POOL_SEND_'+event.tdid)?'Pools or brackets have been sent. Use Nakka Control for later changes.':!supported?'This event has additional native match rules. Edit them in Nakka Control.':'';
 const groups=event.rr_table?.filter(g=>Array.isArray(g)&&g.some(Boolean)).length||0;
 const view={creationReviewRequired:found.creationReviewRequired===true,event:{id:event.tdid,title:event.title,date,status:({10:'Preparing',20:'Accepting entries',25:'Building brackets',30:'In session',40:'Completed'})[event.status]||'Unknown',url:found.event.url},format,rows,config,editable:!blocked,blocked,registered:Array.isArray(event.entry_list)?event.entry_list.length:null,pools:groups?groups+' saved groups':'No pools sent',boardNote:'Physical boards are reviewed in Pool Planner; Nakka controls live match assignment.',checkedAt:new Date().toISOString()};
 return {event,date,view,version:beautyPoolHash_(event)};
}
function beautyHubEveningSetup_(action,input){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another event operation is running.'};let attempted=false;
 const fail=message=>{throw {reviewMessage:message};};
 try{
  const account=beautyHubAuthRequire_(beautyHubRequestToken_),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache(),auth=beautyPoolAuth_(),session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_);
  const fields={read:'',prepare:'settings,version',confirm:'confirmed,ticket'}[action];if(fields===undefined||!input||Object.keys(input).sort().join(',')!==fields||Object.values(input).some(v=>typeof v!=='string'||v.length>6000))fail('Invalid evening settings request.');
  const snapshot=beautyHubEveningSnapshot_(auth);
  if(action==='read')return {success:true,setup:snapshot.view,version:snapshot.version};
  if(!snapshot.view.editable)fail(snapshot.view.blocked);
  if(action==='prepare'){
   if(input.version!==snapshot.version)fail('The event settings changed. Reload Evening Setup and review again.');
   const fallback={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01',limit_rounds:0,rounds:15,game_setting:[],schedule:[]};
   const template={rr_setting:snapshot.event.rr_setting||{...fallback,round_robin:0,robin_count:1,robin_player_count:4,point_w:2,point_d:1,point_l:0},t_setting:snapshot.event.t_setting||{...fallback,tournament:0,t_player_count:16,t3:0},s2_setting:snapshot.event.s2_setting||{...fallback,tournament:0,t_player_count:16,t3:0}};
   const configured=beautyHubCreateMatchSettings_(input.settings,template),ticket=Utilities.getUuid().replace(/-/g,'');
   cache.put(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+ticket,JSON.stringify({uid:account.uid,session,eventId:snapshot.event.tdid,date:snapshot.date,version:snapshot.version,set:configured.set,summary:configured.summary,format:configured.format,expires:Date.now()+300000}),300);
   return {success:true,ticket,title:snapshot.event.title,date:snapshot.date,format:configured.format,summary:configured.summary};
  }
  const saved=JSON.parse(cache.get(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket)||'null');
  if(input.confirmed!=='true'||!saved||saved.uid!==account.uid||saved.session!==session||saved.eventId!==snapshot.event.tdid||saved.date!==snapshot.date||saved.version!==snapshot.version||Date.now()>=saved.expires)fail('Review expired or settings changed. Reload and review again.');
  cache.remove(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket);beautyHubAuthRequire_(beautyHubRequestToken_);
  const audit=beautyPoolAudit_({kind:'EVENT_SETTINGS_BEFORE',uid:account.uid,eventId:saved.eventId,date:saved.date,version:saved.version,before:{rr_setting:snapshot.event.rr_setting||null,t_setting:snapshot.event.t_setting||null,s2_setting:snapshot.event.s2_setting||null},set:saved.set,summary:saved.summary});
  if(beautyHubEveningSnapshot_(auth).version!==saved.version)fail('The event changed during review. Nothing saved.');
  if(Date.now()>=saved.expires)fail('Review expired. Review the changes again.');
  const key='BEAUTY_EVENT_SETTINGS_'+saved.eventId,journal=JSON.stringify({state:'ATTEMPTED',audit,uid:account.uid,eventId:saved.eventId,date:saved.date});props.setProperty(key,journal);if(props.getProperty(key)!==journal)throw Error('journal');
  attempted=true;beautyHubAuthRequire_(beautyHubRequestToken_);
  beautyHubTransferFetch_('tournament/update',auth,{tdid:saved.eventId,expect_update_time:snapshot.event.updateTime,set:saved.set});
  const after=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(saved.eventId),auth).tournament;
  if(!after||!beautyHubCreateFormatMatches_(after,saved.set))throw Error('settings');
  const stable=e=>{const v=beautyPoolCopy_(e);delete v.updateTime;for(const k of ['rr_setting','t_setting','s2_setting'])delete v[k];for(const k of ['t3_table','s2_3_table'])if(beautyPoolEmpty_(v[k]))delete v[k];return v;};
  if(!beautyPoolEqual_(stable(snapshot.event),stable(after))||beautyHubNakkaDate_().date!==saved.date)throw Error('readback');
  const receipt=beautyPoolAudit_({kind:'EVENT_SETTINGS_READBACK',uid:account.uid,beforeAudit:audit,eventId:saved.eventId,date:saved.date,set:saved.set});const verified=JSON.stringify({state:'VERIFIED',audit,receipt,eventId:saved.eventId,date:saved.date});props.setProperty(key,verified);if(props.getProperty(key)!==verified)throw Error('receipt');
  return {success:true,readbackVerified:true,audit,receipt,message:'Evening settings saved and verified in Nakka. Reload Pool Planner before making a new draw.'};
 }catch(e){return {success:false,uncertain:attempted,error:attempted?'Settings save is unverified. Do not retry. Inspect Nakka and the settings audit.':e.reviewMessage||'Evening Setup could not be checked. Reload and try again.'};}
 finally{lock.releaseLock();}
}

/* One-time owner-authorised TEST copy cleanup. No Nakka write routes. */
function beautyHubCleanupPlan_(ss,props,auth){
 const snap=beautyHubEventSnapshot_(ss),events=beautyHubTransferFetch_(('league/tournament/list?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'&count=100'),auth).list;
 if(!Array.isArray(events)||events.length>=100||events.some(e=>typeof e.tdid!=='string'||typeof e.title!=='string'||e.lgid!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')))throw {reviewMessage:'Nakka event inventory is incomplete. Nothing cleaned.'};
 if(events.some(e=>/\bTEST\b/i.test(e.title)))throw {reviewMessage:'TEST events still appear in Nakka. Finish removing those first, then reload this cleanup.'};
 const fake=name=>/^(?:beauty[\s-]+test\b|hub[\s-]+test\b|test[\s-]+(?:player|mobile|kiosk|hub|new)\b)/i.test(String(name||'').trim()),names=new Set();
 const master=snap["PLAYER'S MASTER LIST"],status=snap['PLAYER STATUS DATA'],responses=snap['Form responses 2'];
 const masterRows=[];master.display.slice(1).forEach((r,i)=>{if(fake(r[0])){if(master.formulas[i+1].some(Boolean))throw Error('formula');masterRows.push(i+1);names.add(r[0]);}});
 const statusRows=status.values.slice(1).filter(r=>String(r[0]||'').trim()&&!fake(r[0])&&!fake(r[1])).map(r=>[r[0],r[1],'','','','']);
 status.display.slice(1).forEach(r=>{if(fake(r[0]))names.add(r[0]);if(fake(r[1]))names.add(r[1]);});
 for(const r of responses.display.slice(1))for(const name of r.slice(1,3))if(fake(name))names.add(name);
 if(responses.formulas.slice(1).some(r=>r.some(Boolean)))throw Error('formula');
 const all=props.getProperties(),stored={};for(const key of Object.keys(all).sort())if(/^BEAUTY_(?:LEAGUE_STATS_|SELECTED_TEST_EVENT$|POOL_(?:SEND|START|BOARDS|QUALIFY)_|CREATE_(?:EVENT|REVIEW)_|EVENT_SETTINGS_)/.test(key))stored[key]=all[key];
 const registrations=responses.values.slice(1).filter(r=>r.some(v=>v!==''&&v!==null)).length;
 const publicPlan={fakeNames:[...names].sort(),fakeMasterRows:masterRows.length,registrations,keptMasterPlayers:master.display.slice(1).filter(r=>String(r[0]||'').trim()&&!fake(r[0])).length,keptStatusNames:statusRows.length,storedItems:Object.keys(stored).length,date:beautyHubNakkaDate_().date,realEventsKept:events.length};
 return {snap,events,stored,masterRows,statusRows,publicPlan,version:beautyPoolHash_({snap,events,stored})};
}
function beautyHubCleanup_(action,input){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another TEST operation is running.'};let attempted=false,backup=null;
 const fail=message=>{throw {reviewMessage:message};};
 try{
  const account=beautyHubAuthRequire_(beautyHubRequestToken_),session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_),ss=SpreadsheetApp.openById(SHEET_ID),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache(),auth=beautyPoolAuth_();
  const required=action==='preview'?'':action==='save'?'confirmed,ticket':null;
  if(required===null||!input||Object.keys(input).sort().join(',')!==required||Object.values(input).some(v=>typeof v!=='string'||v.length>200))fail('Invalid cleanup request.');
  if(BEAUTY_IDENTITY_WRITES_ENABLED_!==true)fail('TEST writes are disabled.');
  if(props.getProperty('BEAUTY_CLEANUP_UNCERTAIN'))fail('An earlier cleanup is unverified. Inspect its backup before continuing.');
  const plan=beautyHubCleanupPlan_(ss,props,auth);
  if(action==='preview'){
   const ticket=Utilities.getUuid().replace(/-/g,'');cache.put('beauty-cleanup:'+ticket,JSON.stringify({uid:account.uid,session,version:plan.version,expires:Date.now()+300000}),300);
   return {success:true,ticket,plan:plan.publicPlan};
  }
  const saved=JSON.parse(cache.get('beauty-cleanup:'+input.ticket)||'null');
  if(input.confirmed!=='true'||!saved||saved.uid!==account.uid||saved.session!==session||saved.version!==plan.version||Date.now()>=saved.expires)fail('Cleanup review expired or the data changed. Reload and review again.');
  cache.remove('beauty-cleanup:'+input.ticket);beautyHubAuthRequire_(beautyHubRequestToken_);
  // Native sheet copies retain dates, formulas, formatting and all removed TEST data.
  const prefix='CLEAN-'+Utilities.getUuid().replace(/-/g,'').slice(0,12),copies=[];
  Object.keys(plan.snap).forEach((title,i)=>{const copy=ss.getSheetByName(title).copyTo(ss).setName(prefix+'-'+i),original=plan.snap[title],range=copy.getRange(1,1,original.values.length,original.values[0].length);if(!beautyPoolEqual_(range.getValues(),original.values)||!beautyPoolEqual_(range.getFormulas(),original.formulas)||!beautyPoolEqual_(range.getNumberFormats(),original.formats))throw Error('backup');copies.push({source:title,id:copy.getSheetId(),name:copy.getName()});});
  backup=beautyPoolAudit_({kind:'HUB_CLEANUP_BEFORE',uid:account.uid,recordedUTC:new Date().toISOString(),copies,stored:plan.stored,summary:plan.publicPlan,version:plan.version});
  if(beautyHubCleanupPlan_(ss,props,auth).version!==plan.version)fail('Data changed during backup. No cleanup applied. Review again.');
  if(Date.now()>=saved.expires)fail('Cleanup review expired during backup. Review again.');
  const marker=JSON.stringify({backup,copies,uid:account.uid,recordedUTC:new Date().toISOString()});props.setProperty('BEAUTY_CLEANUP_UNCERTAIN',marker);if(props.getProperty('BEAUTY_CLEANUP_UNCERTAIN')!==marker)throw Error('journal');
  attempted=true;beautyHubAuthRequire_(beautyHubRequestToken_);
  const status=ss.getSheetByName('PLAYER STATUS DATA'),statusCount=plan.snap['PLAYER STATUS DATA'].values.length-1;
  status.getRange(2,1,statusCount,6).clearContent();if(plan.statusRows.length)status.getRange(2,1,plan.statusRows.length,6).setValues(plan.statusRows);
  for(const row of plan.masterRows)ss.getSheetByName("PLAYER'S MASTER LIST").getRange(row+1,1,1,1).clearContent();
  const formCount=plan.snap['Form responses 2'].values.length-1;ss.getSheetByName('Form responses 2').getRange(2,1,formCount,6).clearContent();
  ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,3,plan.snap["TONIGHT'S PLAYERS"].values.length-1,1).clearContent();
  for(const key of Object.keys(plan.stored))props.deleteProperty(key);
  SpreadsheetApp.flush();const after=beautyHubEventSnapshot_(ss);
  // Source rows may shrink after clearing. Verify the original bounded extent too.
  for(const title of Object.keys(plan.snap)){const original=plan.snap[title];if(after[title].values.length!==original.values.length){const range=ss.getSheetByName(title).getRange(1,1,original.values.length,original.values[0].length);after[title]={...after[title],values:range.getValues(),display:range.getDisplayValues(),formulas:range.getFormulas(),formats:range.getNumberFormats()};}}
  for(const title of Object.keys(plan.snap)){
   if(!beautyPoolEqual_(after[title].formulas,plan.snap[title].formulas)||!beautyPoolEqual_(after[title].formats,plan.snap[title].formats)||!beautyPoolEqual_(after[title].values[0],plan.snap[title].values[0]))throw Error('layout');
  }
  if(!beautyPoolEqual_(after.Control.values,plan.snap.Control.values))throw Error('control');
  const expectedMaster=beautyPoolCopy_(plan.snap["PLAYER'S MASTER LIST"].values);for(const row of plan.masterRows)expectedMaster[row][0]='';
  if(!beautyPoolEqual_(after["PLAYER'S MASTER LIST"].values,expectedMaster))throw Error('master');
  const expectedStatus=[plan.snap['PLAYER STATUS DATA'].values[0],...plan.statusRows];while(expectedStatus.length<plan.snap['PLAYER STATUS DATA'].values.length)expectedStatus.push(['','','','','','']);
  if(!beautyPoolEqual_(after['PLAYER STATUS DATA'].values,expectedStatus)||after['Form responses 2'].values.slice(1).some(r=>r.some(v=>v!==''&&v!==null))||after["TONIGHT'S PLAYERS"].values.slice(1).some(r=>String(r[2]||'').trim()))throw Error('content');
  if(Object.keys(plan.stored).some(k=>props.getProperty(k)!==null))throw Error('properties');
  const events=beautyHubTransferFetch_(('league/tournament/list?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'&count=100'),auth).list;if(!beautyPoolEqual_(events,plan.events))throw Error('events');
  const receipt=beautyPoolAudit_({kind:'HUB_CLEANUP_READBACK',beforeAudit:backup,uid:account.uid,summary:plan.publicPlan});
  const verified=JSON.stringify({state:'VERIFIED',backup,receipt,recordedUTC:new Date().toISOString()});props.setProperty('BEAUTY_CLEANUP_LAST',verified);if(props.getProperty('BEAUTY_CLEANUP_LAST')!==verified)throw Error('receipt');props.deleteProperty('BEAUTY_CLEANUP_UNCERTAIN');if(props.getProperty('BEAUTY_CLEANUP_UNCERTAIN')!==null)throw Error('journal');
  // Refill from current native season data only. Failure leaves no obsolete fallback.
  let stats={fresh:false};try{stats=beautyPoolStats_(auth,true);}catch(e){}
  return {success:true,readbackVerified:true,backup,receipt,statsFresh:stats.fresh===true,message:'Hub TEST cleanup verified. TEST registrations and status/consent/messages cleared; recognised dummy names removed. Real master names, name corrections, Nakka events and production preserved. '+(stats.fresh?'Current Nakka season averages loaded.':'Old cached averages removed. Native statistics refresh unavailable; no averages substituted.')};
 }catch(e){return {success:false,uncertain:attempted,backup,error:attempted?'Cleanup is unverified. Do not repeat it. Inspect TEST sheets and the cleanup backup.':e.reviewMessage||'Cleanup could not be reviewed. No cleanup applied.'};}
 finally{lock.releaseLock();}
}

