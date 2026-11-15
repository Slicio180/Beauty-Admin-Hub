from pathlib import Path
w=Path(__file__).parent
p=w/'LiveHub.js';s=p.read_text().replace('function beautyLiveDashboardRead_() {','function beautyLiveDashboardRead_(registrationOnly=false) {');needle='  // Spreadsheet serial values preserve registration order without inventing UTC timestamps.';s=s.replace(needle,"  // Verification needs the current roster only, not rankings or the master selector.\n  if(registrationOnly===true)return {success:true,eventDate:date,eventContext:beautyContextToken_(),players};\n"+needle);p.write_text(s)
p=w/'LiveRegistrationQueue.js';s=p.read_text();start=s.index(' const result=beautyLiveDashboardRead_(),found=');end=s.index(" j.steps.readback='VERIFIED';",start)
s=s[:start]+''' delete j.readbackFailure;
 try{
  let result;try{result=beautyLiveDashboardRead_(true);}catch(e){j.readbackFailure='displayRead';throw Error('Display read unavailable.');}
  const found=result.players.filter(r=>key(r.player||r.newPlayer)===key(j.player));
  const check=(name,read)=>{try{if(read())return;}catch(e){}j.readbackFailure=name;throw Error('Final readback needs review.');};
  check('response',responseMatches);check('master',masterMatch);
  check('statusRecord',()=>{const rows=statusRows();return rows.length===1&&JSON.stringify(rows[0].r)===JSON.stringify(expected);});
  check('displayIdentity',()=>found.length===1);
  check('displayStatus',()=>found[0].status===j.status);
  check('displayConsent',()=>found[0].consent===expected[3]);
  check('displayMessage',()=>found[0].message===String(expected[4]).trim());
  check('displaySource',()=>found[0].whereFrom===j.source);
 }finally{if(j.timing)j.timing.phases.readback=Date.now()-readbackStarted;}
'''+s[end:]
s=s.replace("j.failure='Saved effects need verification at '+(j.stage||'preflight')+'. Recheck this job; do not register again.';","j.failure=beautyQueueFailureText_(j);")
s=s.replace("stage:j.stage,workerMs:","stage:j.stage,failedCheck:beautyQueueReadbackCode_(j),workerMs:")
s=s.replace("const t=beautyLiveTarget_();return {success:true,processed:!!processed,context:t.revision,","const t=beautyLiveTarget_();return {success:true,processed:!!processed,...(action==='recheck'?{recheck:{id:input.id,outcome:processed?.state==='COMPLETE'?'COMPLETE':processed?.state==='REVIEW'?'REVIEW':'NOT_STARTED',failedCheck:beautyQueueReadbackCode_(processed)}}:{}),context:t.revision,")
s+='''
// Fixed labels only: never log submitted message, consent, credentials or exception bodies.
function beautyQueueReadbackCode_(j){return ['displayRead','response','master','statusRecord','displayIdentity','displayStatus','displayConsent','displayMessage','displaySource'].includes(j?.readbackFailure)?j.readbackFailure:null;}
function beautyQueueFailureText_(j){
 const labels={displayRead:'the player-list read',response:'the saved registration response',master:'the master-list identity',statusRecord:'the saved player record',displayIdentity:'the player-list identity',displayStatus:'the displayed status',displayConsent:'the displayed photo/video choice',displayMessage:'the displayed message',displaySource:'the displayed registration source'};
 const code=beautyQueueReadbackCode_(j);
 return code?'Verification needs review: '+labels[code]+'. Recheck this job; do not register again.':'Saved effects need verification at '+(j.stage||'preflight')+'. Recheck this job; do not register again.';
}
'''
p.write_text(s)
p=w/'LiveHubView.html';s=p.read_text();s=s.replace(" const queueTitle=create('h3','Registration queue',sections.overview);"," const queueTitle=create('h3','Registration queue',sections.overview);\n const queueFeedback=create('p','',sections.overview);queueFeedback.id='beautyQueueFeedback';queueFeedback.setAttribute('role','status');queueFeedback.setAttribute('aria-live','polite');")
s=s.replace(' let queueBusy=false,queueEpoch=0;', ''' let queueBusy=false,queueEpoch=0,activeRecheck=null;
 const waitingRechecks=new Map();
 function sayQueue(text){queueFeedback.textContent=text;}
 function requestRecheck(id){
  if(!unlocked||!window.beautyHubData?.eventContext){sayQueue('Sign in and reload the selected event before rechecking.');return;}
  if(id===activeRecheck||waitingRechecks.has(id)){sayQueue(id===activeRecheck?'Checking this registration…':'This registration is waiting for the current check to finish.');return;}
  waitingRechecks.set(id,{context:window.beautyHubData.eventContext,generation:BeautyHubAuth.generation()});
  sayQueue(queueBusy?'Recheck requested. Waiting for the current check to finish…':'Recheck requested. Checking registration…');
  void drainRechecks();
 }
 async function drainRechecks(){
  if(queueBusy||document.hidden||!unlocked)return;
  const next=waitingRechecks.entries().next().value;if(!next)return;
  const [id,ticket]=next;waitingRechecks.delete(id);
  if(ticket.context!==window.beautyHubData?.eventContext||ticket.generation!==BeautyHubAuth.generation()){sayQueue('Pending recheck cancelled because the event or session changed.');return drainRechecks();}
  await queueCheck('recheck',id);
 }
''')
s=s.replace("  if(queueBusy||!unlocked||document.hidden||!window.beautyHubData?.eventContext)return;", "  if(queueBusy||!unlocked||document.hidden||!window.beautyHubData?.eventContext)return;\n  if(!id&&waitingRechecks.size){void drainRechecks();return;}")
s=s.replace("  queueBusy=true;let continueQueue=false;", "  queueBusy=true;if(id){activeRecheck=id;sayQueue('Checking registration… Please wait; do not submit it again.');}let continueQueue=false;")
s=s.replace("const epoch=queueEpoch,context=", "const epoch=queueEpoch,context=")
s=s.replace("b.addEventListener('click',()=>queueCheck('recheck',j.id));", "b.addEventListener('click',()=>requestRecheck(j.id));")
needle="   if(r.legacy)create('li','An older registration receipt"
pos=s.index(needle)
s=s[:pos]+"   if(id){const outcome=r.recheck?.outcome;sayQueue(outcome==='COMPLETE'?'Registration verified. Recheck completed.':outcome==='REVIEW'?'Recheck completed: this registration still needs review. See its details below.':'Recheck did not start. Another operation may be running. Wait for it to finish, then try once.');}\n"+s[pos:]
s=s.replace("queueReadFailed=true;paintIssues();queueList.replaceChildren();", "queueReadFailed=true;if(id)sayQueue('Recheck result unavailable. It may still be running; wait for the queue status before trying again.');paintIssues();queueList.replaceChildren();")
s=s.replace("queueBusy=false;if(continueQueue)setTimeout(()=>queueCheck(),0);", "queueBusy=false;activeRecheck=null;if(waitingRechecks.size)setTimeout(()=>drainRechecks(),0);else if(continueQueue)setTimeout(()=>queueCheck(),0);")
s=s.replace("queueEpoch++;queueBusy=false;queueJobs=[];", "queueEpoch++;queueBusy=false;activeRecheck=null;waitingRechecks.clear();sayQueue('');queueJobs=[];")
s=s.replace("document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});", "document.addEventListener('visibilitychange',()=>{if(!document.hidden){check();void drainRechecks();}});")
p.write_text(s)
