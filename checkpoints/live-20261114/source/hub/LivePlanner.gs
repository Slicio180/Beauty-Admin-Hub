/* Fixed Monday LIVE adapters for the tested event/planner workflow.
 * Never accept a target, URL, credential or date from a browser request.
 */

const BEAUTY_IDENTITY_WRITES_ENABLED_ = true;
var beautyLivePlannerTarget_ = null;
function beautyHubTestGuard_(){beautyLiveLoginGuard_();}
function beautyHubLeagueId_(){return beautyLiveTarget_().leagueId;}
function beautyHubScopeId_(){return 'LIVE_'+(beautyContextStandalone_()?beautyLiveTarget_().eventId:beautyLiveTarget_().leagueId);}
function beautyHubNakkaDate_(){
  const result=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Control'!A2")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  const date=beautyLiveDate_(result.values?.[0]?.[0]);
  if(date!==beautyLiveTarget_().date)throw Error('The selected LIVE date changed.');
  return {date};
}
function beautyHubNakkaEvent_(){
  const checked=beautyLiveEventRead_();
  if(checked.status!=='MATCHED'||checked.event.id!==beautyLiveTarget_().eventId||checked.eventDate!==beautyLiveTarget_().date)throw Error('LIVE event mismatch.');
  beautyLivePlannerTarget_={id:checked.event.id,title:checked.event.title,date:checked.eventDate};return checked;
}
function beautyHubActiveTestTarget_(){if(!beautyLivePlannerTarget_)beautyHubNakkaEvent_();return beautyLivePlannerTarget_;}
function getBeautyHubData_(){return beautyLiveDashboardRead_();}
function beautyHubTransferHash_(value){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value))).replace(/=+$/,'');}
function beautyHubTransferError_(){throw Error('Nakka response needs review.');}
function beautyLivePlannerPending_(){
  const p=PropertiesService.getScriptProperties();
  for(const key of ['BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_REMOVE_PENDING','BEAUTY_LIVE_STATUS_PENDING'])if(p.getProperty(key))throw Error('Resolve the unfinished registration, status or removal before using the planner.');
}
function beautyHubTransferFetch_(path,authorization,payload){
  beautyLiveLoginGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
  const t=beautyLiveTarget_();
  const reads=new Set(['league/get?lgid='+t.leagueId,'league/entry/list?lgid='+t.leagueId,'league/stats?lgid='+t.leagueId+'&kind=stats_list','league/stats?lgid='+t.leagueId+'&kind=rank_list','tournament/entry/list?tdid='+t.eventId,'tournament/get?tdid='+t.eventId,'league/schedule/get?tdid='+t.eventId]);
  if(payload){
    beautyLivePlannerPending_();beautyHubNakkaDate_();
    if(!['tournament/update','tournament/assign/update','league/schedule/generate'].includes(path)||payload.tdid!==t.eventId)throw Error('Unsupported LIVE mutation.');
    if(path==='tournament/update'&&(!Number.isFinite(payload.expect_update_time)||!payload.set||typeof payload.set!=='object'))throw Error('Missing approved revision.');
  }else if(!reads.has(path))throw Error('Unsupported LIVE read.');
  // Use existing server-owned credentials and transport. No caller credentials.
  return beautyLiveRegistrationApi_(path,payload);
}
function beautyLivePlanner_(action,input,token){
  const supported=['eveningsetup','eveningprepare','eveningsave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan'];
  if(!supported.includes(action))return {success:false,error:'Unsupported LIVE planning action.'};
  const prior=beautyHubRequestToken_;beautyHubRequestToken_=token;beautyLivePlannerTarget_=null;
  try{
    beautyLiveLoginGuard_();beautyHubAuthRequire_(token);beautyLivePlannerPending_();
    const pendingSettings=JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_SETTINGS_'+beautyLiveTarget_().eventId)||'null');
    if(action!=='eveningsetup'&&pendingSettings?.state==='ATTEMPTED')throw Error('Review the unverified event settings before planning.');
    if(!input||typeof input!=='object'||Array.isArray(input)||input._context!==beautyContextToken_())return {success:false,error:'Reload the selected LIVE event.'};
    const clean={...input};delete clean._context;
    if(action.startsWith('evening'))return beautyHubEveningSetup_(({eveningsetup:'read',eveningprepare:'prepare',eveningsave:'confirm'})[action],clean);
    return beautyHubPool_(action,clean);
  }catch(e){return {success:false,error:'LIVE planning could not be checked. Sign in, verify the selected date, and resolve any unfinished settings, registration, status or removal.'};}
  finally{beautyHubRequestToken_=prior;beautyLivePlannerTarget_=null;}
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
  function groupName(index){return String(index+1);}
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

/* Pure planning only. No provider calls, scoring or session state. */
var BeautyPoolBoards=(function(){
 'use strict';
 function parseBoards(text){
  if(typeof text!=='string'||!text.trim()||text.length>1000)throw Error('Select available boards.');
  const boards=new Set();
  for(const part of text.replace(/[–—]/g,'-').split(',')){
   const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
   if(!m)throw Error('Use board numbers or ranges separated by commas.');
   const a=Number(m[1]),b=m[2]===undefined?a:Number(m[2]);
   if(a<1||b>1000||a>b)throw Error('Board ranges must ascend within 1–1000.');
   for(let n=a;n<=b;n++){if(boards.has(n))throw Error('Each board must be selected once.');boards.add(n);}
  }
  return [...boards].sort((a,b)=>a-b);
 }
 function allocate(pools,available){
  if(!Array.isArray(available)||!available.length||available.length>1000||available.some(n=>!Number.isInteger(n)||n<1||n>1000)||new Set(available).size!==available.length)throw Error('Choose unique available board numbers.');
  if(!Array.isArray(pools)||!pools.length)throw Error('Generate pools first.');
  const ids=new Set(),jobs=pools.map((p,i)=>{
   if(!p||!((typeof p.id==='string'&&p.id)||(Number.isInteger(p.id)&&p.id>=0))||ids.has(p.id)||!Array.isArray(p.players)||p.players.length<2||p.players.length>5)throw Error('Pools need unique IDs and 2–5 players.');
   ids.add(p.id);return {poolId:p.id,poolNumber:i+1,matches:p.players.length*(p.players.length-1)/2};
  });
  // Longest workload first; stable ties keep equal-size pools in numeric order.
  jobs.sort((a,b)=>b.matches-a.matches||a.poolNumber-b.poolNumber);
  const boards=[...available].sort((a,b)=>a-b).map(board=>({board,matches:0,pools:[]}));
  for(const job of jobs){
   const target=[...boards].sort((a,b)=>a.matches-b.matches||a.pools.length-b.pools.length||a.board-b.board)[0];
   target.pools.push({...job,batch:target.pools.length+1});target.matches+=job.matches;
  }
  return {version:1,mode:'sequential-pools',boards,assignments:boards.flatMap(b=>b.pools.map(p=>({...p,board:b.board}))).sort((a,b)=>a.poolNumber-b.poolNumber)};
 }
 // Reserve one board per pool before spending spare capacity on four-player pools.
 // Scarce venues use one board per pool and queue by earliest free board.
 function defaults(pools,available){
  allocate(pools,available);
  const ready=new Map([...available].sort((a,b)=>a-b).map(b=>[b,1]));
  let spare=Math.max(0,available.length-pools.length);
  const choices=pools.map(pool=>{
   const count=pool.players.length===4&&spare>0?2:1;if(count===2)spare--;
   const boards=[...ready.keys()].sort((a,b)=>ready.get(a)-ready.get(b)||a-b).slice(0,count);
   const start=Math.max(...boards.map(b=>ready.get(b)));
   const end=start+Math.ceil(pool.players.length*(pool.players.length-1)/2/count);
   for(const b of boards)ready.set(b,end);
   return {poolId:pool.id,boards};
  });
  return matchPlan(pools,available,choices);
 }
 function matchPlan(pools,available,choices){
  allocate(pools,available); // Validate the same venue and frozen pool boundaries.
  if(!Array.isArray(choices)||choices.length!==pools.length)throw Error('Choose boards for every pool.');
  const ready=new Map(available.map(n=>[n,1])),matches=[],assignments=[];
  for(const pool of pools){
   const choice=choices.find(c=>c.poolId===pool.id),n=pool.players.length;
   if(!choice||Object.keys(choice).sort().join(',')!=='boards,poolId'||!Array.isArray(choice.boards)||![1,2].includes(choice.boards.length)||choice.boards.length===2&&n!==4||new Set(choice.boards).size!==choice.boards.length||choice.boards.some(b=>!available.includes(b)))throw Error('Choose one board, or two different available boards for a four-player pool.');
   const boards=choice.boards,start=Math.max(...boards.map(b=>ready.get(b))),pairs=[];
   if(n===4)pairs.push([0,3],[1,2],[0,2],[3,1],[0,1],[2,3]);
   else for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)pairs.push([a,b]);
   pairs.forEach(([a,b],i)=>matches.push({poolId:pool.id,wave:start+Math.floor(i/boards.length),board:boards[i%boards.length],players:[pool.players[a].id,pool.players[b].id]}));
   const end=start+Math.ceil(pairs.length/boards.length);for(const b of boards)ready.set(b,end);
   assignments.push({poolId:pool.id,boards:boards.slice(),startWave:start,endWave:end-1});
  }
  return {version:1,assignments,matches};
 }
 const api=Object.freeze({parseBoards,allocate,defaults,matchPlan});
 return api;
})();

