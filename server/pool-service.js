/* Staff-only, fixed Identity TEST. No entry additions/deletions. Explicit audited TEST event start only.
 * API contract: https://push.n01darts.com/api/v1/n01_api_manual_en.html
 * Planning previews expire after30 minutes; final approvals after five minutes. A provider write is never retried.
 */
function beautyPoolError_(message){const e=Error(message);e.name='BeautyPoolError';throw e;}
function beautyPoolKey_(s){return s.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
function beautyPoolCopy_(v){return JSON.parse(JSON.stringify(v));}
function beautyPoolHash_(v){const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;return beautyHubTransferHash_(canonical(v));}
function beautyPoolEqual_(a,b){return beautyPoolHash_(a)===beautyPoolHash_(b);}
function beautyPoolAuth_(){
  const p=PropertiesService.getScriptProperties(),u=p.getProperty('N01_API_USER'),s=p.getProperty('N01_API_PASSWORD');
  if(!u||!s)beautyPoolError_('Nakka credentials are unavailable.');
  return 'Basic '+Utilities.base64Encode(u+':'+s);
}
function beautyPoolProfiles_(auth){
  // league/entry/list returns the full list; it is not a paginated list API.
  const page=beautyHubTransferFetch_('league/entry/list?lgid=lg_tM2v_3523',auth).list;
  if(!Array.isArray(page)||page.length>=1000)beautyPoolError_('League identity list is invalid or exceeds the supported limit.');
  const ids=new Set(),all=[];
  for(const p of page){
    if(!p||typeof p.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(p.lpid)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||/[\x00-\x1f\x7f]/.test(p.name)||ids.has(p.lpid))beautyPoolError_('Ambiguous league identity list.');
    ids.add(p.lpid);all.push({lpid:p.lpid,name:p.name});
  }
  return all.sort((a,b)=>a.lpid<b.lpid?-1:1);
}
function beautyPoolNormalizeStats_(profiles,stats,ranking){
  if(!stats||typeof stats!=='object'||Array.isArray(stats)||!ranking||typeof ranking!=='object'||Array.isArray(ranking))beautyPoolError_('Unsupported statistics data.');
  return profiles.map(p=>{
    const s=stats[p.lpid],rank=ranking[p.lpid];let average=null,reason='No recorded darts',points=null;
    if(s){
      if(!Number.isFinite(s.score)||s.score<0||!Number.isFinite(s.darts)||s.darts<0||!Number.isFinite(s.a)||!Number.isFinite(s.acnt))beautyPoolError_('Unsupported score totals.');
      if(s.a!==0||s.acnt!==0)reason='Manual average needs source review';
      else if(s.darts>0){average=3*s.score/s.darts;if(average>180)beautyPoolError_('Invalid three-dart average.');reason='';}
    }
    if(rank){
      const values=Object.values(rank);if(values.some(v=>!v||!Number.isFinite(v.pt)))beautyPoolError_('Unsupported ranking points.');
      points=values.reduce((sum,v)=>sum+v.pt,0);
      if(s&&(!Number.isFinite(s.pt)||s.pt!==points))beautyPoolError_('Ranking points and aggregate totals disagree.');
    }
    return {lpid:p.lpid,name:p.name,average,points,reason};
  });
}
// Chunked last-good value: write new shards, publish the pointer last. Never
// replace last-good data with an error or a partial provider response.
function beautyPoolLastGood_(value){
  const p=PropertiesService.getScriptProperties(),pointer='BEAUTY_LEAGUE_STATS_CURRENT';
  if(value){
    const old=JSON.parse(p.getProperty(pointer)||'null'),id=Utilities.getUuid().replace(/-/g,''),text=JSON.stringify(value),n=Math.ceil(text.length/1800);
    if(n>100)beautyPoolError_('Statistics snapshot too large.');
    for(let i=0;i<n;i++)p.setProperty('BEAUTY_LEAGUE_STATS_'+id+'_'+i,text.slice(i*1800,(i+1)*1800));
    p.setProperty(pointer,JSON.stringify({id,n}));
    if(old)for(let i=0;i<old.n;i++)p.deleteProperty('BEAUTY_LEAGUE_STATS_'+old.id+'_'+i);
    return value;
  }
  try{const old=JSON.parse(p.getProperty(pointer)||'null');if(!old||old.n>100)return null;let text='';for(let i=0;i<old.n;i++){const s=p.getProperty('BEAUTY_LEAGUE_STATS_'+old.id+'_'+i);if(s===null)return null;text+=s;}return JSON.parse(text);}catch(e){return null;}
}
function beautyPoolStats_(auth,force){
  const p=PropertiesService.getScriptProperties(),now=Date.now(),last=beautyPoolLastGood_();
  const failed=Number(p.getProperty('BEAUTY_LEAGUE_STATS_FAILED')||0);
  if(last&&!force&&now-Date.parse(last.fetchedAt)<300000&&failed<=Date.parse(last.fetchedAt))return {...last,fresh:true};
  const attempt=Number(p.getProperty('BEAUTY_LEAGUE_STATS_ATTEMPT')||0);
  if(now-attempt<60000)return last?{...last,fresh:now-Date.parse(last.fetchedAt)<300000&&failed<=Date.parse(last.fetchedAt),message:'Refresh is limited to once per minute.'}:{fresh:false,profiles:[],message:'Wait one minute before refreshing.'};
  p.setProperty('BEAUTY_LEAGUE_STATS_ATTEMPT',String(now));
  try{
    const league=beautyHubTransferFetch_('league/get?lgid=lg_tM2v_3523',auth).league;
    if(league?.lgid!=='lg_tM2v_3523'||typeof league.title!=='string')throw Error('league');
    const profiles=beautyPoolProfiles_(auth),stats=beautyHubTransferFetch_('league/stats?lgid=lg_tM2v_3523&kind=stats_list',auth).stats,
      ranking=beautyHubTransferFetch_('league/stats?lgid=lg_tM2v_3523&kind=rank_list',auth).stats;
    const qualified=beautyPoolNormalizeStats_(profiles,stats,ranking);p.deleteProperty('BEAUTY_LEAGUE_STATS_FAILED');
    return {...beautyPoolLastGood_({leagueId:league.lgid,title:league.title,fetchedAt:new Date().toISOString(),method:'3 × total score / total darts; full precision for seeding, 2 decimals for display',profiles:qualified}),fresh:true};
  }catch(e){p.setProperty('BEAUTY_LEAGUE_STATS_FAILED',String(Date.now()));return last?{...last,fresh:false,message:'Statistics unavailable. Last successful values retained; new draws and sending are blocked.'}:{fresh:false,profiles:[],message:'Statistics unavailable. No averages have been invented.'};}
}
function beautyPoolRoster_(){
  const data=getBeautyHubData_();if(data?.success!==true||!Array.isArray(data.players))beautyPoolError_('Hub roster unavailable.');
  const seen=new Set(),rows=data.players.map(p=>{
    const name=p.player||p.newPlayer;if(typeof name!=='string'||!name.trim()||!['IN','OUT','STANDBY'].includes(p.status)||seen.has(beautyPoolKey_(name)))beautyPoolError_('Hub names or statuses need review.');
    seen.add(beautyPoolKey_(name));return {id:beautyPoolHash_([data.eventDate,name]),name,status:p.status,average:null};
  });
  return {date:data.eventDate,rows,signature:BeautyPoolSeeding.rosterSignature(rows)};
}
// Native Round Robin and Fixtures use separate provider settings and tables.
function beautyPoolMode_(t){
  const rr=t.rr_setting?.round_robin===1,lg=t.lg_setting?.league===1;
  if(rr===lg)beautyPoolError_('Enable exactly one supported group format: Round Robin or Fixtures (League).');
  return rr?'rr':'lg';
}
function beautyPoolGroupSet_(event,setting,table){
  const mode=beautyPoolMode_(event),set={[mode+'_setting']:setting,[mode+'_table']:table};
  // Provider requires clearing placement-dependent state alongside a new RR table.
  if(mode==='rr')for(const k of ['rr_seq','rr_order','rr_board','rr_disable'])set[k]=[];
  return set;
}
function beautyPoolEvent_(auth,allowStarted=false){
  const t=beautyHubTransferFetch_('tournament/get?tdid=t_QHaG_7792',auth).tournament;
  if(!t||t.tdid!=='t_QHaG_7792'||t.lgid!=='lg_tM2v_3523'||t.title!=='Beauty Registration TEST event DO NOT USE LIVE'||!(allowStarted?[10,20,25,30]:[10,20,25]).includes(t.status)||!Number.isFinite(t.updateTime)||!Number.isFinite(t.t_date)||t.league!==1||t.team_games!==0)beautyPoolError_('Only the selected pre-start Beauty Registration TEST singles event is supported.');
  const mode=beautyPoolMode_(t),setting=t[mode+'_setting'];
  if(setting.match_type!=='01'||(setting.turnaround??0)!==0||(setting.swiss??0)!==0)beautyPoolError_('Only single Round Robin or non-Swiss Fixtures groups using 01 are supported.');
  const date=Utilities.formatDate(new Date(t.t_date*1000),'Europe/Berlin','yyyy-MM-dd');
  if(date!==beautyPoolRoster_().date||date!==beautyHubNakkaDate_().date)beautyPoolError_('Hub date and TEST event differ.');
  return t;
}
function beautyPoolSchedule_(auth,event){
  if(event&&beautyPoolMode_(event)==='rr')return [];
  const r=beautyHubTransferFetch_('league/schedule/get?tdid=t_QHaG_7792',auth);
  if(r.tdid!=='t_QHaG_7792'||r.swiss!==0||!Array.isArray(r.schedule))beautyPoolError_('Unsupported match-card response.');
  return r.schedule;
}
function beautyPoolEmpty_(v){return v==null||v===''||Array.isArray(v)&&v.every(beautyPoolEmpty_)||typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(beautyPoolEmpty_);}
function beautyPoolBlankEvent_(t,schedule){
  if(!beautyPoolEmpty_(schedule))beautyPoolError_('Existing match cards need manual review. Nothing will be overwritten.');
  for(const k of Object.keys(t))if(/_(table|result|rank)$/.test(k)&&!beautyPoolEmpty_(t[k]))beautyPoolError_('Existing groups, brackets or results need manual review. Nothing will be overwritten.');
}
function beautyPoolEntries_(t){return beautyHubTransferEntries_({list:t.entry_list});}
function beautyPoolMappings_(roster,stats,entries,bindings){
  const active=roster.rows.filter(p=>p.status==='IN');
  if(bindings&&(!Array.isArray(bindings)||bindings.length!==active.length))beautyPoolError_('Review every IN player mapping.');
  const usedLeague=new Set(),usedEvent=new Set();
  return active.map(p=>{
    const league=stats.profiles.filter(q=>beautyPoolKey_(q.name)===beautyPoolKey_(p.name)),event=entries.filter(q=>beautyPoolKey_(q.name)===beautyPoolKey_(p.name));
    const b=bindings?bindings.find(q=>q.id===p.id):{lpid:league.length===1?league[0].lpid:'',tpid:event.length===1?event[0].tpid:''};
    if(!b||Object.keys(b).some(k=>!['id','lpid','tpid'].includes(k))||typeof b.lpid!=='string'||typeof b.tpid!=='string')beautyPoolError_('Invalid mapping.');
    const profile=league.find(q=>q.lpid===b.lpid),entry=event.find(q=>q.tpid===b.tpid);
    if(b.lpid&&(!profile||usedLeague.has(b.lpid))||b.tpid&&(!entry||usedEvent.has(b.tpid))||entry?.lpid&&entry.lpid!==b.lpid)beautyPoolError_('Conflicting or repeated identity mapping.');
    if(b.lpid)usedLeague.add(b.lpid);if(b.tpid)usedEvent.add(b.tpid);
    return {...p,lpid:b.lpid,tpid:b.tpid,average:profile?.average??null,reason:profile?.reason||(!profile?'League identity unresolved':''),leagueCandidates:league,eventCandidates:event,linkExposed:!!entry?.lpid};
  });
}
// Event format is frozen into final approval; no provider write during preview.
function beautyPoolFormat_(event,draw,mode){
  if(mode==='preserve')return null;
  if(!['top2-rest','top2-bottom2'].includes(mode))beautyPoolError_('Choose a supported competition format.');
  if(event.d_setting?.tournament===1||event.m_setting?.matchs===1)beautyPoolError_('This format requires a singles event without another enabled format.');
  const counts=draw.pools.map(p=>p.players.length);
  if(!counts.length||counts.some(n=>![3,4,5].includes(n)))beautyPoolError_('Format supports groups of three, four or five.');
  if(mode==='top2-bottom2'&&counts.some(n=>n!==4))beautyPoolError_('Top two and bottom two requires four-player groups. Choose top two and all remaining players for mixed groups.');
  const totalA=counts.length*2,totalB=counts.reduce((s,n)=>s+n-2,0);
  if(totalA<2||totalB<2)beautyPoolError_('Each knockout needs at least two qualifiers. Review this small-event format separately.');
  const bracket=n=>{let size=2;while(size<n)size*=2;if(size>1024)beautyPoolError_('Knockout exceeds supported size.');return {size,table:Array.from({length:Math.log2(size)+1},(_,i)=>Array(size/2**i).fill(''))};};
  const settings=old=>{
    const setting=beautyPoolCopy_(old&&Object.keys(old).length?old:event[beautyPoolMode_(event)+'_setting']);
    if(![1,2,3].includes(setting.limit)||(Object.prototype.hasOwnProperty.call(setting,'drawMode')&&![0,1].includes(setting.drawMode)))beautyPoolError_('Review the existing match format before configuring knockouts.');
    if(setting.limit===1&&(!Number.isInteger(setting.limit_leg_count)||setting.limit_leg_count<1)||setting.limit===2&&(!Number.isInteger(setting.limit_set_count)||setting.limit_set_count<1||!Number.isInteger(setting.limit_set_leg_count)||setting.limit_set_leg_count<1)||setting.limit===3&&(!Array.isArray(setting.schedule)||!setting.schedule.length))beautyPoolError_('Knockout legs, sets or match schedule are incomplete.');
    return {...setting,tournament:1};
  };
  const a=bracket(totalA),b=bracket(totalB),assignment={};
  for(const prefix of ['t','s2']){
    assignment[prefix+'_type']=prefix==='t'?'top':'custom';assignment[prefix+'_count']=2;
    assignment[prefix+'_placeholder']=false;assignment[prefix+'_complete']=true;assignment[prefix+'_referee']=false;assignment[prefix+'_referee_type']='lowest';
    assignment[prefix+'_custom']=Object.fromEntries([3,4,5].map(n=>[String(n),{type:prefix==='t'?'top':'low',count:prefix==='t'?2:n-2}]));
  }
  const set={t_setting:{...settings(event.t_setting),t_player_count:a.size},s2_setting:{...settings(event.s2_setting),t_player_count:b.size},t_table:a.table,s2_table:b.table};
  if(set.t_setting.t3===1)set.t3_table=[['',''],['']];
  if(set.s2_setting.t3===1)set.s2_3_table=[['',''],['']];
  return {mode,groups:counts.length,groupSizes:counts,stage1:{qualifiers:totalA,slots:a.size,byes:a.size-totalA},stage2:{qualifiers:totalB,slots:b.size,byes:b.size-totalB},assignment,set};
}

// Nakka stores top-level qualifier counts as decimal strings on native events.
// Normalize only this documented numeric field; all rules and flags stay exact.
function beautyPoolAssignment_(value){
  const v=beautyPoolCopy_(value);
  if(v&&typeof v==='object')for(const key of ['t_count','s2_count'])if(typeof v[key]==='string'&&/^[1-9][0-9]?$/.test(v[key]))v[key]=Number(v[key]);
  return v;
}
function beautyPoolProjection_(t){const v=beautyPoolCopy_(t);delete v.updateTime;return v;}
function beautyPoolVerify_(before,after,setting,table,format,assigned){
  const expected=beautyPoolProjection_(before);Object.assign(expected,beautyPoolGroupSet_(before,setting,table));if(format){Object.assign(expected,format.set);if(assigned)expected.assign_setting=format.assignment;}
  const actual=beautyPoolProjection_(after);
  if(format&&assigned){expected.assign_setting=beautyPoolAssignment_(expected.assign_setting);actual.assign_setting=beautyPoolAssignment_(actual.assign_setting);}
  if(!beautyPoolEqual_(expected,actual))beautyPoolError_('Event readback differs from the approved change.');
}
function beautyPoolVerifyCards_(table,schedule){
  if(!Array.isArray(schedule)||schedule.length!==table.length)beautyPoolError_('Incomplete division match cards.');
  const allIds=new Set();
  table.forEach((slots,i)=>{
    const players=slots.filter(Boolean),expected=new Set();for(let a=0;a<players.length;a++)for(let b=a+1;b<players.length;b++)expected.add([players[a],players[b]].sort().join(':'));
    if(!Array.isArray(schedule[i])||schedule[i].length!==expected.size)beautyPoolError_('Wrong match-card count.');
    for(const card of schedule[i]){
      if(!card||!Array.isArray(card.p)||card.p.length!==2||!/^[a-z0-9]{4}$/.test(card.lsid)||allIds.has(i+':'+card.lsid)||card.t!==''||(card.r!=null&&(!Number.isInteger(card.r)||card.r<1||card.r>1024)))beautyPoolError_('Unsupported match card.');
      allIds.add(i+':'+card.lsid);const pair=card.p.slice().sort().join(':');if(!expected.delete(pair))beautyPoolError_('Repeated or unexpected match pairing.');
    }
    if(expected.size)beautyPoolError_('Missing match pairing.');
  });return true;
}
function beautyPoolAudit_(value){
  const ss=SpreadsheetApp.openById(SHEET_ID);if(ss.getId()!==SHEET_ID)beautyPoolError_('Audit identity mismatch.');
  const name='POOL-'+Utilities.getUuid().replace(/-/g,'').slice(0,20),sheet=ss.insertSheet(name),text=JSON.stringify(value);
  const rows=[['Beauty TEST pool audit',new Date().toISOString()]];for(let i=0;i<text.length;i+=30000)rows.push(['JSON '+(i/30000+1),text.slice(i,i+30000)]);
  sheet.getRange(1,1,rows.length,2).setValues(rows);SpreadsheetApp.flush();
  if(!beautyPoolEqual_(sheet.getRange(1,1,rows.length,2).getValues(),rows))beautyPoolError_('Pool recovery snapshot could not be verified.');return name;
}
function beautyHubPool_(action,input){
  beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another TEST operation is running. Wait before reviewing.'};
  let attempted=false,journalKey='BEAUTY_POOL_SEND_t_QHaG_7792',audit='',journal;
  const props=PropertiesService.getScriptProperties();
  try{
    const account=beautyHubAuthRequire_(beautyHubRequestToken_);if(!account.uid)throw Error('auth');
    const session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_),auth=beautyPoolAuth_(),cache=CacheService.getScriptCache();
    if(['poolcontrol','poolqualifyprepare','poolqualifysave'].includes(action))return beautyTournamentControl_(action,input,account,session,auth,cache);
    if(['poolstartprepare','poolstart','poolboardplan'].includes(action))return beautyPoolStart_(action,input,account,session,auth,cache);
    const fields={poolload:['refresh'],pooldraw:['bindings','reviewed','sizes'],pooladjust:['change','ticket'],poolprepare:['ticket'],poolsave:['confirmed','ticket']}[action];
    if(action==='poolprepare'&&Object.prototype.hasOwnProperty.call(input||{},'format'))fields.push('format');
    if(action==='poolprepare'&&Object.prototype.hasOwnProperty.call(input||{},'boardPlan'))fields.push('boardPlan');
    if(!fields||!input||Object.keys(input).sort().join(',')!==fields.sort().join(',')||Object.values(input).some(v=>typeof v!=='string'||v.length>40000)||input.sizes?.length>400||input.change?.length>1000)beautyPoolError_('Invalid Pool Planner request.');
    const ticketRead=()=>{if(!/^[a-f0-9]{32}$/.test(input.ticket))beautyPoolError_('Expired pool preview.');const r=JSON.parse(cache.get('beauty-pool:'+input.ticket)||'null');if(!r||r.uid!==account.uid||r.session!==session||Date.now()>=r.expires)beautyPoolError_('Expired pool preview.');return r;};
    const ticketWrite=r=>{const ticket=Utilities.getUuid().replace(/-/g,'');r.uid=account.uid;r.session=session;const lifetime=r.ready===true?300:1800;r.expires=Date.now()+lifetime*1000;const text=JSON.stringify(r);if(text.length>90000)beautyPoolError_('Draw too large.');cache.put('beauty-pool:'+ticket,text,lifetime);return ticket;};
    if(action==='poolload'||action==='pooldraw'){
      if(action==='poolload'&&!['true','false'].includes(input.refresh))beautyPoolError_('Invalid refresh.');
      if(props.getProperty(journalKey)){
        if(action!=='poolload')beautyPoolError_('Pools were already sent. Load the saved competition to continue to Start.');
        const workflow=beautyPoolWorkflow_(auth);return {success:true,workflow,event:workflow.event,mappings:[],stats:null};
      }
      const stats=beautyPoolStats_(auth,action==='poolload'&&input.refresh==='true'),roster=beautyPoolRoster_(),event=beautyPoolEvent_(auth),entries=beautyPoolEntries_(event);
      const bindings=action==='pooldraw'?JSON.parse(input.bindings):null,mappings=beautyPoolMappings_(roster,stats,entries,bindings);
      if(action==='poolload')return {success:true,stats,roster,mappings,event:{id:event.tdid,title:event.title,date:roster.date},formatPreset:props.getProperty('BEAUTY_POOL_FORMAT_PRESET')||'top2-rest',journal:props.getProperty(journalKey)?'A previous pool send is recorded. Sending again is blocked.':''};
      if(!stats.fresh||Date.now()-Date.parse(stats.fetchedAt)>=300000)beautyPoolError_('Fresh statistics required. Refresh and review again.');
      if(input.reviewed!=='true')beautyPoolError_('Review the league and event identities before drawing.');
      const draw=BeautyPoolSeeding.draw({players:mappings,sizes:JSON.parse(input.sizes),seed:parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16),eventDate:roster.date,frozenAt:new Date().toISOString(),source:{leagueId:stats.leagueId,fetchedAt:stats.fetchedAt}});
      const frozen={draw,mappings:mappings.map(p=>({id:p.id,name:p.name,lpid:p.lpid,tpid:p.tpid,linkExposed:p.linkExposed})),rosterSignature:roster.signature,date:roster.date,eventHash:beautyPoolHash_(event),statsHash:beautyPoolHash_(stats.profiles)};
      return {success:true,draw,ticket:ticketWrite(frozen),mappings:frozen.mappings};
    }
    const frozen=ticketRead(),roster=beautyPoolRoster_();
    if(roster.signature!==frozen.rosterSignature||roster.date!==frozen.date)beautyPoolError_('The IN roster or event date changed. Generate and review a new draw.');
    if(action==='pooladjust'){
      const adjusted=BeautyPoolSeeding.adjust(frozen.draw,JSON.parse(input.change));cache.remove('beauty-pool:'+input.ticket);
      return {success:true,draw:adjusted,ticket:ticketWrite({...frozen,draw:adjusted,ready:false}),mappings:frozen.mappings};
    }
    if(props.getProperty(journalKey))beautyPoolError_('A previous pool send is recorded. Inspect its audit; sending again is blocked.');
    const event=beautyPoolEvent_(auth),schedule=beautyPoolSchedule_(auth,event);beautyPoolBlankEvent_(event,schedule);
    if(beautyPoolHash_(event)!==frozen.eventHash)beautyPoolError_('Nakka event changed since the draw. Generate and review a new draw.');
    const stats=beautyPoolStats_(auth,false);if(!stats.fresh||Date.now()-Date.parse(stats.fetchedAt)>=300000||beautyPoolHash_(stats.profiles)!==frozen.statsHash)beautyPoolError_('Statistics changed or expired. Generate a new draw.');
    const liveProfiles=beautyPoolProfiles_(auth);if(!beautyPoolEqual_(liveProfiles,stats.profiles.map(p=>({lpid:p.lpid,name:p.name}))))beautyPoolError_('League identities changed. Reload statistics and review a new draw.');
    const mappings=beautyPoolMappings_(roster,stats,beautyPoolEntries_(event),frozen.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid})));
    if(mappings.some(p=>!p.lpid||!p.tpid))beautyPoolError_('Every IN player needs a reviewed league identity and existing event entry before sending. Resolve the listed missing entries in Nakka, then draw again.');
    BeautyPoolSeeding.check(frozen.draw);
    const assigned=new Set(mappings.map(p=>p.tpid)),unassignedEntries=beautyPoolEntries_(event).filter(p=>!assigned.has(p.tpid)).map(p=>({tpid:p.tpid,name:p.name}));
    const max=Math.max(...frozen.draw.pools.map(g=>g.capacity)),table=frozen.draw.pools.map(g=>{const a=g.players.map(p=>mappings.find(m=>m.id===p.id).tpid);while(a.length<max)a.push('');return a;}),setting={...event[beautyPoolMode_(event)+'_setting'],robin_count:table.length,robin_player_count:max};
    const formatMode=action==='poolprepare'?(input.format||'preserve'):(frozen.formatMode||'preserve'),format=beautyPoolFormat_(event,frozen.draw,formatMode);
    const boardPlan=action==='poolprepare'&&input.boardPlan?beautyPoolBoardPlan_(frozen.draw,JSON.parse(input.boardPlan)):(frozen.boardPlan||null);
    const version=beautyPoolHash_({event,schedule,rosterSignature:roster.signature,table,setting,...(format?{format}: {}),...(boardPlan?{boardPlan}:{})});
    if(action==='poolprepare'){
      cache.remove('beauty-pool:'+input.ticket);
      return {success:true,groupMode:beautyPoolMode_(event),unassignedEntries,ticket:ticketWrite({...frozen,ready:true,version,formatMode,boardPlan}),table,setting,format,boardPlan,warnings:BeautyPoolSeeding.warnings(frozen.draw),event:{id:event.tdid,title:event.title,date:roster.date},expectedCards:table.reduce((s,g)=>s+g.filter(Boolean).length*(g.filter(Boolean).length-1)/2,0)};
    }
    if(unassignedEntries.length&&(typeof BEAUTY_POOL_UNASSIGNED_ENTRIES_VERIFIED_==='undefined'||BEAUTY_POOL_UNASSIGNED_ENTRIES_VERIFIED_!==true))beautyPoolError_('Unassigned Nakka entries need review. Compatibility with excluded OUT/STANDBY entries has not yet been verified in TEST. Resolve event registrations explicitly before sending; no automatic removal.');
    cache.remove('beauty-pool:'+input.ticket); // Consume save ticket before any external mutation.
    if(input.confirmed!=='true'||!frozen.ready||frozen.version!==version||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyPoolError_('Approved preview missing or stale. Nothing was sent.');
    // Re-authenticate and re-read the roster immediately before durable audit.
    beautyHubAuthRequire_(beautyHubRequestToken_);if(beautyPoolRoster_().signature!==roster.signature||beautyHubNakkaDate_().date!==roster.date)beautyPoolError_('Roster changed before sending.');
    audit=beautyPoolAudit_({kind:'POOL_SEND_BEFORE',uid:account.uid,draw:frozen.draw,mappings:frozen.mappings,event:beautyPoolProjection_(event),schedule,table,setting,format,version,...(boardPlan?{boardPlan}:{})});
    journal={state:'ATTEMPTED',uid:account.uid,recordedUTC:new Date().toISOString(),audit,version,drawHash:beautyPoolHash_(frozen.draw)};
    props.setProperty(journalKey,JSON.stringify(journal));if(props.getProperty(journalKey)!==JSON.stringify(journal))beautyPoolError_('Pool journal could not be saved.');
    attempted=true;
    beautyHubTransferFetch_('tournament/update',auth,{tdid:'t_QHaG_7792',expect_update_time:event.updateTime,set:{...beautyPoolGroupSet_(event,setting,table),...(format?.set||{})}});
    const groups=beautyPoolEvent_(auth);beautyPoolVerify_(event,groups,setting,table,format);
    if(format){
      const assigned=beautyHubTransferFetch_('tournament/assign/update',auth,{tdid:'t_QHaG_7792',assign:format.assignment});
      if(!beautyPoolEqual_(beautyPoolAssignment_(assigned.assign_setting),format.assignment))beautyPoolError_('Nakka qualification rules did not match approval.');
      beautyPoolVerify_(event,beautyPoolEvent_(auth),setting,table,format,true);
    }
    if(beautyPoolMode_(event)==='lg'){
      if(!beautyPoolEmpty_(beautyPoolSchedule_(auth,event)))beautyPoolError_('Match cards changed during sending.');
      beautyHubTransferFetch_('league/schedule/generate',auth,{tdid:'t_QHaG_7792',mode:'robin'});
    }
    const after=beautyPoolEvent_(auth),cards=beautyPoolSchedule_(auth,after);beautyPoolVerify_(event,after,setting,table,format,!!format);
    if(beautyPoolMode_(event)==='lg')beautyPoolVerifyCards_(table,cards);
    const receipt=beautyPoolAudit_({kind:'POOL_SEND_READBACK',uid:account.uid,drawHash:journal.drawHash,event:beautyPoolProjection_(after),schedule:cards,beforeAudit:audit});
    journal={...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString(),receipt,readbackHash:beautyPoolHash_({event:beautyPoolProjection_(after),cards})};props.setProperty(journalKey,JSON.stringify(journal));
    if(format)try{props.setProperty('BEAUTY_POOL_FORMAT_PRESET',format.mode);}catch(e){}
    return {success:true,readbackVerified:true,audit,receipt,format,message:(format?'TEST knockout format and qualifier rules verified. ':'')+(beautyPoolMode_(event)==='rr'?'Native Round Robin groups and placement-state readback verified. ':'TEST groups and every round-robin match pairing verified. ')+'Entries and other event settings preserved. Event remains pre-start.'};
  }catch(e){
    return {success:false,error:attempted?'The send may be partially saved. Do not retry. Inspect TEST groups, match cards and the audit before any further change.':(e.name==='BeautyPoolError'?e.message:'Pool Planner could not be checked. Nothing was sent.'),...(audit?{audit}:{}),uncertain:attempted};
  }finally{lock.releaseLock();}
}

