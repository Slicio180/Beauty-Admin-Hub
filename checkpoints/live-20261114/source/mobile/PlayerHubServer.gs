/* Read-only Player Hub. No user-selected API URLs or administrative fields. */
function beautyPlayerRead_(path){
 const r=UrlFetchApp.fetch('https://api.n01darts.com/api/v1/'+path,{method:'get',muteHttpExceptions:true,followRedirects:false});
 if(r.getResponseCode()!==200)throw Error('Nakka kunde inte nås.');
 const data=JSON.parse(r.getContentText());if(data.result!==0)throw Error('Statistiken är inte tillgänglig.');return data;
}
function getBeautyPlayerHub(){
 const c=getRegistrationDisplayContext();
 if(!c?.success||!c.eventId||!c.eventContext)throw Error('Tävlingen kunde inte verifieras.');
 if(typeof CacheService==='undefined')return beautyPlayerBuild_(c);
 const cache=CacheService.getScriptCache();
 const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,c.eventId+'|'+c.eventContext);
 const key='playerhub-v4:'+Utilities.base64EncodeWebSafe(digest);
 const read=()=>{try{const text=cache.get(key),v=text?JSON.parse(text):null;return v?.context?.eventId===c.eventId&&v.context.eventContext===c.eventContext?v:null;}catch(e){return null;}};
 const cached=read();if(cached)return cached;
 const lock=LockService.getScriptLock();if(!lock.tryLock(4000))throw Error('Uppdatering pågår. Försök snart igen.');
 try{const hit=read();if(hit)return hit;const out=beautyPlayerBuild_(c),text=JSON.stringify(out);if(!out.errors.length&&Utilities.newBlob(text).getBytes().length<90000)try{cache.put(key,text,30);}catch(e){}return out;}finally{lock.releaseLock();}
}
function beautyPlayerBuild_(c){
 if(!c?.success||!/^t_[A-Za-z0-9_]{1,80}$/.test(c.eventId))throw Error('Tävlingen kunde inte verifieras.');
 const players=getTonightsPlayerNames(c.eventContext);
 const out={context:c,players,stages:null,ranking:null,eventStats:null,liveMatches:null,errors:[],fetchedAt:new Date().toISOString()};
 try{
  const before=beautyPlayerRead_('tournament/get?tdid='+c.eventId),t=before.tournament;
  if(t?.tdid!==c.eventId||t.team_games!==0||!Number.isFinite(t.t_date)||Utilities.formatDate(new Date(t.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==c.eventDate)throw Error('Fel tävling.');
  out.profiles=(t.entry_list||[]).filter(p=>typeof p.tpid==='string'&&typeof p.name==='string').map(p=>({id:'event:'+c.eventId+':'+p.tpid,eventEntryId:p.tpid,name:p.name}));
  const lgid=t.lgid||'';if(lgid&&!/^lg_[A-Za-z0-9_]{1,80}$/.test(lgid))throw Error('Fel liga.');
  for(const p of out.profiles){const entry=(t.entry_list||[]).find(e=>e.tpid===p.eventEntryId);if(lgid&&typeof entry?.lpid==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(entry.lpid)&&(t.entry_list||[]).filter(e=>e.lpid===entry.lpid).length===1){p.eventScopedId=p.id;p.id='league:'+lgid+':'+entry.lpid;}}
  try{
   const hasPools=(t.rr_table||[]).some(x=>x.length)||(t.lg_table||[]).some(x=>x.length);
   const standings=hasPools?beautyPlayerRead_('tournament/standings?tdid='+c.eventId):{result:0,tdid:c.eventId,groups:[]};
   const schedule=(t.lg_table||[]).some(x=>x.length)?beautyPlayerRead_('league/schedule/get?tdid='+c.eventId):null;
   const after=beautyPlayerRead_('tournament/get?tdid='+c.eventId);
   if(!Number.isFinite(t.updateTime)||after.tournament?.updateTime!==t.updateTime)throw Error('Tävlingen ändrades.');
   out.stages=BeautyNakkaStages.project(after,standings,schedule,c.eventId,lgid);
   for(const kind of ['rr','lg']){
    const pools=out.stages.pools.filter(p=>p.id.startsWith(kind+'_'));if(!pools.length)continue;
    let groupStats=null;try{groupStats=beautyPlayerRead_('tournament/stats?tdid='+c.eventId+'&kind='+kind+'_stats_list').stats;}catch(e){out.errors.push('Gruppsnitt kunde inte hämtas.');}
    for(const pool of pools)beautyPlayerPool_(pool,t,kind,groupStats);
   }
  }catch(e){out.errors.push('Spelresultaten kunde inte hämtas.');}
  try{
   const response=beautyPlayerRead_('tournament/stats?tdid='+c.eventId+'&kind=stats_list');
   if(response.tdid&&response.tdid!==c.eventId)throw Error('Fel statistik.');
   const stats=response.stats;
   if(!stats||typeof stats!=='object'||(Array.isArray(stats)&&stats.length))throw Error('Ofullständig statistik.');
   out.eventStats=out.profiles.map(p=>beautyPlayerStats_(p,stats[p.eventEntryId]));
  }catch(e){out.errors.push('Tävlingsstatistiken kunde inte hämtas.');}
  try{
   const listed=beautyPlayerRead_('match/list?tdid='+c.eventId+'&live=1&count=100');
   if(!Array.isArray(listed.list)||listed.list.length>32)throw Error('Matchlistan kunde inte verifieras.');
   out.liveMatches=[];
   for(const m of listed.list){
    if(m.tdid!==c.eventId)throw Error('Fel tävling i matchlistan.');
    if(m.endMatch===1)continue;
    if(typeof m.mid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(m.mid))throw Error('Fel match-ID.');
    const live=beautyPlayerRead_('match/live?mid='+encodeURIComponent(m.mid));
    const projected=beautyPlayerLive_(live,c.eventId,m.mid,out.profiles,out.stages);
    if(projected)out.liveMatches.push(projected);
   }
  }catch(e){out.liveMatches=null;out.errors.push('Pågående matcher kunde inte hämtas.');}
  if(lgid)try{
   const events=beautyPlayerRead_('league/tournament/list?lgid='+lgid).list;
   const titles=new Map((Array.isArray(events)?events:[]).filter(e=>e.lgid===lgid).map(e=>[e.tdid,e.title]));
   const profiles=beautyPlayerRead_('league/entry/list?lgid='+lgid).list;
   const stats=beautyPlayerRead_('league/stats?lgid='+lgid+'&kind=stats_list').stats;
   const ranks=beautyPlayerRead_('league/stats?lgid='+lgid+'&kind=rank_list').stats;
   if(!Array.isArray(profiles)||profiles.length>=1000||!stats||!ranks)throw Error('Ofullständig statistik.');
   const seen=new Set();out.ranking=profiles.map(p=>{
    if(typeof p.lpid!=='string'||seen.has(p.lpid)||typeof p.name!=='string')throw Error('Otydlig spelare.');seen.add(p.lpid);
    const s=stats[p.lpid],rr=ranks[p.lpid];let points=null,average=null;
    const results=rr?Object.entries(rr).map(([id,v])=>{if(!Number.isFinite(v.pt))throw Error('Fel poäng.');return {eventId:id,title:titles.get(id)||id,points:v.pt};}):[];
    if(rr)points=results.reduce((sum,x)=>sum+x.points,0);
    if(s&&s.a===0&&s.acnt===0&&Number.isFinite(s.score)&&s.score>=0&&Number.isFinite(s.darts)&&s.darts>0){average=3*s.score/s.darts;if(average>180)average=null;}
    const linked=(t.entry_list||[]).filter(e=>e.lpid===p.lpid);
    return {name:p.name,points,average,results,profileId:linked.length===1?out.profiles.find(p=>p.eventEntryId===linked[0].tpid)?.id||null:null};
   }).sort((a,b)=>(b.points??-Infinity)-(a.points??-Infinity)||a.name.localeCompare(b.name,'sv'));
  }catch(e){out.ranking=null;out.errors.push('Ligarankingen kunde inte hämtas.');}
 }catch(e){out.errors.push('Nakka-data kunde inte verifieras.');}
 const end=getRegistrationDisplayContext();
 if(end.eventContext!==c.eventContext||end.eventId!==c.eventId)throw Error('Tävlingen har ändrats. Uppdatera sidan.');
 // Context allowlist: do not return arbitrary bridge fields.
 out.context={eventId:c.eventId,eventContext:c.eventContext,eventDate:c.eventDate,eventTitle:c.eventTitle,brand:c.brand};
 return out;
}

// Fields verified against n01_t_stats.js (provider stats page), 2026-11-09.
function beautyPlayerStats_(p,s){
 const count=v=>Number.isInteger(v)&&v>=0?v:null;
 let average=null;
 if(s){
  if(Number.isFinite(s.darts)&&s.darts>0&&Number.isFinite(s.score)&&s.score>=0){average=3*s.score/s.darts;if(s.a>0)average=Number.isInteger(s.acnt)&&s.acnt>=0?(average+s.a)/(s.acnt+1):null;}
  else if(Number.isFinite(s.a)&&s.a>0&&Number.isInteger(s.acnt)&&s.acnt>0)average=s.a/s.acnt;
  if(!Number.isFinite(average)||average<0||average>180)average=null;
 }
 return {profileId:p.id,name:p.name,available:!!s,played:count(s?.match),won:count(s?.winMatch),legs:count(s?.leg),legsWon:count(s?.winLeg),average,
  ton100:count(s?.ton00),ton140:count(s?.ton40),ton180:count(s?.ton80),highOut:count(s?.highOut)};
}

function beautyPlayerPool_(pool,t,kind,all){
 const index=Number(pool.id.slice(3)),label=t[kind+'_title']?.[index];pool.title=typeof label==='string'&&label.trim()?label.trim().slice(0,100):'GRUPP '+pool.number;
 for(const p of pool.players){
  const stats=all?.[index]?.[p.id];p.average=stats&&Number.isFinite(stats.s)&&stats.s>=0&&Number.isFinite(stats.d)&&stats.d>0?3*stats.s/stats.d:null;
  if(p.average>180)p.average=null;
  const row=pool.matrix?.find(r=>r.id===p.id),complete=row?.cells.filter(c=>c.state==='result');
  p.legsWon=null;p.legsLost=null;
  if(t[kind+'_setting']?.limit===1&&row&&!row.cells.some(c=>c.state==='multiple')){p.legsWon=complete.reduce((a,c)=>a+c.score,0);p.legsLost=complete.reduce((a,c)=>a+c.opponentScore,0);}
 }
}
function beautyPlayerLive_(r,eventId,mid,profiles,stages){
 if(r?.result!==0||r.tdid!==eventId||r.mid!==mid)throw Error('Fel live-match.');
 if(r.end_match===1)return null;
 if(r.end_match!==0||r.match_type&&r.match_type!=='01'||!Array.isArray(r.players)||r.players.length!==2||r.players[0].tpid===r.players[1].tpid)throw Error('Matchformat stöds inte.');
 const n=v=>Number.isFinite(v)&&v>=0?v:null;
 const sides=r.players.map((v,i)=>{const p=profiles.find(p=>p.eventEntryId===v.tpid);if(!p)throw Error('Okänd matchspelare.');return {id:p.eventEntryId,name:p.name,profileId:p.id,legs:n(r.legs?.[i]),remaining:n(r.leg?.left?.[i]),average:n(r.stats?.[i]?.avg)};});
 const pool=r.ttype==='rr'||r.ttype==='lg'?(stages?.pools||[]).find(p=>p.id.startsWith(r.ttype+'_')&&sides.every(s=>p.players.some(p=>p.id===s.id))):null;
 let board=null;
 for(const stage of stages?.knockouts||[])if(stage.kind===r.ttype){const matches=stage.rounds.flatMap(r=>r.matches).concat(stage.thirdPlace?[stage.thirdPlace]:[]);const found=matches.filter(m=>sides.every(s=>[m.left.id,m.right.id].includes(s.id)));if(found.length===1)board=found[0].board?.text||null;}
 return {mid,groupId:pool?.id||null,label:pool?.title||(board?'Bana '+board:'Pågående match'),left:sides[0],right:sides[1],updatedAt:n(r.updateTime),thrower:r.leg?.end===0&&[0,1].includes(r.leg.thrower)?r.leg.thrower:null};
}

// Read-only personalization enrichment. Registration is submitted exactly once by the bridge.
function beautyPersonaliseRegistration_(saved,input){
 // The fixed Hub bridge already verified the queue's Nakka identity.
 // Never build rankings/statistics on the registration response path.
 if(saved?.success!==true||saved.nakka?.entryConfirmed!==true)return saved;
 const identity=saved.playerHubIdentity;
 if(saved.registrationEventContext!==input._context||saved.registrationEventDate!==input.eventDate||!identity||!/^t_[A-Za-z0-9_]+$/.test(identity.eventId)||typeof identity.id!=='string'||!/^(league|event):[A-Za-z0-9_-]+:[A-Za-z0-9_-]{1,80}$/.test(identity.id))delete saved.playerHubIdentity;
 return saved;
}

function getBeautyPersonalPage(id){
 if(typeof id!=='string'||!/^(league|event):[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(id))throw Error('Ogiltig spelare.');
 const data=beautyPlayerBuild_(getRegistrationDisplayContext());if(!(data.profiles||[]).some(p=>p.id===id))throw Error('Välj spelare för den nya tävlingen.');
 const template=HtmlService.createTemplateFromFile('PlayerHub');template.registrationUrl=ScriptApp.getService().getUrl()+'?page=remote';
 return template.evaluate().getContent().replace('</head>','<script>window.BEAUTY_OPEN_PROFILE='+JSON.stringify(id)+';</script></head>');
}