/* Staff-only, fixed Identity LIVE. No entry additions/deletions. Explicit audited LIVE event start only.
 * API contract: https://push.n01darts.com/api/v1/n01_api_manual_en.html
 * Pool reviews have no timer; authenticated sessions and live event checks still apply. A provider write is never retried.
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
  if(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_())return beautyHubTransferEntries_(beautyHubTransferFetch_('tournament/entry/list?tdid='+beautyHubActiveTestTarget_().id,auth)).map(e=>({lpid:e.tpid,name:e.name})).sort((a,b)=>a.lpid<b.lpid?-1:1);
  // league/entry/list returns the full list; it is not a paginated list API.
  const page=beautyHubTransferFetch_(('league/entry/list?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+''),auth).list;
  if(!Array.isArray(page)||page.length>=1000)beautyPoolError_('League identity list is invalid or exceeds the supported limit.');
  const ids=new Set(),all=[];
  for(const p of page){
    if(!p||typeof p.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(p.lpid)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||/[\x00-\x1f\x7f]/.test(p.name)||ids.has(p.lpid))beautyPoolError_('Ambiguous league identity list.');
    ids.add(p.lpid);all.push({lpid:p.lpid,name:p.name});
  }
  return all.sort((a,b)=>a.lpid<b.lpid?-1:1);
}
function beautyPoolNormalizeStats_(profiles,stats,ranking){
  // Explicit empty collections mean no recorded results; missing data still fails.
  if(Array.isArray(stats)&&stats.length===0)stats={};
  if(Array.isArray(ranking)&&ranking.length===0)ranking={};
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
  const p=PropertiesService.getScriptProperties(),pointer=('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_CURRENT');
  if(value){
    const old=JSON.parse(p.getProperty(pointer)||'null'),id=Utilities.getUuid().replace(/-/g,''),text=JSON.stringify(value),n=Math.ceil(text.length/1800);
    if(n>100)beautyPoolError_('Statistics snapshot too large.');
    for(let i=0;i<n;i++)p.setProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_')+id+'_'+i,text.slice(i*1800,(i+1)*1800));
    p.setProperty(pointer,JSON.stringify({id,n}));
    if(old)for(let i=0;i<old.n;i++)p.deleteProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_')+old.id+'_'+i);
    return value;
  }
  try{const old=JSON.parse(p.getProperty(pointer)||'null');if(!old||old.n>100)return null;let text='';for(let i=0;i<old.n;i++){const s=p.getProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_')+old.id+'_'+i);if(s===null)return null;text+=s;}return JSON.parse(text);}catch(e){return null;}
}
function beautyPoolStats_(auth,force){
  if(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_())return beautyPoolStatsRun_(auth,force);
  let identities;
  try{identities=beautyPoolProfiles_(auth);}catch(e){return {fresh:false,profiles:[],identityProfiles:[],diagnostic:'IDENTITY_READ',message:'League player identities could not be verified. Refresh before planning.'};}
  const stats=beautyPoolStatsRun_(auth,force,identities);
  // Statistics outages must not hide independently verified identities.
  const identityProfiles=identities.map(p=>{
    const previous=(stats.profiles||[]).find(q=>q.lpid===p.lpid&&q.name===p.name);
    return previous||{...p,average:null,points:null,reason:'Statistics unavailable'};
  });
  if(stats.fresh&&!beautyPoolEqual_(identities,(stats.profiles||[]).map(p=>({lpid:p.lpid,name:p.name})))){
    stats.fresh=false;stats.message='League identities changed. Refresh statistics before generating a draw.';
  }
  return {...stats,identityProfiles};
}
function beautyPoolStatsRun_(auth,force,identities){
  if(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_()){const profiles=beautyPoolProfiles_(auth).map(p=>({...p,average:null,points:null,reason:'Standalone event — no league ranking'}));return {...beautyPoolLastGood_({leagueId:beautyHubScopeId_(),title:beautyHubActiveTestTarget_().title,fetchedAt:new Date().toISOString(),method:'Standalone event entries; unseeded until event averages are available',profiles}),fresh:true};}
  const p=PropertiesService.getScriptProperties(),now=Date.now(),last=beautyPoolLastGood_();
  const failed=Number(p.getProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_FAILED'))||0);
  if(last&&!force&&now-Date.parse(last.fetchedAt)<300000&&failed<=Date.parse(last.fetchedAt))return {...last,fresh:true};
  const attempt=Number(p.getProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_ATTEMPT'))||0);
  if(now-attempt<60000)return last?{...last,fresh:now-Date.parse(last.fetchedAt)<300000&&failed<=Date.parse(last.fetchedAt),message:'Refresh is limited to once per minute.'}:{fresh:false,profiles:[],message:'Wait one minute before refreshing.'};
  p.setProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_ATTEMPT'),String(now));
  let diagnostic='LEAGUE_METADATA';
  try{
    const league=beautyHubTransferFetch_(('league/get?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+''),auth).league;
    if(league?.lgid!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+'')||typeof league.title!=='string')throw Error('league');
    const profiles=identities||beautyPoolProfiles_(auth);
    diagnostic='SCORE_TOTALS';
    const stats=beautyHubTransferFetch_(('league/stats?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+'&kind=stats_list'),auth).stats;
    diagnostic='RANKING_POINTS';
    const ranking=beautyHubTransferFetch_(('league/stats?lgid='+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+'&kind=rank_list'),auth).stats;
    diagnostic='VALIDATE_STATISTICS';
    const qualified=beautyPoolNormalizeStats_(profiles,stats,ranking);p.deleteProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_FAILED'));
    return {...beautyPoolLastGood_({leagueId:league.lgid,title:league.title,fetchedAt:new Date().toISOString(),method:'3 × total score / total darts; full precision for seeding, 2 decimals for display',profiles:qualified}),fresh:true};
  }catch(e){p.setProperty(('BEAUTY_LEAGUE_STATS_'+(typeof beautyHubScopeId_==='function'?beautyHubScopeId_():'lg_tM2v_3523')+'_FAILED'),String(Date.now()));return last?{...last,fresh:false,diagnostic,message:'Statistics unavailable ('+diagnostic+'). Last successful values retained; new draws and sending are blocked.'}:{fresh:false,profiles:[],diagnostic,message:'Statistics unavailable ('+diagnostic+'). Verified league identities remain available. No averages have been invented.'};}
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
function beautyPoolEvent_(auth,allowStarted=false,allowKnockoutOnly=false){
  const t=beautyHubTransferFetch_(('tournament/get?tdid='+beautyHubActiveTestTarget_().id),auth).tournament;
  const knockoutOnly=t?.rr_setting?.round_robin!==1&&t?.lg_setting?.league!==1&&(t?.t_setting?.tournament===1||t?.s2_setting?.tournament===1)&&t?.d_setting?.tournament!==1&&t?.m_setting?.matchs!==1;
  if(!t||t.tdid!==(beautyHubActiveTestTarget_().id)||(t.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_tM2v_3523')+'')||t.title!==beautyHubActiveTestTarget_().title||!((allowStarted||allowKnockoutOnly&&knockoutOnly)?[10,20,25,30]:[10,20,25]).includes(t.status)||!Number.isFinite(t.updateTime)||!Number.isFinite(t.t_date)||t.team_games!==0)beautyPoolError_('Only the selected pre-start Registration LIVE singles event is supported.');
  if(allowKnockoutOnly&&knockoutOnly){const date=Utilities.formatDate(new Date(t.t_date*1000),'Europe/Berlin','yyyy-MM-dd');if(date!==beautyPoolRoster_().date||date!==beautyHubNakkaDate_().date)beautyPoolError_('Hub date and LIVE event differ.');return t;}
  const mode=beautyPoolMode_(t),setting=t[mode+'_setting'];
  if(setting.match_type!=='01'||(setting.turnaround??0)!==0||(setting.swiss??0)!==0)beautyPoolError_('Only single Round Robin or non-Swiss Fixtures groups using 01 are supported.');
  const date=Utilities.formatDate(new Date(t.t_date*1000),'Europe/Berlin','yyyy-MM-dd');
  if(date!==beautyPoolRoster_().date||date!==beautyHubNakkaDate_().date)beautyPoolError_('Hub date and LIVE event differ.');
  return t;
}
function beautyPoolSchedule_(auth,event){
  if(event&&beautyPoolMode_(event)==='rr')return [];
  const r=beautyHubTransferFetch_(('league/schedule/get?tdid='+beautyHubActiveTestTarget_().id),auth);
  if(r.tdid!==(beautyHubActiveTestTarget_().id)||r.swiss!==0||!Array.isArray(r.schedule))beautyPoolError_('Unsupported match-card response.');
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
    const league=(stats.identityProfiles||stats.profiles).filter(q=>beautyPoolKey_(q.name)===beautyPoolKey_(p.name)),event=entries.filter(q=>beautyPoolKey_(q.name)===beautyPoolKey_(p.name));
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
  const enabledA=event.t_setting?.tournament===1,enabledB=event.s2_setting?.tournament===1;
  if(!enabledA&&!enabledB)return null;
  const counts=draw.pools.map(p=>p.players.length);
  if(!counts.length||counts.some(n=>![3,4,5].includes(n)))beautyPoolError_('Format supports groups of three, four or five.');
  if(mode==='top2-bottom2'&&counts.some(n=>n!==4))beautyPoolError_('Top two and bottom two requires four-player groups. Choose top two and all remaining players for mixed groups.');
  const totalA=enabledA?counts.length*2:0,totalB=enabledB?(enabledA?counts.reduce((s,n)=>s+n-2,0):counts.length*2):0;
  if(enabledA&&totalA<2||enabledB&&totalB<2)beautyPoolError_('Each knockout needs at least two qualifiers. Review this small-event format separately.');
  const bracket=n=>{let size=2;while(size<n)size*=2;if(size>1024)beautyPoolError_('Knockout exceeds supported size.');return {size,table:Array.from({length:Math.log2(size)+1},(_,i)=>Array(size/2**i).fill(''))};};
  const settings=old=>{
    const setting=beautyPoolCopy_(old&&Object.keys(old).length?old:event[beautyPoolMode_(event)+'_setting']);
    if(![1,2,3].includes(setting.limit)||(Object.prototype.hasOwnProperty.call(setting,'drawMode')&&![0,1].includes(setting.drawMode)))beautyPoolError_('Review the existing match format before configuring knockouts.');
    if(setting.limit===1&&(!Number.isInteger(setting.limit_leg_count)||setting.limit_leg_count<1)||setting.limit===2&&(!Number.isInteger(setting.limit_set_count)||setting.limit_set_count<1||!Number.isInteger(setting.limit_set_leg_count)||setting.limit_set_leg_count<1)||setting.limit===3&&(!Array.isArray(setting.schedule)||!setting.schedule.length))beautyPoolError_('Knockout legs, sets or match schedule are incomplete.');
    return {...setting,tournament:1};
  };
  const a=enabledA?bracket(totalA):null,b=enabledB?bracket(totalB):null,assignment={};
  for(const prefix of ['t','s2']){
    assignment[prefix+'_type']=prefix==='t'||!enabledA?'top':'custom';assignment[prefix+'_count']=2;
    assignment[prefix+'_placeholder']=false;assignment[prefix+'_complete']=true;assignment[prefix+'_referee']=false;assignment[prefix+'_referee_type']='lowest';
    assignment[prefix+'_custom']=Object.fromEntries([3,4,5].map(n=>[String(n),{type:prefix==='t'||!enabledA?'top':'low',count:prefix==='t'||!enabledA?2:n-2}]));
  }
  const set={};
  for(const [key,bracketInfo]of [['t',a],['s2',b]])if(bracketInfo){
    set[key+'_setting']={...settings(event[key+'_setting']),t_player_count:bracketInfo.size,...(bracketInfo.size===2?{t3:0}:{})};set[key+'_table']=bracketInfo.table;
    const bronze=key==='t'?'t3_table':'s2_3_table';if(set[key+'_setting'].t3===1)set[bronze]=[['',''],['']];else if(event[bronze]!==undefined)set[bronze]=[];
  }
  const stage=(n,v)=>v?{qualifiers:n,slots:v.size,byes:v.size-n}:{enabled:false,qualifiers:0,slots:0,byes:0};
  return {mode,groups:counts.length,groupSizes:counts,stage1:stage(totalA,a),stage2:stage(totalB,b),assignment,set};
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
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);if(ss.getId()!==beautyLiveTarget_().sheetId)beautyPoolError_('Audit identity mismatch.');
  const name='POOL-'+Utilities.getUuid().replace(/-/g,'').slice(0,20),sheet=ss.insertSheet(name),text=JSON.stringify(value);
  const rows=[['Beauty LIVE pool audit',new Date().toISOString()]];for(let i=0;i<text.length;i+=30000)rows.push(['JSON '+(i/30000+1),text.slice(i,i+30000)]);
  sheet.getRange(1,1,rows.length,2).setValues(rows);SpreadsheetApp.flush();
  if(!beautyPoolEqual_(sheet.getRange(1,1,rows.length,2).getValues(),rows))beautyPoolError_('Pool recovery snapshot could not be verified.');return name;
}
function beautyHubPool_(action,input){
  beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another LIVE operation is running. Wait before reviewing.'};
  let attempted=false,journalKey=('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id),audit='',journal;
  const props=PropertiesService.getScriptProperties();
  try{
    beautyQueueWriteGuard_(null,true);
    const account=beautyHubAuthRequire_(beautyHubRequestToken_);if(!account.uid)throw Error('auth');
    if(typeof beautyHubNakkaEvent_==='function'){const selected=beautyHubNakkaEvent_({});if(selected.status!=='MATCHED')beautyPoolError_(selected.message);}
    const session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_),auth=beautyPoolAuth_(),cache=CacheService.getScriptCache();
    if(['poolcontrol','poolqualifyprepare','poolqualifysave'].includes(action))beautyPoolError_('Use Nakka Control for knockout progression.');
    if(['poolstartprepare','poolstart','poolboardplan'].includes(action))return beautyPoolStart_(action,input,account,session,auth,cache);
    const fields={poolload:['refresh'],pooldraw:['bindings','reviewed','sizes'],pooladjust:['change','ticket'],poolprepare:['ticket'],poolsave:['confirmed','ticket']}[action];
    if(action==='poolprepare'&&Object.prototype.hasOwnProperty.call(input||{},'format'))fields.push('format');
    if(action==='poolprepare'&&Object.prototype.hasOwnProperty.call(input||{},'boardPlan'))fields.push('boardPlan');
    if(!fields||!input||Object.keys(input).sort().join(',')!==fields.sort().join(',')||Object.values(input).some(v=>typeof v!=='string'||v.length>40000)||input.sizes?.length>400||input.change?.length>1000)beautyPoolError_('Invalid Pool Planner request.');
    // One durable draft per event and staff member. Publish verified shards before
    // replacing the pointer; cache eviction and elapsed review time cannot erase it.
    const draftKey='BEAUTY_POOL_DRAFT_'+beautyPoolHash_([beautyHubActiveTestTarget_().id,account.uid]);
    const draftPointer=()=>JSON.parse(props.getProperty(draftKey)||'null');
    const cleanDraft=p=>{if(p)for(let i=0;i<p.n;i++)props.deleteProperty(draftKey+'_'+p.ticket+'_'+i);};
    const ticketRead=()=>{
      const p=draftPointer();if(!/^[a-f0-9]{32}$/.test(input.ticket)||!p||p.ticket!==input.ticket||!Number.isInteger(p.n)||p.n<1||p.n>50)beautyPoolError_('Pool review unavailable or replaced. Generate and review a new preview.');
      let text='';for(let i=0;i<p.n;i++){const part=props.getProperty(draftKey+'_'+p.ticket+'_'+i);if(part===null)beautyPoolError_('Pool review storage is incomplete. Nothing was sent.');text+=part;}
      if(beautyPoolHash_(text)!==p.hash)beautyPoolError_('Pool review storage check failed. Nothing was sent.');
      const r=JSON.parse(text);if(r.uid!==account.uid||r.session!==session||r.target!==beautyHubActiveTestTarget_().id)beautyPoolError_('Pool review belongs to another session or event. Review again.');return r;
    };
    const ticketWrite=r=>{
      const old=draftPointer(),ticket=Utilities.getUuid().replace(/-/g,'');
      r={...r,uid:account.uid,session,target:beautyHubActiveTestTarget_().id};delete r.expires;
      const text=JSON.stringify(r),n=Math.ceil(text.length/1800);if(n>50)beautyPoolError_('Draw too large.');
      const next={ticket,n,hash:beautyPoolHash_(text)};
      try{
        for(let i=0;i<n;i++){const key=draftKey+'_'+ticket+'_'+i,part=text.slice(i*1800,(i+1)*1800);props.setProperty(key,part);if(props.getProperty(key)!==part)throw Error('draft storage');}
        props.setProperty(draftKey,JSON.stringify(next));if(props.getProperty(draftKey)!==JSON.stringify(next))throw Error('draft pointer');
      }catch(e){if(old)props.setProperty(draftKey,JSON.stringify(old));else props.deleteProperty(draftKey);cleanDraft(next);beautyPoolError_('Pool review could not be saved. Previous draw retained; nothing sent.');}
      cleanDraft(old);return ticket;
    };
    const ticketConsume=()=>{const p=draftPointer();props.deleteProperty(draftKey);if(props.getProperty(draftKey)!==null)beautyPoolError_('Could not consume approval. Nothing sent.');cleanDraft(p);};
    if(action==='poolload'||action==='pooldraw'){
      if(action==='poolload'&&!['true','false'].includes(input.refresh))beautyPoolError_('Invalid refresh.');
      if(props.getProperty(journalKey)){
        if(action!=='poolload')beautyPoolError_('Pools were already sent. Load the saved competition to continue to Start.');
        const workflow=beautyPoolWorkflow_(auth);return {success:true,workflow,event:workflow.event,mappings:[],stats:null};
      }
      const event=beautyPoolEvent_(auth,false,action==='poolload');
      if(action==='poolload'&&event.rr_setting?.round_robin!==1&&event.lg_setting?.league!==1)return {success:true,knockoutOnly:true,stats:null,mappings:[],event:{id:event.tdid,title:event.title,date:beautyPoolRoster_().date,url:(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_()?'https://n01darts.com/n01/tournament/comp.php?id=':'https://n01darts.com/n01/league/season.php?id=')+encodeURIComponent(event.tdid)},stages:[['t','Slutspel 1'],['s2','Slutspel 2']].filter(([k])=>event[k+'_setting']?.tournament===1).map(([k,title])=>({title,slots:event[k+'_setting'].t_player_count})),message:'Slutspel only. Assign players to the bracket and start in Nakka Control. No pools are needed.'};
      const stats=beautyPoolStats_(auth,action==='poolload'&&input.refresh==='true'),roster=beautyPoolRoster_(),entries=beautyPoolEntries_(event);
      const bindings=action==='pooldraw'?JSON.parse(input.bindings):null,mappings=beautyPoolMappings_(roster,stats,entries,bindings);
      if(action==='poolload')return {success:true,stats,roster,mappings,event:{id:event.tdid,title:event.title,date:roster.date},stages:{stage1:event.t_setting?.tournament===1,stage2:event.s2_setting?.tournament===1},formatPreset:event.t_setting?.tournament!==1&&event.s2_setting?.tournament!==1?'preserve':props.getProperty('BEAUTY_POOL_FORMAT_PRESET')||'top2-rest',journal:props.getProperty(journalKey)?'A previous pool send is recorded. Sending again is blocked.':''};
      if(!stats.fresh||Date.now()-Date.parse(stats.fetchedAt)>=300000)beautyPoolError_('Fresh statistics required. Refresh and review again.');
      if(input.reviewed!=='true')beautyPoolError_('Review the league and event identities before drawing.');
      const draw=BeautyPoolSeeding.draw({players:mappings,sizes:JSON.parse(input.sizes),seed:parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16),eventDate:roster.date,frozenAt:new Date().toISOString(),source:{leagueId:stats.leagueId,fetchedAt:stats.fetchedAt}});
      const frozen={draw,mappings:mappings.map(p=>({id:p.id,name:p.name,lpid:p.lpid,tpid:p.tpid,linkExposed:p.linkExposed})),rosterSignature:roster.signature,date:roster.date,eventHash:beautyPoolHash_(event),statsHash:beautyPoolHash_(stats.profiles)};
      return {success:true,draw,ticket:ticketWrite(frozen),mappings:frozen.mappings};
    }
    const frozen=ticketRead(),roster=beautyPoolRoster_();
    if(roster.signature!==frozen.rosterSignature||roster.date!==frozen.date)beautyPoolError_('The IN roster or event date changed. Generate and review a new draw.');
    if(action==='pooladjust'){
      const adjusted=BeautyPoolSeeding.adjust(frozen.draw,JSON.parse(input.change));
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
      return {success:true,groupMode:beautyPoolMode_(event),unassignedEntries,ticket:ticketWrite({...frozen,ready:true,version,formatMode,boardPlan}),table,setting,format,matchSettings:{groups:setting,slutspel1:format?.set?.t_setting||event.t_setting,slutspel2:format?.set?.s2_setting||event.s2_setting},boardPlan,warnings:BeautyPoolSeeding.warnings(frozen.draw),event:{id:event.tdid,title:event.title,date:roster.date},expectedCards:table.reduce((s,g)=>s+g.filter(Boolean).length*(g.filter(Boolean).length-1)/2,0)};
    }
    if(unassignedEntries.length&&(typeof BEAUTY_POOL_UNASSIGNED_ENTRIES_VERIFIED_==='undefined'||BEAUTY_POOL_UNASSIGNED_ENTRIES_VERIFIED_!==true))beautyPoolError_('Unassigned Nakka entries need review. Compatibility with excluded OUT/STANDBY entries has not yet been verified in LIVE. Resolve event registrations explicitly before sending; no automatic removal.');
    ticketConsume(); // Consume save ticket before any external mutation.
    if(input.confirmed!=='true'||!frozen.ready||frozen.version!==version||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyPoolError_('Approved preview missing or stale. Nothing was sent.');
    // Re-authenticate and re-read the roster immediately before durable audit.
    beautyHubAuthRequire_(beautyHubRequestToken_);if(beautyPoolRoster_().signature!==roster.signature||beautyHubNakkaDate_().date!==roster.date)beautyPoolError_('Roster changed before sending.');
    audit=beautyPoolAudit_({kind:'POOL_SEND_BEFORE',uid:account.uid,draw:frozen.draw,mappings:frozen.mappings,event:beautyPoolProjection_(event),schedule,table,setting,format,version,...(boardPlan?{boardPlan}:{})});
    journal={state:'ATTEMPTED',uid:account.uid,recordedUTC:new Date().toISOString(),audit,version,drawHash:beautyPoolHash_(frozen.draw)};
    props.setProperty(journalKey,JSON.stringify(journal));if(props.getProperty(journalKey)!==JSON.stringify(journal))beautyPoolError_('Pool journal could not be saved.');
    attempted=true;
    beautyHubTransferFetch_('tournament/update',auth,{tdid:(beautyHubActiveTestTarget_().id),expect_update_time:event.updateTime,set:{...beautyPoolGroupSet_(event,setting,table),...(format?.set||{})}});
    const groups=beautyPoolEvent_(auth);beautyPoolVerify_(event,groups,setting,table,format);
    if(format){
      const assigned=beautyHubTransferFetch_('tournament/assign/update',auth,{tdid:(beautyHubActiveTestTarget_().id),assign:format.assignment});
      if(!beautyPoolEqual_(beautyPoolAssignment_(assigned.assign_setting),format.assignment))beautyPoolError_('Nakka qualification rules did not match approval.');
      beautyPoolVerify_(event,beautyPoolEvent_(auth),setting,table,format,true);
    }
    if(beautyPoolMode_(event)==='lg'){
      if(!beautyPoolEmpty_(beautyPoolSchedule_(auth,event)))beautyPoolError_('Match cards changed during sending.');
      beautyHubTransferFetch_('league/schedule/generate',auth,{tdid:(beautyHubActiveTestTarget_().id),mode:'robin'});
    }
    const after=beautyPoolEvent_(auth),cards=beautyPoolSchedule_(auth,after);beautyPoolVerify_(event,after,setting,table,format,!!format);
    if(beautyPoolMode_(event)==='lg')beautyPoolVerifyCards_(table,cards);
    const receipt=beautyPoolAudit_({kind:'POOL_SEND_READBACK',uid:account.uid,drawHash:journal.drawHash,event:beautyPoolProjection_(after),schedule:cards,beforeAudit:audit});
    journal={...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString(),receipt,readbackHash:beautyPoolHash_({event:beautyPoolProjection_(after),cards})};props.setProperty(journalKey,JSON.stringify(journal));
    if(format)try{props.setProperty('BEAUTY_POOL_FORMAT_PRESET',format.mode);}catch(e){}
    return {success:true,readbackVerified:true,audit,receipt,format,message:(format?'LIVE knockout format and qualifier rules verified. ':'')+(beautyPoolMode_(event)==='rr'?'Native Round Robin groups and placement-state readback verified. ':'LIVE groups and every round-robin match pairing verified. ')+'Entries and other event settings preserved. Event remains pre-start.'};
  }catch(e){
    return {success:false,error:attempted?'The send may be partially saved. Do not retry. Inspect LIVE groups, match cards and the audit before any further change.':(e.name==='BeautyPoolError'?e.message:'Pool Planner could not be checked. Nothing was sent.'),...(audit?{audit}:{}),uncertain:attempted};
  }finally{lock.releaseLock();}
}

/* Private, owner-run Apps Script editor reconciliation. No provider mutations.
 * Only an existing ATTEMPTED native RR send can become VERIFIED, after exact
 * comparison against its original approved audit. Never clears the send lock.
 * Trailing underscore prevents google.script.run access from a web page. */
