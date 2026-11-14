/* Readback-confirmed Nakka add. One POST per phase; an uncertain POST is
 * journalled before sending and is never automatically repeated. ScriptLock
 * coordinates this project only; the Hub and other registration project have
 * independent locks. Cross-project acceptance remains a separate release check. */
function beautyRegistrationNakka_(playerName) {
  const attention=()=>({entryConfirmed:false,identityVerified:false,needsAttention:true});
  const key=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const name=String(playerName||'').normalize('NFC').trim().replace(/\s+/g,' ');
  if(!name||name.length>120)return attention();
  const lock=beautyRegistrationLockHeld_?null:LockService.getScriptLock();if(lock&&!lock.tryLock(5000))return attention();
  try {
    const properties=PropertiesService.getScriptProperties();
    const user=properties.getProperty('N01_API_USER'),password=properties.getProperty('N01_API_PASSWORD');
    if(!user||!password)return attention();
    const headers={Authorization:'Basic '+Utilities.base64Encode(user+':'+password)};
    const leagueId='lg_tM2v_3523',zone=Session.getScriptTimeZone();
    const control=SpreadsheetApp.openById(SHEET_ID).getSheetByName('Control');
    const readDate=()=>{const d=control.getRange('A2').getValue();if(!(d instanceof Date)||!Number.isFinite(d.getTime()))throw Error('Invalid control date.');return Utilities.formatDate(d,zone,'yyyy-MM-dd')};
    const date=readDate(),eventId=getN01EventIdFromControlDate_();
    function api(route,payload){
      const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+route,{method:payload?'post':'get',headers,followRedirects:false,muteHttpExceptions:true,...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{})});
      if(response.getResponseCode()!==200)throw Error('Nakka unavailable.');
      const data=JSON.parse(response.getContentText());if(data.result!==0)throw Error('Nakka rejected request.');return data;
    }
    function eventCheck(){
      if(readDate()!==date)throw Error('Control changed.');
      const event=api('tournament/get?tdid='+encodeURIComponent(eventId)).tournament;
      if(!event||event.tdid!==eventId||event.lgid!==leagueId||event.league!==1||event.team_games!==0||![10,20,25].includes(event.status)||!Number.isFinite(event.t_date)||Utilities.formatDate(new Date(event.t_date*1000),zone,'yyyy-MM-dd')!==date)throw Error('Event is not open for registration.');
    }
    function list(kind){const data=api(kind==='league'?'league/entry/list?lgid='+leagueId:'tournament/entry/list?tdid='+encodeURIComponent(eventId));if(!Array.isArray(data.list))throw Error('Incomplete list.');return data.list;}
    eventCheck();
    const journalKey='BEAUTY_PUBLIC_NAKKA_'+Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,eventId+'|'+key(name)).map(n=>(n&255).toString(16).padStart(2,'0')).join('');
    let pending=JSON.parse(properties.getProperty(journalKey)||'null');
    if(pending&&(pending.eventId!==eventId||pending.nameKey!==key(name)||!['LEAGUE_ATTEMPTED','EVENT_ATTEMPTED'].includes(pending.stage)))return attention();
    function record(stage){pending={stage,eventId,nameKey:key(name),recordedUTC:new Date().toISOString()};const text=JSON.stringify(pending);properties.setProperty(journalKey,text);if(properties.getProperty(journalKey)!==text)throw Error('Journal not saved.');}
    let members=list('league').filter(p=>key(p.name)===key(name));
    if(members.length>1)return attention();
    if(!members.length){
      if(pending)return attention();
      // Do not create a league identity if an unlinked same-name entry exists.
      if(list('event').some(p=>key(p.name)===key(name)))return attention();
      eventCheck();record('LEAGUE_ATTEMPTED');
      try{api('league/entry/update',{lgid:leagueId,add:[{name}]})}catch(e){/* Read once; never repeat POST. */}
      members=list('league').filter(p=>key(p.name)===key(name));
    }
    if(members.length!==1||!members[0].lpid)return attention();
    const lpid=members[0].lpid;
    const matches=p=>key(p.name)===key(name)||(p.lpid&&String(p.lpid)===String(lpid));
    let entries=list('event').filter(matches);
    if(!entries.length){
      if(pending?.stage==='EVENT_ATTEMPTED')return attention();
      eventCheck();record('EVENT_ATTEMPTED');
      try{api('tournament/entry/update',{tdid:eventId,add:[{name,lpid}]})}catch(e){/* Read once; never repeat POST. */}
      entries=list('event').filter(matches);
    }
    if(entries.length!==1||key(entries[0].name)!==key(name)||!entries[0].tpid||(entries[0].lpid&&String(entries[0].lpid)!==String(lpid)))return attention();
    if(readDate()!==date)return attention();
    // Exact league identity verification is unavailable if Nakka omits lpid.
    properties.deleteProperty(journalKey);
    return {entryConfirmed:true,identityVerified:!!entries[0].lpid,needsAttention:false};
  }catch(e){return attention();}
  finally{if(lock)lock.releaseLock();}
}