/* Private, owner-run Apps Script editor reconciliation. No provider mutations.
 * Only an existing ATTEMPTED native RR send can become VERIFIED, after exact
 * comparison against its original approved audit. Never clears the send lock.
 * Trailing underscore prevents google.script.run access from a web page. */
function beautyPoolReconcileAttempt_(){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))beautyPoolError_('Another TEST operation is running.');
 try{
  const props=PropertiesService.getScriptProperties(),key='BEAUTY_POOL_SEND_t_QHaG_7792',journal=JSON.parse(props.getProperty(key)||'null');
  if(journal?.state!=='ATTEMPTED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit))beautyPoolError_('No attempted TEST send is available for this read-only check.');
  const ss=SpreadsheetApp.openById(SHEET_ID);if(ss.getId()!==SHEET_ID)beautyPoolError_('Audit identity mismatch.');
  const sheet=ss.getSheetByName(journal.audit);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Original approval audit is unavailable.');
  const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')beautyPoolError_('Original approval audit is invalid.');
  const before=JSON.parse(rows.slice(1).map(r=>r[1]).join(''));
  if(before.kind!=='POOL_SEND_BEFORE'||before.uid!==journal.uid||before.version!==journal.version||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!=='t_QHaG_7792'||beautyPoolMode_(before.event)!=='rr'||!before.format)beautyPoolError_('Original approval does not match the attempted native Round Robin send.');
  BeautyPoolSeeding.check(before.draw);
  if(!beautyPoolEqual_(beautyPoolFormat_(before.event,before.draw,before.format.mode),before.format))beautyPoolError_('Original competition format differs from approval.');
  const roster=beautyPoolRoster_();if(roster.date!==before.draw.eventDate||roster.signature!==BeautyPoolSeeding.rosterSignature(before.draw.roster))beautyPoolError_('Roster or date changed after the attempted send.');
  const auth=beautyPoolAuth_(),current=beautyPoolEvent_(auth);
  beautyPoolVerify_(before.event,current,before.setting,before.table,before.format,true);
  const receipt=beautyPoolAudit_({kind:'POOL_SEND_READBACK',uid:journal.uid,drawHash:journal.drawHash,event:beautyPoolProjection_(current),schedule:[],beforeAudit:journal.audit,reconciled:true});
  // Re-read after receipt creation so an intervening provider edit cannot be marked verified.
  const checked=beautyPoolEvent_(auth);if(!beautyPoolEqual_(current,checked))beautyPoolError_('TEST event changed during readback. Attempt lock retained.');
  const saved={...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString(),receipt,readbackHash:beautyPoolHash_({event:beautyPoolProjection_(checked),cards:[]}),reconciled:true};
  props.setProperty(key,JSON.stringify(saved));
  if(props.getProperty(key)!==JSON.stringify(saved))beautyPoolError_('Verification journal could not be confirmed.');
  try{props.setProperty('BEAUTY_POOL_FORMAT_PRESET',before.format.mode);}catch(e){}
  const result={success:true,readbackVerified:true,reconciled:true,providerWrites:0,audit:journal.audit,receipt,message:'Previously saved TEST groups and knockout rules match the original approval. No Nakka change was sent.'};
  if(typeof Logger!=='undefined')Logger.log(JSON.stringify(result));return result;
 }finally{lock.releaseLock();}
}

