/* Read-only, owner-only Identity TEST casting feed. Cast feed has no provider calls or writes; staff refresh is separately authenticated. */
function beautyLiveTestData() {
  beautyHubTestGuard_();
  const data = getBeautyHubData_();
  if (!data || data.success !== true || !Array.isArray(data.players)) throw new Error('TEST data unavailable');
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Form responses 2');
  const registrations = Object.create(null);
  if (sheet && sheet.getLastRow() >= 2) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    for (const row of rows) {
      if (!(row[0] instanceof Date) || isNaN(row[0].getTime())) continue;
      if (!(typeof beautyContextRead_==='function'&&beautyContextRead_())&&Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') !== data.eventDate) continue;
      const selected = String(row[1] || '').trim();
      const name = selected === 'MITT NAMN FINNS INTE I LISTAN' ? String(row[2] || '').trim() : selected;
      const time = row[0].getTime();
      if (name && (registrations[name] === undefined || time < registrations[name])) registrations[name] = time;
    }
  }
  const snapshot = beautyLiveStatsSnapshot_();
  const brandContext=typeof beautyContextRead_==='function'?beautyContextRead_():null;
  return { brand:brandContext?.mode==='league'&&brandContext.leagueId==='lg_tM2v_3523'?'monday':'club', statsAvailable: !!snapshot, statsStale: !!snapshot && snapshot.fresh !== true, statsFetchedAt: snapshot ? snapshot.fetchedAt : null, success: true, eventDate: data.eventDate, updatedAt: new Date().toISOString(), rankingAvailable: false,
    players: data.players.map(function(p) {
      const name = String(p.player || p.newPlayer || '').trim();
      const matches = snapshot ? snapshot.profiles.filter(function(q){return beautyPoolKey_(q.name) === beautyPoolKey_(name);}) : [];
      const profile = matches.length === 1 ? matches[0] : null;
      return { average: profile && typeof profile.average === 'number' ? profile.average : null, name: name, registeredAt: registrations[name] === undefined ? null : registrations[name], rank: null, points: profile && typeof profile.points === 'number' ? profile.points : null };
    }).filter(function(p) { return p.name; }) };
}