function beautyPoolReconcileAttempt_(){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))beautyPoolError_('Another LIVE operation is running.');
 try{
  const props=PropertiesService.getScriptProperties(),key=('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id),journal=JSON.parse(props.getProperty(key)||'null');
  if(journal?.state!=='ATTEMPTED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit))beautyPoolError_('No attempted LIVE send is available for this read-only check.');
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);if(ss.getId()!==beautyLiveTarget_().sheetId)beautyPoolError_('Audit identity mismatch.');
  const sheet=ss.getSheetByName(journal.audit);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Original approval audit is unavailable.');
  const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty LIVE pool audit')beautyPoolError_('Original approval audit is invalid.');
  const before=JSON.parse(rows.slice(1).map(r=>r[1]).join(''));
  if(before.kind!=='POOL_SEND_BEFORE'||before.uid!==journal.uid||before.version!==journal.version||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!==(beautyHubActiveTestTarget_().id)||beautyPoolMode_(before.event)!=='rr'||!before.format)beautyPoolError_('Original approval does not match the attempted native Round Robin send.');
  BeautyPoolSeeding.check(before.draw);
  if(!beautyPoolEqual_(beautyPoolFormat_(before.event,before.draw,before.format.mode),before.format))beautyPoolError_('Original competition format differs from approval.');
  const roster=beautyPoolRoster_();if(roster.date!==before.draw.eventDate||roster.signature!==BeautyPoolSeeding.rosterSignature(before.draw.roster))beautyPoolError_('Roster or date changed after the attempted send.');
  const auth=beautyPoolAuth_(),current=beautyPoolEvent_(auth);
  beautyPoolVerify_(before.event,current,before.setting,before.table,before.format,true);
  const receipt=beautyPoolAudit_({kind:'POOL_SEND_READBACK',uid:journal.uid,drawHash:journal.drawHash,event:beautyPoolProjection_(current),schedule:[],beforeAudit:journal.audit,reconciled:true});
  // Re-read after receipt creation so an intervening provider edit cannot be marked verified.
  const checked=beautyPoolEvent_(auth);if(!beautyPoolEqual_(current,checked))beautyPoolError_('LIVE event changed during readback. Attempt lock retained.');
  const saved={...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString(),receipt,readbackHash:beautyPoolHash_({event:beautyPoolProjection_(checked),cards:[]}),reconciled:true};
  props.setProperty(key,JSON.stringify(saved));
  if(props.getProperty(key)!==JSON.stringify(saved))beautyPoolError_('Verification journal could not be confirmed.');
  try{props.setProperty('BEAUTY_POOL_FORMAT_PRESET',before.format.mode);}catch(e){}
  const result={success:true,readbackVerified:true,reconciled:true,providerWrites:0,audit:journal.audit,receipt,message:'Previously saved LIVE groups and knockout rules match the original approval. No Nakka change was sent.'};
  if(typeof Logger!=='undefined')Logger.log(JSON.stringify(result));return result;
 }finally{lock.releaseLock();}
}

