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
