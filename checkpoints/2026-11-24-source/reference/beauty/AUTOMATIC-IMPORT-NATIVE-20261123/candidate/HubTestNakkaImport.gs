/* Automatic inbound registration, original owner TEST only.
 * Runs through the existing authenticated CLOCK; never writes to Nakka/master.
 * A durable event+entry intent precedes one atomic two-table write. An unknown
 * reply is read back, never resent. Provider reads do not hold ScriptLock.
 */
function beautyNakkaImportKey_(suffix) {
  const c=beautyBackgroundScope_();
  return 'BEAUTY_NAKKA_IMPORT_V1_'+c.eventId+'_'+c.revision+'_'+suffix;
}
function beautyNakkaImportNeed_(ok,code){if(!ok)throw Error(code);}
function beautyNakkaImportEqual_(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function beautyNakkaImportName_(v){return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
function beautyNakkaImportDue_(now) {
  const raw=PropertiesService.getScriptProperties().getProperty(beautyNakkaImportKey_('SCAN'));
  if(!raw)return true;
  let r;try{r=JSON.parse(raw);}catch(e){throw Error('IMPORT_HISTORY_REVIEW');}
  beautyNakkaImportNeed_(r?.version===1&&Number.isFinite(r.nextAt),'IMPORT_HISTORY_REVIEW');
  return now>=r.nextAt;
}
function beautyNakkaImportProvider_(context) {
  const data=beautyHubNakkaReads_(beautyPoolAuth_(),true),event=data[0]?.tournament;
  beautyContextEventValidate_(context,event);
  beautyNakkaImportNeed_(event.title===context.title&&[10,20].includes(event.status),'IMPORT_EVENT_CLOSED');
  const entries=beautyHubTransferEntries_(data[1]),league=data[2]?.list;
  beautyNakkaImportNeed_(Array.isArray(league)&&league.length<1000&&league.every(r=>
    r&&typeof r.name==='string'&&r.name.trim()&&r.name.length<=120&&/^[A-Za-z0-9]{4}$/.test(r.lpid||''))&&
    new Set(league.map(r=>r.lpid)).size===league.length,'IMPORT_PROVIDER_REVIEW');
  return {entries,league:league.map(r=>({name:r.name,lpid:r.lpid})),readAt:Date.now()};
}
function beautyNakkaImportSnapshot_() {
  const context=beautyBackgroundScope_(),ss=beautyHubSpreadsheet_(),snap=beautyHubEventSnapshot_(ss);
  beautyNakkaImportNeed_(ss.getId()===context.sheetId&&
    Utilities.formatDate(snap.Control.values[1][0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')===context.date,'IMPORT_CONTEXT_CHANGED');
  // Serial values make a saved receipt compare exactly after a Sheets readback.
  const serial=v=>v instanceof Date?(Date.parse(Utilities.formatDate(v,ss.getSpreadsheetTimeZone(),"yyyy-MM-dd'T'HH:mm:ss")+'Z')-Date.UTC(1899,11,30))/86400000:v;
  for(const title of ['Control','Form responses 2'])snap[title].values=snap[title].values.map(row=>row.map(serial));
  const bounds={};
  for(const title of ['Form responses 2','PLAYER STATUS DATA']){
    const sh=ss.getSheetByName(title);bounds[title]={last:sh.getLastRow(),capacity:sh.getMaxRows()};
  }
  return {context,snap,bounds};
}
function beautyNakkaImportHistory_() {
  const context=beautyBackgroundScope_(),props=PropertiesService.getScriptProperties(),all=props.getProperties();
  const removals=beautyRemovalRecoveryList_().map(x=>x.receipt),registrations=[],imports=[];
  const rp=beautyRegistrationRecoveryPrefix_(),ip=beautyNakkaImportKey_('');
  for(const key of Object.keys(all)){
    if(key.startsWith(rp)){
      let r;try{r=JSON.parse(all[key]);}catch(e){throw Error('IMPORT_HISTORY_REVIEW');}
      beautyNakkaImportNeed_(r&&typeof r.name==='string'&&r.eventId===context.eventId&&r.context===context.revision,'IMPORT_HISTORY_REVIEW');
      registrations.push(r);
    }else if(key.startsWith(ip)&&key!==ip+'SCAN'){
      let r;try{r=JSON.parse(all[key]);}catch(e){throw Error('IMPORT_HISTORY_REVIEW');}
      beautyNakkaImportNeed_(r?.version===1&&beautyNakkaImportEqual_(r.context,context)&&
        r.entry&&key===ip+r.entry.tpid&&['INTENT','COMPLETE','REVIEW'].includes(r.state),'IMPORT_HISTORY_REVIEW');
      imports.push(r);
    }else if(key.startsWith('BEAUTY_NAKKA_REMOVED_ENTRY_'+context.eventId+'_')){
      let r;try{r=JSON.parse(all[key]);}catch(e){throw Error('IMPORT_HISTORY_REVIEW');}
      beautyNakkaImportNeed_(r?.identity?.name&&r.event?.id===context.eventId,'IMPORT_HISTORY_REVIEW');
      removals.push({...r,player:r.identity.name});
    }
  }
  beautyNakkaImportNeed_(imports.length<=100&&registrations.length<=100,'IMPORT_HISTORY_REVIEW');
  return {removals,registrations,imports};
}
// Pure decision: existing event participation is retained, never repaired here.
function beautyNakkaImportDecision_(entry,provider,state,history) {
  const key=beautyNakkaImportName_,eq=beautyNakkaImportEqual_,name=key(entry.name),snap=state.snap;
  const answer=(state,code,extra)=>({state,code,entry,...extra});
  if(!name||entry.name!==entry.name.trim()||entry.name.length>120||/^[=+@-]|[\x00-\x1f\x7f]/.test(entry.name))return answer('REVIEW','IMPORT_NAME_REVIEW');
  const e=provider.entries.filter(r=>key(r.name)===name||r.tpid===entry.tpid||entry.lpid&&r.lpid===entry.lpid);
  const l=provider.league.filter(r=>key(r.name)===name||entry.lpid&&r.lpid===entry.lpid);
  if(e.length!==1||!eq(e[0],entry)||l.length!==1||key(l[0].name)!==name||entry.lpid&&entry.lpid!==l[0].lpid)return answer('REVIEW','IMPORT_IDENTITY_REVIEW');
  const lpid=l[0].lpid;
  if(provider.entries.some(r=>r.tpid!==entry.tpid&&r.lpid===lpid))return answer('REVIEW','IMPORT_IDENTITY_REVIEW');
  if(history.removals.some(r=>key(r.player)===name||key(r.identity?.name)===name||r.tpid===entry.tpid||r.identity?.lpid===lpid))return answer('PROTECTED','IMPORT_REMOVAL_PROTECTED');
  const stored=snap['PLAYER STATUS DATA'],response=snap['Form responses 2'],shown=snap["TONIGHT'S PLAYERS"];
  const matches=stored.values.map((v,i)=>({v,i})).slice(1).filter(r=>key(r.v[0])===name||r.v[1]&&key(r.v[1])===name);
  const responses=response.values.map((v,i)=>({v,i})).slice(1).filter(r=>key(r.v[1]==='MITT NAMN FINNS INTE I LISTAN'?r.v[2]:r.v[1])===name);
  const visible=shown.display.slice(1).filter(r=>key(r[0]||r[1])===name);
  if(matches.some(r=>['OUT','STANDBY'].includes(r.v[2])))return answer('PROTECTED','IMPORT_STATUS_PROTECTED');
  const prior=history.imports.filter(r=>key(r.entry.name)===name||r.entry.tpid===entry.tpid||r.entry.lpid&&r.entry.lpid===lpid);
  if(prior.length){
    if(prior.length!==1||!eq(prior[0].entry,entry))return answer('REVIEW','IMPORT_IDENTITY_CHANGED');
    if(prior[0].state==='COMPLETE')return matches.length===1&&matches[0].v[2]==='IN'&&responses.length===1&&visible.length===1?
      answer('PRESENT','IMPORT_ALREADY_COMPLETE'):answer('REVIEW','IMPORT_RECORD_CHANGED');
    return answer(prior[0].state==='INTENT'?'RESUME':'REVIEW',prior[0].code||'IMPORT_VERIFY_PENDING',{receipt:prior[0]});
  }
  if(matches.length===1&&matches[0].v[2]==='IN'&&responses.length===1&&visible.length===1)return answer('PRESENT','IMPORT_ALREADY_PRESENT');
  if(history.registrations.some(r=>key(r.name)===name))return answer('PROTECTED','IMPORT_REGISTRATION_PROTECTED');
  if(responses.length||visible.length||matches.length>1)return answer('REVIEW','IMPORT_EXISTING_RECORD_REVIEW');
  if(matches.length&&(!eq(matches[0].v,[entry.name,'','','','',''])||stored.formulas[matches[0].i].some(Boolean)))return answer('REVIEW','IMPORT_EXISTING_RECORD_REVIEW');
  if(snap["PLAYER'S MASTER LIST"].values.slice(1).filter(r=>key(r[0])===name).length>1)return answer('REVIEW','IMPORT_MASTER_AMBIGUOUS');
  if(shown.display.slice(1).filter(r=>r[0]||r[1]).length>=99)return answer('REVIEW','IMPORT_CAPACITY_REVIEW');
  return answer('READY','IMPORT_READY',{statusRow:matches.length?matches[0].i:state.bounds['PLAYER STATUS DATA'].last});
}
function beautyNakkaImportPlan_(decision,state) {
  const need=beautyNakkaImportNeed_,s=state.snap,name=decision.entry.name;
  need(decision.state==='READY','IMPORT_PLAN_REVIEW');
  const serial=Math.max(s.Control.values[1][0],s.Control.values[1][1]);
  need(Number.isFinite(serial)&&serial<s.Control.values[1][0]+1,'IMPORT_DATE_REVIEW');
  const cells=[{title:'Form responses 2',row:state.bounds['Form responses 2'].last,values:[serial,name,'','N/A','','NAKKA']},
    {title:'PLAYER STATUS DATA',row:decision.statusRow,values:[name,'','IN','N/A','','NAKKA']}];
  for(const cell of cells){
    const b=s[cell.title],bounds=state.bounds[cell.title];cell.sheetId=b.id;
    need(Number.isInteger(cell.row)&&cell.row>=1&&cell.row<bounds.capacity&&cell.row<(cell.title==='Form responses 2'?10000:1000),'IMPORT_CAPACITY_REVIEW');
    const old=b.values[cell.row]||['','','','','',''];
    need((cell.title==='PLAYER STATUS DATA'?old.every((v,i)=>v===''||i===0&&v===name):old.every(v=>v===''))&&!(b.formulas[cell.row]||[]).some(Boolean),'IMPORT_CHANGED');
  }
  return {cells,before:beautyHubTransferHash_(state),preserved:beautyNakkaImportPreservation_(state,cells)};
}
function beautyNakkaImportPreservation_(state,cells) {
  const copy=JSON.parse(JSON.stringify(state.snap));
  for(const cell of cells){
    const b=copy[cell.title];
    // Appended blank tails and calculated display text are not source content.
    for(const field of ['values','display'])if(b[field][cell.row])b[field][cell.row]=[];
    if(cell.title==='Form responses 2'&&b.formats[cell.row])b.formats[cell.row][0]='IMPORT_TIMESTAMP_FORMAT';
  }
  for(const title of ['Form responses 2','PLAYER STATUS DATA']){
    const b=copy[title];delete b.display;
    while(b.values.length>1&&b.values[b.values.length-1].every(v=>v===''||v===null)&&b.formulas[b.formulas.length-1].every(v=>!v)){
      for(const field of ['values','formulas','formats'])b[field].pop();
    }
  }
  // Only derived tonight values may recalculate; formulas and formats must stay.
  delete copy["TONIGHT'S PLAYERS"].values;delete copy["TONIGHT'S PLAYERS"].display;
  return beautyHubTransferHash_(copy);
}
function beautyNakkaImportPresent_(receipt,state) {
  const key=beautyNakkaImportName_,name=key(receipt.entry.name),eq=beautyNakkaImportEqual_;
  return receipt.plan.cells.every(cell=>{
    const s=state.snap[cell.title],v=s.values[cell.row];
    const matches=s.values.slice(1).filter(r=>cell.title==='Form responses 2'?key(r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1])===name:key(r[0])===name||r[1]&&key(r[1])===name);
    return s.id===cell.sheetId&&eq(v,cell.values)&&matches.length===1&&!(s.formulas[cell.row]||[]).some(Boolean);
  });
}
function beautyNakkaImportExecute_(entry,io) {
  io.guard();let state=io.read(),history=io.history(),decision=beautyNakkaImportDecision_(entry,io.provider,state,history);
  if(!['READY','RESUME'].includes(decision.state))return decision;
  let receipt=decision.receipt;
  if(!receipt){
    const plan=beautyNakkaImportPlan_(decision,state);
    // No legacy Google Form writer may race a fixed row batch.
    io.externalClosed();io.revalidate();io.guard();
    beautyNakkaImportNeed_(beautyHubTransferHash_(io.read())===plan.before,'IMPORT_CHANGED');
    decision=beautyNakkaImportDecision_(entry,io.provider,state,io.history());
    beautyNakkaImportNeed_(decision.state==='READY','IMPORT_CHANGED');
    receipt={version:1,context:state.context,entry,state:'INTENT',code:'IMPORT_VERIFY_PENDING',plan,attempts:0,createdAt:io.now()};
    io.save(receipt); // Readback failure stops before any table write.
    io.guard();io.externalClosed();
    beautyNakkaImportNeed_(beautyHubTransferHash_(io.read())===plan.before,'IMPORT_CHANGED');
    try{io.write(plan);}catch(e){} // One send only, even when its reply is lost.
  }
  io.guard();state=io.read();
  if(!beautyNakkaImportPresent_(receipt,state)||beautyNakkaImportPreservation_(state,receipt.plan.cells)!==receipt.plan.preserved){
    receipt.state='REVIEW';receipt.code='IMPORT_SAVE_UNCERTAIN';io.save(receipt);
    return {state:'REVIEW',code:receipt.code,entry};
  }
  // Projection retries are bounded and never repeat the registration write.
  receipt.attempts++;io.save(receipt);
  try{io.sync(entry.name);io.guard();state=io.read();
    const rows=state.snap["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>beautyNakkaImportName_(r[0]||r[1])===beautyNakkaImportName_(entry.name));
    beautyNakkaImportNeed_(beautyNakkaImportPresent_(receipt,state)&&beautyNakkaImportPreservation_(state,receipt.plan.cells)===receipt.plan.preserved&&
      rows.length===1&&beautyNakkaImportEqual_(rows[0],[entry.name,'','IN','N/A','','NAKKA']),'IMPORT_DISPLAY_PENDING');
    receipt.state='COMPLETE';receipt.code='IMPORT_VERIFIED';receipt.completedAt=io.now();io.save(receipt);
    return {state:'COMPLETE',code:'IMPORT_VERIFIED',entry};
  }catch(e){
    receipt.code=/^IMPORT_[A-Z_]+$/.test(e.message)?e.message:'IMPORT_DISPLAY_PENDING';
    if(receipt.attempts>=3)receipt.state='REVIEW';io.save(receipt);
    return {state:receipt.state==='REVIEW'?'REVIEW':'RESUME',code:receipt.code,entry};
  }
}
function beautyNakkaImportIO_(provider) {
  const context=beautyBackgroundScope_(),p=PropertiesService.getScriptProperties();
  const guard=()=>{beautyBackgroundRequire_();beautyNakkaImportNeed_(beautyBackgroundInvocation_.operation==='nakka-import'&&
    beautyNakkaImportEqual_(beautyBackgroundScope_(),context)&&Date.now()-provider.readAt<60000,'IMPORT_CONTEXT_CHANGED');};
  return {provider,guard,read:beautyNakkaImportSnapshot_,history:beautyNakkaImportHistory_,now:()=>new Date().toISOString(),
    revalidate:()=>{guard();const lock=beautyBackgroundInvocation_.lock;let fresh,error;
      lock.releaseLock();try{fresh=beautyNakkaImportProvider_(context);}catch(e){error=e;}
      beautyNakkaImportNeed_(lock.tryLock(1000),'IMPORT_COMMIT_BUSY');guard();if(error)throw error;
      Object.assign(provider,fresh);},
    externalClosed:()=>{guard();const url=beautyHubSpreadsheet_().getFormUrl();beautyNakkaImportNeed_(!url||!FormApp.openByUrl(url).isAcceptingResponses(),'IMPORT_FORM_OPEN');},
    save:r=>{guard();beautyBackgroundSave_(beautyNakkaImportKey_(r.entry.tpid),r);},
    write:plan=>{guard();const requests=plan.cells.map(c=>({updateCells:{range:{sheetId:c.sheetId,startRowIndex:c.row,endRowIndex:c.row+1,startColumnIndex:0,endColumnIndex:6},
      rows:[{values:c.values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}}));
      // A numeric Sheets serial needs a date format so later ordinary removal
      // and registration readers receive a Date, not an untyped number.
      const response=plan.cells.find(c=>c.title==='Form responses 2');
      requests.push({repeatCell:{range:{sheetId:response.sheetId,startRowIndex:response.row,endRowIndex:response.row+1,startColumnIndex:0,endColumnIndex:1},
        cell:{userEnteredFormat:{numberFormat:{type:'DATE_TIME',pattern:'yyyy-mm-dd hh:mm:ss'}}},fields:'userEnteredFormat.numberFormat'}});
      Sheets.Spreadsheets.batchUpdate({requests},context.sheetId);SpreadsheetApp.flush();},
    sync:name=>{guard();syncTonightStatusDisplay_(name);},
  };
}
function beautyNakkaImportScan_(provider) {
  const io=beautyNakkaImportIO_(provider);io.guard();const state=io.read(),history=io.history();
  const decisions=provider.entries.map(e=>beautyNakkaImportDecision_(e,provider,state,history));
  const next=decisions.find(d=>d.state==='RESUME')||decisions.find(d=>d.state==='READY');
  if(next){const result=beautyNakkaImportExecute_(next.entry,io);decisions[decisions.indexOf(next)]=result;}
  const issues=decisions.filter(d=>['REVIEW','RESUME'].includes(d.state));
  for(const issue of issues)beautyHubAttentionRemember_(issue.entry.name,state.context.date,{code:issue.code});
  for(const done of decisions.filter(d=>d.state==='COMPLETE'))beautyHubAttentionRemember_(done.entry.name,state.context.date,{entryConfirmed:true});
  return {version:1,checkedAt:new Date().toISOString(),nextAt:Date.now()+120000,entries:provider.entries.length,
    imported:decisions.filter(d=>d.state==='COMPLETE').length,pending:decisions.filter(d=>['READY','RESUME'].includes(d.state)).length,
    protected:decisions.filter(d=>d.state==='PROTECTED').length,issues:issues.slice(0,20).map(d=>({name:d.entry.name,code:d.code})),issueCount:issues.length,nakkaWrites:0,masterWrites:0};
}
// Like the existing verified-recheck path, this owns its unlocked read phase.
function beautyNakkaImportRun_(run) {
  beautyBackgroundRequire_();
  if(typeof beautyImportAcceptancePending_==='function'&&beautyImportAcceptancePending_()){beautyImportAcceptanceRun_(run);return;}
  const i=beautyBackgroundInvocation_,lock=i.lock,p=PropertiesService.getScriptProperties(),c=beautyBackgroundConfig_();
  beautyBackgroundRequire_();const claimed=p.getProperty(c.runKey);let provider,error;
  lock.releaseLock();try{provider=beautyNakkaImportProvider_(i.context);}catch(e){error=e;}
  if(!lock.tryLock(1000)){console.log(JSON.stringify({type:'BEAUTY_IMPORT_DEFERRED',code:'IMPORT_COMMIT_BUSY',leaseUnchanged:true}));return;}
  beautyNakkaImportNeed_(p.getProperty(c.runKey)===claimed,'IMPORT_CLAIM_CHANGED');beautyBackgroundRequire_();
  let result;
  try{if(error)throw error;result=beautyNakkaImportScan_(provider);}
  catch(e){result={version:1,checkedAt:new Date().toISOString(),nextAt:Date.now()+120000,code:/^IMPORT_[A-Z_]+$/.test(e.message)?e.message:'IMPORT_CHECK_UNAVAILABLE',nakkaWrites:0,masterWrites:0};}
  beautyBackgroundRequire_();beautyBackgroundSave_(beautyNakkaImportKey_('SCAN'),result);
  run.state='FINISHED';run.finishedAt=new Date().toISOString();run.result={operation:'nakka-import',...result};
  beautyBackgroundSave_(c.runKey,run);console.log(JSON.stringify({type:'BEAUTY_BACKGROUND_RESULT',...run}));
}
// Owner-only readback/preflight: no fixture setup, writes, trigger or lease edits.
function beautyReadAutomaticNakkaImport20261123() {
  beautyBackgroundOwner_();const context=beautyBackgroundScope_(),provider=beautyNakkaImportProvider_(context);
  const lock=LockService.getScriptLock();beautyNakkaImportNeed_(lock.tryLock(1000),'IMPORT_BUSY');
  try{beautyNakkaImportNeed_(beautyNakkaImportEqual_(beautyBackgroundScope_(),context),'IMPORT_CONTEXT_CHANGED');
    const state=beautyNakkaImportSnapshot_(),history=beautyNakkaImportHistory_(),report={result:'AUTOMATIC_IMPORT_READ_ONLY',context,
      playersInHub:state.snap["TONIGHT'S PLAYERS"].display.slice(1).filter(r=>r[0]||r[1]).length,
      entries:provider.entries.map(entry=>{const d=beautyNakkaImportDecision_(entry,provider,state,history);return {name:entry.name,tpid:entry.tpid,state:d.state,code:d.code};}),
      lastScan:JSON.parse(PropertiesService.getScriptProperties().getProperty(beautyNakkaImportKey_('SCAN'))||'null'),writesPerformed:false};
    console.log(JSON.stringify(report,null,2));return report;
  }finally{lock.releaseLock();}
}