/* Continue the same planner after reload. Start never re-sends groups. */
function beautyPoolWorkflow_(auth){
 const props=PropertiesService.getScriptProperties(),journal=JSON.parse(props.getProperty(('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id))||'null');
 if(journal?.state!=='VERIFIED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit)||!/^POOL-[a-f0-9]{20}$/.test(journal.receipt))beautyPoolError_('The saved draw is not verified. Inspect its audit before continuing.');
 const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);if(ss.getId()!==beautyLiveTarget_().sheetId)beautyPoolError_('Audit identity mismatch.');
 function read(name){const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Saved draw audit unavailable.');const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty LIVE pool audit')beautyPoolError_('Saved draw audit invalid.');return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));}
 const before=read(journal.audit),receipt=read(journal.receipt);
 if(before.kind!=='POOL_SEND_BEFORE'||receipt.kind!=='POOL_SEND_READBACK'||receipt.beforeAudit!==journal.audit||receipt.drawHash!==journal.drawHash||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!==(beautyHubActiveTestTarget_().id))beautyPoolError_('Saved draw audit does not match the verified send.');
 const event=beautyPoolEvent_(auth,true),roster=beautyPoolRoster_();
 if(before.draw.eventDate!==roster.date||BeautyPoolSeeding.rosterSignature(before.draw.roster)!==roster.signature)beautyPoolError_('Players or date changed after sending. Review before starting.');
 const pending=JSON.parse(props.getProperty(('BEAUTY_POOL_START_'+beautyHubActiveTestTarget_().id))||'null');
 const savedBoards=JSON.parse(props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id))||'null');
 const boardPlan=savedBoards?.drawHash===journal.drawHash?beautyPoolBoardPlan_(before.draw,savedBoards.input):(before.boardPlan||null);
 const result={event:{id:event.tdid,title:event.title,date:roster.date,status:event.status},audit:journal.audit,receipt:journal.receipt,draw:before.draw,format:before.format||null,boardPlan,canStart:false,running:event.status===30,startUncertain:pending?.state==='ATTEMPTED'};
 // Board edits never replace groups/results, but must still bind the saved membership.
 if(!beautyPoolEqual_(event[beautyPoolMode_(event)+'_table'],receipt.event[beautyPoolMode_(event)+'_table']))beautyPoolError_('Nakka pool membership changed. Reload and inspect before editing boards.');
 result.boardVersion=beautyPoolHash_({revision:event.updateTime,drawHash:journal.drawHash,boardPlan});
 if(event.status===30){result.canEditBoards=true;return result;}
 const normalize=t=>{const v=beautyPoolProjection_(t);if(v.assign_setting)v.assign_setting=beautyPoolAssignment_(v.assign_setting);return v;};
 if(!beautyPoolEqual_(normalize(event),normalize(receipt.event)))beautyPoolError_('Nakka changed after the verified send. Review the saved event before starting.');
 const cards=beautyPoolSchedule_(auth,event);
 if(!beautyPoolEqual_(cards,receipt.schedule))beautyPoolError_('Match cards changed after the verified send.');
 if(!before.format&&(event.t_setting?.tournament===1||event.s2_setting?.tournament===1))beautyPoolError_('Review qualification rules before starting from the Hub.');
 result.canStart=!pending;result.version=beautyPoolHash_({event,cards,roster:roster.signature,receipt:journal.receipt,boardPlan});return result;
}
function beautyPoolStart_(action,input,account,session,auth,cache){
 const expected=action==='poolstartprepare'?'':action==='poolboardplan'?(Object.prototype.hasOwnProperty.call(input||{},'boardVersion')?'boardPlan,boardVersion':'boardPlan'):'confirmed,ticket';
 if(!input||Object.keys(input).sort().join(',')!==expected||Object.values(input).some(v=>typeof v!=='string'))beautyPoolError_('Invalid Start request.');
 const props=PropertiesService.getScriptProperties(),key=('BEAUTY_POOL_START_'+beautyHubActiveTestTarget_().id);
 const workflow=beautyPoolWorkflow_(auth);
 if(action!=='poolboardplan'&&!workflow.canStart)beautyPoolError_(workflow.running?'Competition is already running.':workflow.startUncertain?'A previous Start is unverified. Inspect the event and audit; do not retry.':'Start is blocked until the saved draw is verified.');
 if(action==='poolboardplan'){
  if(!workflow.canStart&&!workflow.canEditBoards)beautyPoolError_('Board editing is unavailable until the saved event is verified.');
  if((workflow.running||input.boardVersion!==undefined)&&input.boardVersion!==workflow.boardVersion)beautyPoolError_('The event or board plan changed. Reload before saving boards.');
  const plan=beautyPoolBoardPlan_(workflow.draw,JSON.parse(input.boardPlan));
  const audit=beautyPoolAudit_({kind:'POOL_BOARD_PLAN',uid:account.uid,poolReceipt:workflow.receipt,previousPlan:workflow.boardPlan,boardVersion:workflow.boardVersion,running:workflow.running,plan});
  const fresh=beautyPoolWorkflow_(auth);if(fresh.boardVersion!==workflow.boardVersion)beautyPoolError_('The event changed during review. Reload before saving boards.');
  const journal=JSON.parse(props.getProperty(('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id)));
  const value=JSON.stringify({drawHash:journal.drawHash,input:JSON.parse(input.boardPlan),audit});props.setProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id),value);
  if(props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id))!==value)beautyPoolError_('Board plan could not be verified.');
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
  beautyHubTransferFetch_('tournament/update',auth,{tdid:(beautyHubActiveTestTarget_().id),expect_update_time:event.updateTime,set:{status:30}});
  const after=beautyPoolEvent_(auth,true),expected=beautyPoolProjection_(event);expected.status=30;
  if(!beautyPoolEqual_(expected,beautyPoolProjection_(after)))beautyPoolError_('Start readback differs from approval.');
  const receipt=beautyPoolAudit_({kind:'POOL_START_READBACK',uid:account.uid,beforeAudit:audit,poolReceipt:workflow.receipt,event:beautyPoolProjection_(after)});
  props.setProperty(key,JSON.stringify({...journal,state:'VERIFIED',receipt,verifiedUTC:new Date().toISOString()}));
  return {success:true,readbackVerified:true,audit,receipt,message:'LIVE competition started and verified. Live reads the running event.'};
 }catch(e){return {success:false,uncertain:true,audit,error:'Start may have been saved. Do not retry. Inspect the LIVE event and Start audit.'};}
}

