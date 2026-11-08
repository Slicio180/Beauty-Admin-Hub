const BEAUTY_LIVE_TARGET_ = Object.freeze({sheetId:'1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',eventId:'t_UsRG_9574',leagueId:'lg_tM2v_3523',date:'2026-11-09'});
function beautyLiveSheetsRead_(path) {
  beautyLiveLoginGuard_();
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+BEAUTY_LIVE_TARGET_.sheetId+path,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});
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
  if(date!==BEAUTY_LIVE_TARGET_.date)throw Error('The registration date changed. This LIVE acceptance build is fixed to 9 November 2026.');
  const clean=v=>String(v??'').trim();
  const players=(data.valueRanges[1].values||[]).map(r=>({player:clean(r[0]),newPlayer:clean(r[1]),status:clean(r[2]),consent:clean(r[3]),message:clean(r[4]),whereFrom:clean(r[5])})).filter(p=>p.player||p.newPlayer);
  const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const statuses=new Map();
  for(const row of data.valueRanges[2].values||[]){const name=key(row[0]);if(!name)continue;if(statuses.has(name))throw Error('Duplicate player status records need review.');statuses.set(name,clean(row[2]));}
  for(const player of players)player.status=statuses.get(key(player.player||player.newPlayer))||'';
  return {success:true,mode:'live-status',readOnly:false,statusWritesEnabled:true,eventContext:'live-20261109',eventDate:date,eventDateDisplay:'9 November 2026',players,playerCount:players.length,masterPlayers:beautyLiveRegistrationRows_(SpreadsheetApp.openById(BEAUTY_LIVE_TARGET_.sheetId).getSheetByName("PLAYER'S MASTER LIST"),1).map(r=>r[0]).filter(n=>n&&n!=='MITT NAMN FINNS INTE I LISTAN').sort((a,b)=>a.localeCompare(b,'sv-SE')),updatedAt:new Date().toISOString(),activeEvent:{mode:'league',leagueId:BEAUTY_LIVE_TARGET_.leagueId,eventId:BEAUTY_LIVE_TARGET_.eventId,date},attention:{available:false,complete:false,eventDate:date,items:[]}};
}
function beautyLiveEventRead_() {
  const target=BEAUTY_LIVE_TARGET_;
  const control=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Control'!A2")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(beautyLiveDate_(control.values?.[0]?.[0])!==target.date)throw Error('The registration date changed.');
  const r=UrlFetchApp.fetch('https://lbc.n01darts.com/n01/tournament/n01_tournament.php?cmd=get_data&tdid='+target.eventId,{method:'get',muteHttpExceptions:true,followRedirects:false});
  if(r.getResponseCode()!==200)throw Error('Nakka event read failed.');
  const payload=JSON.parse(r.getContentText()),event=payload.tournament||payload;
  const date=Number.isFinite(event.t_date)?Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd'):null;
  if(event.tdid!==target.eventId||event.lgid!==target.leagueId||date!==target.date||event.team_games!==0||event.league!==1||typeof event.title!=='string'||!event.title.trim()||event.title.length>300)throw Error('Nakka event identity mismatch.');
  return {success:true,status:'MATCHED',readOnly:true,eventDate:date,checkedAt:new Date().toISOString(),event:{id:event.tdid,title:event.title,date,url:'https://n01darts.com/n01/league/season.php?id='+target.eventId},message:'Selected public event verified. Administrative API access has not been checked.'};
}
function beautyHubTest(action,input,token) {
  beautyLiveLoginGuard_();
  try{beautyHubAuthRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};}
  if(['register','status'].includes(action)&&PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return {success:false,code:'REMOVE_REVIEW',error:'Review the unfinished removal before another change.'};
  if(action==='removepreview'||action==='removesave'){
    if(!input||input._context!=='live-20261109')return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRemove_(action==='removepreview'?'preview':'save',clean,token);
  }
  if(action==='register'){
    if(!input||input._context!=='live-20261109')return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
    const clean=Object.assign({},input);delete clean._context;return beautyLiveRegister_(clean,token);
  }
  if(action==='status'){
    if(PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_REGISTRATION_PENDING'))return {success:false,code:'REGISTRATION_REVIEW_REQUIRED',error:'Review the pending registration before another save.'};
    if(!input||input._context!=='live-20261109')return {success:false,code:'STALE_EVENT',error:'Reload the selected event.'};
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
