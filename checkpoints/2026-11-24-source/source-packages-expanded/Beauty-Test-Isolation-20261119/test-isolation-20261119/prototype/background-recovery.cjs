'use strict';
// OFFLINE ONLY. No triggers or network services. Adapter must share its lock
// with ALL queue writers and implement durable write/readback semantics.
const {save}=require('./save-recovery.cjs');
const retryable=new Set(['TEMPORARY_READ_FAILURE','RATE_LIMITED','BUSY']);
const blockers=new Set(['ATTEMPTED_ROW_ABSENT','RETRY_CONFLICT','RECEIPT_CONFLICT','RECEIPT_READBACK','ROW_READBACK','BACKGROUND_APPEND_BLOCKED','INVALID_REQUEST','INVALID_RECORD','INVALID_EVENT','INVALID_LEDGER','DUPLICATE_ID','PLAYER_ALREADY_REGISTERED','WRONG_EVENT','INVALID_NEW_STATE']);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function run(adapter,context,clock){
 const started=clock();
 if(!Number.isFinite(started))throw Error('INVALID_CLOCK');
 if(!adapter.tryLock())return {status:'BUSY',processed:0};
 let processed=0;
 try{
  adapter.assertContext(context);
  const jobs=adapter.list();
  if(!Array.isArray(jobs)||jobs.length>1000)throw Error('INVALID_QUEUE');
  const ids=new Set();
  for(const j of jobs){
   if(!j||typeof j.id!=='string'||ids.has(j.id)||!['PENDING','COMPLETE','BLOCKED'].includes(j.status)||!Number.isInteger(j.attempts)||j.attempts<0||!Number.isFinite(j.nextAt)||!Number.isFinite(j.expiresAt)||!j.request||j.id!==j.request.registrationId)throw Error('INVALID_JOB');
   ids.add(j.id);
  }
  function persist(job){
   adapter.assertContext(context);adapter.write(job);
   if(!same(adapter.read(job.id),job))throw Error('QUEUE_READBACK');
  }
  for(const snapshot of jobs.filter(j=>j.status==='PENDING').sort((a,b)=>a.nextAt-b.nextAt||a.id.localeCompare(b.id))){
   const now=clock();if(!Number.isFinite(now)||now<started)throw Error('INVALID_CLOCK');
   if(processed>=3||now-started>=15000)break;
   adapter.assertContext(context);
   const job=adapter.read(snapshot.id);if(!same(job,snapshot))throw Error('QUEUE_CHANGED');
   // Never redirect old work into the newly selected event.
   if(!same(job.context,context))continue;
   if(now>=job.expiresAt||job.attempts>=5){persist({...job,status:'BLOCKED',code:now>=job.expiresAt?'RECOVERY_EXPIRED':'RETRY_LIMIT'});processed++;continue;}
   if(job.nextAt>now)continue;
   // Persist attempt before work: an interrupted run cannot retry forever.
   const attempt={...job,attempts:job.attempts+1,nextAt:now+Math.min(300000,30000*2**job.attempts)};
   persist(attempt);processed++;
   let outcome;
   try{
    const store=adapter.store(job);
    // Outer lock already held. Background confirmation never creates records.
    outcome=save({...store,tryLock:()=>true,releaseLock:()=>{},appendRecord:()=>{throw Error('BACKGROUND_APPEND_BLOCKED');}},job.request,context);
   }catch(e){const code=e&&e.message;outcome={status:'ERROR',code:retryable.has(code)||blockers.has(code)?code:'UNEXPECTED_FAILURE'};}
   adapter.assertContext(context);
   if(outcome.status==='VERIFIED')persist({...attempt,status:'COMPLETE',code:'VERIFIED'});
   else if(retryable.has(outcome.code||outcome.status))persist({...attempt,code:outcome.code||outcome.status});
   else persist({...attempt,status:'BLOCKED',code:outcome.code||'UNEXPECTED_RESULT'});
  }
  return {status:'FINISHED',processed};
 }finally{adapter.releaseLock();}
}
module.exports={run};