function beautyPoolBoardPlan_(draw,input){
 if(!input||Object.keys(input).sort().join(',')!=='available,choices')beautyPoolError_('Invalid board plan.');
 return BeautyPoolBoards.matchPlan(draw.pools,input.available,input.choices);
}


function beautyHubCreateFormatMatches_(event,expected){
 for(const [key,flag]of [['rr_setting','round_robin'],['t_setting','tournament'],['s2_setting','tournament']]){
  const wanted=expected[key],actual=event[key];
  if(wanted?.[flag]===0){if(actual!=null&&actual[flag]!==0)return false;}
  else if(!wanted||!actual||!beautyPoolEqual_(actual,wanted))return false;
 }
 return true;
}

function beautyHubCreateMatchSettings_(raw,template){
 const fail=message=>{throw {reviewMessage:message};};
 if(typeof raw!=='string'||raw.length>4000)fail('Invalid match settings. Review the event setup again.');
 let input;try{input=JSON.parse(raw);}catch(e){fail('Match settings are unreadable. Review the event setup again.');}
 const object=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
 if(!object(input,['groups','stage1','stage2']))fail('Invalid match settings. Review the event setup again.');
 if(!input.groups&&!input.stage1&&!input.stage2)fail('Choose Round Robin or at least one Slutspel.');
 const integer=(n,label)=>{if(!Number.isInteger(n)||n<1||n>99)fail(label+' must be a whole number from 1 to 99.');return n;};
 const set={},summary=[];
 for(const [key,provider,title] of [['groups','rr_setting','Groups'],['stage1','t_setting','Slutspel 1'],['stage2','s2_setting','Slutspel 2']]){
  const value=input[key],knockout=key!=='groups',keys=knockout?['legs','maxDarts','finalLegs','thirdPlace','thirdPlaceLegs']:['legs','maxDarts'];
  if(value===null){set[provider]=beautyPoolCopy_(template[provider]);Object.assign(set[provider],knockout?{tournament:0,t3:0}:{round_robin:0});summary.push(title+': off');continue;}
  if(knockout&&Object.prototype.hasOwnProperty.call(value||{},'slots'))keys.push('slots');
  if(!object(value,keys))fail('Invalid '+title+' settings. Review the event setup again.');
  if(knockout&&(!input.groups||value.slots!==undefined)&&(!Number.isInteger(value.slots)||value.slots<2||value.slots>128||(value.slots&(value.slots-1))))fail(title+' bracket size must be a power of two from 2 to 128.');
  const legs=integer(value.legs,title+' legs');
  if(value.maxDarts!==null&&(!Number.isInteger(value.maxDarts)||value.maxDarts<3||value.maxDarts>297||value.maxDarts%3!==0))fail(title+' dart limit must be a multiple of 3, from 3 to 297, or disabled.');
  const limited=value.maxDarts!==null,rounds=limited?value.maxDarts/3:15;
  const setting=beautyPoolCopy_(template[provider]);
  Object.assign(setting,knockout?{tournament:1,...(value.slots!==undefined?{t_player_count:value.slots}:{})}:{round_robin:1});
  Object.assign(setting,{limit:1,limit_leg_count:legs,drawMode:0,limit_rounds:limited?1:0,rounds,game_setting:[]});
  let text=title+': first to '+legs+' '+(legs===1?'leg':'legs');
  if(knockout){
   const finalLegs=integer(value.finalLegs,title+' final legs'),thirdLegs=integer(value.thirdPlaceLegs,title+' third-place legs');
   if(typeof value.thirdPlace!=='boolean')fail(title+' third-place choice must be on or off.');
   setting.t3=value.thirdPlace&&setting.t_player_count!==2?1:0;
   const override=(round,count)=>({round,limit:1,limit_leg_count:count,drawMode:0,startScore:setting.startScore||501,match_type:setting.match_type||'01',roundLimit:limited?1:0,maxRound:rounds,overkill:setting.overkill||0});
   if(finalLegs!==legs)setting.game_setting.push(override(-1,finalLegs));
   if(setting.t3===1)setting.game_setting.push(override(-3,thirdLegs));
   text+=' · Final: first to '+finalLegs+' · Third place: '+(setting.t3===1?'first to '+thirdLegs:'off')+(!input.groups||value.slots!==undefined?' · '+setting.t_player_count+' bracket slots':' · Bracket size automatic from pool qualifiers');
  }
  text+=' · '+(limited?value.maxDarts+' darts per player per leg ('+rounds+' rounds)':'No dart limit');
  set[provider]=setting;summary.push(text);
 }
 const stages=[input.stage1?'Slutspel 1':'',input.stage2?'Slutspel 2':''].filter(Boolean).join(' and ');
 return {set,summary,format:input.groups?(stages?'Round Robin + '+stages:'Round Robin only'):stages+' only'};
}

