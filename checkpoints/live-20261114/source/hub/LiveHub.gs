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
  const ranges=["'Control'!A2:B2","'TONIGHT''S PLAYERS'!A2:F","'PLAYER STATUS DATA'!A2:C","'Form responses 2'!A2:C"];
  const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==4)throw Error('Incomplete spreadsheet response.');
  const date=beautyLiveDate_(data.valueRanges[0].values?.[0]?.[0]);
  if(date!==beautyLiveTarget_().date)throw Error('The registration date changed. Reload the selected event.');
  const clean=v=>String(v??'').trim();
  const players=(data.valueRanges[1].values||[]).map(r=>({player:clean(r[0]),newPlayer:clean(r[1]),status:clean(r[2]),consent:clean(r[3]),message:clean(r[4]),whereFrom:clean(r[5])})).filter(p=>p.player||p.newPlayer);
  const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const statuses=new Map();
  for(const row of data.valueRanges[2].values||[]){const name=key(row[0]);if(!name)continue;if(statuses.has(name))throw Error('Duplicate player status records need review.');statuses.set(name,clean(row[2]));}
  for(const player of players)player.status=statuses.get(key(player.player||player.newPlayer))||'';
  // Spreadsheet serial values preserve registration order without inventing UTC timestamps.
  const start=data.valueRanges[0].values?.[0]?.[1],end=Date.parse(date+'T00:00:00Z')/86400000+25570,times=new Map();
  if(Number.isFinite(start)&&start<end)for(const row of data.valueRanges[3].values||[]){
    const at=row[0],name=key(row[1]==='MITT NAMN FINNS INTE I LISTAN'?row[2]:row[1]);
    if(name&&Number.isFinite(at)&&at>=start&&at<end&&(!times.has(name)||at<times.get(name)))times.set(name,at);
  }
  // Reuse the existing authenticated statistics refresh; no Nakka call on dashboard polling.
  let snapshot=null;try{if(beautyLiveTarget_().mode==='league')snapshot=beautyCastSnapshot_();}catch(e){}
  const verified=!!snapshot?.fresh;
  for(const player of players){
    const name=key(player.player||player.newPlayer),matches=verified?snapshot.profiles.filter(p=>key(p.name)===name):[];
    player.registrationOrder=player.whereFrom==='NAKKA'?null:times.has(name)?times.get(name):null;
    player.rankingPoints=matches.length===1&&Number.isFinite(matches[0].points)?matches[0].points:null;
  }
  return {success:true,rankingAvailable:verified,rankingFetchedAt:snapshot?.fetchedAt||null,rankingMethod:'League points descending; equal points alphabetical',mode:'live-status',readOnly:false,statusWritesEnabled:true,eventContext:beautyContextToken_(),eventDate:date,eventDateDisplay:date,players,playerCount:players.length,masterPlayers:beautyLiveRegistrationRows_(SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName("PLAYER'S MASTER LIST"),1).map(r=>r[0]).filter(n=>n&&n!=='MITT NAMN FINNS INTE I LISTAN').sort((a,b)=>a.localeCompare(b,'sv-SE')),updatedAt:new Date().toISOString(),activeEvent:{mode:beautyLiveTarget_().mode,leagueId:beautyLiveTarget_().leagueId,eventId:beautyLiveTarget_().eventId,date},attention:{available:false,complete:false,eventDate:date,items:[]}};
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
  try{beautyHubAuthSessionRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};}
  if(typeof action==='string'&&action.startsWith('context:'))return beautyLiveContextService_(action.slice(8),input,token);
  try{beautyContextAssert_();}catch(e){return {success:false,code:'EVENT_REVIEW_REQUIRED',error:e.message};}
  if(typeof action==='string'&&action.startsWith('queue:'))return beautyQueueService_(action.slice(6),input,token);
  if(action==='consent'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean={...input};delete clean._context;return beautyLiveConsent_(clean,token);
  }

  if(['eveningsetup','eveningprepare','eveningsave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan'].includes(action))return beautyLivePlanner_(action,input,token);

  if(action==='removepreview'||action==='removesave'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRemove_(action==='removepreview'?'preview':'save',clean,token);
  }
  if(action==='register'){
    if(!input||input._context!==beautyContextToken_())return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRegister_(clean,token);
  }
  if(action==='status'){

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
