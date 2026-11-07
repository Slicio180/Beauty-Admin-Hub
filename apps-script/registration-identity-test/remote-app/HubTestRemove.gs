/* Owner-only TEST: one reviewed registration and event entry; never a league deletion. */
const BEAUTY_HUB_REMOVE_ENABLED_ = true;
function beautyHubRemoveState_(input, authorization) {
  const ss=(typeof beautyHubSpreadsheet_==='function'?beautyHubSpreadsheet_():SpreadsheetApp.openById(SHEET_ID)),snap=beautyHubNakkaMeasure_('sheet-snapshot',()=>beautyHubEventSnapshot_(ss));
  const date=Utilities.formatDate(snap.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');
  if(date!==input.eventDate)throw Error('STALE');
  // The validated snapshot already contains these rows. Do not reopen the workbook
  // and reread Control, Tonight and the master list for the same state.
  const key=beautyHubEventKey_,data={eventDate:date,players:snap["TONIGHT'S PLAYERS"].display.slice(1).map(row=>({
    player:String(row[0]||'').trim(),newPlayer:String(row[1]||'').trim(),status:String(row[2]||'').trim(),
    consent:String(row[3]||'').trim(),message:String(row[4]||'').trim(),whereFrom:String(row[5]||'').trim()
  })).filter(row=>row.player||row.newPlayer)};
  const players=data.players.filter(p=>key(p.player||p.newPlayer)===key(input.player));
  const stored=snap['PLAYER STATUS DATA'].display.map((v,i)=>({v,i})).slice(1).filter(r=>key(r.v[0])===key(input.player));
  if(players.length!==1||stored.length!==1||!['IN','OUT','STANDBY'].includes(players[0].status))throw Error('IDENTITY');
  const responses=snap['Form responses 2'];
  if(responses.formulas.some(r=>r.some(Boolean)))throw Error('LAYOUT');
  const registrations=responses.values.map((v,i)=>({v,i})).slice(1).filter(r=>{
    if(!(r.v[0] instanceof Date)||isNaN(r.v[0].getTime())||(!(typeof beautyContextRead_==='function'&&beautyContextRead_())&&Utilities.formatDate(r.v[0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')!==date))return false;
    const raw=String(r.v[1]||'').trim()==='MITT NAMN FINNS INTE I LISTAN'?r.v[2]:r.v[1];
    return key(raw)===key(input.player)||!!stored[0].v[1]&&key(raw)===key(stored[0].v[1]);
  });
  if(registrations.length!==1)throw Error('IDENTITY');
  const match=beautyHubNakkaEvent_({});
  if(match.status!=='MATCHED'||match.event?.id!==beautyHubTransferTarget_()||match.eventDate!==date)throw Error('TARGET');
  const [eventData,list,leagueData]=beautyHubNakkaReads_(authorization,true),raw=eventData.tournament;
  if(!raw||raw.tdid!==beautyHubTransferTarget_()||(raw.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||raw.title!==beautyHubActiveTestTarget_().title||![10,20].includes(raw.status)||
    !Number.isFinite(raw.t_date)||!Number.isFinite(raw.updateTime)||Utilities.formatDate(new Date(raw.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('TARGET');
  const standalone=typeof beautyContextStandalone_==='function'&&beautyContextStandalone_();
  const league=standalone?[{name:input.player,lpid:''}]:leagueData.list;
  if(!Array.isArray(league)||league.length>=1000)throw Error('IDENTITY');
  const identities=league.filter(r=>key(r.name)===key(input.player));
  if(identities.length!==1||(!standalone&&!/^[A-Za-z0-9]{4}$/.test(identities[0].lpid)))throw Error('IDENTITY');
  const entries=beautyHubTransferEntries_(list),found=entries.filter(r=>key(r.name)===key(input.player)||(identities[0].lpid&&r.lpid===identities[0].lpid));
  if(found.length>1||found.some(r=>key(r.name)!==key(input.player)||!standalone&&r.lpid&&r.lpid!==identities[0].lpid))throw Error('IDENTITY');
  const entry=found[0]||null;
  // Removing an entry does not repair brackets. Refuse any existing placement.
  const contains=(value,id)=>value===id||Array.isArray(value)&&value.some(v=>contains(v,id))||value&&typeof value==='object'&&Object.entries(value).some(([k,v])=>k===id||contains(v,id));
  if(entry&&Object.keys(raw).some(k=>(k==='table'||k.endsWith('_table'))&&contains(raw[k],entry.tpid)))throw Error('BRACKET');
  const fullEntries=list.list.slice().sort((a,b)=>a.tpid.localeCompare(b.tpid));
  const event={id:raw.tdid,title:raw.title,date,status:raw.status,updateTime:raw.updateTime};
  const state={snap,data,registration:registrations[0],stored:stored[0],identity:{name:identities[0].name,lpid:identities[0].lpid},entry,fullEntries,event};
  state.version=beautyHubTransferHash_({snap,event,identity:state.identity,entry,fullEntries});
  state.journal='BEAUTY_NAKKA_REMOVE_'+event.id+'_'+beautyHubTransferHash_({name:key(input.player),timestamp:registrations[0].v[0].toISOString()});
  return {ss,state};
}
function beautyHubRemove_(action,input) {
  return beautyHubNakkaTimed_('remove-'+action,()=>beautyHubRemoveRun_(action,input));
}
function beautyHubRemoveRun_(action,input) {
  beautyHubTestGuard_();
  const fail=(code,journal,backup)=>({success:false,code,error:{INVALID_REMOVE:'Invalid removal request. Reload and review again.',REMOVE_DISABLED:'Removal is disabled.',REMOVE_BUSY:'Another operation is running. Review again shortly.',REMOVE_STALE:'The event or player data changed. Review a new removal.',REMOVE_IDENTITY:'A unique registration and league identity could not be verified. Review the player manually.',REMOVE_TARGET:'Removal is limited to the selected, pre-start TEST event.',REMOVE_BRACKET:'This player is placed in a bracket. Review the bracket in Nakka before removal.',REMOVE_REVIEW:'A previous removal needs review. No retry was sent.',REMOVE_UNCERTAIN:'Removal may be partly saved. Do not repeat it. Inspect Nakka and the Hub using the recovery reference.',REMOVE_FAILED:'Removal could not be checked. Nothing was deliberately retried.'}[code]||'Removal needs review.',...(journal?{journal}:{}),...(backup?{backup}:{})});
  const keys=action==='preview'?'eventDate,player':'confirmed,eventDate,player,ticket';
  if(!['preview','save'].includes(action)||!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==keys||Object.values(input).some(v=>typeof v!=='string')||
     !beautyHubEventDateValid_(input.eventDate)||!input.player.trim()||input.player.length>120||/[\x00-\x1f\x7f]/.test(input.player)||
     action==='save'&&(input.confirmed!=='true'||!/^[a-f0-9]{32}$/.test(input.ticket)))return fail('INVALID_REMOVE');
  if(BEAUTY_HUB_REMOVE_ENABLED_!==true||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)return fail('REMOVE_DISABLED');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('REMOVE_BUSY');
  let attempted=false,journal,backup;
  try{
    const account=beautyHubAuthRequire_(beautyHubRequestToken_),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache();
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');if(!user||!password)throw Error('READ');
    const authorization='Basic '+Utilities.base64Encode(user+':'+password),session=beautyHubTransferHash_(account.sessionBinding||beautyHubRequestToken_);
    let reviewed;
    if(action==='save'){
      const ticket='beauty-remove-preview:'+input.ticket;
      try{reviewed=JSON.parse(cache.get(ticket)||'null');}catch(e){}
      cache.remove(ticket);
      if(!reviewed||reviewed.uid!==account.uid||reviewed.session!==session||reviewed.player!==input.player||reviewed.date!==input.eventDate||Date.now()>=reviewed.expires)return fail('REMOVE_STALE');
    }
    let checked=beautyHubRemoveState_(input,authorization),state=checked.state,ss=checked.ss;journal=state.journal;
    if(props.getProperty(journal))return fail('REMOVE_REVIEW',journal);
    if(action==='preview'){
      const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
      cache.put('beauty-remove-preview:'+ticket,JSON.stringify({uid:account.uid,session,player:input.player,date:input.eventDate,version:state.version,expires}),300);
      return {success:true,status:'PREVIEW',ticket,expires,player:input.player,event:state.event,identity:state.identity,tpid:state.entry?.tpid||null,statusInHub:state.data.players.find(p=>beautyHubEventKey_(p.player||p.newPlayer)===beautyHubEventKey_(input.player)).status};
    }
    if(reviewed.version!==state.version)return fail('REMOVE_STALE');
    // Immutable typed recovery copy inside the approved TEST spreadsheet.
    backup='REMOVE-'+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,8);
    const archive=beautyHubNakkaMeasure_('recovery-sheet-create',()=>ss.insertSheet(backup)),serialized=JSON.stringify({recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,state});
    const chunks=serialized.match(/[\s\S]{1,30000}/g);archive.getRange(1,1,chunks.length,1).setValues(chunks.map(c=>["'"+c]));
    const saved=archive.getRange(1,1,chunks.length,1).getValues().map(r=>String(r[0]).replace(/^'/,'')).join('');
    if(saved!==serialized)throw Error('BACKUP');
    checked=beautyHubRemoveState_(input,authorization);
    if(checked.state.version!==state.version)return fail('REMOVE_STALE',journal,backup);
    beautyHubAuthRequire_(beautyHubRequestToken_);
    const record={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,event:state.event,tpid:state.entry?.tpid||null,identity:state.identity,backup,version:state.version};
    props.setProperty(journal,JSON.stringify(record));if(props.getProperty(journal)!==JSON.stringify(record))throw Error('JOURNAL');
    attempted=true;
    if(state.entry){
      const receipt=beautyHubTransferFetch_('tournament/entry/update',authorization,{tdid:state.event.id,remove:[state.entry.tpid]});
      if(receipt.removed!==1||(receipt.updated||0)!==0||(receipt.added||[]).length)throw Error('RECEIPT');
    }
    const verifyNakka=()=>{
      const [eventData,list]=beautyHubNakkaReads_(authorization,false),latest=eventData.tournament;
      if(!latest||latest.tdid!==state.event.id||(latest.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||latest.title!==state.event.title||latest.status!==state.event.status||
        Utilities.formatDate(new Date(latest.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==state.event.date)throw Error('TARGET_CHANGED');
      beautyHubTransferEntries_(list);
      const remaining=list.list.slice().sort((a,b)=>a.tpid.localeCompare(b.tpid));
      if(JSON.stringify(remaining)!==JSON.stringify(state.fullEntries.filter(r=>r.tpid!==state.entry?.tpid)))throw Error('NAKKA_READBACK');
    };
    verifyNakka();
    // No Sheet registration mutation until the exact event-entry deletion is verified.
    if(beautyHubEventVersion_(beautyHubNakkaMeasure_('sheet-prewrite-check',()=>beautyHubEventSnapshot_(ss)),input.eventDate)!==beautyHubEventVersion_(state.snap,input.eventDate))throw Error('SHEET_CHANGED');
    ss.getSheetByName('Form responses 2').getRange(state.registration.i+1,2,1,2).clearContent();
    ss.getSheetByName('PLAYER STATUS DATA').getRange(state.stored.i+1,3,1,4).clearContent();
    SpreadsheetApp.flush();
    const tonight=ss.getSheetByName("TONIGHT'S PLAYERS"),expected=state.data.players.filter(p=>beautyHubEventKey_(p.player||p.newPlayer)!==beautyHubEventKey_(input.player));
    let rows;
    for(let i=0;i<5;i++){
      rows=tonight.getRange(2,1,99,6).getDisplayValues();
      if(rows.filter(r=>r[0]||r[1]).length===expected.length&&!rows.some(r=>beautyHubEventKey_(r[0]||r[1])===beautyHubEventKey_(input.player)))break;
      if(i===4)throw Error('RECALCULATION');Utilities.sleep(250);
    }
    const wanted=new Map(expected.map(p=>[beautyHubEventKey_(p.player||p.newPlayer),p]));
    const values=rows.map(r=>{const name=beautyHubEventKey_(r[0]||r[1]);if(name&&!wanted.has(name))throw Error('MEMBERSHIP');return [name?wanted.get(name).status:''];});
    tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
    const after=beautyHubNakkaMeasure_('sheet-preservation-check',()=>beautyHubEventSnapshot_(ss)),planned=JSON.parse(JSON.stringify(state.snap));
    // Compare typed values via JSON; only two response name cells and four status cells may change.
    for(const field of ['values','display']){
      planned['Form responses 2'][field][state.registration.i][1]='';planned['Form responses 2'][field][state.registration.i][2]='';
      planned['PLAYER STATUS DATA'][field][state.stored.i].splice(2,4,'','','','');
    }
    for(const title of ['Control',"PLAYER'S MASTER LIST",'Form responses 2','PLAYER STATUS DATA'])if(JSON.stringify(after[title])!==JSON.stringify(planned[title]))throw Error('PRESERVATION');
    for(const field of ['formulas','formats'])if(JSON.stringify(after["TONIGHT'S PLAYERS"][field])!==JSON.stringify(state.snap["TONIGHT'S PLAYERS"][field]))throw Error('FORMULA');
    const data=beautyHubNakkaMeasure_('hub-readback',()=>getBeautyHubData_()),sort=players=>players.slice().sort((a,b)=>(a.player||a.newPlayer).localeCompare(b.player||b.newPlayer));
    if(data.eventDate!==input.eventDate||JSON.stringify(sort(data.players))!==JSON.stringify(sort(expected)))throw Error('HUB_READBACK');
    verifyNakka();
    record.state='VERIFIED';record.verifiedUTC=new Date().toISOString();props.setProperty(journal,JSON.stringify(record));
    if(props.getProperty(journal)!==JSON.stringify(record))throw Error('JOURNAL');
    const transfer=props.getProperty('BEAUTY_NAKKA_TRANSFER_'+state.event.id+'_'+(state.identity.lpid||beautyHubTransferHash_(state.identity.name)));
    let previous;try{previous=JSON.parse(transfer||'null');}catch(e){}
    // An organiser may have already removed this exact old entry in Nakka.
    // A completed Hub removal can retain proof of verified absence too; this
    // does not claim that this request sent a Nakka deletion.
    const absentPrior=['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(previous?.state)&&
      previous.event?.id===state.event.id&&previous.event?.date===state.event.date&&
      previous.identity?.name===state.identity.name&&previous.identity?.lpid===state.identity.lpid&&
      /^[A-Za-z0-9]{4}$/.test(previous.tpid||'')&&!state.fullEntries.some(r=>r.tpid===previous.tpid);
    const reviewedReplacement=state.entry&&absentPrior&&beautyHubTransferReviewMatch_(transfer,{event:state.event,identity:state.identity,existing:state.entry});
    const proofIds=[...(state.entry?[state.entry.tpid]:[]),...(absentPrior&&(!state.entry||reviewedReplacement)?[previous.tpid]:[])];
    for(const removedTpid of new Set(proofIds)){
      const proof={state:'VERIFIED',journal,event:state.event,identity:state.identity,tpid:removedTpid,priorTransfer:transfer,
        basis:removedTpid===state.entry?.tpid?'ENTRY_REMOVED_AND_VERIFIED':reviewedReplacement?'REVIEWED_REPLACEMENT_REMOVED_AND_ORIGINAL_ABSENT':'ENTRY_ALREADY_ABSENT_AND_VERIFIED',
        removedEntryId:state.entry?.tpid||null};
      const proofKey='BEAUTY_NAKKA_REMOVED_ENTRY_'+state.event.id+'_'+removedTpid,text=JSON.stringify(proof);
      props.setProperty(proofKey,text);if(props.getProperty(proofKey)!==text)throw Error('JOURNAL');
    }
    if(typeof beautyHubAttentionRemember_==='function'){
      try{beautyHubAttentionRemember_(input.player,input.eventDate,{success:true,readbackVerified:true,status:'REMOVED',message:'Removed from this event; league profile retained.'});}catch(e){}
    }
    return {success:true,status:'REMOVED',readbackVerified:true,player:input.player,event:state.event,journal,backup,data};
  }catch(e){
    if(e.name==='HubAuthError'&&!attempted)return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};
    if(attempted&&typeof beautyHubAttentionRemember_==='function')try{beautyHubAttentionRemember_(input.player,input.eventDate,{code:'REMOVE_UNCERTAIN'});}catch(ignored){}
    return fail(attempted?'REMOVE_UNCERTAIN':({STALE:'REMOVE_STALE',IDENTITY:'REMOVE_IDENTITY',TARGET:'REMOVE_TARGET',BRACKET:'REMOVE_BRACKET'}[e.message]||'REMOVE_FAILED'),journal,backup);
  }finally{lock.releaseLock();}
}