/* Explicit find-or-create review. Changing the date never creates an event. */

function beautyHubEveningSnapshot_(auth){
 const found=beautyHubNakkaEvent_({});if(found.status!=='MATCHED')throw {reviewMessage:found.message||'Find the evening event first.'};
 const event=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(found.event.id),auth).tournament,date=beautyHubNakkaDate_().date;
 if(event?.tdid!==found.event.id||event.title!==found.event.title||(event.lgid||'')!==(''+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+'')||event.team_games!==0||!Number.isFinite(event.updateTime)||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==date)throw Error('event');
 const config={},rows=[],enabled=[];let supported=true;
 for(const [key,provider,title,flag]of [['groups','rr_setting','Groups','round_robin'],['stage1','t_setting','Slutspel 1','tournament'],['stage2','s2_setting','Slutspel 2','tournament']]){
  const s=event[provider];if(s?.[flag]!==1){config[key]=null;rows.push({title,text:'Off'});continue;}enabled.push(title);
  const overrides=s.game_setting||[],baseLimit=s.limit_rounds??0,maxDarts=baseLimit===1?s.rounds*3:null;
  const valid=Number.isInteger(s.limit_leg_count)&&s.limit_leg_count>=1&&s.limit_leg_count<=99&&s.limit===1&&(s.drawMode??0)===0&&[0,1].includes(baseLimit)&&(maxDarts===null||Number.isInteger(maxDarts)&&maxDarts>=3&&maxDarts<=297)&&Array.isArray(overrides)&&overrides.every(r=>key!=='groups'&&[-1,-3].includes(r.round)&&(r.limit??1)===1&&(r.drawMode??0)===0&&(r.roundLimit??baseLimit)===baseLimit&&(baseLimit===0||(r.maxRound??s.rounds)===s.rounds));
  supported=supported&&valid;
  const final=Array.isArray(overrides)?overrides.find(r=>r.round===-1):null,bronze=Array.isArray(overrides)?overrides.find(r=>r.round===-3):null;
  config[key]={legs:s.limit_leg_count,maxDarts,...(key==='groups'?{}:{finalLegs:final?.limit_leg_count||s.limit_leg_count,thirdPlace:s.t3===1,thirdPlaceLegs:bronze?.limit_leg_count||s.limit_leg_count,slots:s.t_player_count})};
  let text=s.limit===1?'First to '+s.limit_leg_count+' '+(s.limit_leg_count===1?'leg':'legs'):s.limit===2?'First to '+s.limit_set_count+' sets · '+s.limit_set_leg_count+' legs per set':'Native match schedule';
  text+=' · '+(maxDarts===null?'No dart limit':maxDarts+' darts per player per leg ('+s.rounds+' rounds)');
  if(key!=='groups')text+=' · Final: '+config[key].finalLegs+' legs · Third place: '+(s.t3===1?config[key].thirdPlaceLegs+' legs':'off')+(config.groups?' · Bracket size automatic from pool qualifiers':' · '+s.t_player_count+' bracket slots');
  if(!valid)text+=' · Additional native rules';rows.push({title,text});
 }
 const format=(config.groups?'Round Robin':'')+((config.stage1||config.stage2)?(config.groups?' + ':'')+[config.stage1?'Slutspel 1':'',config.stage2?'Slutspel 2':''].filter(Boolean).join(' and '):'')+(config.groups&&!config.stage1&&!config.stage2?' only':'');
 const props=PropertiesService.getScriptProperties(),pending=JSON.parse(props.getProperty('BEAUTY_EVENT_SETTINGS_'+event.tdid)||'null');
 const played=Object.keys(event).some(k=>/_(table|result|rank)$/.test(k)&&!beautyPoolEmpty_(event[k]));
 const blocked=found.creationReviewRequired?'Verify the existing event below before changing settings.':pending?.state==='ATTEMPTED'?'A settings change is unverified. Inspect Nakka before another save.':![10,20,25].includes(event.status)?'The event has started or finished. Edit match settings in Nakka Control.':played||props.getProperty('BEAUTY_POOL_SEND_'+event.tdid)?'Pools or brackets have been sent. Use Nakka Control for later changes.':!supported?'This event has additional native match rules. Edit them in Nakka Control.':'';
 const groups=event.rr_table?.filter(g=>Array.isArray(g)&&g.some(Boolean)).length||0;
 const view={creationReviewRequired:found.creationReviewRequired===true,event:{id:event.tdid,title:event.title,date,status:({10:'Preparing',20:'Accepting entries',25:'Building brackets',30:'In session',40:'Completed'})[event.status]||'Unknown',url:found.event.url},format,rows,config,editable:!blocked,blocked,registered:Array.isArray(event.entry_list)?event.entry_list.length:null,pools:groups?groups+' saved groups':'No pools sent',boardNote:'Physical boards are reviewed in Pool Planner; Nakka controls live match assignment.',checkedAt:new Date().toISOString()};
 return {event,date,view,version:beautyPoolHash_(event)};
}

