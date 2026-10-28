/* Staff-visible, durable TEST attention records. Nakka checks are GET-only.
 * These records never replace, delete or bypass transfer/creation journals.
 */
function beautyHubAttentionKey_(date,name) {
  return 'BEAUTY_TEST_ATTENTION_'+date+'_'+beautyHubTransferHash_(name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'));
}
function beautyHubAttentionRemember_(name,date,result) {
  // Called only with the canonical committed registration or guarded transfer
  // result. Recording trouble cannot turn a saved registration into a retry.
  try {
    beautyHubTestGuard_();
    if(typeof name!=='string'||!name.trim()||name.length>120||!/^20\d\d-\d\d-\d\d$/.test(date))return false;
    const confirmed=result?.entryConfirmed===true||(result?.success===true&&result.readbackVerified===true&&['ALREADY_PRESENT','TRANSFERRED','ENTRY_VERIFIED_LINK_UNEXPOSED','PRESENT_AFTER_ATTEMPT','REMOVED'].includes(result.status));
    const record={name,date,state:confirmed?'CLEAR':'ATTENTION',code:confirmed?'ENTRY_CONFIRMED':String(result?.code||'ENTRY_UNCONFIRMED').replace(/[^A-Z_]/g,'').slice(0,60),checkedAt:new Date().toISOString()};
    const props=PropertiesService.getScriptProperties(),key=beautyHubAttentionKey_(date,name),text=JSON.stringify(record);
    props.setProperty(key,text);return props.getProperty(key)===text;
  } catch(e) { return false; }
}
function beautyHubAttentionRead_(data) {
  beautyHubTestGuard_();
  const date=data.eventDate,answer={available:true,eventDate:date,items:[],checkedAt:null,complete:false};
  if(!/^20\d\d-\d\d-\d\d$/.test(date||''))return {...answer,available:false};
  try {
    const props=PropertiesService.getScriptProperties(),prefix='BEAUTY_TEST_ATTENTION_'+date+'_';
    const all=props.getProperties();
    for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))){
      const r=JSON.parse(all[key]);
      if(r.date!==date||typeof r.name!=='string'||!r.name||r.name.length>120||!['CLEAR','ATTENTION'].includes(r.state)||typeof r.code!=='string'||!/^[A-Z_]{1,60}$/.test(r.code))throw Error('record');
      if(r.state==='ATTENTION')answer.items.push({name:r.name,code:r.code});
    }
    const raw=props.getProperty('BEAUTY_TEST_ATTENTION_CHECK_'+date);
    if(raw){const meta=JSON.parse(raw);answer.checkedAt=meta.checkedAt;answer.complete=meta.signature===beautyHubTransferHash_((data.players||[]).map(p=>({name:p.player||p.newPlayer,status:p.status})));}
    answer.items.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
    return answer;
  }catch(e){return {...answer,available:false,complete:false};}
}
function beautyHubAttentionRefresh_(input) {
  beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Unexpected attention input.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {success:false,code:'BUSY',message:'Another operation is running. The saved attention list is retained.'};
  try {
    const date=beautyHubNakkaDate_().date,hub=beautyHubNakkaHubRows_(),props=PropertiesService.getScriptProperties();
    const match=beautyHubNakkaEvent_({});
    if(match.status!=='MATCHED'||match.event?.id!==BEAUTY_HUB_NAKKA_TEST_EVENT_||match.event?.title!=='Beauty Hub TEST — DO NOT USE LIVE'||match.eventDate!==date)throw Error('target');
    const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
    if(!user||!password)throw Error('credentials');
    const auth='Basic '+Utilities.base64Encode(user+':'+password);
    const event=beautyHubTransferFetch_('tournament/get?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_+'&entry=0',auth).tournament;
    if(!event||event.tdid!==BEAUTY_HUB_NAKKA_TEST_EVENT_||event.lgid!=='lg_tM2v_3523'||event.title!==match.event.title||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('target');
    const entries=beautyHubTransferEntries_(beautyHubTransferFetch_('tournament/entry/list?tdid='+BEAUTY_HUB_NAKKA_TEST_EVENT_,auth));
    const league=beautyHubTransferFetch_('league/entry/list?lgid=lg_tM2v_3523&count=1000',auth).list;
    if(!Array.isArray(league)||league.length>=1000)throw Error('league');
    const ids=new Set();
    for(const r of league){if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>120||typeof r.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(r.lpid)||ids.has(r.lpid))throw Error('league');ids.add(r.lpid);}
    const normalize=n=>n.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
    // Include retained issues even if their Hub status has since become OUT.
    const retained=beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))});
    if(!retained.available)throw Error('record');
    const names=new Map(hub.filter(p=>p.status==='IN').map(p=>[normalize(p.name),p.name]));
    for(const item of retained.items)names.set(normalize(item.name),item.name);
    const decisions=[];
    for(const [key,name]of names){
      const h=hub.filter(p=>normalize(p.name)===key),l=league.filter(p=>normalize(p.name)===key),e=entries.filter(p=>normalize(p.name)===key||(l.length===1&&p.lpid===l[0].lpid));
      let code='';
      if(h.length!==1)code='HUB_IDENTITY_REVIEW';
      else if(l.length!==1)code='LEAGUE_IDENTITY_REVIEW';
      else if(e.length!==1)code=e.length?'IDENTITY_CONFLICT':'MISSING_EVENT_ENTRY';
      else if(normalize(e[0].name)!==key||(e[0].lpid&&e[0].lpid!==l[0].lpid))code='IDENTITY_CONFLICT';
      if(!code){
        const creation=props.getProperty('BEAUTY_NAKKA_LEAGUE_CREATE_lg_tM2v_3523_'+beautyHubTransferHash_(key));
        if(creation){const c=JSON.parse(creation);if(c.state!=='VERIFIED'||c.name!==name||c.lpid!==l[0].lpid)code='LEAGUE_CREATION_REVIEW_REQUIRED';}
        const transfer=props.getProperty('BEAUTY_NAKKA_TRANSFER_'+BEAUTY_HUB_NAKKA_TEST_EVENT_+'_'+l[0].lpid);
        if(transfer){
          const t=JSON.parse(transfer);
          if(t.event?.id!==BEAUTY_HUB_NAKKA_TEST_EVENT_||t.event?.date!==date||t.identity?.name!==name||t.identity?.lpid!==l[0].lpid)code='TRANSFER_REVIEW_REQUIRED';
          else if(t.state==='ATTEMPTED'){
            if(!Number.isInteger(t.beforeCount)||entries.length!==t.beforeCount+1||beautyHubTransferHash_(entries.filter(r=>r.tpid!==e[0].tpid))!==t.beforeHash)code='TRANSFER_REVIEW_REQUIRED';
          }else if(!['VERIFIED','ENTRY_VERIFIED_LINK_UNEXPOSED'].includes(t.state)||t.tpid!==e[0].tpid)code='TRANSFER_REVIEW_REQUIRED';
        }
      }
      if(retained.items.some(item=>normalize(item.name)===key&&['REMOVE_UNCERTAIN','REMOVE_REVIEW_REQUIRED'].includes(item.code)))code='REMOVE_REVIEW_REQUIRED';
      decisions.push({name,code});
    }
    beautyHubAuthRequire_(beautyHubRequestToken_);
    if(beautyHubNakkaDate_().date!==date||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub))throw Error('stale');
    for(const d of decisions)if(!beautyHubAttentionRemember_(d.name,date,d.code?{code:d.code}:{entryConfirmed:true}))throw Error('save');
    const meta={checkedAt:new Date().toISOString(),signature:beautyHubTransferHash_(hub)};
    props.setProperty('BEAUTY_TEST_ATTENTION_CHECK_'+date,JSON.stringify(meta));
    return {success:true,attention:beautyHubAttentionRead_({eventDate:date,players:hub.map(p=>({player:p.name,status:p.status}))})};
  }catch(e){
    if(e.name==='HubAuthError')return {success:false,code:'AUTH_REQUIRED',message:'Sign in to continue.'};
    return {success:false,code:'CHECK_UNAVAILABLE',message:'The player check could not be completed. Saved alerts are retained. Check the event date and Nakka; no players were added.'};
  }finally{lock.releaseLock();}
}
