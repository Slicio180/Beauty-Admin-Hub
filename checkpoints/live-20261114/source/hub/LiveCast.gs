/* Owner-only LIVE player display. Keep deployment access MYSELF.
 * Feed exposes only names/display statistics. It never calls Nakka or writes a roster.
 * Statistics refresh requires the existing Hub staff session and uses GET only.
 */
const BEAUTY_CAST_PREFIX_ = 'BEAUTY_LIVE_CAST_V1_';
function beautyCastKey_(name){return String(name||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
function beautyCastRoster_(){
  const ranges=["'Control'!A2:B2","'TONIGHT''S PLAYERS'!A2:B","'Form responses 2'!A2:C"];
  const data=beautyLiveSheetsRead_('/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==3)throw Error('Incomplete cast roster.');
  const control=data.valueRanges[0].values?.[0]||[],date=beautyLiveDate_(control[0]);
  if(date!==beautyLiveTarget_().date)throw Error('Selected LIVE date changed.');
  const end=Date.parse(date+'T00:00:00Z')/86400000+25569+1,start=control[1],times=new Map();
  // Exactly the Control reset-to-event window used by the roster formula.
  // Serial timestamps are only used for ordering, never displayed as UTC times.
  if(typeof start==='number'&&Number.isFinite(start)&&start<end){
    for(const row of data.valueRanges[2].values||[]){
      if(typeof row[0]!=='number'||!Number.isFinite(row[0])||row[0]<start||row[0]>=end)continue;
      const name=String(row[1]||'').trim()==='MITT NAMN FINNS INTE I LISTAN'?row[2]:row[1],key=beautyCastKey_(name);
      if(key&&(!times.has(key)||row[0]<times.get(key)))times.set(key,row[0]);
    }
  }
  const seen=new Set(),players=[];
  for(const row of data.valueRanges[1].values||[]){
    const name=String(row[0]||row[1]||'').trim();if(!name)continue;
    const key=beautyCastKey_(name);
    if(name.length>200||/[\x00-\x1f\x7f]/.test(name)||seen.has(key))throw Error('Ambiguous cast roster.');
    seen.add(key);players.push({name,registeredAt:times.has(key)?times.get(key):null});
  }
  return {date,players};
}
function beautyCastSnapshot_(value){
  const p=PropertiesService.getScriptProperties(),key=BEAUTY_CAST_PREFIX_+beautyLiveTarget_().leagueId+'_STATS';
  if(value){
    const old=JSON.parse(p.getProperty(key)||'null'),text=JSON.stringify(value),n=Math.ceil(text.length/1800),id=Utilities.getUuid().replace(/-/g,'');
    if(n>100)throw Error('Cast statistics too large.');
    for(let i=0;i<n;i++)p.setProperty(key+'_'+id+'_'+i,text.slice(i*1800,(i+1)*1800));
    p.setProperty(key,JSON.stringify({id,n}));
    if(old)for(let i=0;i<old.n;i++)p.deleteProperty(key+'_'+old.id+'_'+i);
    return value;
  }
  try{
    const pointer=JSON.parse(p.getProperty(key)||'null');if(!pointer||!Number.isInteger(pointer.n)||pointer.n<1||pointer.n>100)return null;
    let text='';for(let i=0;i<pointer.n;i++){const part=p.getProperty(key+'_'+pointer.id+'_'+i);if(part===null)return null;text+=part;}
    const snapshot=JSON.parse(text),at=Date.parse(snapshot.fetchedAt),age=Date.now()-at;
    if(snapshot.leagueId!==beautyLiveTarget_().leagueId||!Array.isArray(snapshot.profiles)||!Number.isFinite(age)||age<0||age>=604800000)return null;
    return {...snapshot,fresh:age<300000&&!p.getProperty(BEAUTY_CAST_PREFIX_+'FAILED')};
  }catch(e){return null;}
}
function beautyCastNormalizeStats_(profiles,stats,ranking){
  if(Array.isArray(stats)&&!stats.length)stats={};if(Array.isArray(ranking)&&!ranking.length)ranking={};
  if(!stats||typeof stats!=='object'||Array.isArray(stats)||!ranking||typeof ranking!=='object'||Array.isArray(ranking))throw Error('Unsupported league statistics.');
  if(!Array.isArray(profiles)||profiles.length>=1000)throw Error('Incomplete league identities.');
  const ids=new Set();
  return profiles.map(p=>{
    if(!p||typeof p.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(p.lpid)||ids.has(p.lpid)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||/[\x00-\x1f\x7f]/.test(p.name))throw Error('Ambiguous league identities.');
    ids.add(p.lpid);const s=stats[p.lpid],rank=ranking[p.lpid];let average=null,points=null;
    if(s){
      if(!Number.isFinite(s.score)||s.score<0||!Number.isFinite(s.darts)||s.darts<0||!Number.isFinite(s.a)||!Number.isFinite(s.acnt))throw Error('Unsupported score totals.');
      if(s.a===0&&s.acnt===0&&s.darts>0){average=3*s.score/s.darts;if(average>180)throw Error('Invalid three-dart average.');}
    }
    if(rank){
      const values=Object.values(rank);if(values.some(v=>!v||!Number.isFinite(v.pt)))throw Error('Unsupported ranking points.');
      points=values.reduce((sum,v)=>sum+v.pt,0);
      if(s&&(!Number.isFinite(s.pt)||s.pt!==points))throw Error('Ranking totals disagree.');
    }
    return {name:p.name,average,points};
  });
}
function beautyLiveRefreshStats(token){
  beautyLiveLoginGuard_();beautyHubAuthRequire_(token);
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {success:false};
  try{
    beautyHubAuthRequire_(token);
    const p=PropertiesService.getScriptProperties(),attempt=Number(p.getProperty(BEAUTY_CAST_PREFIX_+'ATTEMPT')||0);
    if(Date.now()-attempt<60000)return {success:true,limited:true};
    p.setProperty(BEAUTY_CAST_PREFIX_+'ATTEMPT',String(Date.now()));
    try{
      beautyCastRoster_();
      const id=beautyLiveTarget_().leagueId;if(beautyContextStandalone_())return {success:true,fresh:false,statsAvailable:false};
      const league=beautyLiveRegistrationApi_('league/get?lgid='+id).league;
      if(league?.lgid!==id||typeof league.title!=='string')throw Error('League mismatch.');
      const profiles=beautyLiveRegistrationApi_('league/entry/list?lgid='+id).list;
      const stats=beautyLiveRegistrationApi_('league/stats?lgid='+id+'&kind=stats_list').stats;
      const ranks=beautyLiveRegistrationApi_('league/stats?lgid='+id+'&kind=rank_list').stats;
      const qualified=beautyCastNormalizeStats_(profiles,stats,ranks);
      beautyHubAuthRequire_(token);
      const snapshot=beautyCastSnapshot_({leagueId:id,fetchedAt:new Date().toISOString(),profiles:qualified});
      p.deleteProperty(BEAUTY_CAST_PREFIX_+'FAILED');
      return {success:true,fresh:true,fetchedAt:snapshot.fetchedAt};
    }catch(e){p.setProperty(BEAUTY_CAST_PREFIX_+'FAILED',String(Date.now()));return {success:false,fresh:false};}
  }finally{lock.releaseLock();}
}
function beautyLiveCastData(){
  beautyLiveLoginGuard_();
  const c=beautyLiveTarget_(),roster=beautyCastRoster_(),snapshot=c.mode==='league'?beautyCastSnapshot_():null;
  const event={id:c.eventId,title:c.title,date:c.date};
  beautyContextAssert_();
  return {success:true,brand:beautyLiveBrand_(),eventId:c.eventId,leagueId:c.leagueId,eventContext:c.revision,eventDate:roster.date,eventTitle:event.title,updatedAt:new Date().toISOString(),rankingAvailable:!!snapshot&&roster.players.some(p=>{const matches=snapshot.profiles.filter(q=>beautyCastKey_(q.name)===beautyCastKey_(p.name));return matches.length===1&&Number.isFinite(matches[0].points);}),rankingMethod:'League points descending; equal points alphabetical',
    statsAvailable:!!snapshot,statsStale:!!snapshot&&!snapshot.fresh,statsFetchedAt:snapshot?.fetchedAt||null,
    players:roster.players.map(p=>{
      const matches=snapshot?snapshot.profiles.filter(q=>beautyCastKey_(q.name)===beautyCastKey_(p.name)):[],profile=matches.length===1?matches[0]:null;
      return {name:p.name,registeredAt:p.registeredAt,rank:null,points:profile?.points??null,average:profile?.average??null};
    })};
}
function beautyLiveCastUrl(token){
  beautyLiveLoginGuard_();beautyHubAuthRequire_(token);
  const checked=beautyLiveEventRead_();
  if(checked?.status!=='MATCHED'||checked.event?.id!==beautyLiveTarget_().eventId||checked.eventDate!==beautyLiveTarget_().date)throw Error('LIVE event mismatch.');
  beautyCastRoster_();beautyHubAuthRequire_(token);
  PropertiesService.getScriptProperties().setProperty(BEAUTY_CAST_PREFIX_+'EVENT',JSON.stringify({id:checked.event.id,title:checked.event.title,date:checked.eventDate}));
  const url=ScriptApp.getService().getUrl();
  if(typeof url!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/(dev|exec)$/.test(url))throw Error('Open the deployed Hub URL first.');
  return url+'?page=live';
}
