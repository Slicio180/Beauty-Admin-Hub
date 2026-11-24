/* Selected-event TEST removal reconciliation. Provider access is GET-only.
 * Never replays deletion, appends a registration or changes a permanent profile.
 */
function beautyRemovalRecoveryEqual_(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function beautyRemovalRecoveryInsist_(ok,code){if(!ok)throw Error(code);}
function beautyRemovalRecoveryPlan_(x,hash){
 const eq=beautyRemovalRecoveryEqual_,need=beautyRemovalRecoveryInsist_,key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const r=x.receipt,b=x.backup,s=b?.state,c=x.context,current=x.current;
 need(r?.recoveryVersion===1&&['ATTEMPTED','VERIFIED'].includes(r.state),'REMOVE_LEGACY_REVIEW');
 need(c?.mode==='league'&&eq(r.context,c)&&r.sheetId===c.sheetId&&r.event?.id===c.eventId&&r.event?.date===c.date,'REMOVE_CONTEXT_CHANGED');
 need(b?.player===r.player&&b.uid===r.uid&&s?.journal===x.journal&&s.version===r.version&&eq(s.event,r.event)&&eq(s.identity,r.identity)&&(s.entry?.tpid||null)===r.tpid,'REMOVE_BACKUP_REVIEW');
 need(hash({snap:s.snap,event:s.event,identity:s.identity,entry:s.entry,fullEntries:s.fullEntries})===r.version,'REMOVE_BACKUP_REVIEW');
 need(x.transferHash===r.transferHash&&x.registrationHash===r.registrationHash,'REMOVE_LATER_OPERATION');
 const titles=['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"];
 for(const title of titles){const a=current?.[title],o=s.snap?.[title];need(a&&o&&a.id===o.id&&['values','display','formulas','formats'].every(f=>Array.isArray(a[f])&&Array.isArray(o[f])&&eq(a[f][0],o[f][0])),'REMOVE_LAYOUT_REVIEW');}
 need(eq(current.Control,s.snap.Control),'REMOVE_CONTEXT_CHANGED');
 const shown=current["TONIGHT'S PLAYERS"],oldShown=s.snap["TONIGHT'S PLAYERS"];
 need(eq(shown.formulas,oldShown.formulas)&&eq(shown.formats,oldShown.formats),'REMOVE_LAYOUT_REVIEW');
 const ri=s.registration?.i,si=s.stored?.i,oldResponse=s.snap['Form responses 2'],oldStatus=s.snap['PLAYER STATUS DATA'],responses=current['Form responses 2'],status=current['PLAYER STATUS DATA'];
 need(Number.isInteger(ri)&&ri>=1&&Number.isInteger(si)&&si>=1&&eq(s.registration.v,oldResponse.values[ri])&&eq(s.stored.v,oldStatus.display[si]),'REMOVE_BACKUP_REVIEW');
 need(typeof oldResponse.values[ri]?.[0]==='string'&&Number.isFinite(Date.parse(oldResponse.values[ri][0])),'REMOVE_BACKUP_REVIEW');
 need(key(oldStatus.values[si]?.[0])===key(r.player)&&['IN','OUT','STANDBY'].includes(oldStatus.values[si][2]),'REMOVE_BACKUP_REVIEW');
 const aliases=new Set([key(r.player),key(oldStatus.values[si][1])].filter(Boolean)),matchesName=row=>aliases.has(key(row[1]))||aliases.has(key(row[2]));
 need(matchesName(oldResponse.values[ri]),'REMOVE_BACKUP_REVIEW');
 need(!responses.formulas.some(row=>row.some(Boolean))&&!status.formulas.some(row=>row.some(Boolean)),'REMOVE_LAYOUT_REVIEW');
 for(const [a,o,i]of [[responses,oldResponse,ri],[status,oldStatus,si]])need(a.values[i]&&a.values[i].length===6&&eq(a.formulas[i],o.formulas[i])&&eq(a.formats[i],o.formats[i]),'REMOVE_LAYOUT_REVIEW');
 need(responses.values.every((row,i)=>i===0||i===ri||!matchesName(row)),'REMOVE_LATER_REGISTRATION');
 const found=status.values.map((row,i)=>({row,i})).slice(1).filter(v=>aliases.has(key(v.row[0]))||aliases.has(key(v.row[1])));
 need(found.length===1&&found[0].i===si&&eq(status.values[si].slice(0,2),oldStatus.values[si].slice(0,2)),'REMOVE_IDENTITY_CHANGED');
 need(current["PLAYER'S MASTER LIST"].values.slice(1).filter(row=>key(row[0])===key(r.player)).length===1,'REMOVE_IDENTITY_CHANGED');
 for(const col of [0,3,4,5])need(eq(responses.values[ri][col],oldResponse.values[ri][col]),'REMOVE_PLAYER_CHANGED');
 const ranges=[];
 for(const [title,row,column,width,old]of [['Form responses 2',ri,1,2,oldResponse],['PLAYER STATUS DATA',si,2,4,oldStatus]]){
  const before=current[title].values[row].slice(column,column+width),original=old.values[row].slice(column,column+width);
  need(before.every((v,i)=>v===''||eq(v,original[i])),'REMOVE_PLAYER_CHANGED');
  if(before.some(v=>v!==''))ranges.push({title,sheetId:current[title].id,row:row+1,column:column+1,width,before,after:Array(width).fill('')});
 }
 const event=x.provider?.event,entries=x.provider?.entries,league=x.provider?.league;
 need(event?.tdid===c.eventId&&event.lgid===c.leagueId&&event.title===r.event.title&&event.status===r.event.status&&[10,20].includes(event.status)&&x.provider.date===c.date,'REMOVE_EVENT_CHANGED');
 need(Array.isArray(entries)&&Array.isArray(league)&&league.length<1000,'REMOVE_PROVIDER_UNAVAILABLE');
 need(league.every(e=>e&&typeof e.name==='string'&&e.name.trim()&&/^[A-Za-z0-9]{4}$/.test(e.lpid||''))&&new Set(league.map(e=>e.lpid)).size===league.length,'REMOVE_PROVIDER_UNAVAILABLE');
 need(!entries.some(e=>e.tpid===r.tpid||aliases.has(key(e.name))||r.identity.lpid&&e.lpid===r.identity.lpid),'REMOVE_ENTRY_STILL_PRESENT');
 const profiles=league.filter(e=>key(e.name)===key(r.player)||e.lpid===r.identity.lpid);
 need(profiles.length===1&&profiles[0].name===r.identity.name&&profiles[0].lpid===r.identity.lpid,'REMOVE_IDENTITY_CHANGED');
 const contains=(value,id)=>value===id||Array.isArray(value)&&value.some(v=>contains(v,id))||value&&typeof value==='object'&&Object.entries(value).some(([k,v])=>k===id||contains(v,id));
 need(!r.tpid||!Object.keys(event).some(k=>(k==='table'||k.endsWith('_table'))&&contains(event[k],r.tpid)),'REMOVE_BRACKET_REVIEW');
 if(r.state==='VERIFIED')need(ranges.length===0,'REMOVE_LATER_REGISTRATION');
 return {player:r.player,journal:x.journal,backup:r.backup,event:r.event,ranges,context:c,nakkaWrites:0,masterWrites:0};
}
function beautyRemovalRecoveryExecute_(io){
 const eq=beautyRemovalRecoveryEqual_,need=beautyRemovalRecoveryInsist_;
 // Claim a bounded attempt before any provider read, including failed reads.
 io.begin();
 const before=io.read(),fresh=beautyRemovalRecoveryPlan_(before,io.hash);
 if(before.receipt.state==='VERIFIED'){io.check(before);need(io.displayVerified(before),'REMOVE_DISPLAY_PENDING');io.finish(before);return io.result(before,false);}
 io.check(before);
 if(fresh.ranges.length)io.clear(fresh.ranges,before);
 io.refresh(before);
 const after=io.read(),complete=beautyRemovalRecoveryPlan_(after,io.hash);need(complete.ranges.length===0,'REMOVE_SAVE_UNCERTAIN');
 const wanted=JSON.parse(JSON.stringify(before.current));
 for(const range of fresh.ranges)for(let col=0;col<range.width;col++)for(const field of ['values','display'])wanted[range.title][field][range.row-1][range.column-1+col]='';
 for(const title of Object.keys(wanted)){
  if(title==="TONIGHT'S PLAYERS")need(eq(after.current[title].formulas,wanted[title].formulas)&&eq(after.current[title].formats,wanted[title].formats),'REMOVE_LAYOUT_REVIEW');
  else need(eq(after.current[title],wanted[title]),'REMOVE_PRESERVATION_REVIEW');
 }
 io.check(after);need(io.displayVerified(after),'REMOVE_DISPLAY_PENDING');io.finish(after);return io.result(after,true);
}
function beautyRemovalRecoveryList_(){
 beautyHubTestGuard_();const c=beautyContextRead_(),all=PropertiesService.getScriptProperties().getProperties(),prefix='BEAUTY_NAKKA_REMOVE_'+c.eventId+'_';
 const keys=Object.keys(all).filter(k=>k.startsWith(prefix));if(keys.length>100)throw Error('REMOVE_HISTORY_REVIEW');
 return keys.map(journal=>{let r;try{r=JSON.parse(all[journal]);}catch(e){throw Error('REMOVE_HISTORY_REVIEW');}
  if(!r||!['ATTEMPTED','VERIFIED'].includes(r.state)||typeof r.player!=='string'||!r.player.trim()||r.player.length>120||r.event?.id!==c.eventId||r.event?.date!==c.date)throw Error('REMOVE_HISTORY_REVIEW');
  return {journal,receipt:r};
 });
}
function beautyRemovalRecoveryIssue_(name){
 const rows=beautyRemovalRecoveryList_().filter(x=>x.receipt.player===name&&x.receipt.state==='ATTEMPTED');
 const code=beautyHubAttentionRead_({eventDate:beautyHubNakkaDate_().date,players:[]}).items.find(x=>x.name===name)?.code;
 if(rows.length>1)return {code:'REMOVE_HISTORY_REVIEW',player:name};
 const completed=beautyRemovalRecoveryList_().filter(x=>x.receipt.player===name&&x.receipt.state==='VERIFIED'&&x.receipt.recoveryVersion===1).sort((a,b)=>b.receipt.recordedUTC.localeCompare(a.receipt.recordedUTC));
 return rows[0]||(/^REMOVE_/.test(code||'')?(completed[0]||{code:'REMOVE_LEGACY_REVIEW',player:name}):null);
}
function beautyRemovalRecoveryIO_(journal,authorize,automatic){
 const eq=beautyRemovalRecoveryEqual_,need=beautyRemovalRecoveryInsist_,props=PropertiesService.getScriptProperties(),context=beautyContextRead_();
 let ownedRaw=props.getProperty(journal),claimed=false;
 const guard=()=>{beautyHubTestGuard_();authorize();need(eq(beautyContextRead_(),context),'REMOVE_CONTEXT_CHANGED');need(props.getProperty(journal)===ownedRaw,'REMOVE_LATER_OPERATION');};
 const load=()=>{guard();let r;try{r=JSON.parse(ownedRaw||'null');}catch(e){throw Error('REMOVE_HISTORY_REVIEW');}need(r?.recoveryVersion===1&&r.sheetId===context.sheetId&&eq(r.context,context),'REMOVE_LEGACY_REVIEW');return r;};
 const save=r=>{guard();const raw=JSON.stringify(r);need(Utilities.newBlob(raw).getBytes().length<=8500,'REMOVE_HISTORY_REVIEW');props.setProperty(journal,raw);ownedRaw=raw;need(props.getProperty(journal)===raw,'REMOVE_SAVE_UNCERTAIN');};
 const read=()=>{
  const r=load(),ss=beautyHubSpreadsheet_();need(ss.getId()===r.sheetId&&/^REMOVE-\d{8}-\d{6}-[a-f0-9]{8}$/.test(r.backup||''),'REMOVE_BACKUP_REVIEW');
  const archive=ss.getSheetByName(r.backup);need(archive&&archive.getLastColumn()===1&&archive.getLastRow()>=1&&archive.getLastRow()<=100,'REMOVE_BACKUP_REVIEW');
  const saved=archive.getRange(1,1,archive.getLastRow(),1).getValues().map(row=>String(row[0]).replace(/^'/,'')).join('');
  need(beautyHubTransferHash_(saved)===r.backupHash,'REMOVE_BACKUP_REVIEW');let backup;try{backup=JSON.parse(saved);}catch(e){throw Error('REMOVE_BACKUP_REVIEW');}
  const current=JSON.parse(JSON.stringify(beautyHubEventSnapshot_(ss))),[eventData,list,leagueData]=beautyHubNakkaReads_(beautyPoolAuth_(),true);guard();
  const event=eventData.tournament;need(event&&Number.isFinite(event.t_date),'REMOVE_PROVIDER_UNAVAILABLE');
  const transfer=props.getProperty('BEAUTY_NAKKA_TRANSFER_'+context.eventId+'_'+r.identity.lpid)||'';
  return {journal,receipt:r,backup,current,context,transferHash:beautyHubTransferHash_(transfer),registrationHash:beautyHubTransferHash_(props.getProperty(beautyRegistrationRecoveryKey_(r.player))||''),provider:{event,entries:beautyHubTransferEntries_(list),league:leagueData.list,date:Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')}};
 };
 const expectedDisplay=x=>{
  const responses=x.current['Form responses 2'].values,status=x.current['PLAYER STATUS DATA'].values,key=beautyHubEventKey_,names=[];
  for(const row of responses.slice(1)){const name=String(row[1]==='MITT NAMN FINNS INTE I LISTAN'?row[2]:row[1]||'').trim();if(name&&!names.some(n=>key(n)===key(name)))names.push(name);}
  need(names.length<=99,'REMOVE_DISPLAY_REVIEW');
  return names.map(name=>{const matches=status.slice(1).filter(row=>key(row[0])===key(name)||row[1]&&key(row[1])===key(name));need(matches.length===1&&['IN','OUT','STANDBY'].includes(matches[0][2]),'REMOVE_DISPLAY_REVIEW');return {name,status:matches[0][2]};});
 };
 const io={hash:beautyHubTransferHash_,read,
  begin:()=>{const r=load();need(['ATTEMPTED','VERIFIED'].includes(r.state),'REMOVE_HISTORY_REVIEW');
   if(r.state==='VERIFIED')return;const attempts=r.recovery?.attempts||0,last=Date.parse(r.recovery?.lastAttemptAt);
   need(Number.isInteger(attempts)&&attempts>=0&&(!automatic||attempts<3),'REMOVE_RETRY_LIMIT');
   need(!automatic||!attempts||Number.isFinite(last)&&Date.now()-last>=30000,'REMOVE_RETRY_COOLDOWN');
   r.recovery={version:1,attempts:attempts+1,lastAttemptAt:new Date().toISOString(),state:'CHECKING',code:'REMOVE_CHECKING'};save(r);claimed=true;},
  check:x=>{guard();need(eq(JSON.parse(JSON.stringify(beautyHubEventSnapshot_(beautyHubSpreadsheet_()))),x.current),'REMOVE_CHANGED_DURING_CHECK');},
  clear:(ranges,x)=>{const expected=JSON.parse(JSON.stringify(x.current));for(const range of ranges){guard();const snapshot=JSON.parse(JSON.stringify(beautyHubEventSnapshot_(beautyHubSpreadsheet_())));for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])need(eq(snapshot[title],expected[title]),'REMOVE_CHANGED_DURING_CHECK');const sh=beautyHubSpreadsheet_().getSheetByName(range.title);need(sh?.getSheetId()===range.sheetId,'REMOVE_LAYOUT_REVIEW');const cell=sh.getRange(range.row,range.column,1,range.width);need(eq(cell.getValues()[0],range.before)&&!cell.getFormulas()[0].some(Boolean),'REMOVE_PLAYER_CHANGED');cell.clearContent();for(const field of ['values','display'])expected[range.title][field][range.row-1].splice(range.column-1,range.width,...range.after);}SpreadsheetApp.flush();},
  refresh:()=>{
   guard();SpreadsheetApp.flush();const ss=beautyHubSpreadsheet_(),x={current:JSON.parse(JSON.stringify(beautyHubEventSnapshot_(ss)))},expected=expectedDisplay(x),key=beautyHubEventKey_,tonight=ss.getSheetByName("TONIGHT'S PLAYERS");let shown;
   for(let i=0;i<5;i++){shown=tonight.getRange(2,1,99,6).getDisplayValues();if(eq(shown.filter(row=>row[0]||row[1]).map(row=>key(row[0]||row[1])).sort(),expected.map(row=>key(row.name)).sort()))break;if(i===4)throw Error('REMOVE_DISPLAY_PENDING');Utilities.sleep(250);}
   guard();const latest=JSON.parse(JSON.stringify(beautyHubEventSnapshot_(ss)));
   for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])need(eq(latest[title],x.current[title]),'REMOVE_CHANGED_DURING_CHECK');
   const values=shown.map(row=>{if(!row[0]&&!row[1])return [''];const match=expected.find(p=>key(p.name)===key(row[0]||row[1]));need(match,'REMOVE_DISPLAY_REVIEW');return [match.status];});
   need(!tonight.getRange(2,3,99,1).getFormulas().some(row=>row[0]),'REMOVE_LAYOUT_REVIEW');tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
  },
  displayVerified:x=>{const expected=expectedDisplay(x),key=beautyHubEventKey_,shown=x.current["TONIGHT'S PLAYERS"].display.slice(1).filter(row=>row[0]||row[1]);return shown.length===expected.length&&shown.every(row=>expected.some(p=>key(p.name)===key(row[0]||row[1])&&p.status===row[2]))&&!shown.some(row=>key(row[0]||row[1])===key(x.receipt.player));},
  finish:x=>{const r=load();need(['ATTEMPTED','VERIFIED'].includes(r.state),'REMOVE_LATER_OPERATION');const verifiedAt=r.verifiedUTC||new Date().toISOString();
   if(r.tpid){const proof={state:'VERIFIED',journal,event:r.event,identity:r.identity,tpid:r.tpid,priorTransfer:props.getProperty('BEAUTY_NAKKA_TRANSFER_'+context.eventId+'_'+r.identity.lpid),basis:'REMOVAL_RECONCILED_FROM_IMMUTABLE_BACKUP',removedEntryId:r.tpid,verifiedAt};const key='BEAUTY_NAKKA_REMOVED_ENTRY_'+context.eventId+'_'+r.tpid,raw=JSON.stringify(proof);props.setProperty(key,raw);need(props.getProperty(key)===raw,'REMOVE_SAVE_UNCERTAIN');}
   if(r.state!=='VERIFIED'||r.recovery?.state!=='VERIFIED'){r.state='VERIFIED';r.verifiedUTC=verifiedAt;r.recovery={...r.recovery,state:'VERIFIED',code:'REMOVAL_VERIFIED',verifiedAt};save(r);}
   need(beautyHubAttentionRemember_(r.player,context.date,{success:true,readbackVerified:true,status:'REMOVED'}),'REMOVE_ATTENTION_PENDING');
  },
  result:(x,changed)=>({success:true,status:'REMOVED',outcome:'REMOVAL_VERIFIED',readbackVerified:true,player:x.receipt.player,event:x.receipt.event,journal,backup:x.receipt.backup,changed,nakkaWrites:0,masterWrites:0,data:beautyHubRemoveSnapshot_(getBeautyHubData_(),x.receipt.event)}),
  fail:code=>{if(!claimed)return;const r=load();if(r.state==='ATTEMPTED'){r.recovery={...r.recovery,state:'NEEDS_HELP',code};save(r);}beautyHubAttentionRemember_(r.player,context.date,{code:'REMOVE_REVIEW_REQUIRED'});}
 };return io;
}

function beautyRemovalRecoveryRows_(data){
 const now=Date.now(),rows=beautyRemovalRecoveryList_(),names=new Set(rows.map(x=>x.receipt.player)),out=[];
 for(const name of names){
  const history=rows.filter(x=>x.receipt.player===name),pending=history.filter(x=>x.receipt.state==='ATTEMPTED');
  const done=history.filter(x=>x.receipt.state==='VERIFIED'&&x.receipt.recovery?.state==='VERIFIED').sort((a,b)=>b.receipt.verifiedUTC.localeCompare(a.receipt.verifiedUTC));
  if(!pending.length&&(!done.length||(data.players||[]).some(p=>(p.player||p.newPlayer)===name)))continue;
  const item=pending[0]||done[0],r=item.receipt,recovery=r.recovery,verified=!pending.length;
  const supported=pending.length===1&&r.recoveryVersion===1&&beautyRemovalRecoveryEqual_(r.context,beautyContextRead_());
  const attempts=recovery?.attempts||0,last=Date.parse(recovery?.lastAttemptAt),recent=Number.isFinite(last)&&now-last<30000;
  const transient=!recovery||['REMOVE_CHECKING','REMOVE_PROVIDER_UNAVAILABLE','REMOVE_DISPLAY_PENDING','REMOVE_SAVE_UNCERTAIN','REMOVE_ATTENTION_PENDING'].includes(recovery.code);
  const eligible=supported&&Number.isInteger(attempts)&&attempts>=0&&attempts<3&&!recent&&transient;
  const code=verified?'REMOVAL_VERIFIED':pending.length>1?'REMOVE_HISTORY_REVIEW':!supported?'REMOVE_LEGACY_REVIEW':recovery?.code||'REMOVE_UNCERTAIN';
  out.push({name,status:verified?'REMOVED':'REMOVAL_PENDING',operation:'removal',tone:verified?'green':eligible||recent&&transient?'orange':'red',code,
   problem:verified?'Removal verified. Permanent player profiles are retained.':'The saved removal needs to be checked.',
   next:'Check the saved removal. Beauty only finishes unchanged local fields after verifying absence in Nakka.',autoEligible:eligible,
   history:[{at:r.recordedUTC,source:'removal',state:'ATTEMPTED',code:'REMOVE_STARTED'},...(recovery?[{at:recovery.verifiedAt||recovery.lastAttemptAt,source:'removal-recovery',state:recovery.state,code:recovery.code}]:[])],
   checkedAt:verified?r.verifiedUTC:recovery?.lastAttemptAt||null,entry:null,original:null,journal:item.journal,backup:r.backup,
   outcome:verified?'REMOVAL_VERIFIED':null,attempts});
 }
 return out;
}
function beautyRemovalRecoveryService_(action,name,issue,authorize){
 const failure=(code,error)=>({success:false,code,error});
 if(action==='confirm')return failure('INVALID_RECOVERY','A removal cannot be confirmed as a registration. Check the saved removal.');
 let io,result,code;
 try{
  authorize();if(!issue.journal)throw Error(issue.code||'REMOVE_LEGACY_REVIEW');
  io=beautyRemovalRecoveryIO_(issue.journal,authorize,action==='auto');result=beautyRemovalRecoveryExecute_(io);
 }catch(e){
  if(e.name==='HubAuthError')return failure('AUTH_REQUIRED','Sign in to continue.');
  code=/^REMOVE_[A-Z_]+$/.test(e.message)?e.message:'REMOVE_PROVIDER_UNAVAILABLE';
  try{io?.fail(code);}catch(ignore){}
 }
 try{
  authorize();const view=beautyPlayerRecoveryView_(getBeautyHubData_());
  if(result?.readbackVerified)view.removal={player:name,outcome:'REMOVAL_VERIFIED',readbackVerified:true,changed:result.changed,event:result.event,journal:result.journal,backup:result.backup,nakkaWrites:0};
  else view.guidance={player:name,operation:'removal',code,problem:'The saved removal could not be completed safely.',steps:[
   'The saved removal and its backup are retained. Do not remove or register this player again.',
   ['REMOVE_PLAYER_CHANGED','REMOVE_LATER_REGISTRATION','REMOVE_IDENTITY_CHANGED','REMOVE_LATER_OPERATION'].includes(code)?'Later player changes were detected and preserved. Review those changes before continuing.':code==='REMOVE_ENTRY_STILL_PRESENT'?'The player is still present in Nakka. No deletion was retried. Review the original removal.':code==='REMOVE_LEGACY_REVIEW'?'This older removal has insufficient recovery metadata. It requires manual review.':'Check the selected event, Nakka connection and saved report. Then check after correction.'
  ]};
  return view;
 }catch(e){return failure(e.name==='HubAuthError'?'AUTH_REQUIRED':'REMOVE_REVIEW_REQUIRED','The removal record is retained. Reload to check its current result.');}
}
