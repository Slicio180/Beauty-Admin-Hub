/* AUD-092/094: single-entry, explicitly confirmed Identity TEST transfer only.
 * Manual transfer does not create league players. AUD-100 automatic registration
 * can establish a new league identity through its separate guarded helper.
 * API contract: https://push.n01darts.com/api/v1/n01_api_manual_en.html
 */
const BEAUTY_HUB_NAKKA_TRANSFER_ENABLED_ = true;
const BEAUTY_HUB_NAKKA_TEST_EVENT_ = 't_RqC2_2034';
// Invocation-local context, created only by the guarded player registration
// controller after validating its public input. Never accepted from a client.
var beautyHubPlayerContext_ = null;
function beautyHubNakkaAuthorize_(player) {
  if(beautyHubPlayerContext_!==null)return beautyHubPlayerTransferRequire_(player);
  return beautyHubAuthRequire_(beautyHubRequestToken_);
}
function beautyHubTransferError_(code) { const e=new Error(code);e.name='HubTransferError';throw e; }
function beautyHubTransferHash_(value) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value))).replace(/=+$/,'');
}
function beautyHubTransferFetch_(path,authorization,payload) {
  const options={method:payload?'post':'get',headers:{Authorization:authorization},muteHttpExceptions:true,followRedirects:false};
  if(payload){options.contentType='application/json';options.payload=JSON.stringify(payload);}
  // Both origin and paths are compiled in; no caller-supplied URL or target.
  const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,options);
  if(response.getResponseCode()!==200)beautyHubTransferError_('NAKKA_UNAVAILABLE');
  const text=response.getContentText();if(text.length>1000000)beautyHubTransferError_('NAKKA_LAYOUT');
  const data=JSON.parse(text);
  if(!data||typeof data!=='object'||data.result!==0)beautyHubTransferError_('NAKKA_UNAVAILABLE');
  return data;
}
function beautyHubTransferEntries_(data) {
  if(!Array.isArray(data.list)||data.list.length>=1000)beautyHubTransferError_('NAKKA_LAYOUT');
  const ids=new Set();
  return data.list.map(row=>{
    if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||/[\x00-\x1f\x7f]/.test(row.name)||
       typeof row.tpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(row.tpid)||ids.has(row.tpid)||
       (row.lpid!=null&&(typeof row.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(row.lpid))))beautyHubTransferError_('NAKKA_LAYOUT');
    ids.add(row.tpid);return {tpid:row.tpid,name:row.name,lpid:row.lpid||''};
  }).sort((a,b)=>a.tpid.localeCompare(b.tpid));
}
function beautyHubTransferState_(player,authorization,allowMissing) {
  const key=v=>v.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const match=beautyHubNakkaEvent_({});
  if(match.status!=='MATCHED'||match.event?.id!==BEAUTY_HUB_NAKKA_TEST_EVENT_)beautyHubTransferError_('TEST_TARGET_ONLY');
  const raw=beautyHubTransferFetch_('tournament/get?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_+'&entry=0',authorization).tournament;
  if(!raw||raw.tdid!==BEAUTY_HUB_NAKKA_TEST_EVENT_||raw.lgid!=='lg_tM2v_3523'||raw.title!=='Beauty Hub TEST — DO NOT USE LIVE'||
     ![10,20].includes(raw.status)||!Number.isFinite(raw.t_date)||!Number.isFinite(raw.updateTime))beautyHubTransferError_('TEST_TARGET_ONLY');
  if(Utilities.formatDate(new Date(raw.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==match.eventDate)beautyHubTransferError_('STALE_TRANSFER');
  const event={id:raw.tdid,title:raw.title,date:match.eventDate,status:raw.status,updateTime:raw.updateTime};
  const hub=beautyHubNakkaHubRows_(),found=hub.filter(row=>key(row.name)===key(player));
  if(found.length!==1||found[0].status!=='IN')beautyHubTransferError_('PLAYER_NOT_ELIGIBLE');
  const leagueData=beautyHubTransferFetch_('league/entry/list?lgid=lg_tM2v_3523&count=1000',authorization);
  if(!Array.isArray(leagueData.list)||leagueData.list.length>=1000)beautyHubTransferError_('NAKKA_LAYOUT');
  const ids=new Set(),league=[],leagueRows=[];
  for(const row of leagueData.list){
    if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||/[\x00-\x1f\x7f]/.test(row.name)||
       typeof row.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(row.lpid)||ids.has(row.lpid))beautyHubTransferError_('NAKKA_LAYOUT');
    ids.add(row.lpid);leagueRows.push({name:row.name,lpid:row.lpid});if(key(row.name)===key(found[0].name))league.push({name:row.name,lpid:row.lpid});
  }
  // Name equality proposes a link only. The organiser must explicitly review
  // the proposed existing league player and LPID before a POST is possible.
  if(league.length>1||(!allowMissing&&league.length!==1)||(league[0]?.name||found[0].name).length>60)beautyHubTransferError_('LEAGUE_IDENTITY_REVIEW');
  const identity=league[0]||{name:found[0].name,lpid:''},entries=beautyHubTransferEntries_(beautyHubTransferFetch_('tournament/entry/list?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_,authorization));
  const existing=entries.filter(row=>key(row.name)===key(identity.name)||(identity.lpid&&row.lpid===identity.lpid));
  if(existing.length>1||existing.some(row=>key(row.name)!==key(identity.name)||(row.lpid&&row.lpid!==identity.lpid)))beautyHubTransferError_('IDENTITY_CONFLICT');
  beautyHubNakkaAuthorize_(player);
  if(beautyHubNakkaDate_().date!==event.date||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub))beautyHubTransferError_('STALE_TRANSFER');
  return {event,hub,identity,entries,existing:existing[0]||null,...(allowMissing?{league:leagueRows.sort((a,b)=>a.lpid.localeCompare(b.lpid))}:{})};
}
function beautyHubNakkaTransfer_(action,input) {
  const result=beautyHubNakkaTransferRun_(action,input);
  if(typeof beautyHubAttentionRemember_==='function'&&result?.success===true&&result.readbackVerified===true&&result.event?.date)
    beautyHubAttentionRemember_(input.player,result.event.date,result);
  return result;
}
function beautyHubNakkaTransferRun_(action,input) {
  beautyHubTestGuard_();
  const messages={LEAGUE_CREATION_REVIEW_REQUIRED:'A previous league creation needs review. No add was sent; do not repeat the registration.',INVALID_TRANSFER:'Invalid transfer request. Reload the preview.',TRANSFER_DISABLED:'TEST transfers are disabled.',
    TEST_TARGET_ONLY:'Transfers are restricted to the named Beauty Hub TEST event, in Preparing or Accepting entries. No other event can be changed.',
    PLAYER_NOT_ELIGIBLE:'Select exactly one Hub player with IN status.',LEAGUE_IDENTITY_REVIEW:'No unique existing league identity could be proposed. Review the player in Nakka; no new league player was created.',
    IDENTITY_CONFLICT:'An existing Nakka entry has conflicting or duplicate identity details. Review it manually.',STALE_TRANSFER:'The event, player or Nakka list changed. Review a new preview.',
    NAKKA_LAYOUT:'Nakka returned incomplete or unsupported player data. No transfer can be verified.',NAKKA_UNAVAILABLE:'Nakka could not be checked. No automatic retry.',
    TRANSFER_BUSY:'Another TEST operation is running. Wait and review a new preview.',TRANSFER_REVIEW_REQUIRED:'A previous transfer attempt for this league player needs manual review. Do not repeat it.',
    TRANSFER_UNCERTAIN:'The request may have saved. Do not retry. Inspect the Nakka TEST entry and league link, and retain the journal reference.',TRANSFER_FAILED:'The transfer could not be prepared. No automatic retry.'};
  const fail=(code,journal)=>({success:false,code,error:messages[code]||messages.TRANSFER_FAILED,...(journal?{journal}: {})});
  const keys=action==='preview'?'player':'confirmed,player,ticket';
  if(!['preview','save'].includes(action)||!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==keys||
     Object.values(input).some(v=>typeof v!=='string')||!input.player.trim()||input.player.length>120||/[\x00-\x1f\x7f]/.test(input.player)||
     (action==='save'&&(input.confirmed!=='true'||!/^[a-f0-9]{32}$/.test(input.ticket))))return fail('INVALID_TRANSFER');
  if(BEAUTY_HUB_NAKKA_TRANSFER_ENABLED_!==true||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)return fail('TRANSFER_DISABLED');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('TRANSFER_BUSY');
  let attempted=false,journal=null;
  try{
    const account=beautyHubNakkaAuthorize_(input.player),props=PropertiesService.getScriptProperties();
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
    if(!user||!password)return fail('NAKKA_UNAVAILABLE');
    const authorization='Basic '+Utilities.base64Encode(user+':'+password),cache=CacheService.getScriptCache();
    const session=beautyHubTransferHash_(account.sessionBinding||beautyHubRequestToken_);
    let reviewed;
    if(action==='save'){
      const key='beauty-nakka-preview:'+input.ticket;
      try{reviewed=JSON.parse(cache.get(key)||'null');}catch(e){}
      cache.remove(key); // A confirmation is consumed once, even on failure.
      if(!reviewed||reviewed.uid!==account.uid||reviewed.session!==session||reviewed.player!==input.player||Date.now()>=reviewed.expires)return fail('STALE_TRANSFER');
    }
    const state=beautyHubTransferState_(input.player,authorization);
    journal='BEAUTY_NAKKA_TRANSFER_'+BEAUTY_HUB_NAKKA_TEST_EVENT_+'_'+state.identity.lpid;
    const creation=props.getProperty('BEAUTY_NAKKA_LEAGUE_CREATE_lg_tM2v_3523_'+beautyHubTransferHash_(input.player.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE')));
    if(creation){let old;try{old=JSON.parse(creation);}catch(e){}if(old?.state!=='VERIFIED'||old.name!==input.player||old.lpid!==state.identity.lpid)return fail('LEAGUE_CREATION_REVIEW_REQUIRED');}
    const prior=props.getProperty(journal);
    if(prior){
      let old;try{old=JSON.parse(prior);}catch(e){}
      if(old?.state==='ATTEMPTED'){
        // Read-only reconciliation of an old uncertain attempt. Presence is
        // independent of attributing the POST or proving an unexposed LPID.
        const existing=state.existing;
        if(existing&&old.event?.id===state.event.id&&old.event?.date===state.event.date&&
           old.identity?.name===state.identity.name&&old.identity?.lpid===state.identity.lpid&&
           Number.isInteger(old.beforeCount)&&old.beforeCount>=0&&state.entries.length===old.beforeCount+1&&
           beautyHubTransferHash_(state.entries.filter(r=>r.tpid!==existing.tpid))===old.beforeHash){
          const linked=existing.lpid===state.identity.lpid;
          return {success:true,status:'PRESENT_AFTER_ATTEMPT',changed:false,readbackVerified:true,identityVerified:linked,
            operationVerified:false,event:state.event,identity:state.identity,tpid:existing.tpid,journal,
            message:linked?'The player is present with the reviewed league link. Previous entries match the saved fingerprint. No new add was sent; the original attempt record is retained.':'The player is present in the TEST event and previous entries match the saved fingerprint. No new add was sent. The API does not expose the league link, so its exact ID remains unverified; the original attempt record is retained.'};
        }
        return fail('TRANSFER_REVIEW_REQUIRED',journal);
      }
      if(!['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(old?.state))return fail('TRANSFER_REVIEW_REQUIRED',journal);
      if(!state.existing)return fail('TRANSFER_REVIEW_REQUIRED',journal);
      if(old.event?.id!==state.event.id||old.identity?.lpid!==state.identity.lpid||old.tpid!==state.existing.tpid)return fail('TRANSFER_REVIEW_REQUIRED',journal);
    }
    if(state.existing)return {success:true,status:'ALREADY_PRESENT',changed:false,readbackVerified:true,event:state.event,identity:state.identity,
      identityVerified:state.existing.lpid===state.identity.lpid,
      message:state.existing.lpid===state.identity.lpid?'Already in this TEST event with the same league link. Nothing added.':'Already present in this TEST event. Nothing added. The API does not expose the league link, so its exact ID is not verified here.'};
    const version=beautyHubTransferHash_(state);
    if(action==='preview'){
      const ticket=Utilities.getUuid().replace(/-/g,''),expires=Date.now()+300000;
      cache.put('beauty-nakka-preview:'+ticket,JSON.stringify({uid:account.uid,session,player:input.player,version,expires}),300);
      return {success:true,status:'PREVIEW',event:state.event,identity:state.identity,player:input.player,ticket,expires,
        message:'Check the existing league identity below. Confirming adds this one IN player to the TEST event only.'};
    }
    if(reviewed.version!==version)return fail('STALE_TRANSFER');
    // Check the event again immediately before posting. Nakka admin pages must
    // be closed during this operation: entry/add has no documented CAS token.
    const latest=beautyHubTransferFetch_('tournament/get?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_+'&entry=0',authorization).tournament;
    if(!latest||latest.tdid!==state.event.id||latest.lgid!=='lg_tM2v_3523'||latest.title!==state.event.title||
       latest.status!==state.event.status||latest.updateTime!==state.event.updateTime||Utilities.formatDate(new Date(latest.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==state.event.date)return fail('STALE_TRANSFER');
    beautyHubNakkaAuthorize_(input.player);
    if(beautyHubNakkaDate_().date!==state.event.date||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(state.hub))return fail('STALE_TRANSFER');
    const record={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:account.uid,event:state.event,
      identity:state.identity,beforeCount:state.entries.length,beforeHash:beautyHubTransferHash_(state.entries)};
    // Durable write-ahead marker. Never use cache as the retry barrier.
    props.setProperty(journal,JSON.stringify(record));
    if(props.getProperty(journal)!==JSON.stringify(record))throw Error('journal');
    attempted=true;
    const result=beautyHubTransferFetch_('tournament/entry/update',authorization,{tdid:BEAUTY_HUB_NAKKA_TEST_EVENT_,add:[{name:state.identity.name,lpid:state.identity.lpid}]});
    if(!Array.isArray(result.added)||result.added.length!==1||!result.added[0]||!/^[A-Za-z0-9]{4}$/.test(result.added[0].tpid)||
       result.added[0].name!==state.identity.name||(result.updated||0)!==0||(result.removed||0)!==0)throw Error('receipt');
    const tpid=result.added[0].tpid,after=beautyHubTransferEntries_(beautyHubTransferFetch_('tournament/entry/list?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_,authorization));
    const added=after.filter(r=>r.tpid===tpid);
    if(added.length!==1||added[0].name!==state.identity.name||(added[0].lpid&&added[0].lpid!==state.identity.lpid)||after.length!==state.entries.length+1||
       JSON.stringify(after.filter(r=>r.tpid!==tpid))!==JSON.stringify(state.entries))throw Error('readback');
    const linked=added[0].lpid===state.identity.lpid;
    record.state=linked?'VERIFIED':'ENTRY_VERIFIED_LINK_UNEXPOSED';record.verifiedUTC=new Date().toISOString();record.tpid=tpid;
    record.entryVerified=true;record.identityVerified=linked;props.setProperty(journal,JSON.stringify(record));
    if(props.getProperty(journal)!==JSON.stringify(record))throw Error('journal');
    return {success:true,status:linked?'TRANSFERRED':'ENTRY_VERIFIED_LINK_UNEXPOSED',changed:true,readbackVerified:true,identityVerified:linked,event:state.event,identity:state.identity,tpid,journal,
      message:linked?'Added to the Nakka TEST event. New entry and existing league link verified; previous entries preserved.':'Added to the Nakka TEST event and the new entry is confirmed; previous entries are preserved. The reviewed league ID was sent, but the API does not expose the saved link for exact-ID verification. Do not add this player again.'};
  }catch(e){
    if(e.name==='HubAuthError'&&!attempted)return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'};
    return fail(attempted?'TRANSFER_UNCERTAIN':e.name==='HubTransferError'?e.message:'TRANSFER_FAILED',journal);
  }finally{lock.releaseLock();}
}
