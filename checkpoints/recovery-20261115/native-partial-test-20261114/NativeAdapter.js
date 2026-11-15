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
