/* Accepted import decision/atomic-write core with selected-window response filtering. */
function beautyNakkaImportNeed_(ok,code){if(!ok)throw Error(code);}

function beautyNakkaImportEqual_(a,b){return JSON.stringify(a)===JSON.stringify(b);}

function beautyNakkaImportName_(v){return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}

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
  const responses=response.values.map((v,i)=>({v,i})).slice(1).filter(r=>beautyNakkaImportResponseCurrent_(r.v,state)&&key(r.v[1]==='MITT NAMN FINNS INTE I LISTAN'?r.v[2]:r.v[1])===name);
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
    const matches=s.values.slice(1).filter(r=>cell.title==='Form responses 2'?beautyNakkaImportResponseCurrent_(r,state)&&key(r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1])===name:key(r[0])===name||r[1]&&key(r[1])===name);
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