function beautyHubEveningSetup_(action,input){
 beautyHubTestGuard_();const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,error:'Another event operation is running.'};let attempted=false;
 const fail=message=>{throw {reviewMessage:message};};
 try{
  beautyQueueWriteGuard_(null,true);
  const account=beautyHubAuthRequire_(beautyHubRequestToken_),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache(),auth=beautyPoolAuth_(),session=beautyPoolHash_(account.sessionBinding||beautyHubRequestToken_);
  const fields={read:'',prepare:'settings,version',confirm:'confirmed,ticket'}[action];if(fields===undefined||!input||Object.keys(input).sort().join(',')!==fields||Object.values(input).some(v=>typeof v!=='string'||v.length>6000))fail('Invalid evening settings request.');
  const snapshot=beautyHubEveningSnapshot_(auth);
  if(action==='read')return {success:true,setup:snapshot.view,version:snapshot.version};
  if(!snapshot.view.editable)fail(snapshot.view.blocked);
  if(action==='prepare'){
   if(input.version!==snapshot.version)fail('The event settings changed. Reload Evening Setup and review again.');
   const fallback={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01',limit_rounds:0,rounds:15,game_setting:[],schedule:[]};
   const template={rr_setting:snapshot.event.rr_setting||{...fallback,round_robin:0,robin_count:1,robin_player_count:4,point_w:2,point_d:1,point_l:0},t_setting:snapshot.event.t_setting||{...fallback,tournament:0,t_player_count:16,t3:0},s2_setting:snapshot.event.s2_setting||{...fallback,tournament:0,t_player_count:16,t3:0}};
   const configured=beautyHubCreateMatchSettings_(input.settings,template),ticket=Utilities.getUuid().replace(/-/g,'');
   cache.put(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+ticket,JSON.stringify({uid:account.uid,session,eventId:snapshot.event.tdid,date:snapshot.date,version:snapshot.version,set:configured.set,summary:configured.summary,format:configured.format,expires:Date.now()+300000}),300);
   return {success:true,ticket,title:snapshot.event.title,date:snapshot.date,format:configured.format,summary:configured.summary};
  }
  const saved=JSON.parse(cache.get(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket)||'null');
  if(input.confirmed!=='true'||!saved||saved.uid!==account.uid||saved.session!==session||saved.eventId!==snapshot.event.tdid||saved.date!==snapshot.date||saved.version!==snapshot.version||Date.now()>=saved.expires)fail('Review expired or settings changed. Reload and review again.');
  cache.remove(('beauty-evening:'+(typeof beautyHubLeagueId_==='function'?beautyHubLeagueId_():'lg_M2wQ_4189')+':')+input.ticket);beautyHubAuthRequire_(beautyHubRequestToken_);
  const audit=beautyPoolAudit_({kind:'EVENT_SETTINGS_BEFORE',uid:account.uid,eventId:saved.eventId,date:saved.date,version:saved.version,before:{rr_setting:snapshot.event.rr_setting||null,t_setting:snapshot.event.t_setting||null,s2_setting:snapshot.event.s2_setting||null},set:saved.set,summary:saved.summary});
  if(beautyHubEveningSnapshot_(auth).version!==saved.version)fail('The event changed during review. Nothing saved.');
  if(Date.now()>=saved.expires)fail('Review expired. Review the changes again.');
  const key='BEAUTY_EVENT_SETTINGS_'+saved.eventId,journal=JSON.stringify({state:'ATTEMPTED',audit,uid:account.uid,eventId:saved.eventId,date:saved.date});props.setProperty(key,journal);if(props.getProperty(key)!==journal)throw Error('journal');
  attempted=true;beautyHubAuthRequire_(beautyHubRequestToken_);
  beautyHubTransferFetch_('tournament/update',auth,{tdid:saved.eventId,expect_update_time:snapshot.event.updateTime,set:saved.set});
  const after=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(saved.eventId),auth).tournament;
  if(!after||!beautyHubCreateFormatMatches_(after,saved.set))throw Error('settings');
  const stable=e=>{const v=beautyPoolCopy_(e);delete v.updateTime;for(const k of ['rr_setting','t_setting','s2_setting'])delete v[k];for(const k of ['t3_table','s2_3_table'])if(beautyPoolEmpty_(v[k]))delete v[k];return v;};
  if(!beautyPoolEqual_(stable(snapshot.event),stable(after))||beautyHubNakkaDate_().date!==saved.date)throw Error('readback');
  const receipt=beautyPoolAudit_({kind:'EVENT_SETTINGS_READBACK',uid:account.uid,beforeAudit:audit,eventId:saved.eventId,date:saved.date,set:saved.set});const verified=JSON.stringify({state:'VERIFIED',audit,receipt,eventId:saved.eventId,date:saved.date});props.setProperty(key,verified);if(props.getProperty(key)!==verified)throw Error('receipt');
  return {success:true,readbackVerified:true,audit,receipt,message:'Evening settings saved and verified in Nakka. Reload Pool Planner before making a new draw.'};
 }catch(e){return {success:false,uncertain:attempted,error:attempted?'Settings save is unverified. Do not retry. Inspect Nakka and the settings audit.':e.reviewMessage||'Evening Setup could not be checked. Reload and try again.'};}
 finally{lock.releaseLock();}
}