/* Continue the same planner after reload. Start never re-sends groups. */
function beautyPoolWorkflow_(auth){
 const props=PropertiesService.getScriptProperties(),journal=JSON.parse(props.getProperty('BEAUTY_POOL_SEND_t_QHaG_7792')||'null');
 if(journal?.state!=='VERIFIED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit)||!/^POOL-[a-f0-9]{20}$/.test(journal.receipt))beautyPoolError_('The saved draw is not verified. Inspect its audit before continuing.');
 const ss=SpreadsheetApp.openById(SHEET_ID);if(ss.getId()!==SHEET_ID)beautyPoolError_('Audit identity mismatch.');
 function read(name){const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Saved draw audit unavailable.');const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')beautyPoolError_('Saved draw audit invalid.');return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));}
 const before=read(journal.audit),receipt=read(journal.receipt);
 if(before.kind!=='POOL_SEND_BEFORE'||receipt.kind!=='POOL_SEND_READBACK'||receipt.beforeAudit!==journal.audit||receipt.drawHash!==journal.drawHash||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!=='t_QHaG_7792')beautyPoolError_('Saved draw audit does not match the verified send.');
 const event=beautyPoolEvent_(auth,true),roster=beautyPoolRoster_();
 if(before.draw.eventDate!==roster.date||BeautyPoolSeeding.rosterSignature(before.draw.roster)!==roster.signature)beautyPoolError_('Players or date changed after sending. Review before starting.');
 const pending=JSON.parse(props.getProperty('BEAUTY_POOL_START_t_QHaG_7792')||'null');
 const savedBoards=JSON.parse(props.getProperty('BEAUTY_POOL_BOARDS_t_QHaG_7792')||'null');
 const boardPlan=savedBoards?.drawHash===journal.drawHash?beautyPoolBoardPlan_(before.draw,savedBoards.input):(before.boardPlan||null);
 const result={event:{id:event.tdid,title:event.title,date:roster.date,status:event.status},audit:journal.audit,receipt:journal.receipt,draw:before.draw,format:before.format||null,boardPlan,canStart:false,running:event.status===30,startUncertain:pending?.state==='ATTEMPTED'};
 if(event.status===30)return result;
 const normalize=t=>{const v=beautyPoolProjection_(t);if(v.assign_setting)v.assign_setting=beautyPoolAssignment_(v.assign_setting);return v;};
 if(!beautyPoolEqual_(normalize(event),normalize(receipt.event)))beautyPoolError_('Nakka changed after the verified send. Review the saved event before starting.');
 const cards=beautyPoolSchedule_(auth,event);
 if(!beautyPoolEqual_(cards,receipt.schedule))beautyPoolError_('Match cards changed after the verified send.');
 if(!before.format)beautyPoolError_('Review qualification rules before starting from the Hub.');
 result.canStart=!pending;result.version=beautyPoolHash_({event,cards,roster:roster.signature,receipt:journal.receipt,boardPlan});return result;
}
function beautyPoolStart_(action,input,account,session,auth,cache){
 const expected=action==='poolstartprepare'?'':action==='poolboardplan'?'boardPlan':'confirmed,ticket';
 if(!input||Object.keys(input).sort().join(',')!==expected||Object.values(input).some(v=>typeof v!=='string'))beautyPoolError_('Invalid Start request.');
 const props=PropertiesService.getScriptProperties(),key='BEAUTY_POOL_START_t_QHaG_7792';
 const workflow=beautyPoolWorkflow_(auth);
 if(!workflow.canStart)beautyPoolError_(workflow.running?'Competition is already running.':workflow.startUncertain?'A previous Start is unverified. Inspect the event and audit; do not retry.':'Start is blocked until the saved draw is verified.');
 if(action==='poolboardplan'){
  const plan=beautyPoolBoardPlan_(workflow.draw,JSON.parse(input.boardPlan));
  const audit=beautyPoolAudit_({kind:'POOL_BOARD_PLAN',uid:account.uid,poolReceipt:workflow.receipt,plan});
  const journal=JSON.parse(props.getProperty('BEAUTY_POOL_SEND_t_QHaG_7792'));
  const value=JSON.stringify({drawHash:journal.drawHash,input:JSON.parse(input.boardPlan),audit});props.setProperty('BEAUTY_POOL_BOARDS_t_QHaG_7792',value);
  if(props.getProperty('BEAUTY_POOL_BOARDS_t_QHaG_7792')!==value)beautyPoolError_('Board plan could not be verified.');
  return {success:true,workflow:beautyPoolWorkflow_(auth),message:'Board match plan saved in the Hub. Nakka scoring remains unchanged.'};
 }
 if(workflow.draw.pools.some(p=>p.players.length===4)&&!workflow.boardPlan)beautyPoolError_('Choose one or two boards for each four-player pool and save the board plan before Start.');
 if(action==='poolstartprepare'){
  const ticket=Utilities.getUuid().replace(/-/g,'');cache.put('beauty-start:'+ticket,JSON.stringify({uid:account.uid,session,expires:Date.now()+300000,version:workflow.version}),300);
  return {success:true,ticket,workflow};
 }
 if(!/^[a-f0-9]{32}$/.test(input.ticket))beautyPoolError_('Start review expired. Check the saved competition again.');
 const approved=JSON.parse(cache.get('beauty-start:'+input.ticket)||'null');cache.remove('beauty-start:'+input.ticket);
 if(input.confirmed!=='true'||!approved||approved.uid!==account.uid||approved.session!==session||Date.now()>=approved.expires||approved.version!==workflow.version||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyPoolError_('Start approval missing, expired or changed. Nothing was started.');
 beautyHubAuthRequire_(beautyHubRequestToken_);
 const event=beautyPoolEvent_(auth),audit=beautyPoolAudit_({kind:'POOL_START_BEFORE',uid:account.uid,event:beautyPoolProjection_(event),poolAudit:workflow.audit,poolReceipt:workflow.receipt,version:workflow.version});
 // Check again after recording recovery evidence, immediately before the mutation.
 if(beautyPoolWorkflow_(auth).version!==approved.version)beautyPoolError_('Event changed during Start review. Nothing was started.');
 const journal={state:'ATTEMPTED',audit,uid:account.uid,recordedUTC:new Date().toISOString(),poolReceipt:workflow.receipt};
 props.setProperty(key,JSON.stringify(journal));if(props.getProperty(key)!==JSON.stringify(journal))beautyPoolError_('Start journal could not be saved.');
 try{
  beautyHubTransferFetch_('tournament/update',auth,{tdid:'t_QHaG_7792',expect_update_time:event.updateTime,set:{status:30}});
  const after=beautyPoolEvent_(auth,true),expected=beautyPoolProjection_(event);expected.status=30;
  if(!beautyPoolEqual_(expected,beautyPoolProjection_(after)))beautyPoolError_('Start readback differs from approval.');
  const receipt=beautyPoolAudit_({kind:'POOL_START_READBACK',uid:account.uid,beforeAudit:audit,poolReceipt:workflow.receipt,event:beautyPoolProjection_(after)});
  props.setProperty(key,JSON.stringify({...journal,state:'VERIFIED',receipt,verifiedUTC:new Date().toISOString()}));
  return {success:true,readbackVerified:true,audit,receipt,message:'TEST competition started and verified. Beauty Live reads the running event.'};
 }catch(e){return {success:false,uncertain:true,audit,error:'Start may have been saved. Do not retry. Inspect the TEST event and Start audit.'};}
}

function beautyPoolBoardPlan_(draw,input){
 if(!input||Object.keys(input).sort().join(',')!=='available,choices')beautyPoolError_('Invalid board plan.');
 return BeautyPoolBoards.matchPlan(draw.pools,input.available,input.choices);
}
