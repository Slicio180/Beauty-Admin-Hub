/* Candidate, not installed. Pure partial-save planner and one-shot controller.
 * Adapters supply current snapshots and durable journals; no ambient services.
 * A proposal is not permission to repeat an uncertain Nakka request.
 */
function beautyPartialPlan_(input){
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const insist=(v,m)=>{if(!v)throw Error(m);};
 const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const {kind,receipt,current,original,context,entries}=input;
 insist(['status','consent','removal'].includes(kind),'UNSUPPORTED_RECOVERY');
 insist(receipt&&typeof receipt.player==='string'&&key(receipt.player),'MISSING_PLAYER');
 insist(context&&context.eventId&&context.sheetId&&context.revision&&context.date,'MISSING_CONTEXT');
 insist((receipt.eventDate||receipt.event?.date)===context.date,'WRONG_EVENT_DATE');
 insist((!receipt.eventId||receipt.eventId===context.eventId)&&(!receipt.event?.id||receipt.event.id===context.eventId)&&(!receipt.sheetId||receipt.sheetId===context.sheetId),'WRONG_TARGET');
 const required=['Control','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST",'Form responses 2'];
 for(const title of required){const t=current?.[title];insist(t&&Number.isInteger(t.id)&&t.values&&t.display&&t.formulas&&t.formats,'INCOMPLETE_SNAPSHOT');for(const field of ['display','formulas','formats'])insist(t[field].length===t.values.length,'INCOMPLETE_SNAPSHOT');}
 const cells=[];
 const cell=(title,row,column,before,after)=>{
  const t=current[title];insist(t.values[row]&&t.formulas[row]&&!t.formulas[row][column],'SOURCE_FORMULA');
  const value=t.values[row][column];insist(same(value,before)||same(value,after),'CONFLICTING_CELL');
  if(!same(value,after))cells.push({title,sheetId:t.id,row:row+1,column:column+1,before:value,after});
 };
 const store=current['PLAYER STATUS DATA'];
 const found=store.display.map((r,i)=>({r,i})).slice(1).filter(x=>key(x.r[0])===key(receipt.player)||key(x.r[1])===key(receipt.player));
 insist(found.length===1&&key(found[0].r[0])===key(receipt.player),'AMBIGUOUS_SOURCE');
 if(kind==='status'||kind==='consent'){
  const shown=current["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>key(r[0]||r[1])===key(receipt.player));insist(shown.length===1,'AMBIGUOUS_DISPLAY');
  const before=kind==='status'?receipt.beforeStatus:receipt.before,after=kind==='status'?receipt.afterStatus:receipt.after;
  const allowed=kind==='status'?['IN','OUT','STANDBY']:['JA','NEJ','N/A','NOT ANSWERED',''];
  insist(allowed.includes(before)&&(kind==='status'?allowed:['JA','NEJ','N/A']).includes(after),'INVALID_RECORDED_CHOICE');
  if(Number.isInteger(receipt.row))insist(receipt.row===found[0].i+1,'SOURCE_MOVED');
  cell('PLAYER STATUS DATA',found[0].i,kind==='status'?2:3,before,after);
 }else{
  insist(original?.state&&original.player===receipt.player,'MISSING_REMOVAL_BACKUP');const s=original.state;
  insist(s.version===receipt.version&&s.event?.id===context.eventId&&s.event.date===context.date,'BACKUP_MISMATCH');
  insist(Array.isArray(entries)&&entries.every(r=>r&&r.tpid&&r.name),'INCOMPLETE_NAKKA_READ');
  insist(!entries.some(r=>r.tpid===receipt.tpid||key(r.name)===key(receipt.player)),'NAKKA_REMOVAL_NOT_VERIFIED');
  insist(Array.isArray(s.registrations)&&s.registrations.length>0&&s.stored&&Number.isInteger(s.stored.i)&&found[0].i===s.stored.i,'BACKUP_IDENTITY');
  const owned=new Set();
  for(const r of s.registrations){insist(Number.isInteger(r.i)&&r.i>=1&&s.snap['Form responses 2'].values[r.i],'BACKUP_RESPONSE');const row=s.snap['Form responses 2'].values[r.i];insist(key(row[1]==='MITT NAMN FINNS INTE I LISTAN'?row[2]:row[1])===key(receipt.player),'BACKUP_RESPONSE_IDENTITY');for(const c of [1,2]){owned.add('Form responses 2:'+r.i+':'+c);cell('Form responses 2',r.i,c,row[c],'');}}
  insist(key(s.snap['PLAYER STATUS DATA'].values[s.stored.i][0])===key(receipt.player),'BACKUP_STATUS_IDENTITY');
  for(const c of [2,3,4,5]){owned.add('PLAYER STATUS DATA:'+s.stored.i+':'+c);cell('PLAYER STATUS DATA',s.stored.i,c,s.snap['PLAYER STATUS DATA'].values[s.stored.i][c],'');}
  for(const title of required){const a=current[title],b=s.snap[title];insist(b&&a.id===b.id,'BACKUP_SHEET');
   for(const f of ['formulas','formats'])insist(same(a[f],b[f]),'SHEET_LAYOUT_CHANGED');
   if(title==="TONIGHT'S PLAYERS")continue; // Derived content may have partially recalculated.
   insist(a.values.length===b.values.length,'SOURCE_ROWS_CHANGED');
   for(let r=0;r<b.values.length;r++){insist(a.values[r].length===b.values[r].length,'SOURCE_COLUMNS_CHANGED');for(let c=0;c<b.values[r].length;c++)if(!owned.has(title+':'+r+':'+c))insist(same(a.values[r][c],b.values[r][c])&&same(a.display[r][c],b.display[r][c]),'UNRELATED_DATA_CHANGED');}
  }
 }
 return {kind,player:receipt.player,context:{...context},cells,derivedStatusRefresh:true,nakkaWrites:0,masterWrites:0,operation:'EXPLICITLY_REVIEWED_COMPLETION'};
}
/* Adapter contract: caller authenticates staff and holds the shared ScriptLock
 * excluding active workers. Ticket storage is separate from durable evidence.
 * Every write is an absolute replacement of an exact reviewed source cell.
 */
function beautyPartialController_(io){
 const insist=(v,m)=>{if(!v)throw Error(m);};
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function checked(ref){const a=io.read(ref);const plan=beautyPartialPlan_(a);return {a,plan,version:io.hash(a)};}
 function identity(actor){insist(actor?.uid&&actor.session,'AUTH_REQUIRED');return actor.uid+':'+io.hash(actor.session);}
 function preview(ref,actor){const who=identity(actor),x=checked(ref),id=io.id(),ticket={id,ref,who,version:x.version,expires:io.now()+300000};io.putTicket(id,ticket);return {ticket:id,plan:x.plan,expires:ticket.expires};}
 function verify(ref,job){
  const latest=io.read(ref);insist(equal(latest.context,job.plan.context)&&io.hash(latest.receipt)===job.receiptHash,'CONTEXT_OR_RECEIPT_CHANGED');
  for(const c of job.plan.cells)insist(equal(latest.current[c.title].values[c.row-1][c.column-1],c.after),'SOURCE_NOT_VERIFIED');
  const plan=beautyPartialPlan_(latest);insist(plan.cells.length===0,'COMPLETION_NOT_VERIFIED');
  // Check complete source preservation, allowing only the approved cells.
  const wanted=JSON.parse(JSON.stringify(job.before));for(const c of job.plan.cells){wanted[c.title].values[c.row-1][c.column-1]=c.after;wanted[c.title].display[c.row-1][c.column-1]=String(c.after);}
  for(const title of Object.keys(wanted)){
   if(title==="TONIGHT'S PLAYERS"){for(const f of ['formulas','formats'])insist(equal(latest.current[title][f],wanted[title][f]),'DISPLAY_LAYOUT_CHANGED');}
   else insist(equal(latest.current[title],wanted[title]),'PRESERVATION_NOT_VERIFIED');
  }
  insist(io.displayVerified(latest,job.plan),'DISPLAY_NOT_VERIFIED');
  job.state='VERIFIED';job.verifiedAt=io.now();io.save(job);
  insist(equal(io.load(job.id),job),'AUDIT_NOT_VERIFIED');
  io.releasePending(ref,job.receiptHash);return {outcome:'VERIFIED',id:job.id};
 }
 function confirm(ticketId,actor){const who=identity(actor),ticket=io.takeTicket(ticketId);insist(ticket&&ticket.who===who&&ticket.expires>io.now(),'STALE_TICKET');const x=checked(ticket.ref);insist(ticket.version===x.version,'STALE_PREVIEW');
  const job={id:ticketId,ref:ticket.ref,state:'INTENT',uid:actor.uid,plan:x.plan,before:x.a.current,receiptHash:io.hash(x.a.receipt),at:io.now()};
  insist(!io.load(job.id),'TICKET_ALREADY_USED');io.save(job);insist(equal(io.load(job.id),job),'AUDIT_NOT_VERIFIED');
  try{if(x.plan.cells.length)io.writeCells(x.plan.cells);}catch(e){} // exactly one batch, no automatic repeat
  try{if(x.plan.derivedStatusRefresh)io.refreshDerived();return verify(ticket.ref,job);}catch(e){job.state='REVIEW';job.failure=e.message;io.save(job);return {outcome:'REVIEW',id:job.id,reason:e.message};}
 }
 function recheck(id,actor){identity(actor);const job=io.load(id);insist(job&&['INTENT','REVIEW','VERIFIED'].includes(job.state),'MISSING_RECEIPT');
  const fresh=io.read(job.ref);insist(equal(fresh.context,job.plan.context)&&io.hash(fresh.receipt)===job.receiptHash,'CONTEXT_OR_RECEIPT_CHANGED');
  if(job.state==='VERIFIED'){io.releasePending(job.ref,job.receiptHash);return {outcome:'VERIFIED',id};}
  // This path performs no source cell writes, even when the previous write is absent.
  try{if(job.plan.derivedStatusRefresh)io.refreshDerived();return verify(job.ref,job);}catch(e){return {outcome:'REVIEW',id,reason:e.message};}
 }
 return {preview,confirm,recheck};
}
if(typeof module!=='undefined')module.exports={beautyPartialPlan_,beautyPartialController_};

/* Isolated native Sheets test adapter. It cannot act on original event rows.
 * All mutations are confined to six marked BPR1411 fixture tabs in pinned TEST.
 * Nakka entries are simulated; no provider network call exists in this adapter.
 */
function beautyPartialNativeConfig_(){return {scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',sheetId:'17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',eventId:'t_gINp_8026',leagueId:'lg_M2wQ_4189',date:'2026-11-07',revision:'7badf194ceda4cff92e5a7205045b638',mode:'league'};}
function beautyPartialNativeHash_(x){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(x)).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function beautyPartialNativeGuard_(){
 const c=beautyPartialNativeConfig_();
 if(ScriptApp.getScriptId()!==c.scriptId)throw Error('PARTIAL_TEST_PROJECT');
 const now=beautyContextRead_();
 if(!now||['sheetId','eventId','leagueId','date','revision','mode'].some(k=>now[k]!==c[k]))throw Error('PARTIAL_TEST_CONTEXT');
 return c;
}
function beautyPartialNativeOwner_(){beautyPartialNativeGuard_();if(Session.getActiveUser().getEmail().toLowerCase()!=='alessiotampella@gmail.com')throw Error('PARTIAL_TEST_OWNER');}
function beautyPartialNativeLocked_(fn){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('PARTIAL_TEST_BUSY');try{beautyPartialNativeGuard_();return fn();}finally{lock.releaseLock();}}
function beautyPartialNativeBook_(){const c=beautyPartialNativeGuard_(),ss=SpreadsheetApp.openById(c.sheetId);if(ss.getId()!==c.sheetId||Utilities.formatDate(ss.getSheetByName('Control').getRange('A2').getValue(),'Europe/Stockholm','yyyy-MM-dd')!==c.date)throw Error('PARTIAL_TEST_WORKBOOK');return ss;}
function beautyPartialNativeMap_(){return {'Control':'BPR1411_Control','Form responses 2':'BPR1411_Responses','PLAYER STATUS DATA':'BPR1411_Status',"TONIGHT'S PLAYERS":'BPR1411_Display',"PLAYER'S MASTER LIST":'BPR1411_Master'};}
function beautyPartialNativeMarker_(){return 'BEAUTY_PARTIAL_NATIVE_FIXTURE_V1:'+beautyPartialNativeHash_(beautyPartialNativeConfig_());}
function beautyPartialNativeTab_(ss,name){
 if(!Object.values(beautyPartialNativeMap_()).concat(['BPR1411_Journal']).includes(name))throw Error('FIXTURE_TAB_REQUIRED');
 const sh=ss.getSheetByName(name);if(!sh||sh.getRange('H1').getValue()!==beautyPartialNativeMarker_())throw Error('FIXTURE_MARKER_MISSING');return sh;
}
function beautyPartialNativeJournal_(ss){
 const sh=beautyPartialNativeTab_(ss,'BPR1411_Journal');
 function load(key){const end=sh.getLastRow();if(end<2)return null;if(end>2000)throw Error('FIXTURE_JOURNAL_CAPACITY');const all=sh.getRange(2,1,end-1,6).getValues(),rows=all.filter(r=>r[1]===key);if(!rows.length)return null;const batch=rows[rows.length-1][0],chosen=rows.filter(r=>r[0]===batch),n=chosen[0][3];if(!Number.isInteger(n)||n<1||chosen.length!==n||chosen.some((r,i)=>r[2]!==i||r[3]!==n||r[5]!==chosen[0][5]))throw Error('INCOMPLETE_JOURNAL');if(chosen.some(r=>typeof r[4]!=='string'||!r[4].startsWith('j:')))throw Error('JOURNAL_ENCODING');const value=JSON.parse(chosen.map(r=>r[4].slice(2)).join(''));if(beautyPartialNativeHash_(value)!==chosen[0][5])throw Error('JOURNAL_HASH');return value;}
 function save(key,value){beautyPartialNativeGuard_();beautyPartialNativeTab_(ss,'BPR1411_Journal');const text=JSON.stringify(value),parts=[];for(let i=0;i<text.length;i+=16000)parts.push(text.slice(i,i+16000));if(parts.length>100||sh.getLastRow()+parts.length>2000)throw Error('FIXTURE_JOURNAL_CAPACITY');const id=Utilities.getUuid(),hash=beautyPartialNativeHash_(value),rows=parts.map((s,i)=>[id,key,i,parts.length,'j:'+s,hash]);sh.getRange(sh.getLastRow()+1,1,rows.length,6).setValues(rows);if(beautyPartialNativeHash_(load(key))!==hash)throw Error('JOURNAL_READBACK');}
 return {load,save};
}
function beautyPartialNativeSnapshot_(ss){const out={};for(const [title,name]of Object.entries(beautyPartialNativeMap_())){const sh=beautyPartialNativeTab_(ss,name),r=sh.getRange(1,1,10,6);out[title]={id:sh.getSheetId(),values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return out;}
function beautyPartialNativeExpectedDisplay_(snap){const rows=[['PLAYER','OLD NAME','STATUS','CONSENT','MESSAGE','SOURCE']],responses=snap['Form responses 2'].values,store=snap['PLAYER STATUS DATA'].values;
 for(const r of responses.slice(1)){const name=r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1];if(!name)continue;const match=store.slice(1).filter(s=>s[0]===name);if(match.length!==1)throw Error('FIXTURE_IDENTITY');rows.push([name,match[0][1],match[0][2],match[0][3],match[0][4],match[0][5]]);}while(rows.length<10)rows.push(['','','','','','']);if(rows.length!==10)throw Error('FIXTURE_ROWS');return rows;
}
function beautyPartialNativeIO_(ss,ref,fault){const j=beautyPartialNativeJournal_(ss);let writes=0,refreshes=0;
 function read(requested){if(requested!==ref)throw Error('FIXTURE_REF');const c=beautyPartialNativeGuard_(),record=j.load('fixture:'+ref);if(!record)throw Error('FIXTURE_NOT_SEEDED');return {kind:record.kind,receipt:record.receipt,original:record.original,entries:record.entries,context:{sheetId:c.sheetId,eventId:c.eventId,date:c.date,revision:c.revision},current:beautyPartialNativeSnapshot_(ss)};}
 const io={read,hash:beautyPartialNativeHash_,now:()=>Date.now(),id:()=>Utilities.getUuid().replace(/-/g,''),putTicket:(id,v)=>j.save('ticket:'+id,v),takeTicket:id=>{const t=j.load('ticket:'+id);if(t)j.save('ticket:'+id,null);return t;},save:job=>j.save('job:'+job.id,job),load:id=>j.load('job:'+id),
 writeCells:cells=>{writes++;beautyPartialNativeGuard_();if(fault==='absent')throw Error('INJECTED_BEFORE_WRITE');const allowed=beautyPartialPlan_(read(ref)).cells;if(JSON.stringify(cells)!==JSON.stringify(allowed))throw Error('UNREVIEWED_CELL');for(const c of cells){const sh=beautyPartialNativeTab_(ss,beautyPartialNativeMap_()[c.title]);if(sh.getSheetId()!==c.sheetId)throw Error('CELL_TAB_CHANGED');if(c.row<2||c.row>10||c.column<1||c.column>6)throw Error('CELL_RANGE');if(sh.getRange(c.row,c.column).getValue()!==c.before)throw Error('CELL_CHANGED');sh.getRange(c.row,c.column).setValue(c.after);if(fault==='partial')throw Error('INJECTED_PARTIAL_WRITE');}SpreadsheetApp.flush();if(fault==='lost')throw Error('INJECTED_LOST_REPLY');},
 refreshDerived:()=>{refreshes++;beautyPartialNativeGuard_();if(fault==='display')throw Error('INJECTED_DISPLAY_FAILURE');const rows=beautyPartialNativeExpectedDisplay_(beautyPartialNativeSnapshot_(ss));beautyPartialNativeTab_(ss,'BPR1411_Display').getRange(1,1,10,6).setValues(rows);SpreadsheetApp.flush();},
 displayVerified:latest=>JSON.stringify(latest.current["TONIGHT'S PLAYERS"].values)===JSON.stringify(beautyPartialNativeExpectedDisplay_(latest.current)),
 releasePending:(requested,hash)=>{if(beautyPartialNativeHash_(read(requested).receipt)!==hash)throw Error('RECEIPT_CHANGED');j.save('released:'+ref,{receiptHash:hash,verifiedAt:new Date().toISOString()});}
 };return {io,j,counts:()=>({writes,refreshes})};
}
/* Staff-authenticated, session-bound preview/confirm/recheck entry point.
 * Fixtures only. No new live Hub route and no raw target or cells from clients.
 */
function beautyTestPartialRecovery(action,input,token){
 beautyPartialNativeGuard_();const auth=beautyHubAuthRequire_(token);
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('INPUT');
 const keys={preview:'ref',confirm:'ref,ticket',recheck:'id,ref'}[action];
 if(!keys||Object.keys(input).sort().join(',')!==keys||Object.values(input).some(v=>typeof v!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(v)))throw Error('INPUT');
 return beautyPartialNativeLocked_(()=>{beautyHubAuthRequire_(token);const ss=beautyPartialNativeBook_(),a=beautyPartialNativeIO_(ss,input.ref,''),ctl=beautyPartialController_(a.io),actor={uid:auth.uid,session:token};return action==='preview'?ctl.preview(input.ref,actor):action==='confirm'?ctl.confirm(input.ticket,actor):ctl.recheck(input.id,actor);});
}
function beautyPartialNativeOriginalHash_(ss){const out={};for(const title of Object.keys(beautyPartialNativeMap_())){const sh=ss.getSheetByName(title);if(!sh)throw Error('ORIGINAL_TAB_MISSING');const r=sh.getDataRange();out[title]={id:sh.getSheetId(),values:r.getValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return beautyPartialNativeHash_(out);}
function beautyTestRecoveryFixtureSetup20261114(){beautyPartialNativeOwner_();return beautyPartialNativeLocked_(()=>{const ss=beautyPartialNativeBook_(),before=beautyPartialNativeOriginalHash_(ss),names=Object.values(beautyPartialNativeMap_()).concat(['BPR1411_Journal']);
 // Preflight every existing tab before creating any new one. Never adopt unmarked data.
 for(const name of names)if(ss.getSheetByName(name))beautyPartialNativeTab_(ss,name);
 const created=[];for(const name of names){if(!ss.getSheetByName(name)){const sh=ss.insertSheet(name);sh.getRange('H1').setValue(beautyPartialNativeMarker_());created.push(name);}beautyPartialNativeTab_(ss,name);}
 const j=beautyPartialNativeJournal_(ss);if(!j.load('original-baseline'))j.save('original-baseline',{hash:before});
 if(beautyPartialNativeOriginalHash_(ss)!==before)throw Error('ORIGINALS_CHANGED_DURING_SETUP');
 const result={result:'TEST_RECOVERY_FIXTURES_READY',createdTabs:created,originalEventTabsWritten:false,nakkaCalls:0,providerEventVerified:false};console.log(JSON.stringify(result));return result;});}
function beautyPartialNativeSeed_(ss,kind,ref){const rows=()=>Array.from({length:10},()=>Array(6).fill('')),tables={};for(const title of Object.keys(beautyPartialNativeMap_()))tables[title]=rows();
 tables['Control'][0]=['DATE','','','','',''];tables['Control'][1][0]='2026-11-07';
 for(const title of ['PLAYER STATUS DATA',"TONIGHT'S PLAYERS"])tables[title][0]=['PLAYER','OLD NAME','STATUS','CONSENT','MESSAGE','SOURCE'];
 tables['Form responses 2'][0]=['TIME','PLAYER','NEW NAME','CONSENT','MESSAGE','SOURCE'];tables["PLAYER'S MASTER LIST"][0][0]='PLAYER';
 for(let i=1;i<=8;i++){const name='Recovery Fixture '+i;tables['PLAYER STATUS DATA'][i]=[name,'','IN','JA','Rtff.   ','TEST'];tables['Form responses 2'][i]=['2026-11-07T12:00:00Z',name,'','JA','Rtff.   ','TEST'];tables["PLAYER'S MASTER LIST"][i][0]=name;tables["TONIGHT'S PLAYERS"][i]=tables['PLAYER STATUS DATA'][i].slice();}
 for(const [title,name]of Object.entries(beautyPartialNativeMap_())){beautyPartialNativeGuard_();const range=beautyPartialNativeTab_(ss,name).getRange(1,1,10,6);range.setNumberFormat('@');range.setValues(tables[title]);}SpreadsheetApp.flush();
 const c=beautyPartialNativeConfig_(),player='Recovery Fixture 1',snap=beautyPartialNativeSnapshot_(ss);
 const record={kind,receipt:{player,eventDate:c.date,eventId:c.eventId,sheetId:c.sheetId,row:2,beforeStatus:'IN',afterStatus:'OUT',before:'JA',after:'NEJ'},entries:[],original:null};
 if(kind==='removal'){record.receipt={player,event:{id:c.eventId,date:c.date},sheetId:c.sheetId,version:ref,tpid:'simulated-fixture-entry'};record.original={player,state:{version:ref,event:{id:c.eventId,date:c.date},snap,registrations:[{i:1}],stored:{i:1}}};}
 beautyPartialNativeJournal_(ss).save('fixture:'+ref,record);return record;
}
/* One owner-run suite, resumable between scenarios if execution time is short.
 * Each completed scenario is journaled. Existing event records are never seeded.
 */
function beautyTestRecoveryNativeRun20261114(){beautyPartialNativeOwner_();return beautyPartialNativeLocked_(()=>{
 const started=Date.now(),ss=beautyPartialNativeBook_(),j=beautyPartialNativeJournal_(ss),baseline=j.load('original-baseline');if(!baseline)throw Error('RUN_FIXTURE_SETUP_FIRST');
 if(beautyPartialNativeOriginalHash_(ss)!==baseline.hash)throw Error('ORIGINALS_CHANGED_SINCE_SETUP');
 const scenarios=[['status',''],['consent',''],['removal',''],['status','lost'],['removal','lost'],['status','absent'],['removal','absent'],['removal','partial'],['status','display']];
 const results=j.load('suite-results')||[];
 for(let i=results.length;i<scenarios.length;i++){
  if(Date.now()-started>90000)break;
  const [kind,fault]=scenarios[i],ref='native-'+i,at=Date.now();beautyPartialNativeSeed_(ss,kind,ref);
  const a=beautyPartialNativeIO_(ss,ref,fault),ctl=beautyPartialController_(a.io),actor={uid:'TEST_EDITOR_OWNER',session:'owner-suite-'+ref},p=ctl.preview(ref,actor);
  if(a.counts().writes!==0)throw Error('PREVIEW_WROTE');
  const result=ctl.confirm(p.ticket,actor);let expected=['absent','partial','display'].includes(fault)?'REVIEW':'VERIFIED';if(result.outcome!==expected)throw Error('UNEXPECTED_CONFIRM_'+kind+'_'+fault+'_'+result.reason);
  let duplicate=false;try{ctl.confirm(p.ticket,actor);}catch(e){duplicate=e.message==='STALE_TICKET';}if(!duplicate||a.counts().writes!==1)throw Error('DUPLICATE_CONFIRM');
  const b=beautyPartialNativeIO_(ss,ref,''),rechecked=beautyPartialController_(b.io).recheck(result.id,actor);
  expected=['absent','partial'].includes(fault)?'REVIEW':'VERIFIED';if(rechecked.outcome!==expected||b.counts().writes!==0)throw Error('RECHECK_REPLAY_OR_FAILURE');
  if(beautyPartialNativeOriginalHash_(ss)!==baseline.hash)throw Error('ORIGINAL_PRESERVATION');
  results.push({kind,fault:fault||'none',outcome:'PASS',confirmation:result.outcome,recheck:rechecked.outcome,sourceWriteAttempts:a.counts().writes,recheckSourceWrites:b.counts().writes,durationMs:Date.now()-at});j.save('suite-results',results);
 }
 const report={result:results.length===scenarios.length?'NATIVE_FIXTURE_SUITE_PASS':'NATIVE_FIXTURE_SUITE_CONTINUE',completed:results.length,total:scenarios.length,scenarios:results,originalEventTabsUnchanged:true,nakkaCalls:0,nakkaSimulated:true,productionChanged:false,scope:'Native Sheets fixture adapter, not production recovery or real Nakka verification'};
 console.log(JSON.stringify(report,null,2));return report;
 });}
