/* Staff-visible, durable TEST attention records. Nakka checks are GET-only.
 * These records never replace, delete or bypass transfer/creation journals.
 */
function beautyHubAttentionKey_(date,name) {
  return ('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_')+date+'_'+beautyHubTransferHash_(name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'));
}
function beautyHubAttentionRemember_(name,date,result) {
  // Called only with the canonical committed registration or guarded transfer
  // result. Recording trouble cannot turn a saved registration into a retry.
  try {
    beautyHubTestGuard_();
    if(typeof name!=='string'||!name.trim()||name.length>120||!/^20\d\d-\d\d-\d\d$/.test(date))return false;
    const confirmed=result?.entryConfirmed===true||(result?.success===true&&result.readbackVerified===true&&['ALREADY_PRESENT','TRANSFERRED','ENTRY_VERIFIED_LINK_UNEXPOSED','PRESENT_AFTER_ATTEMPT','CURRENT_ENTRY_REVIEWED','REMOVED'].includes(result.status));
    const record={name,date,state:confirmed?'CLEAR':'ATTENTION',code:confirmed?'ENTRY_CONFIRMED':String(result?.code||'ENTRY_UNCONFIRMED').replace(/[^A-Z_]/g,'').slice(0,60),checkedAt:new Date().toISOString()};
    const props=PropertiesService.getScriptProperties(),key=beautyHubAttentionKey_(date,name),text=JSON.stringify(record);
    const previous=props.getProperty(key);
    if(previous){try{const old=JSON.parse(previous);if(old.name===record.name&&old.date===record.date&&old.state===record.state&&old.code===record.code)return true;}catch(e){}}
    props.setProperty(key,text);return props.getProperty(key)===text;
  } catch(e) { return false; }
}
function beautyHubAttentionRead_(data) {
  beautyHubTestGuard_();
  const date=data.eventDate,answer={available:true,eventDate:date,items:[],checkedAt:null,complete:false};
  if(!/^20\d\d-\d\d-\d\d$/.test(date||''))return {...answer,available:false};
  try {
    const props=PropertiesService.getScriptProperties(),prefix=('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_')+date+'_';
    const all=props.getProperties();
    for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))){
      const r=JSON.parse(all[key]);
      if(r.date!==date||typeof r.name!=='string'||!r.name||r.name.length>120||!['CLEAR','ATTENTION'].includes(r.state)||typeof r.code!=='string'||!/^[A-Z_]{1,60}$/.test(r.code))throw Error('record');
      if(r.state==='ATTENTION'){
        const diagnostic=beautyHubRegistrationDiagnosticRead_(r.name,date);
        answer.items.push({name:r.name,code:r.code,...(diagnostic?{registrationDiagnostic:diagnostic}:{})});
      }
    }
    const raw=props.getProperty(('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_CHECK_')+date);
    if(raw){const meta=JSON.parse(raw);answer.checkedAt=meta.checkedAt;answer.complete=meta.signature===beautyHubTransferHash_((data.players||[]).map(p=>({name:p.player||p.newPlayer,status:p.status})));}
    answer.items.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
    return answer;
  }catch(e){return {...answer,available:false,complete:false};}
}
function beautyHubAttentionRefresh_(input) {
  return beautyHubNakkaTimed_('diagnose',()=>beautyHubAttentionRefreshRun_(input));
}
function beautyHubAttentionRefreshRun_(input) {
  beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Unexpected attention input.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(0))return {success:false,code:'BUSY',message:'Another operation is running. The saved attention list is retained.'};
  let locked=true,diagnosis='CHECK_UNAVAILABLE';
  try {
    const date=beautyHubNakkaDate_().date,hub=beautyHubNakkaHubRows_(),props=PropertiesService.getScriptProperties();
    const target=beautyHubTransferTarget_();
    const fingerprint=()=>JSON.stringify(Object.entries(props.getProperties()).sort(([a],[b])=>a.localeCompare(b)));
    const before=fingerprint();
    // Nakka GETs must not hold up registration or transfer writes.
    lock.releaseLock();locked=false;
    const match=beautyHubNakkaEvent_({});
    if(match.status!=='MATCHED'||match.event?.id!==beautyHubTransferTarget_()||match.event?.title!==beautyHubActiveTestTarget_().title||match.eventDate!==date){diagnosis=match.status==='NOT_FOUND'?'EVENT_DATE_MISMATCH':match.status==='STALE'?'STALE_CHECK':match.status==='AMBIGUOUS'?'EVENT_AMBIGUOUS':'EVENT_UNAVAILABLE';throw Error('target');}
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
    if(!user||!password)throw Error('credentials');
    const auth='Basic '+Utilities.base64Encode(user+':'+password);
    const [eventData,entryData,leagueData]=beautyHubNakkaReads_(auth,true),event=eventData.tournament;
    if(!event||event.tdid!==beautyHubTransferTarget_()||(event.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||event.title!==match.event.title||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('target');
    const entries=beautyHubTransferEntries_(entryData);
    const standalone=typeof beautyContextStandalone_==='function'&&beautyContextStandalone_();
    const league=standalone?hub.map(p=>({name:p.name,lpid:''})):leagueData.list;
    if(!Array.isArray(league)||league.length>=1000)throw Error('league');
    const ids=new Set();
    for(const r of league){if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>120||typeof r.lpid!=='string'||(!standalone&&(!/^[A-Za-z0-9]{4}$/.test(r.lpid)||ids.has(r.lpid))))throw Error('league');ids.add(r.lpid);}
    const normalize=n=>n.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
    // Include retained issues even if their Hub status has since become OUT.
    const retained=beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))});
    if(!retained.available)throw Error('record');
    const names=new Map(hub.filter(p=>p.status==='IN').map(p=>[normalize(p.name),p.name]));
    for(const item of retained.items)names.set(normalize(item.name),item.name);
    const decisions=[];
    for(const [key,name]of names){
      const h=hub.filter(p=>normalize(p.name)===key),l=league.filter(p=>normalize(p.name)===key),e=entries.filter(p=>normalize(p.name)===key||(l.length===1&&l[0].lpid&&p.lpid===l[0].lpid));
      let code='';
      if(h.length!==1)code='HUB_IDENTITY_REVIEW';
      else if(l.length!==1)code='LEAGUE_IDENTITY_REVIEW';
      else if(e.length!==1)code=e.length?'IDENTITY_CONFLICT':'MISSING_EVENT_ENTRY';
      else if(normalize(e[0].name)!==key||(e[0].lpid&&e[0].lpid!==l[0].lpid))code='IDENTITY_CONFLICT';
      if(!code){
        const creation=props.getProperty(('BEAUTY_NAKKA_LEAGUE_CREATE_'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'_')+beautyHubTransferHash_(key));
        if(creation){const c=JSON.parse(creation);if(c.state!=='VERIFIED'||c.name!==name||c.lpid!==l[0].lpid)code='LEAGUE_CREATION_REVIEW_REQUIRED';}
        const transfer=props.getProperty('BEAUTY_NAKKA_TRANSFER_'+beautyHubTransferTarget_()+'_'+(l[0].lpid||beautyHubTransferHash_(name)));
        if(transfer){
          const t=JSON.parse(transfer);
          if(t.event?.id!==beautyHubTransferTarget_()||t.event?.date!==date||t.identity?.name!==name||t.identity?.lpid!==l[0].lpid)code='TRANSFER_REVIEW_REQUIRED';
          else if(t.state==='ATTEMPTED'){
            if((!Number.isInteger(t.beforeCount)||entries.length!==t.beforeCount+1||beautyHubTransferHash_(entries.filter(r=>r.tpid!==e[0].tpid))!==t.beforeHash)&&
              !beautyHubTransferReviewMatch_(transfer,{event:{id:beautyHubTransferTarget_(),date},identity:{name,lpid:l[0].lpid},existing:e[0]}))code='TRANSFER_REVIEW_REQUIRED';
          }else if(!['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(t.state)||
            t.tpid!==e[0].tpid&&!beautyHubTransferReviewMatch_(transfer,{event:{id:beautyHubTransferTarget_(),date},identity:{name,lpid:l[0].lpid},existing:e[0]}))code='TRANSFER_REVIEW_REQUIRED';
        }
      }
      if(retained.items.some(item=>normalize(item.name)===key&&['REMOVE_UNCERTAIN','REMOVE_REVIEW_REQUIRED'].includes(item.code)))code='REMOVE_REVIEW_REQUIRED';
      decisions.push({name,code});
    }
    if(!lock.tryLock(0))return {success:false,code:'BUSY',message:'Registration or another operation is running. Saved alerts are retained.'};
    locked=true;
    beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
    if(beautyHubTransferTarget_()!==target||fingerprint()!==before){diagnosis='STALE_CHECK';throw Error('stale');}
    if(beautyHubNakkaDate_().date!==date||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub)){diagnosis='STALE_CHECK';throw Error('stale');}
    for(const d of decisions)if(!beautyHubAttentionRemember_(d.name,date,d.code?{code:d.code}:{entryConfirmed:true}))throw Error('save');
    const meta={checkedAt:new Date().toISOString(),signature:beautyHubTransferHash_(hub)};
    props.setProperty(('BEAUTY_TEST_ATTENTION_'+(typeof beautyHubEventScopeId_==='function'?beautyHubEventScopeId_():'lg_M2wQ_4189')+'_CHECK_')+date,JSON.stringify(meta));
    return {success:true,eventDate:date,event:match.event,hubCount:hub.length,nakkaCount:entries.length,attention:beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))})};
  }catch(e){
    if(e.name==='HubAuthError')return {success:false,code:'AUTH_REQUIRED',message:'Sign in to continue.'};
    return {success:false,code:diagnosis,message:'The player check could not be completed. Saved alerts are retained. Check the event date and Nakka; no players were added.'};
  }finally{if(locked)lock.releaseLock();}
}


