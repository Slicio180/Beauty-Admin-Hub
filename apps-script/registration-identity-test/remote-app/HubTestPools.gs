/* Generated shared pool core and staff service. Edit public/js/pool-seeding.js and server/pool-service.js. */
/* Pure draw planning. No services, storage, timers, credentials or provider writes. */
var BeautyPoolSeeding=(function(){
  'use strict';
  const fail=message=>{throw Error(message);};
  const copy=value=>JSON.parse(JSON.stringify(value));
  function validatePlayers(players){
    if(!Array.isArray(players)||players.length>1000)fail('Invalid event roster.');
    const ids=new Set();
    return players.map(p=>{
      if(!p||typeof p.id!=='string'||!p.id||p.id.length>120||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!['IN','OUT','STANDBY'].includes(p.status))fail('Missing or ambiguous player identity or status.');
      ids.add(p.id);
      if(p.average!==null&&(typeof p.average!=='number'||!Number.isFinite(p.average)||p.average<0||p.average>180))fail('An average must be a verified number or explicitly missing.');
      return {id:p.id,name:p.name,status:p.status,average:p.average};
    });
  }
  const compareId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
  function rosterSignature(players){return JSON.stringify(validatePlayers(players).filter(p=>p.status==='IN').sort(compareId).map(p=>[p.id,p.name]));}
  function sizesFromPlan(plan){
    if(!plan||!['three','four','five','pools'].every(k=>Number.isInteger(plan[k])&&plan[k]>=0)||plan.pools!==plan.three+plan.four+plan.five||plan.five&&plan.pools!==1||plan.five>1)fail('Invalid pool-size scheme.');
    return [...Array(plan.four).fill(4),...Array(plan.three).fill(3),...Array(plan.five).fill(5)];
  }
  function shuffled(players,seed){
    let state=seed>>>0;
    const random=()=>{state=(state+0x6D2B79F5)>>>0;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
    const result=players.slice().sort(compareId);
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function groupName(index){let name='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))name=String.fromCharCode(65+(n-1)%26)+name;return name;}
  function summary(group){
    const known=group.players.filter(p=>p.average!==null);
    return {players:group.players.length,capacity:group.capacity,known:known.length,unseeded:group.players.length-known.length,
      knownAverage:known.length?known.reduce((sum,p)=>sum+p.average,0)/known.length:null};
  }
  function check(draw){
    if(!draw||!Array.isArray(draw.pools)||!Array.isArray(draw.roster))fail('Invalid draw.');
    const roster=validatePlayers(draw.roster);if(roster.some(p=>p.status!=='IN'))fail('Draw includes an excluded player.');
    const expected=new Map(draw.roster.map(p=>[p.id,p])),seen=new Set();
    if(draw.pools.some(g=>![3,4,5].includes(g.capacity))||draw.pools.some(g=>g.capacity===5)&&draw.pools.length!==1)fail('Unsupported pool capacities.');
    for(const [index,group] of draw.pools.entries()){
      if(group.id!==index||group.name!==groupName(index))fail('Pool identity changed.');
      if(group.players.length!==group.capacity)fail('Every pool must match its chosen capacity.');
      for(const p of group.players){
        if(seen.has(p.id)||!expected.has(p.id)||JSON.stringify(p)!==JSON.stringify(expected.get(p.id)))fail('Draw changed, repeated or omitted a player.');
        seen.add(p.id);
      }
    }
    if(seen.size!==expected.size)fail('Draw omitted a player.');
    return true;
  }
  function warnings(draw){
    const counts=draw.pools.map(g=>summary(g).unseeded),messages=[];
    if(Math.max(...counts)-Math.min(...counts)>1)messages.push('Manual changes have made the unseeded distribution uneven.');
    const first=new Set(draw.firstSeeds),repeated=draw.pools.some(g=>g.players.filter(p=>first.has(p.id)).length>1);
    if(repeated)messages.push('Manual changes have put first-round seeds together.');
    if(draw.roster.some(p=>p.average===null))messages.push('Pool strength uses known averages only; unseeded players are not treated as zero.');
    return messages;
  }
  function draw(options){
    const all=validatePlayers(options?.players),roster=all.filter(p=>p.status==='IN');
    if(roster.length<5||roster.length>101)fail('Seeded draws support 5–101 IN players.');
    const sizes=options.sizes;
    if(!Array.isArray(sizes)||!sizes.length||sizes.some(n=>![3,4,5].includes(n))||sizes.includes(5)&&(sizes.length!==1||sizes[0]!==5)||sizes.reduce((a,b)=>a+b,0)!==roster.length)fail('Pool capacities must match the selected IN list and scheme.');
    if(!Number.isInteger(options.seed)||options.seed<0||options.seed>0xFFFFFFFF)fail('A recorded unsigned 32-bit draw seed is required.');
    if(typeof options.eventDate!=='string'||!/^20\d\d-\d\d-\d\d$/.test(options.eventDate)||!Number.isFinite(Date.parse(options.eventDate+'T12:00:00Z'))||new Date(options.eventDate+'T12:00:00Z').toISOString().slice(0,10)!==options.eventDate||typeof options.frozenAt!=='string'||!Number.isFinite(Date.parse(options.frozenAt))||
      !options.source||typeof options.source.leagueId!=='string'||!options.source.leagueId||typeof options.source.fetchedAt!=='string'||!Number.isFinite(Date.parse(options.source.fetchedAt)))fail('Record the event, league and frozen statistics time.');
    const order=shuffled(roster,options.seed),known=order.filter(p=>p.average!==null).sort((a,b)=>b.average-a.average),unknown=order.filter(p=>p.average===null);
    const pools=sizes.map((capacity,i)=>({id:i,name:groupName(i),capacity,players:[],unseededQuota:0}));
    // Water-fill counts, favouring larger pools for remainder slots. Counts differ by at most one.
    for(let i=0;i<unknown.length;i++){
      const group=pools.filter(g=>g.unseededQuota<g.capacity).sort((a,b)=>a.unseededQuota-b.unseededQuota||b.capacity-a.capacity||a.id-b.id)[0];
      group.unseededQuota++;
    }
    const seededCapacity=pools.map(g=>g.capacity-g.unseededQuota),firstSeeds=[];
    let placed=0,round=0;
    while(placed<known.length){
      const indices=pools.map((_,i)=>i);if(round%2)indices.reverse();
      for(const i of indices){
        if(pools[i].players.length>=seededCapacity[i]||placed>=known.length)continue;
        if(round===0)firstSeeds.push(known[placed].id);
        pools[i].players.push(known[placed++]);
      }
      round++;
    }
    // Improve comparable known-player means without moving first-round seeds or unknown quotas.
    const protectedIds=new Set(firstSeeds),target=known.length?known.reduce((s,p)=>s+p.average,0)/known.length:0;
    const means=pools.map(g=>({sum:g.players.reduce((s,p)=>s+p.average,0),count:g.players.length}));
    const cost=(sum,count)=>count?Math.pow(sum/count-target,2):0;
    for(let pass=0;pass<100;pass++){
      let best=null,improvement=1e-9;
      for(let a=0;a<pools.length;a++)for(let b=a+1;b<pools.length;b++){
        const left=means[a],right=means[b];if(!left.count||!right.count)continue;
        const before=cost(left.sum,left.count)+cost(right.sum,right.count);
        for(let x=0;x<pools[a].players.length;x++)for(let y=0;y<pools[b].players.length;y++){
          const p=pools[a].players[x],q=pools[b].players[y];if(protectedIds.has(p.id)||protectedIds.has(q.id))continue;
          const delta=q.average-p.average,gain=before-cost(left.sum+delta,left.count)-cost(right.sum-delta,right.count);
          if(gain>improvement){improvement=gain;best={a,b,x,y,delta};}
        }
      }
      if(!best)break;
      const {a,b,x,y,delta}=best;[pools[a].players[x],pools[b].players[y]]=[pools[b].players[y],pools[a].players[x]];means[a].sum+=delta;means[b].sum-=delta;
    }
    let index=0;for(const group of pools)for(let i=0;i<group.unseededQuota;i++)group.players.push(unknown[index++]);
    const result={version:1,eventDate:options.eventDate,frozenAt:options.frozenAt,source:{leagueId:options.source.leagueId,fetchedAt:options.source.fetchedAt},seed:options.seed,
      method:'seeded snake with protected first-round seeds and bounded mean balancing',unseededPolicy:'even counts, no invented averages',
      roster:roster.slice().sort(compareId).map(copy),rosterSignature:rosterSignature(all),firstSeeds,pools:pools.map(g=>({id:g.id,name:g.name,capacity:g.capacity,players:g.players.map(copy)})),manualChanges:[]};
    check(result);return result;
  }
  function adjust(current,change){
    check(current);const result=copy(current);
    const origin=result.pools.find(g=>g.players.some(p=>p.id===change.playerId)),target=result.pools.find(g=>g.id===change.targetPool);
    if(!origin||!target||origin===target)fail('Choose a player and another pool.');
    const from=origin.players.findIndex(p=>p.id===change.playerId);
    if(target.players.length>=target.capacity){
      const other=target.players.findIndex(p=>p.id===change.swapWith);
      if(other<0)fail('The destination is full. Choose a player to swap.');
      [origin.players[from],target.players[other]]=[target.players[other],origin.players[from]];
    }else{target.players.push(origin.players.splice(from,1)[0]);}
    result.manualChanges.push({playerId:change.playerId,from:origin.id,to:target.id,swapWith:change.swapWith||null});
    check(result);return result;
  }
  function band(average,thresholds=[50,55,60]){
    if(!Array.isArray(thresholds)||thresholds.length!==3||thresholds.some((n,i)=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>180||i&&n<=thresholds[i-1]))fail('Average-band boundaries must increase without overlap.');
    if(average===null)return 'UNSEEDED';
    if(typeof average!=='number'||!Number.isFinite(average)||average<0||average>180)fail('Invalid average.');
    return thresholds.filter(n=>average>=n).length;
  }
  const api={draw,adjust,check,summary,warnings,band,rosterSignature,sizesFromPlan};
  return Object.freeze(api);
})();

/* Staff-only, fixed Identity TEST. No entry additions/deletions, no event start.
 * API contract: https://push.n01darts.com/api/v1/n01_api_manual_en.html
 * Frozen previews expire after five minutes. A provider write is never retried.
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
  const all=[],ids=new Set();
  for(let skip=0;skip<=1000;skip+=100){
    const page=beautyHubTransferFetch_('league/entry/list?lgid=lg_tM2v_3523&count=100&skip='+skip,auth).list;
    if(!Array.isArray(page)||page.length>100)beautyPoolError_('Incomplete league identity list.');
    for(const p of page){
      if(!p||!/^[A-Za-z0-9]{4}$/.test(p.lpid)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||ids.has(p.lpid))beautyPoolError_('Ambiguous league identity list.');
      ids.add(p.lpid);all.push({lpid:p.lpid,name:p.name});
    }
    if(all.length>1000)beautyPoolError_('League identity limit exceeded.');
    if(page.length<100)return all.sort((a,b)=>a.lpid<b.lpid?-1:1);
  }
  beautyPoolError_('League identity list may be truncated.');
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
function beautyPoolEvent_(auth){
  const t=beautyHubTransferFetch_('tournament/get?tdid=t_RqC2_2034',auth).tournament;
  if(!t||t.tdid!=='t_RqC2_2034'||t.lgid!=='lg_tM2v_3523'||t.title!=='Beauty Hub TEST — DO NOT USE LIVE'||![10,20,25].includes(t.status)||!Number.isFinite(t.updateTime)||!Number.isFinite(t.t_date)||t.league!==1||t.team_games!==0||t.lg_setting?.league!==1||t.lg_setting?.match_type!=='01'||t.lg_setting.turnaround!==0||(t.lg_setting.swiss??0)!==0)beautyPoolError_('Only the pre-start, single round-robin Beauty TEST league event is supported.');
  const date=Utilities.formatDate(new Date(t.t_date*1000),'Europe/Berlin','yyyy-MM-dd');
  if(date!==beautyPoolRoster_().date||date!==beautyHubNakkaDate_().date)beautyPoolError_('Hub date and TEST event differ.');
  return t;
}
function beautyPoolSchedule_(auth){
  const r=beautyHubTransferFetch_('league/schedule/get?tdid=t_RqC2_2034',auth);
  if(r.tdid!=='t_RqC2_2034'||r.swiss!==0||!Array.isArray(r.schedule))beautyPoolError_('Unsupported match-card response.');
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
function beautyPoolProjection_(t){const v=beautyPoolCopy_(t);delete v.updateTime;return v;}
function beautyPoolVerify_(before,after,setting,table){
  const expected=beautyPoolProjection_(before);expected.lg_setting=setting;expected.lg_table=table;
  if(!beautyPoolEqual_(expected,beautyPoolProjection_(after)))beautyPoolError_('Event readback differs from the approved change.');
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
  let attempted=false,journalKey='BEAUTY_POOL_SEND_t_RqC2_2034',audit='',journal;
  const props=PropertiesService.getScriptProperties();
  try{
    const account=beautyHubAuthRequire_(beautyHubRequestToken_);if(!account.uid)throw Error('auth');
    const session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_),auth=beautyPoolAuth_(),cache=CacheService.getScriptCache();
    const fields={poolload:['refresh'],pooldraw:['bindings','reviewed','sizes'],pooladjust:['change','ticket'],poolprepare:['ticket'],poolsave:['confirmed','ticket']}[action];
    if(!fields||!input||Object.keys(input).sort().join(',')!==fields.sort().join(',')||Object.values(input).some(v=>typeof v!=='string'||v.length>40000)||input.sizes?.length>400||input.change?.length>1000)beautyPoolError_('Invalid Pool Planner request.');
    const ticketRead=()=>{if(!/^[a-f0-9]{32}$/.test(input.ticket))beautyPoolError_('Expired pool preview.');const r=JSON.parse(cache.get('beauty-pool:'+input.ticket)||'null');if(!r||r.uid!==account.uid||r.session!==session||Date.now()>=r.expires)beautyPoolError_('Expired pool preview.');return r;};
    const ticketWrite=r=>{const ticket=Utilities.getUuid().replace(/-/g,'');r.uid=account.uid;r.session=session;r.expires=Date.now()+300000;const text=JSON.stringify(r);if(text.length>90000)beautyPoolError_('Draw too large.');cache.put('beauty-pool:'+ticket,text,300);return ticket;};
    if(action==='poolload'||action==='pooldraw'){
      if(action==='poolload'&&!['true','false'].includes(input.refresh))beautyPoolError_('Invalid refresh.');
      const stats=beautyPoolStats_(auth,action==='poolload'&&input.refresh==='true'),roster=beautyPoolRoster_(),event=beautyPoolEvent_(auth),entries=beautyPoolEntries_(event);
      const bindings=action==='pooldraw'?JSON.parse(input.bindings):null,mappings=beautyPoolMappings_(roster,stats,entries,bindings);
      if(action==='poolload')return {success:true,stats,roster,mappings,event:{id:event.tdid,title:event.title,date:roster.date},journal:props.getProperty(journalKey)?'A previous pool send is recorded. Sending again is blocked.':''};
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
    const event=beautyPoolEvent_(auth),schedule=beautyPoolSchedule_(auth);beautyPoolBlankEvent_(event,schedule);
    if(beautyPoolHash_(event)!==frozen.eventHash)beautyPoolError_('Nakka event changed since the draw. Generate and review a new draw.');
    const stats=beautyPoolStats_(auth,false);if(!stats.fresh||Date.now()-Date.parse(stats.fetchedAt)>=300000||beautyPoolHash_(stats.profiles)!==frozen.statsHash)beautyPoolError_('Statistics changed or expired. Generate a new draw.');
    const liveProfiles=beautyPoolProfiles_(auth);if(!beautyPoolEqual_(liveProfiles,stats.profiles.map(p=>({lpid:p.lpid,name:p.name}))))beautyPoolError_('League identities changed. Reload statistics and review a new draw.');
    const mappings=beautyPoolMappings_(roster,stats,beautyPoolEntries_(event),frozen.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid})));
    if(mappings.some(p=>!p.lpid||!p.tpid))beautyPoolError_('Every IN player needs a reviewed league identity and existing event entry before sending. Resolve the listed missing entries in Nakka, then draw again.');
    BeautyPoolSeeding.check(frozen.draw);
    const max=Math.max(...frozen.draw.pools.map(g=>g.capacity)),table=frozen.draw.pools.map(g=>{const a=g.players.map(p=>mappings.find(m=>m.id===p.id).tpid);while(a.length<max)a.push('');return a;}),setting={...event.lg_setting,robin_count:table.length,robin_player_count:max};
    const version=beautyPoolHash_({event,schedule,rosterSignature:roster.signature,table,setting});
    if(action==='poolprepare'){
      cache.remove('beauty-pool:'+input.ticket);
      return {success:true,ticket:ticketWrite({...frozen,ready:true,version}),table,setting,warnings:BeautyPoolSeeding.warnings(frozen.draw),event:{id:event.tdid,title:event.title,date:roster.date},expectedCards:table.reduce((s,g)=>s+g.filter(Boolean).length*(g.filter(Boolean).length-1)/2,0)};
    }
    cache.remove('beauty-pool:'+input.ticket); // Consume save ticket before any external mutation.
    if(input.confirmed!=='true'||!frozen.ready||frozen.version!==version||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyPoolError_('Approved preview missing or stale. Nothing was sent.');
    // Re-authenticate and re-read the roster immediately before durable audit.
    beautyHubAuthRequire_(beautyHubRequestToken_);if(beautyPoolRoster_().signature!==roster.signature||beautyHubNakkaDate_().date!==roster.date)beautyPoolError_('Roster changed before sending.');
    audit=beautyPoolAudit_({kind:'POOL_SEND_BEFORE',uid:account.uid,draw:frozen.draw,mappings:frozen.mappings,event:beautyPoolProjection_(event),schedule,table,setting,version});
    journal={state:'ATTEMPTED',uid:account.uid,recordedUTC:new Date().toISOString(),audit,version,drawHash:beautyPoolHash_(frozen.draw)};
    props.setProperty(journalKey,JSON.stringify(journal));if(props.getProperty(journalKey)!==JSON.stringify(journal))beautyPoolError_('Pool journal could not be saved.');
    attempted=true;
    beautyHubTransferFetch_('tournament/update',auth,{tdid:'t_RqC2_2034',expect_update_time:event.updateTime,set:{lg_setting:setting,lg_table:table}});
    const groups=beautyPoolEvent_(auth);beautyPoolVerify_(event,groups,setting,table);
    if(!beautyPoolEmpty_(beautyPoolSchedule_(auth)))beautyPoolError_('Match cards changed during sending.');
    beautyHubTransferFetch_('league/schedule/generate',auth,{tdid:'t_RqC2_2034',mode:'robin'});
    const after=beautyPoolEvent_(auth),cards=beautyPoolSchedule_(auth);beautyPoolVerify_(event,after,setting,table);beautyPoolVerifyCards_(table,cards);
    const receipt=beautyPoolAudit_({kind:'POOL_SEND_READBACK',uid:account.uid,drawHash:journal.drawHash,event:beautyPoolProjection_(after),schedule:cards,beforeAudit:audit});
    journal={...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString(),receipt,readbackHash:beautyPoolHash_({event:beautyPoolProjection_(after),cards})};props.setProperty(journalKey,JSON.stringify(journal));
    return {success:true,readbackVerified:true,audit,receipt,message:'TEST groups and every round-robin match pairing verified. Entries and other event settings preserved. Event remains pre-start.'};
  }catch(e){
    return {success:false,error:attempted?'The send may be partially saved. Do not retry. Inspect TEST groups, match cards and the audit before any further change.':(e.name==='BeautyPoolError'?e.message:'Pool Planner could not be checked. Nothing was sent.'),...(audit?{audit}:{}),uncertain:attempted};
  }finally{lock.releaseLock();}
}
