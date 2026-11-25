/* Staff-only provisional ratings. Append-only workbook history; no Nakka writes. */
var BeautyRatingCore=(function(){
 const need=(v,m)=>{if(!v)throw Error(m);};
 function average(v){need(typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=180,'Enter an average greater than 0 and no more than 180.');return v;}
 function effective(record,official){
  if(record?.state==='PROVISIONAL')return {average:record.estimate,source:record.estimate===null?'UNRATED':'ESTIMATED',reason:record.estimate===null?'Unrated — waiting for first completed event':'Estimated — waiting for first completed event'};
  return {average:official??record?.finalAverage??null,source:official!=null||record?.finalAverage!=null?'NAKKA':'UNRATED',reason:official!=null||record?.finalAverage!=null?'':'No verified average'};
 }
 function completed(record,evidence,now){
  if(record.state!=='PROVISIONAL')return record;
  const valid=evidence&&evidence.leagueId===record.leagueId&&evidence.lpid===record.lpid&&evidence.status===40&&evidence.participated===true&&Number.isFinite(evidence.score)&&evidence.score>=0&&Number.isInteger(evidence.darts)&&evidence.darts>0&&3*evidence.score/evidence.darts<=180&&typeof evidence.eventId==='string'&&Number.isFinite(evidence.revision);
  if(!valid)return {...record,confirmation:null};
  const proof=JSON.stringify([evidence.eventId,evidence.revision,evidence.score,evidence.darts]);
  if(record.confirmation?.proof!==proof||now<record.confirmation.at)return {...record,confirmation:{proof,at:now}};
  if(now-record.confirmation.at<60000)return record;
  return {...record,state:'VERIFIED',finalAverage:3*evidence.score/evidence.darts,firstCompletedEvent:evidence.eventId,verifiedAt:new Date(now).toISOString(),confirmation:null};
 }
 return Object.freeze({average,effective,completed});
})();
function beautyRatingsScope_(){
 beautyLiveLoginGuard_();beautyContextAssert_();const t=beautyLiveTarget_();beautyReleaseContextGuard_(t);
 if(t.mode!=='league')throw Error('Player estimates in this Hub require the league player identity. AIK Internal keeps its separate rating store.');
 return {sheetId:t.sheetId,leagueId:t.leagueId,eventId:t.eventId};
}
function beautyRatingsRead_(scope){
 const ss=SpreadsheetApp.openById(scope.sheetId),sh=ss.getSheetByName('PLAYER RATINGS');
 if(!sh)return {sheet:null,records:{}};
 const rows=sh.getDataRange().getValues();
 if(JSON.stringify(rows[0])!==JSON.stringify(['BEAUTY_PLAYER_RATINGS_V1','Record JSON']))throw Error('PLAYER RATINGS layout needs review.');
 const records={};
 for(const row of rows.slice(1)){
  if(!row[0]&&!row[1])continue;
  const r=JSON.parse(row[1]);
  if(r.schema!==1||r.sheetId!==scope.sheetId||typeof r.leagueId!=='string'||!/^[A-Za-z0-9]{4}$/.test(r.lpid)||row[0]!==r.leagueId+':'+r.lpid||!['PROVISIONAL','VERIFIED'].includes(r.state)||!Number.isInteger(r.version)||r.version<1)throw Error('Rating history needs review.');
  if(!Array.isArray(r.events)||r.events.length>100||r.events.some(e=>!/^t_[A-Za-z0-9_]+$/.test(e)))throw Error('Invalid rating event history.');
  if(r.estimate!==null)BeautyRatingCore.average(r.estimate);
  if(r.state==='VERIFIED'&&(!Number.isFinite(r.finalAverage)||r.finalAverage<0||r.finalAverage>180))throw Error('Invalid verified average.');
  const old=records[row[0]];if(r.version!==(old?.version||0)+1)throw Error('Rating history revision mismatch.');records[row[0]]=r;
 }
 return {sheet:sh,records};
}
function beautyRatingsAppend_(scope,record,expected,guard){
 guard();const current=beautyRatingsRead_(scope),key=scope.leagueId+':'+record.lpid,old=current.records[key];
 if((old?.version||0)!==expected)throw Error('This average changed in another session. Reload before saving.');
 let sh=current.sheet;if(!sh){sh=SpreadsheetApp.openById(scope.sheetId).insertSheet('PLAYER RATINGS');sh.appendRow(['BEAUTY_PLAYER_RATINGS_V1','Record JSON']);}
 const next={...record,schema:1,sheetId:scope.sheetId,leagueId:scope.leagueId,version:expected+1},raw=JSON.stringify(next);
 if(raw.length>40000)throw Error('Rating history entry is too large.');
 guard();sh.appendRow([key,raw]);SpreadsheetApp.flush();
 if(sh.getRange(sh.getLastRow(),2).getValue()!==raw)throw Error('Rating save reply is uncertain. Reload before retrying.');return next;
}
function beautyRatingsProvider_(){
 const scope=beautyRatingsScope_(),profiles=beautyPoolProfiles_(null);
 const response=beautyLiveRegistrationApi_('league/stats?lgid='+scope.leagueId+'&kind=stats_list');
 const stats=response.stats;
 if(!stats||typeof stats!=='object'||Array.isArray(stats)&&stats.length)throw Error('Statistics unavailable; estimates retained.');
 return {scope,profiles,stats};
}
function beautyRatingsOfficial_(s){
 if(!s)return null;
 if(!Number.isFinite(s.score)||s.score<0||!Number.isInteger(s.darts)||s.darts<0||s.a!==0||s.acnt!==0)throw Error('Statistics need source review.');
 const n=s.darts?3*s.score/s.darts:null;if(n!==null&&n>180)throw Error('Invalid Nakka average.');return n;
}
function beautyRatingsEvent_(scope,eventId,lpid){
 if(!/^t_[A-Za-z0-9_]+$/.test(eventId))throw Error('Invalid recorded event identity.');
 const event=beautyLiveRegistrationApi_('tournament/get?tdid='+eventId).tournament;
 if(!event||event.tdid!==eventId||event.lgid!==scope.leagueId||event.team_games!==0||!Number.isFinite(event.updateTime)||!Array.isArray(event.entry_list))throw Error('First-event identity could not be verified.');
 const matches=event.entry_list.filter(e=>e.lpid===lpid);if(matches.length>1)throw Error('Ambiguous first-event player identity.');
 if(!matches.length)return {leagueId:scope.leagueId,lpid,eventId,status:event.status,participated:false,revision:event.updateTime};
 const stats=beautyLiveRegistrationApi_('tournament/stats?tdid='+eventId+'&kind=stats_list').stats;
 if(!stats||typeof stats!=='object')throw Error('Event statistics unavailable.');
 const s=stats[matches[0].tpid];
 const official=beautyRatingsOfficial_(s);
 const after=beautyLiveRegistrationApi_('tournament/get?tdid='+eventId).tournament;
 if(!after||after.tdid!==event.tdid||after.lgid!==event.lgid||after.status!==event.status||after.updateTime!==event.updateTime)throw Error('Event changed while reading statistics; estimate retained.');
 return {leagueId:scope.leagueId,lpid,eventId,status:event.status,participated:official!==null,score:s?.score??0,darts:s?.darts??0,revision:event.updateTime};
}
function beautyRatingsService_(action,input,token){
 let lock;const prior=beautyHubRequestToken_;beautyHubRequestToken_=token;
 try{
  const guard=()=>{beautyHubAuthRequire_(token);if(input?._context!==beautyContextToken_())throw Error('The event changed. Reopen Player averages.');};guard();
  const provider=beautyRatingsProvider_(),scope=provider.scope;
  if(!['list','save'].includes(action))throw Error('Unsupported rating action.');
  if(action==='save'){
   if(Object.keys(input).some(k=>!['_context','lpid','estimate','version'].includes(k))||!Number.isInteger(input.version)||input.version<0)throw Error('Invalid rating request.');
   const matches=provider.profiles.filter(p=>p.lpid===input.lpid);if(matches.length!==1)throw Error('Player identity unavailable. Wait for registration to finish.');
   const estimate=input.estimate===null?null:BeautyRatingCore.average(input.estimate);
   const before=beautyRatingsRead_(scope).records[scope.leagueId+':'+input.lpid];
   if(before?.state==='VERIFIED')throw Error('This player already has a verified average.');
   const official=beautyRatingsOfficial_(provider.stats[input.lpid]);
   // A late estimate is permitted only if all recorded darts belong to this open event.
   if(!before&&official!==null){const e=beautyRatingsEvent_(scope,scope.eventId,input.lpid),s=provider.stats[input.lpid];if(e.status===40||!e.participated||e.score!==s.score||e.darts!==s.darts)throw Error('Existing results need review; an estimate cannot overwrite an established average.');}
   lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('Hub is busy. Try saving again.');guard();
   const record=before||{state:'PROVISIONAL',lpid:input.lpid,name:matches[0].name,events:[scope.eventId],createdAt:new Date().toISOString(),confirmation:null};
   beautyRatingsAppend_(scope,{...record,estimate,editedBy:beautyHubAuthRequire_(token).uid,editedAt:new Date().toISOString()},input.version,guard);
   lock.releaseLock();lock=null;
  }
  const records=beautyRatingsRead_(scope).records;
  return {success:true,context:input._context,players:provider.profiles.map(p=>{const r=records[scope.leagueId+':'+p.lpid],official=beautyRatingsOfficial_(provider.stats[p.lpid]);return {id:p.lpid,name:p.name,...BeautyRatingCore.effective(r,official),estimate:r?.estimate??null,version:r?.version||0,editable:r?.state!=='VERIFIED',firstCompletedEvent:r?.firstCompletedEvent||null};})};
 }catch(e){return {success:false,error:e.message};}finally{if(lock)lock.releaseLock();beautyHubRequestToken_=prior;}
}
function beautyRatingsApply_(stats){
 const scope=beautyRatingsScope_(),records=beautyRatingsRead_(scope).records;
 const apply=p=>({...p,...BeautyRatingCore.effective(records[scope.leagueId+':'+p.lpid],p.average)});
 return {...stats,profiles:(stats.profiles||[]).map(apply),identityProfiles:(stats.identityProfiles||stats.profiles||[]).map(apply)};
}
function beautyRatingsBackground_(){
 beautyCombinedBackgroundRequire_();const scope=beautyRatingsScope_(),key='BEAUTY_RATINGS_SCAN_'+scope.sheetId+'_'+scope.leagueId,p=PropertiesService.getScriptProperties();
 if(Date.now()-Number(p.getProperty(key)||0)<120000)return {state:'NOT_DUE'};
 p.setProperty(key,String(Date.now()));
 const records=Object.values(beautyRatingsRead_(scope).records).filter(r=>r.leagueId===scope.leagueId&&r.state==='PROVISIONAL');
 if(!records.length)return {state:'IDLE'};
 // Round-robin cursor keeps all provisional players eligible without delaying registration work.
 const cursor=Number(p.getProperty(key+'_CURSOR')||0)%records.length,r=records[cursor];p.setProperty(key+'_CURSOR',String(cursor+1));
 let next=JSON.parse(JSON.stringify(r));
 const current=beautyRatingsEvent_(scope,scope.eventId,r.lpid);
 if(current.participated&&!next.events.includes(scope.eventId))next.events.push(scope.eventId);
 for(const eventId of next.events){
  const e=eventId===scope.eventId?current:beautyRatingsEvent_(scope,eventId,r.lpid);
  if(e.status===40&&!e.participated)continue;
  next=BeautyRatingCore.completed(next,e,Date.now());
  // An earlier event with recorded darts must finish before later events can qualify.
  if(e.participated||next.confirmation||next.state==='VERIFIED')break;
 }
 if(JSON.stringify(next)===JSON.stringify(r))return {state:'WAITING'};
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {state:'BUSY'};
 try{beautyRatingsAppend_(scope,next,r.version,()=>{beautyCombinedBackgroundRequire_();if(beautyRatingsScope_().sheetId!==scope.sheetId)throw Error('Rating context changed.');});}finally{lock.releaseLock();}
 return {state:next.state};
}