// Separate original automatic-registration outcome: attention refresh and manual
// recovery never write this key, so they cannot replace the original stop code.
function beautyHubRegistrationDiagnosticKey_(name,date) {
  return 'BEAUTY_TEST_REG_DIAGNOSTIC_'+beautyHubTransferHash_(beautyHubAttentionKey_(date,name));
}
function beautyHubRegistrationDiagnostic_(name,date,source,result,stage) {
  try{
    beautyHubTestGuard_();
    if(typeof name!=='string'||!name.trim()||name.length>120||!/^20\d\d-\d\d-\d\d$/.test(date)||!['HUB','MOBIL','KIOSK'].includes(source))return false;
    const code=result?.entryConfirmed===true?'ENTRY_CONFIRMED':typeof result?.code==='string'&&/^[A-Z_]{1,60}$/.test(result.code)?result.code:'ENTRY_UNCONFIRMED';
    const stages=['AUTO_LOCK','PRECHECK','EVENT_PREVIEW','EVENT_PREVIEW_RETRY','EVENT_SAVE','LEAGUE_PRECHECK','LEAGUE_LOCK','LEAGUE_READ','LEAGUE_RECHECK','LEAGUE_JOURNAL','LEAGUE_WRITE','LEAGUE_READBACK'];
    const record={version:1,source,stage:stages.includes(stage)?stage:'UNKNOWN',code,recordedAt:new Date().toISOString()};
    const props=PropertiesService.getScriptProperties(),key=beautyHubRegistrationDiagnosticKey_(name,date),text=JSON.stringify(record);
    props.setProperty(key,text);return props.getProperty(key)===text;
  }catch(e){return false;}
}
function beautyHubRegistrationDiagnosticRead_(name,date) {
  try{
    const r=JSON.parse(PropertiesService.getScriptProperties().getProperty(beautyHubRegistrationDiagnosticKey_(name,date))||'null');
    if(r?.version!==1||!['HUB','MOBIL','KIOSK'].includes(r.source)||typeof r.stage!=='string'||!/^[_A-Z]{1,40}$/.test(r.stage)||typeof r.code!=='string'||!/^[_A-Z]{1,60}$/.test(r.code)||typeof r.recordedAt!=='string'||!Number.isFinite(Date.parse(r.recordedAt)))return null;
    return {source:r.source,stage:r.stage,code:r.code,recordedAt:r.recordedAt};
  }catch(e){return null;}
}