function beautyLiveTestUrl(token) {
  beautyHubTestGuard_();
  beautyHubAuthRequire_(token);
  if(typeof beautyHubNakkaEvent_==='function')beautyHubSelectCastEvent_(token);
  const hub = getBeautyHubData_();
  if (hub?.success !== true || !/^\d{4}-\d{2}-\d{2}$/.test(hub.eventDate))
    throw Error('Selected TEST date unavailable.');
  const response = UrlFetchApp.fetch(('https://api.n01darts.com/api/v1/tournament/get?tdid='+beautyHubActiveTestTarget_().id), {
    method:'get', muteHttpExceptions:true, followRedirects:false
  });
  if (response.getResponseCode() !== 200) throw Error('TEST event unavailable.');
  const data = JSON.parse(response.getContentText()), event = data?.tournament;
  if (data.result !== 0 || event?.tdid !== (beautyHubActiveTestTarget_().id) ||
      (event.lgid||'')!== (''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'') ||
      event.title !== beautyHubActiveTestTarget_().title ||
      !Number.isFinite(event.t_date) || event.t_date <= 0 ||
      Utilities.formatDate(new Date(event.t_date * 1000), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hub.eventDate)
    throw Error('Live does not match the selected Hub TEST event.');
  beautyHubAuthRequire_(token);
  const current = getBeautyHubData_();
  if (current?.success !== true || current.eventDate !== hub.eventDate)
    throw Error('Hub date changed while opening the display.');
  return ScriptApp.getService().getUrl() + '?page=live';
}

/* Anonymous cast requests never trigger authenticated Nakka refreshes. The staff
 * statistics refresh publishes this shared snapshot; expired/failed values remain visibly labelled as last fetched for up to seven days;
 * they are never represented as current or used to qualify a draw. Rank deliberately remains unavailable until qualified.
 */
function beautyLiveStatsSnapshot_() {
  try {
    const snapshot = beautyPoolLastGood_();
    if (!snapshot || snapshot.leagueId !== (''+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_M2wQ_4189')+'') || !Array.isArray(snapshot.profiles)) return null;
    const at = Date.parse(snapshot.fetchedAt), age = Date.now() - at;
    const failed = Number(PropertiesService.getScriptProperties().getProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_M2wQ_4189')+'_FAILED')) || 0);
    if (!Number.isFinite(at) || age < 0 || age >= 604800000) return null;
    return Object.assign({}, snapshot, {fresh: age < 300000 && failed <= at});
  } catch (e) { return null; }
}

/* Fixed public TEST stage page. Opener is staff-authorized and date matched. */
function beautyStageTestUrl(token){
  beautyHubTestGuard_();beautyHubAuthRequire_(token);
  if(typeof beautyHubNakkaEvent_==='function')beautyHubSelectCastEvent_(token);
  const hub=getBeautyHubData_();if(hub?.success!==true||!/^\d{4}-\d{2}-\d{2}$/.test(hub.eventDate))throw Error('Selected TEST date unavailable.');
  const response=UrlFetchApp.fetch(('https://api.n01darts.com/api/v1/tournament/get?tdid='+beautyHubActiveTestTarget_().id),{method:'get',muteHttpExceptions:true,followRedirects:false});
  if(response.getResponseCode()!==200)throw Error('TEST event unavailable.');const data=JSON.parse(response.getContentText()),t=data?.tournament;
  if(data.result!==0||t?.tdid!==(beautyHubActiveTestTarget_().id)||(t.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||t.title!==beautyHubActiveTestTarget_().title||!Number.isFinite(t.t_date)||t.t_date<=0||Utilities.formatDate(new Date(t.t_date*1000),Session.getScriptTimeZone(),'yyyy-MM-dd')!==hub.eventDate)throw Error('Stage display does not match the selected Hub event.');
  beautyHubAuthRequire_(token);if(getBeautyHubData_()?.eventDate!==hub.eventDate)throw Error('Hub date changed while opening the display.');return ScriptApp.getService().getUrl()+'?page=stages';
}

/* Staff-owned automatic refresh; the cast feed itself never contacts Nakka. */
function beautyLiveRefreshStats(token){
  beautyHubTestGuard_();beautyHubAuthRequire_(token);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(1000))return {success:false,message:'Statistics refresh already running.'};
  try{
    beautyHubAuthRequire_(token);
    const snapshot=beautyPoolStats_(beautyPoolAuth_(),true);
    beautyHubAuthRequire_(token);
    return {success:true,fresh:snapshot.fresh===true,fetchedAt:snapshot.fetchedAt||null};
  }finally{lock.releaseLock();}
}

/* Public cast metadata comes only from the verified TEST send audit.
 * Never publish names, LPIDs, staff IDs, consent, messages or credentials. */
function beautyStagePlanTest(){
 beautyHubTestGuard_();
 try{
  const props=PropertiesService.getScriptProperties(),journal=JSON.parse(props.getProperty(('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id))||'null');
  if(journal?.state!=='VERIFIED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit)||!/^POOL-[a-f0-9]{20}$/.test(journal.receipt))return null;
  // Cache only already-verified public metadata; any saved-plan version change gets a new key.
  const key='BEAUTY_STAGE_PLAN_V1_'+beautyPoolHash_({journal,boards:props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id)),labels:props.getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))});
  let cache=null;try{if(typeof CacheService!=='undefined')cache=CacheService.getScriptCache();const hit=cache?.get(key);if(hit)return JSON.parse(hit);}catch(e){}
  const ss=SpreadsheetApp.openById(SHEET_ID);
  function read(name){const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()>100)return null;const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')return null;return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));}
  const before=read(journal.audit),receipt=read(journal.receipt);
  if(before?.kind!=='POOL_SEND_BEFORE'||receipt?.kind!=='POOL_SEND_READBACK'||receipt.beforeAudit!==journal.audit||receipt.drawHash!==journal.drawHash||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!==(beautyHubActiveTestTarget_().id)||!Array.isArray(before.draw?.pools)||!Array.isArray(before.mappings))return null;
  const rr=before.event.rr_setting?.round_robin===1,lg=before.event.lg_setting?.league===1;
  if(rr===lg)return null;
  const mode=rr?'rr':'lg';
  const saved=JSON.parse(props.getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))||'null');
  const boardSaved=JSON.parse(props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id))||'null');
  const boardPlan=boardSaved?.drawHash===journal.drawHash?beautyPoolBoardPlan_(before.draw,boardSaved.input):before.boardPlan;
  const pools=before.draw.pools.map((pool,i)=>{
   const ids=pool.players.map(p=>before.mappings.find(q=>q.id===p.id)?.tpid);
   if(ids.some(id=>typeof id!=='string'||!/^[A-Za-z0-9]{4}$/.test(id))||new Set(ids).size!==ids.length||JSON.stringify(ids)!==JSON.stringify(before.table?.[i]?.filter(Boolean)))throw Error('Audit mismatch');
   const known=pool.players.map(p=>p.average).filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=180),label=saved?.drawHash===journal.drawHash?saved.labels?.[i]:null;
   const boards=boardPlan?.assignments?.find(a=>a.poolId===pool.id)?.boards;
   return {id:mode+'_'+i,ids,boards:Array.isArray(boards)?boards:null,startAverage:known.length?known.reduce((a,b)=>a+b,0)/known.length:null,coverage:known.length,board:Number.isInteger(boards?.[0])?boards[0]:Number.isInteger(label?.board)?label.board:null,group:Number.isInteger(label?.group)?label.group:null};
  });
  const result={eventId:(beautyHubActiveTestTarget_().id),eventDate:before.draw.eventDate,frozenAt:before.draw.frozenAt,drawHash:journal.drawHash,pools};
  try{cache?.put(key,JSON.stringify(result),60);}catch(e){}
  return result;
 }catch(e){return null;}
}
/* Organiser-only labels, isolated from Nakka assignments and audit baselines. */
function beautyStageLabelsTest(token,labels){
 beautyHubTestGuard_();beautyHubAuthRequire_(token);
 const plan=beautyStagePlanTest();
 if(!plan||!Array.isArray(labels)||labels.length!==plan.pools.length||labels.length>101)throw Error('Verified cast plan unavailable.');
 const seen=new Set();
 const safe=labels.map((p,i)=>{if(!p||Object.keys(p).sort().join(',')!=='board,group,ids'||JSON.stringify(p.ids?.slice().sort())!==JSON.stringify(plan.pools[i].ids.slice().sort())||!Number.isInteger(p.board)||p.board<1||p.board>1000||!Number.isInteger(p.group)||p.group<1||p.group>101||seen.has(p.board+':'+p.group))throw Error('Cast labels do not match verified pools.');seen.add(p.board+':'+p.group);return {board:p.board,group:p.group};});
 beautyHubAuthRequire_(token);const current=beautyStagePlanTest();if(current?.drawHash!==plan.drawHash)throw Error('Verified plan changed.');
 const text=JSON.stringify({drawHash:plan.drawHash,labels:safe});PropertiesService.getScriptProperties().setProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id),text);
 if(PropertiesService.getScriptProperties().getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))!==text)throw Error('Cast labels could not be verified.');return {success:true};
}

/* Staff opener owns this short-lived request context; public casts only read the verified binding. */
function beautyHubSelectCastEvent_(token){
 const prior=beautyHubRequestToken_;
 try{beautyHubRequestToken_=token;if(beautyHubNakkaEvent_({}).status!=='MATCHED')throw Error('Check or create the TEST event for the selected date first.');}
 finally{beautyHubRequestToken_=prior;}
}

