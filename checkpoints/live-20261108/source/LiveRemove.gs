/* Fixed-target LIVE removal helpers. Source/schema checked before confirmation. */
function beautyLiveRemoveHash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value)).map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');
}
function beautyLiveRemoveSerial_(value,zone) {
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(value instanceof Date&&!isNaN(value.getTime()))return (Date.parse(Utilities.formatDate(value,zone,"yyyy-MM-dd'T'HH:mm:ss.SSS")+'Z')-Date.UTC(1899,11,30))/86400000;
  throw Error('LAYOUT');
}
function beautyLiveRemoveDateValid_(value){return value===BEAUTY_LIVE_TARGET_.date;}
function beautyLiveRemoveSnapshot_(ss) {
  if(ss.getId()!==BEAUTY_LIVE_TARGET_.sheetId||ss.getSpreadsheetLocale()!=='en_GB'||ss.getSpreadsheetTimeZone()!=='Africa/Ceuta')throw Error('LAYOUT');
  const titles=['Control','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST",'Form responses 2'];
  const widths=[2,6,6,1,6],limits=[10,1000,1000,10000,10000];
  const headers=[['START DATE','LAST RESET'],['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['PLAYERS'],['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM']];
  const snap={};
  for(let i=0;i<titles.length;i++){
    const sh=ss.getSheetByName(titles[i]);if(!sh||sh.getLastRow()>limits[i]||sh.getLastColumn()>widths[i])throw Error('LAYOUT');
    const n=titles[i]==="TONIGHT'S PLAYERS"?Math.min(1000,sh.getMaxRows()):Math.max(2,sh.getLastRow());
    if(titles[i]==="TONIGHT'S PLAYERS"&&n<100)throw Error('LAYOUT');
    const r=sh.getRange(1,1,n,widths[i]);
    snap[titles[i]]={values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats(),id:sh.getSheetId()};
    if(JSON.stringify(snap[titles[i]].display[0])!==JSON.stringify(headers[i]))throw Error('LAYOUT');
  }
  const t=snap["TONIGHT'S PLAYERS"];
  if(t.display.slice(100).some(r=>r[0]||r[1])||t.formulas.slice(1).some(r=>r[2])||snap.Control.formulas[1].some(Boolean)||snap['PLAYER STATUS DATA'].formulas.some(r=>r.some(Boolean)))throw Error('LAYOUT');
  const expected="=IFERROR(SORT(UNIQUE(FILTER({IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,'Form responses 2'!B2:B),IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,\"\")},IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,'Form responses 2'!B2:B)<>\"\",'Form responses 2'!A2:A>=Control!B2,'Form responses 2'!A2:A<Control!A2+1)),1,TRUE),\"\")";
  if(t.formulas[1][0]!==expected)throw Error('LAYOUT');
  const zone=ss.getSpreadsheetTimeZone(),start=beautyLiveRemoveSerial_(snap.Control.values[1][1],zone),end=beautyLiveRemoveSerial_(snap.Control.values[1][0],zone)+1;
  if(start>=end)throw Error('LAYOUT');
  return snap;
}
function beautyLiveRemoveVersion_(snap,date){return beautyLiveRemoveHash_({snap,date});}
function beautyLiveRemoveEntries_(data){
  if(!Array.isArray(data.list)||data.list.length>=1000)throw Error('IDENTITY');
  const ids=new Set();
  return data.list.map(r=>{
    if(!r||typeof r.name!=='string'||!r.name.trim()||!/^[A-Za-z0-9]{4}$/.test(r.tpid)||ids.has(r.tpid)||(r.lpid!=null&&r.lpid!==''&&!/^[A-Za-z0-9]{4}$/.test(r.lpid)))throw Error('IDENTITY');
    ids.add(r.tpid);return {name:r.name,tpid:r.tpid,lpid:r.lpid||''};
  });
}
function beautyLiveRemoveReads_(authorization,includeLeague){
  const t=BEAUTY_LIVE_TARGET_,result=[beautyLiveRegistrationApi_('tournament/get?tdid='+t.eventId),beautyLiveRegistrationApi_('tournament/entry/list?tdid='+t.eventId)];
  if(includeLeague)result.push(beautyLiveRegistrationApi_('league/entry/list?lgid='+t.leagueId));return result;
}
function beautyLiveRemoveFetch_(path,authorization,payload){
  if(path!=='tournament/entry/update'||payload.tdid!==BEAUTY_LIVE_TARGET_.eventId||Object.keys(payload).sort().join(',')!=='remove,tdid'||!Array.isArray(payload.remove)||payload.remove.length!==1||!/^[A-Za-z0-9]{4}$/.test(payload.remove[0]))throw Error('TARGET');
  return beautyLiveRegistrationApi_(path,payload);
}
function beautyLiveRemoveMeasure_(name,run){return run();}
function beautyLiveRemovalSetup(){
  beautyLiveLoginGuard_();beautyLiveRemoveSnapshot_(SpreadsheetApp.openById(BEAUTY_LIVE_TARGET_.sheetId));beautyLiveRegistrationEvent_();
  console.log(JSON.stringify({check:'LIVE_REMOVAL_SETUP',result:'READY_FOR_REMOVAL_REVIEW',writesPerformed:false}));
}
function beautyLiveRemovalReview(){
  beautyLiveLoginGuard_();const p=PropertiesService.getScriptProperties();console.log(JSON.stringify({check:'LIVE_REMOVAL_RECEIPT',pending:JSON.parse(p.getProperty('BEAUTY_LIVE_REMOVE_PENDING')||'null'),last:JSON.parse(p.getProperty('BEAUTY_LIVE_REMOVE_LAST')||'null')},null,2));
}

/* Owner-only LIVE: one reviewed registration and event entry; never a league deletion. */

function beautyLiveRemoveState_(input, authorization) {
  const ss=SpreadsheetApp.openById(BEAUTY_LIVE_TARGET_.sheetId),snap=beautyLiveRemoveMeasure_('sheet-snapshot',()=>beautyLiveRemoveSnapshot_(ss));
  const date=Utilities.formatDate(snap.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');
  if(date!==input.eventDate)throw Error('STALE');
  // The validated snapshot already contains these rows. Do not reopen the workbook
  // and reread Control, Tonight and the master list for the same state.
  const key=beautyLiveRegistrationKey_,data={eventDate:date,players:snap["TONIGHT'S PLAYERS"].display.slice(1).map(row=>({
    player:String(row[0]||'').trim(),newPlayer:String(row[1]||'').trim(),status:String(row[2]||'').trim(),
    consent:String(row[3]||'').trim(),message:String(row[4]||'').trim(),whereFrom:String(row[5]||'').trim()
  })).filter(row=>row.player||row.newPlayer)};
  const players=data.players.filter(p=>key(p.player||p.newPlayer)===key(input.player));
  const stored=snap['PLAYER STATUS DATA'].display.map((v,i)=>({v,i})).slice(1).filter(r=>key(r.v[0])===key(input.player));
  if(players.length!==1||stored.length!==1||!['IN','OUT','STANDBY'].includes(players[0].status)||stored[0].v[2]!==players[0].status)throw Error('IDENTITY');
  const responses=snap['Form responses 2'];
  if(responses.formulas.some(r=>r.some(Boolean)))throw Error('LAYOUT');
  const registrations=responses.values.map((v,i)=>({v,i})).slice(1).filter(r=>{
    if(r.v.every(v=>v===''||v===null))return false;
    const serial=beautyLiveRemoveSerial_(r.v[0],ss.getSpreadsheetTimeZone());
    if(serial<beautyLiveRemoveSerial_(snap.Control.values[1][1],ss.getSpreadsheetTimeZone())||serial>=beautyLiveRemoveSerial_(snap.Control.values[1][0],ss.getSpreadsheetTimeZone())+1)return false;
    const raw=String(r.v[1]||'').trim()==='MITT NAMN FINNS INTE I LISTAN'?r.v[2]:r.v[1];
    return key(raw)===key(input.player)||!!stored[0].v[1]&&key(raw)===key(stored[0].v[1]);
  });
  if(registrations.length!==1)throw Error('IDENTITY');
  const publicEvent=beautyLiveEventRead_(),match={status:publicEvent.status,event:publicEvent.event,eventDate:publicEvent.eventDate};
  if(match.status!=='MATCHED'||match.event?.id!==BEAUTY_LIVE_TARGET_.eventId||match.eventDate!==date)throw Error('TARGET');
  const [eventData,list,leagueData]=beautyLiveRemoveReads_(authorization,true),raw=eventData.tournament;
  if(!raw||raw.tdid!==BEAUTY_LIVE_TARGET_.eventId||(raw.lgid||'')!==BEAUTY_LIVE_TARGET_.leagueId||typeof raw.title!=='string'||!raw.title.trim()||![10,20].includes(raw.status)||
    !Number.isFinite(raw.t_date)||!Number.isFinite(raw.updateTime)||Utilities.formatDate(new Date(raw.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('TARGET');
  const standalone=false;
  const league=standalone?[{name:input.player,lpid:''}]:leagueData.list;
  if(!Array.isArray(league)||league.length>=1000)throw Error('IDENTITY');
  const identities=league.filter(r=>key(r.name)===key(input.player));
  if(identities.length!==1||(!standalone&&!/^[A-Za-z0-9]{4}$/.test(identities[0].lpid)))throw Error('IDENTITY');
  const entries=beautyLiveRemoveEntries_(list),found=entries.filter(r=>key(r.name)===key(input.player)||(identities[0].lpid&&r.lpid===identities[0].lpid));
  if(found.length>1||found.some(r=>key(r.name)!==key(input.player)||!standalone&&r.lpid&&r.lpid!==identities[0].lpid))throw Error('IDENTITY');
  const entry=found[0]||null;
  // Removing an entry does not repair brackets. Refuse any existing placement.
  const contains=(value,id)=>value===id||Array.isArray(value)&&value.some(v=>contains(v,id))||value&&typeof value==='object'&&Object.entries(value).some(([k,v])=>k===id||contains(v,id));
  if(entry&&Object.keys(raw).some(k=>(k==='table'||k.endsWith('_table'))&&contains(raw[k],entry.tpid)))throw Error('BRACKET');
  const fullEntries=list.list.slice().sort((a,b)=>a.tpid.localeCompare(b.tpid));
  const event={id:raw.tdid,title:raw.title,date,status:raw.status,updateTime:raw.updateTime};
  const state={snap,data,registration:registrations[0],stored:stored[0],identity:{name:identities[0].name,lpid:identities[0].lpid},entry,fullEntries,event};
  state.version=beautyLiveRemoveHash_({snap,event,identity:state.identity,entry,fullEntries});
  state.journal='BEAUTY_LIVE_REMOVE_'+event.id+'_'+beautyLiveRemoveHash_({name:key(input.player),timestamp:String(beautyLiveRemoveSerial_(registrations[0].v[0],ss.getSpreadsheetTimeZone()))});
  return {ss,state};
}

function beautyLiveRemove_(action,input,token) {
  beautyLiveLoginGuard_();
  try{beautyHubAuthRequire_(token);}catch(e){return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};}
  const fail=(code,journal,backup)=>({success:false,code,error:{INVALID_REMOVE:'Invalid removal request. Reload and review again.',REMOVE_DISABLED:'Removal is disabled.',REMOVE_BUSY:'Another operation is running. Review again shortly.',REMOVE_STALE:'The event or player data changed. Review a new removal.',REMOVE_IDENTITY:'A unique registration and league identity could not be verified. Review the player manually.',REMOVE_TARGET:'Removal is limited to the selected, pre-start LIVE event.',REMOVE_BRACKET:'This player is placed in a bracket. Review the bracket in Nakka before removal.',REMOVE_REVIEW:'A previous removal needs review. No retry was sent.',REMOVE_UNCERTAIN:'Removal may be partly saved. Do not repeat it. Inspect Nakka and the Hub using the recovery reference.',REMOVE_FAILED:'Removal could not be checked. Nothing was deliberately retried.'}[code]||'Removal needs review.',...(journal?{journal}:{}),...(backup?{backup}:{})});
  const keys=action==='preview'?'eventDate,player':'confirmed,eventDate,player,ticket';
  if(!['preview','save'].includes(action)||!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==keys||Object.values(input).some(v=>typeof v!=='string')||
     !beautyLiveRemoveDateValid_(input.eventDate)||!input.player.trim()||input.player.length>120||/[\x00-\x1f\x7f]/.test(input.player)||
     action==='save'&&(input.confirmed!=='true'||!/^[a-f0-9]{32}$/.test(input.ticket)))return fail('INVALID_REMOVE');

  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('REMOVE_BUSY');
  let attempted=false,journal,backup;
  try{
    const account=beautyHubAuthRequire_(token),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache();
    if(['BEAUTY_LIVE_STATUS_PENDING','BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_REMOVE_PENDING'].some(k=>props.getProperty(k)))return fail('REMOVE_REVIEW');
    const authorization=null,session=beautyLiveRemoveHash_(account.sessionBinding||token);
    let reviewed;
    if(action==='save'){
      const ticket='beauty-remove-preview:'+input.ticket;
      try{reviewed=JSON.parse(cache.get(ticket)||'null');}catch(e){}
      cache.remove(ticket);
      if(!reviewed||reviewed.uid!==account.uid||reviewed.session!==session||reviewed.player!==input.player||reviewed.date!==input.eventDate||Date.now()>=reviewed.expires)return fail('REMOVE_STALE');
    }
    let checked=beautyLiveRemoveState_(input,authorization),state=checked.state,ss=checked.ss;journal=state.journal;
    if(props.getProperty(journal))return fail('REMOVE_REVIEW',journal);
    if(action==='preview'){
      const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
      cache.put('beauty-remove-preview:'+ticket,JSON.stringify({uid:account.uid,session,player:input.player,date:input.eventDate,version:state.version,expires}),300);
      return {success:true,status:'PREVIEW',ticket,expires,player:input.player,event:state.event,identity:state.identity,tpid:state.entry?.tpid||null,statusInHub:state.data.players.find(p=>beautyLiveRegistrationKey_(p.player||p.newPlayer)===beautyLiveRegistrationKey_(input.player)).status};
    }
    if(reviewed.version!==state.version)return fail('REMOVE_STALE');
    // Recovery snapshot inside the approved LIVE spreadsheet.
    backup='REMOVE-'+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,8);
    const archive=beautyLiveRemoveMeasure_('recovery-sheet-create',()=>ss.insertSheet(backup)),serialized=JSON.stringify({recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,state});
    const chunks=serialized.match(/[\s\S]{1,30000}/g);archive.getRange(1,1,chunks.length,1).setValues(chunks.map(c=>["'"+c]));
    const saved=archive.getRange(1,1,chunks.length,1).getValues().map(r=>String(r[0]).replace(/^'/,'')).join('');
    if(saved!==serialized)throw Error('BACKUP');
    checked=beautyLiveRemoveState_(input,authorization);
    if(checked.state.version!==state.version)return fail('REMOVE_STALE',journal,backup);
    beautyHubAuthRequire_(token);
    const record={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,event:state.event,tpid:state.entry?.tpid||null,identity:state.identity,backup,version:state.version};
    props.setProperty(journal,JSON.stringify(record));if(props.getProperty(journal)!==JSON.stringify(record))throw Error('JOURNAL');
    props.setProperty('BEAUTY_LIVE_REMOVE_PENDING',JSON.stringify(record));
    if(props.getProperty('BEAUTY_LIVE_REMOVE_PENDING')!==JSON.stringify(record))throw Error('JOURNAL');
    attempted=true;
    if(state.entry){
      const receipt=beautyLiveRemoveFetch_('tournament/entry/update',authorization,{tdid:state.event.id,remove:[state.entry.tpid]});
      if(receipt.removed!==1||(receipt.updated||0)!==0||(receipt.added||[]).length)throw Error('RECEIPT');
    }
    const verifyNakka=()=>{
      const [eventData,list]=beautyLiveRemoveReads_(authorization,false),latest=eventData.tournament;
      if(!latest||latest.tdid!==state.event.id||(latest.lgid||'')!==BEAUTY_LIVE_TARGET_.leagueId||latest.title!==state.event.title||latest.status!==state.event.status||
        Utilities.formatDate(new Date(latest.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==state.event.date)throw Error('TARGET_CHANGED');
      beautyLiveRemoveEntries_(list);
      const remaining=list.list.slice().sort((a,b)=>a.tpid.localeCompare(b.tpid));
      if(JSON.stringify(remaining)!==JSON.stringify(state.fullEntries.filter(r=>r.tpid!==state.entry?.tpid)))throw Error('NAKKA_READBACK');
    };
    verifyNakka();
    // No Sheet registration mutation until the exact event-entry deletion is verified.
    if(beautyLiveRemoveVersion_(beautyLiveRemoveMeasure_('sheet-prewrite-check',()=>beautyLiveRemoveSnapshot_(ss)),input.eventDate)!==beautyLiveRemoveVersion_(state.snap,input.eventDate))throw Error('SHEET_CHANGED');
    ss.getSheetByName('Form responses 2').getRange(state.registration.i+1,2,1,2).clearContent();
    ss.getSheetByName('PLAYER STATUS DATA').getRange(state.stored.i+1,3,1,4).clearContent();
    SpreadsheetApp.flush();
    const tonight=ss.getSheetByName("TONIGHT'S PLAYERS"),expected=state.data.players.filter(p=>beautyLiveRegistrationKey_(p.player||p.newPlayer)!==beautyLiveRegistrationKey_(input.player));
    let rows;
    for(let i=0;i<5;i++){
      rows=tonight.getRange(2,1,99,6).getDisplayValues();
      if(rows.filter(r=>r[0]||r[1]).length===expected.length&&!rows.some(r=>beautyLiveRegistrationKey_(r[0]||r[1])===beautyLiveRegistrationKey_(input.player)))break;
      if(i===4)throw Error('RECALCULATION');Utilities.sleep(250);
    }
    const wanted=new Map(expected.map(p=>[beautyLiveRegistrationKey_(p.player||p.newPlayer),p]));
    const values=rows.map(r=>{const name=beautyLiveRegistrationKey_(r[0]||r[1]);if(name&&!wanted.has(name))throw Error('MEMBERSHIP');return [name?wanted.get(name).status:''];});
    tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
    const after=beautyLiveRemoveMeasure_('sheet-preservation-check',()=>beautyLiveRemoveSnapshot_(ss)),planned=JSON.parse(JSON.stringify(state.snap));
    // Compare typed values via JSON; only two response name cells and four status cells may change.
    for(const field of ['values','display']){
      planned['Form responses 2'][field][state.registration.i][1]='';planned['Form responses 2'][field][state.registration.i][2]='';
      planned['PLAYER STATUS DATA'][field][state.stored.i].splice(2,4,'','','','');
    }
    for(const title of ['Control',"PLAYER'S MASTER LIST",'Form responses 2','PLAYER STATUS DATA'])if(JSON.stringify(after[title])!==JSON.stringify(planned[title]))throw Error('PRESERVATION');
    for(const field of ['formulas','formats'])if(JSON.stringify(after["TONIGHT'S PLAYERS"][field])!==JSON.stringify(state.snap["TONIGHT'S PLAYERS"][field]))throw Error('FORMULA');
    const data=beautyLiveRemoveMeasure_('hub-readback',()=>beautyLiveDashboardRead_()),sort=players=>players.slice().sort((a,b)=>(a.player||a.newPlayer).localeCompare(b.player||b.newPlayer));
    if(data.eventDate!==input.eventDate||JSON.stringify(sort(data.players))!==JSON.stringify(sort(expected)))throw Error('HUB_READBACK');
    verifyNakka();
    record.state='VERIFIED';record.verifiedUTC=new Date().toISOString();props.setProperty(journal,JSON.stringify(record));
    if(props.getProperty(journal)!==JSON.stringify(record))throw Error('JOURNAL');
    props.setProperty('BEAUTY_LIVE_REMOVE_LAST',JSON.stringify(record));
    props.deleteProperty('BEAUTY_LIVE_REMOVE_PENDING');
    if(props.getProperty('BEAUTY_LIVE_REMOVE_PENDING')!==null)throw Error('JOURNAL');
    return {success:true,status:'REMOVED',readbackVerified:true,player:input.player,event:state.event,journal,backup,data};
  }catch(e){
    if(e.name==='HubAuthError'&&!attempted)return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};
    return fail(attempted?'REMOVE_UNCERTAIN':({STALE:'REMOVE_STALE',IDENTITY:'REMOVE_IDENTITY',TARGET:'REMOVE_TARGET',BRACKET:'REMOVE_BRACKET'}[e.message]||'REMOVE_FAILED'),journal,backup);
  }finally{lock.releaseLock();}
}

