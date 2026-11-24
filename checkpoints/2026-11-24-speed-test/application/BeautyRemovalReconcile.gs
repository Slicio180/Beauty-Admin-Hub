/* Complete only removal-owned source cells after independently verified
 * provider absence. No provider mutation and no reconstruction of old intent.
 */
function beautyLiveRemovalAuthority_(player){
 const key=beautyLiveRegistrationKey_,c=beautyLiveTarget_(),p=PropertiesService.getScriptProperties();
 const rows=beautyQueueRead_().filter(j=>j.event.eventId===c.eventId&&key(j.player)===key(player));
 const recovery=beautyRecoveryJobs_().filter(j=>j.event.eventId===c.eventId&&key(j.player)===key(player));
 return beautyLiveRemoveHash_({queue:rows,recovery});
}
function beautyLiveRemovalPlan_(x){
 const need=(ok,code)=>{if(!ok)throw Error(code);},eq=beautyRecoverySame_,key=beautyLiveRegistrationKey_;
 const r=x.receipt,b=x.backup,s=b?.state,c=x.context,a=x.current,o=s?.snap;
 need(r?.recoveryVersion===1&&r.state==='ATTEMPTED','REMOVE_LEGACY_REVIEW');
 need(c.mode==='league'&&eq(c,r.context)&&c.sheetId===r.sheetId&&r.event?.id===c.eventId&&r.event.date===c.date,'REMOVE_CONTEXT_CHANGED');
 need(b&&b.player===r.player&&b.uid===r.uid&&s?.journal===x.journal&&s.version===r.version&&eq(s.event,r.event)&&eq(s.identity,r.identity)&&r.tpid===(s.entry?.tpid||null),'REMOVE_BACKUP_REVIEW');
 need(beautyLiveRemoveHash_(b)===r.backupHash&&beautyLiveRemoveHash_({snap:s.snap,event:s.event,identity:s.identity,entry:s.entry,fullEntries:s.fullEntries})===r.version,'REMOVE_BACKUP_REVIEW');
 need(x.authority===r.authority,'REMOVE_LATER_OPERATION');
 for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"]){
  need(a?.[title]&&o?.[title]&&a[title].id===o[title].id&&['values','display','formulas','formats'].every(f=>Array.isArray(a[title][f])&&eq(a[title][f][0],o[title][f][0])),'REMOVE_LAYOUT_REVIEW');
 }
 need(eq(a.Control,o.Control),'REMOVE_CONTEXT_CHANGED');
 need(eq(a["TONIGHT'S PLAYERS"].formulas,o["TONIGHT'S PLAYERS"].formulas)&&eq(a["TONIGHT'S PLAYERS"].formats,o["TONIGHT'S PLAYERS"].formats),'REMOVE_LAYOUT_REVIEW');
 const status=a['PLAYER STATUS DATA'],response=a['Form responses 2'],oldStatus=o['PLAYER STATUS DATA'],oldResponse=o['Form responses 2'],si=s.stored?.i;
 need(Number.isInteger(si)&&si>=1&&Array.isArray(s.registrations)&&s.registrations.length>0&&s.registrations.length<=99,'REMOVE_BACKUP_REVIEW');
 need(eq(s.stored.v,oldStatus.display[si])&&key(oldStatus.values[si]?.[0])===key(r.player),'REMOVE_BACKUP_REVIEW');
 need(!status.formulas.some(row=>row.some(Boolean))&&!response.formulas.some(row=>row.some(Boolean)),'REMOVE_LAYOUT_REVIEW');
 const aliases=new Set([key(r.player),key(oldStatus.values[si][1])].filter(Boolean));
 const matches=row=>aliases.has(key(row[1]==='MITT NAMN FINNS INTE I LISTAN'?row[2]:row[1]));
 const indices=new Set(s.registrations.map(v=>v.i));
 need(indices.size===s.registrations.length,'REMOVE_BACKUP_REVIEW');
 const date=x.dateSerial,start=x.startSerial;
 need(Number.isFinite(date)&&Number.isFinite(start)&&start<date+1,'REMOVE_CONTEXT_CHANGED');
 for(const [i,row] of response.values.entries())if(i>0&&!indices.has(i)&&matches(row)){
  const serial=x.responseSerials[i];need(Number.isFinite(serial)&&!(serial>=start&&serial<date+1),'REMOVE_LATER_REGISTRATION');
 }
 const statusMatches=status.values.map((row,i)=>({row,i})).slice(1).filter(v=>aliases.has(key(v.row[0]))||v.row[1]&&aliases.has(key(v.row[1])));
 need(statusMatches.length===1&&statusMatches[0].i===si&&eq(status.values[si].slice(0,2),oldStatus.values[si].slice(0,2)),'REMOVE_IDENTITY_CHANGED');
 const masterMatches=snap=>snap["PLAYER'S MASTER LIST"].values.slice(1).filter(row=>key(row[0])===key(r.player));
 need(masterMatches(o).length<=1&&eq(masterMatches(a),masterMatches(o)),'REMOVE_IDENTITY_CHANGED');
 const ranges=[];
 for(const v of s.registrations){
  const i=v.i;need(Number.isInteger(i)&&i>=1&&eq(v.v,oldResponse.values[i])&&matches(v.v),'REMOVE_BACKUP_REVIEW');
  need(response.values[i]?.length===6&&eq(response.formulas[i],oldResponse.formulas[i])&&eq(response.formats[i],oldResponse.formats[i]),'REMOVE_LAYOUT_REVIEW');
  for(const col of [0,3,4,5])need(eq(response.values[i][col],oldResponse.values[i][col]),'REMOVE_PLAYER_CHANGED');
  ranges.push({title:'Form responses 2',row:i,column:1,width:2});
 }
 need(status.values[si]?.length===6&&eq(status.formulas[si],oldStatus.formulas[si])&&eq(status.formats[si],oldStatus.formats[si]),'REMOVE_LAYOUT_REVIEW');
 ranges.push({title:'PLAYER STATUS DATA',row:si,column:2,width:4});
 for(const v of ranges){
  const current=a[v.title].values[v.row].slice(v.column,v.column+v.width),original=o[v.title].values[v.row].slice(v.column,v.column+v.width);
  need(current.every((value,i)=>value===''||eq(value,original[i])),'REMOVE_PLAYER_CHANGED');
 }
 const e=x.provider?.event,entries=x.provider?.entries,league=x.provider?.league;
 need(e&&e.tdid===c.eventId&&e.lgid===c.leagueId&&e.title===r.event.title&&e.status===r.event.status&&[10,20].includes(e.status)&&x.provider.date===c.date,'REMOVE_EVENT_CHANGED');
 need(Array.isArray(entries)&&Array.isArray(league)&&league.length<1000,'REMOVE_PROVIDER_UNAVAILABLE');
 need(!entries.some(v=>v.tpid===r.tpid||aliases.has(key(v.name))||r.identity.lpid&&v.lpid===r.identity.lpid),'REMOVE_ENTRY_STILL_PRESENT');
 const identities=league.filter(v=>key(v.name)===key(r.player)||v.lpid===r.identity.lpid);
 need(identities.length===1&&identities[0].name===r.identity.name&&identities[0].lpid===r.identity.lpid,'REMOVE_IDENTITY_CHANGED');
 const contains=(v,id)=>v===id||Array.isArray(v)&&v.some(n=>contains(n,id))||v&&typeof v==='object'&&Object.entries(v).some(([k,n])=>k===id||contains(n,id));
 need(!r.tpid||!Object.keys(e).some(k=>(k==='table'||k.endsWith('_table'))&&contains(e[k],r.tpid)),'REMOVE_BRACKET_REVIEW');
 return ranges.filter(v=>a[v.title].values[v.row].slice(v.column,v.column+v.width).some(value=>value!==''));
}
function beautyLiveRemovalRead_(r){
 const context=beautyBackgroundScope_(),ss=SpreadsheetApp.openById(context.sheetId),snap=beautyLiveRemoveSnapshot_(ss);
 const backup=beautyRecoveryRecordRead_(r.backup,'REMOVE');if(!backup)throw Error('REMOVE_BACKUP_REVIEW');
 let event,entries,league;
 try{
  event=beautyLiveRegistrationApi_('tournament/get?tdid='+context.eventId).tournament;
  entries=beautyLiveRemoveEntries_(beautyLiveRegistrationApi_('tournament/entry/list?tdid='+context.eventId));
  league=beautyLiveRegistrationApi_('league/entry/list?lgid='+context.leagueId).list;
 }catch(e){throw Error('REMOVE_PROVIDER_UNAVAILABLE');}
 return {receipt:r,backup,journal:backup.state?.journal,context,current:JSON.parse(JSON.stringify(snap)),authority:beautyLiveRemovalAuthority_(r.player),
  dateSerial:beautyLiveRemoveSerial_(snap.Control.values[1][0],ss.getSpreadsheetTimeZone()),startSerial:beautyLiveRemoveSerial_(snap.Control.values[1][1],ss.getSpreadsheetTimeZone()),
  responseSerials:snap['Form responses 2'].values.map((row,i)=>{if(!i||row.every(v=>v===''||v===null))return null;try{return beautyLiveRemoveSerial_(row[0],ss.getSpreadsheetTimeZone());}catch(e){return null;}}),
  provider:{event,entries,league,date:event&&Number.isFinite(event.t_date)?Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd'):null}};
}
function beautyLiveRemovalReconcile_(ref,raw,actor,automatic){
 const p=PropertiesService.getScriptProperties(),r=JSON.parse(raw),context=beautyBackgroundScope_();let owned=raw,journal;
 const guard=()=>{beautyContextAssert_();if(!beautyRecoverySame_(beautyBackgroundScope_(),context)||p.getProperty(ref)!==owned||p.getProperty(BEAUTY_QUEUE_LEASE_))throw Error('REMOVE_CONTEXT_CHANGED');if(automatic)beautyCombinedBackgroundRequire_();};
 const save=()=>{guard();const value=JSON.stringify(r);p.setProperty(journal,value);if(p.getProperty(journal)!==value)throw Error('REMOVE_SAVE_UNCERTAIN');p.setProperty(ref,value);owned=value;if(p.getProperty(ref)!==value)throw Error('REMOVE_SAVE_UNCERTAIN');};
 try{
  guard();if(r.recoveryVersion!==1||r.context?.revision!==context.revision)throw Error('REMOVE_LEGACY_REVIEW');
  const backup=beautyRecoveryRecordRead_(r.backup,'REMOVE');journal=backup?.state?.journal;
  if(!journal||p.getProperty(journal)!==raw)throw Error('REMOVE_RECEIPT_CHANGED');
  if(automatic&&((r.recovery?.attempts||0)>=3||r.recovery?.nextAt>Date.now()))throw Error('REMOVE_RETRY_LIMIT');
  r.recovery={attempts:(r.recovery?.attempts||0)+1,state:'CHECKING',nextAt:Date.now()+120000};save();
  const before=beautyLiveRemovalRead_(r),ranges=beautyLiveRemovalPlan_(before);guard();
  const latest=beautyLiveRemovalRead_(r),latestRanges=beautyLiveRemovalPlan_(latest);guard();
  if(!beautyRecoverySame_(before.current,latest.current)||!beautyRecoverySame_(ranges,latestRanges))throw Error('REMOVE_PLAYER_CHANGED');
  const ss=SpreadsheetApp.openById(context.sheetId);
  // One atomic, fixed-cell clear; a lost reply is read back and never re-sent
  // within this attempt. Later attempts may only clear original-or-empty cells.
  if(ranges.length){const requests=ranges.map(v=>({updateCells:{range:{sheetId:before.current[v.title].id,startRowIndex:v.row,endRowIndex:v.row+1,startColumnIndex:v.column,endColumnIndex:v.column+v.width},rows:[{values:Array.from({length:v.width},()=>({}))}],fields:'userEnteredValue'}}));try{beautyEventSheets_(':batchUpdate',{requests});}catch(e){}SpreadsheetApp.flush();}
  guard();const afterSource=beautyLiveRemovalRead_(r);if(beautyLiveRemovalPlan_(afterSource).length)throw Error('REMOVE_SAVE_UNCERTAIN');
  const wanted=JSON.parse(JSON.stringify(before.current));for(const v of ranges)for(let k=0;k<v.width;k++)for(const field of ['values','display'])wanted[v.title][field][v.row][v.column+k]='';
  for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])if(!beautyRecoverySame_(wanted[title],afterSource.current[title]))throw Error('REMOVE_PRESERVATION_REVIEW');
  const rows=ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,99,2).getDisplayValues(),status=afterSource.current['PLAYER STATUS DATA'].values.slice(1),key=beautyLiveRegistrationKey_;
  if(rows.some(v=>key(v[0]||v[1])===key(r.player)))throw Error('REMOVE_DISPLAY_PENDING');
  const values=rows.map(v=>{const name=key(v[0]||v[1]);if(!name)return [''];const matches=status.filter(s=>key(s[0])===name);if(matches.length!==1||!['IN','OUT','STANDBY'].includes(matches[0][2]))throw Error('REMOVE_DISPLAY_REVIEW');return [matches[0][2]];});
  guard();ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
  const final=beautyLiveRemovalRead_(r);if(beautyLiveRemovalPlan_(final).length)throw Error('REMOVE_SAVE_UNCERTAIN');
  for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])if(!beautyRecoverySame_(wanted[title],final.current[title]))throw Error('REMOVE_PRESERVATION_REVIEW');
  const shown=final.current["TONIGHT'S PLAYERS"].display.slice(1,100);
  if(!shown.every((v,i)=>{
   if(v[0]!==rows[i][0]||v[1]!==rows[i][1]||v[2]!==values[i][0])return false;
   const name=key(v[0]||v[1]);if(!name)return v.slice(2).every(cell=>cell==='');
   const matches=status.filter(s=>key(s[0])===name);
   return matches.length===1&&v[3]===String(matches[0][3])&&v[4]===String(matches[0][4])&&v[5]===String(matches[0][5]);
  }))throw Error('REMOVE_DISPLAY_PENDING');
  guard();r.state='VERIFIED';r.verifiedUTC=new Date().toISOString();r.recovery={...r.recovery,state:'COMPLETE',code:'REMOVAL_VERIFIED'};save();
  p.setProperty('BEAUTY_LIVE_REMOVE_LAST',owned);p.deleteProperty(ref);if(p.getProperty(ref)!==null)throw Error('REMOVE_SAVE_UNCERTAIN');
  return {success:true,outcome:'COMPLETE',reference:journal,player:r.player,nakkaWrites:0,message:'Removal verified. The original provider deletion was not repeated.'};
 }catch(e){
  if(journal&&p.getProperty(ref)===owned&&r.state==='ATTEMPTED'){
   const retry=['REMOVE_PROVIDER_UNAVAILABLE','REMOVE_SAVE_UNCERTAIN','REMOVE_DISPLAY_PENDING'].includes(e.message);
   r.recovery={...r.recovery,state:retry&&(r.recovery?.attempts||0)<3?'RETRY_WAIT':'NEEDS_HELP',code:/^REMOVE_[A-Z_]+$/.test(e.message||'')?e.message:'REMOVE_CHECK_UNAVAILABLE'};
   try{save();}catch(ignored){}
  }
  return {success:false,outcome:'REVIEW',code:/^REMOVE_[A-Z_]+$/.test(e.message||'')?e.message:'REMOVE_CHECK_UNAVAILABLE',error:'The saved removal still needs review. Changed player data was preserved; no Nakka deletion was repeated.'};
 }
}