/* One-time owner-authorised LIVE copy cleanup. No Nakka write routes. */

function beautyStagePlanLive(){
 beautyHubTestGuard_();
 try{
  const props=PropertiesService.getScriptProperties(),journal=JSON.parse(props.getProperty(('BEAUTY_POOL_SEND_'+beautyHubActiveTestTarget_().id))||'null');
  if(journal?.state!=='VERIFIED'||!/^POOL-[a-f0-9]{20}$/.test(journal.audit)||!/^POOL-[a-f0-9]{20}$/.test(journal.receipt))return null;
  // Cache only already-verified public metadata; any saved-plan version change gets a new key.
  const key='BEAUTY_STAGE_PLAN_V1_'+beautyPoolHash_({journal,boards:props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id)),labels:props.getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))});
  let cache=null;try{if(typeof CacheService!=='undefined')cache=CacheService.getScriptCache();const hit=cache?.get(key);if(hit)return JSON.parse(hit);}catch(e){}
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);
  function read(name){const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()>100)return null;const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty LIVE pool audit')return null;return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));}
  const before=read(journal.audit),receipt=read(journal.receipt);
  if(before?.kind!=='POOL_SEND_BEFORE'||receipt?.kind!=='POOL_SEND_READBACK'||receipt.beforeAudit!==journal.audit||receipt.drawHash!==journal.drawHash||beautyPoolHash_(before.draw)!==journal.drawHash||before.event?.tdid!==(beautyHubActiveTestTarget_().id)||!Array.isArray(before.draw?.pools)||!Array.isArray(before.mappings))return null;
  const rr=before.event.rr_setting?.round_robin===1,lg=before.event.lg_setting?.league===1;
  if(rr===lg)return null;
  const mode=rr?'rr':'lg';
  const saved=JSON.parse(props.getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))||'null');
  const boardSaved=JSON.parse(props.getProperty(('BEAUTY_POOL_BOARDS_'+beautyHubActiveTestTarget_().id))||'null');
  const boardPlan=boardSaved?.drawHash===journal.drawHash?beautyPoolBoardPlan_(before.draw,boardSaved.input):before.boardPlan;
  const pools=before.draw.pools.map((pool,i)=>{
   const ids=pool.players.map(p=>before.mappings.find(q=>q.id===p.id)?.tpid);
   if(ids.some(id=>typeof id!=='string'||!/^[A-Za-z0-9]{4}$/.test(id))||new Set(ids).size!==ids.length||JSON.stringify(ids)!==JSON.stringify(before.table?.[i]?.filter(Boolean)))throw Error('Audit mismatch');
   const known=pool.players.map(p=>p.average).filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=180),label=saved?.drawHash===journal.drawHash?saved.labels?.[i]:null;
   const boards=boardPlan?.assignments?.find(a=>a.poolId===pool.id)?.boards;
   return {id:mode+'_'+i,ids,boards:Array.isArray(boards)?boards:null,startAverage:known.length?known.reduce((a,b)=>a+b,0)/known.length:null,coverage:known.length,board:Number.isInteger(boards?.[0])?boards[0]:Number.isInteger(label?.board)?label.board:null,group:Number.isInteger(label?.group)?label.group:null};
  });
  const result={eventId:(beautyHubActiveTestTarget_().id),eventDate:before.draw.eventDate,frozenAt:before.draw.frozenAt,drawHash:journal.drawHash,pools};
  try{cache?.put(key,JSON.stringify(result),60);}catch(e){}
  return result;
 }catch(e){return null;}
}
/* Organiser-only labels, isolated from Nakka assignments and audit baselines. */

function beautyStageLabelsLive(token,labels){
 beautyHubTestGuard_();beautyHubAuthRequire_(token);
 const plan=beautyStagePlanLive();
 if(!plan||!Array.isArray(labels)||labels.length!==plan.pools.length||labels.length>101)throw Error('Verified cast plan unavailable.');
 const seen=new Set();
 const safe=labels.map((p,i)=>{if(!p||Object.keys(p).sort().join(',')!=='board,group,ids'||JSON.stringify(p.ids?.slice().sort())!==JSON.stringify(plan.pools[i].ids.slice().sort())||!Number.isInteger(p.board)||p.board<1||p.board>1000||!Number.isInteger(p.group)||p.group<1||p.group>101||seen.has(p.board+':'+p.group))throw Error('Cast labels do not match verified pools.');seen.add(p.board+':'+p.group);return {board:p.board,group:p.group};});
 beautyHubAuthRequire_(token);const current=beautyStagePlanLive();if(current?.drawHash!==plan.drawHash)throw Error('Verified plan changed.');
 const text=JSON.stringify({drawHash:plan.drawHash,labels:safe});PropertiesService.getScriptProperties().setProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id),text);
 if(PropertiesService.getScriptProperties().getProperty(('BEAUTY_STAGE_LABELS_'+beautyHubActiveTestTarget_().id))!==text)throw Error('Cast labels could not be verified.');return {success:true};
}

/* Staff opener owns this short-lived request context; public casts only read the verified binding. */
