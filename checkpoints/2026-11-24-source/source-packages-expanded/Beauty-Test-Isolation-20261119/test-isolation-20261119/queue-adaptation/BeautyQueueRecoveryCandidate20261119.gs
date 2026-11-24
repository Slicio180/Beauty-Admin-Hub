// PREPARED ONLY. Not installed. Derived from captured TEST queue core.
function beautyQueueRecoveryCandidate20261119_(store, clock, tokenFactory) {
  'use strict';
  const STEPS=['save','provider','display'];
  // Greater than the documented six-minute Apps Script execution limit.
  // An expired claim is quarantined, never replayed. Do not shorten in production.
  const LEASE_MS=600000;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
  function stop(code){const e=new Error(code);e.code=code;throw e;}
  function exact(v,keys){if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).sort().join(',')!==keys.slice().sort().join(','))stop('INVALID_REQUEST');}
  function text(v,max){return typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);}
  function validate(r){
    exact(r,['requestId','event','playerId','player','source','consent','message']);
    if(!/^[a-zA-Z0-9_-]{12,100}$/.test(r.requestId||'')||!text(r.playerId,160)||!text(r.player,120)||!['HUB','KIOSK','MOBIL'].includes(r.source)||!['JA','NEJ'].includes(r.consent)||typeof r.message!=='string'||r.message.length>2000)stop('INVALID_REQUEST');
    exact(r.event,['mode','leagueId','eventId','date','revision','sheetId']);
    const e=r.event;
    if(!['league','tournament'].includes(e.mode)||!/^t_[\w]{1,80}$/.test(e.eventId||'')||!/^20\d\d-\d\d-\d\d$/.test(e.date||'')||new Date(e.date+'T12:00:00Z').toISOString().slice(0,10)!==e.date||!text(e.revision,100)||!/^[-\w]{20,150}$/.test(e.sheetId||'')||(e.mode==='league'?!/^lg_[\w]{1,80}$/.test(e.leagueId||''):e.leagueId!==''))stop('INVALID_EVENT');
    return copy(r);
  }
  const eventKey=e=>JSON.stringify([e.mode,e.leagueId,e.eventId]);
  const key=r=>JSON.stringify([eventKey(r.event),r.playerId]);
  function checkRows(rows){
    if(!Array.isArray(rows)||rows.length>500)stop('QUEUE_LAYOUT');
    const ids=new Set(),players=new Set();
    for(const j of rows){
      if(!j||j.version!==1||!Number.isInteger(j.revision)||j.revision<1||!['QUEUED','WORKING','ATTENTION','COMPLETE'].includes(j.state)||!Array.isArray(j.history)||j.history.length>20)stop('QUEUE_LAYOUT');
      validate(j.request);
      if(ids.has(j.request.requestId)||players.has(key(j.request)))stop('QUEUE_DUPLICATE');
      ids.add(j.request.requestId);players.add(key(j.request));
      if(!Number.isFinite(j.createdAt)||!Number.isFinite(j.updatedAt)||!j.outcomes||!STEPS.every(s=>j.outcomes[s]&&['PENDING','INTENT','VERIFIED'].includes(j.outcomes[s].state)))stop('QUEUE_LAYOUT');
      if(j.state==='WORKING'&&(!j.claim||!text(j.claim.token,100)||!Number.isFinite(j.claim.expiresAt)))stop('QUEUE_LAYOUT');
      if(j.state==='COMPLETE'&&!STEPS.every(s=>j.outcomes[s].state==='VERIFIED'))stop('QUEUE_LAYOUT');
    }
    // Only one worker is allowed in this bounded queue. Acceptance remains free.
    if(rows.filter(j=>j.state==='WORKING').length>1)stop('QUEUE_MULTIPLE_WORKERS');
  }
  function transaction(fn){return store.transaction(tx=>{const rows=tx.list();checkRows(rows);return fn(tx,rows);});}
  function write(tx,j,event){
    const out=copy(j);out.revision++;out.updatedAt=clock();out.history.push({at:out.updatedAt,event});
    if(out.history.length>20)stop('QUEUE_HISTORY_LIMIT');
    tx.put(out,j.revision);return copy(out);
  }
  function find(rows,id){const j=rows.find(x=>x.request.requestId===id);if(!j)stop('REQUEST_MISSING');return j;}
  function owned(rows,id,token){const j=find(rows,id);if(j.state!=='WORKING'||j.claim.token!==token||clock()>=j.claim.expiresAt)stop('CLAIM_LOST');return j;}
  function enqueue(raw){
    const request=validate(raw);
    return transaction((tx,rows)=>{
      const old=rows.find(j=>j.request.requestId===request.requestId);
      if(old){if(!same(old.request,request))stop('REQUEST_ID_REUSED');return {accepted:true,replayed:true,duplicate:false,job:copy(old)};}
      const duplicate=rows.find(j=>key(j.request)===key(request));
      if(duplicate)return {accepted:false,replayed:false,duplicate:true,code:'PLAYER_ALREADY_QUEUED',requestId:duplicate.request.requestId,state:duplicate.state};
      // The same provider event cannot be silently rebound to another date/book.
      if(rows.some(j=>eventKey(j.request.event)===eventKey(request.event)&&!same({...j.request.event,revision:''},{...request.event,revision:''})))stop('EVENT_BINDING_CHANGED');
      if(rows.length>=500)stop('QUEUE_CAPACITY');
      const t=clock(),job={version:1,revision:1,request,state:'QUEUED',createdAt:t,updatedAt:t,claim:null,failure:null,outcomes:Object.fromEntries(STEPS.map(s=>[s,{state:'PENDING'}])),history:[{at:t,event:'ACCEPTED'}]};
      tx.put(job,0);return {accepted:true,replayed:false,duplicate:false,job:copy(job)};
    });
  }
  function list(){return transaction((tx,rows)=>copy(rows));}
  function get(id){return transaction((tx,rows)=>copy(find(rows,id)));}
  function claim(){
    return transaction((tx,rows)=>{
      const active=rows.find(j=>j.state==='WORKING');
      if(active){
        if(clock()<active.claim.expiresAt)return null;
        active.state='ATTENTION';active.failure='WORKER_INTERRUPTED';active.claim=null;
        write(tx,active,'INTERRUPTED');
        // Reload on the next invocation; never continue from a possibly uncertain write.
        return null;
      }
      const pending=rows.find(j=>j.state==='QUEUED');if(!pending)return null;
      const token=tokenFactory();if(!text(token,100))stop('INVALID_CLAIM_TOKEN');
      pending.state='WORKING';pending.claim={token,expiresAt:clock()+LEASE_MS};return write(tx,pending,'CLAIMED');
    });
  }
  function operation(id,token,step,effect){
    if(!STEPS.includes(step)||typeof effect!=='function')stop('INVALID_OPERATION');
    const intent=transaction((tx,rows)=>{
      const j=owned(rows,id,token),index=STEPS.indexOf(step);
      if(j.outcomes[step].state!=='PENDING'||STEPS.slice(0,index).some(s=>j.outcomes[s].state!=='VERIFIED'))stop('OPERATION_REPLAY_BLOCKED');
      j.outcomes[step]={state:'INTENT',operationId:id+':'+step};return write(tx,j,'INTENT_'+step.toUpperCase());
    });
    // Deliberately outside Store.transaction / ScriptLock.
    const proof=effect(copy(intent.request),intent.outcomes[step].operationId);
    if(!proof||proof.verified!==true||typeof proof.recordId!=='string'||!text(proof.recordId,160)||Object.keys(proof).some(k=>!['verified','recordId'].includes(k)))stop('EFFECT_NOT_VERIFIED');
    return transaction((tx,rows)=>{
      const j=owned(rows,id,token);if(j.outcomes[step].state!=='INTENT')stop('OPERATION_STATE_CHANGED');
      j.outcomes[step]={...j.outcomes[step],state:'VERIFIED',recordId:proof.recordId};return write(tx,j,'VERIFIED_'+step.toUpperCase());
    });
  }
  function attention(id,token,code){
    // Only fixed diagnostic codes enter durable records; no raw exceptions/payloads.
    const allowed=['SAVE_UNCERTAIN','PROVIDER_UNCERTAIN','DISPLAY_UNCERTAIN','WORKER_FAILED'];
    return transaction((tx,rows)=>{const j=owned(rows,id,token);j.state='ATTENTION';j.claim=null;j.failure=allowed.includes(code)?code:'WORKER_FAILED';return write(tx,j,'NEEDS_ATTENTION');});
  }
  function complete(id,token){return transaction((tx,rows)=>{const j=owned(rows,id,token);if(!STEPS.every(s=>j.outcomes[s].state==='VERIFIED'))stop('INCOMPLETE');j.state='COMPLETE';j.claim=null;return write(tx,j,'COMPLETE');});}
  function processNext(effects){
    if(!effects||!STEPS.every(s=>typeof effects[s]==='function'))stop('MISSING_EFFECT');
    const j=claim();if(!j)return null;
    for(const step of STEPS){
      try{operation(j.request.requestId,j.claim.token,step,effects[step]);}
      catch(error){
        // If the durable store also fails, leave the existing intent/claim in place.
        // This propagates the storage failure; it is never a successful completion.
        return attention(j.request.requestId,j.claim.token,{save:'SAVE_UNCERTAIN',provider:'PROVIDER_UNCERTAIN',display:'DISPLAY_UNCERTAIN'}[step]);
      }
    }
    return complete(j.request.requestId,j.claim.token);
  }
  // Confirmation only: verifiers MUST be read-only and bind proof to this exact
  // request and operation. This API never invokes save/provider/display writes.
  function recover(id, expectedEvent, verifiers, assertContext){
    if(typeof assertContext!=='function'||!verifiers||!STEPS.every(s=>typeof verifiers[s]==='function'))stop('MISSING_VERIFIER');
    const claimed=transaction((tx,rows)=>{
      assertContext(expectedEvent);
      const j=find(rows,id);
      if(!same(j.request.event,expectedEvent))stop('EVENT_CHANGED');
      if(j.state!=='ATTENTION')return null;
      if(rows.some(x=>x.state==='WORKING'))return null;
      const retry=j.recovery||{attempts:0,nextAt:0};
      if(!Number.isInteger(retry.attempts)||retry.attempts<0||!Number.isFinite(retry.nextAt))stop('RECOVERY_LAYOUT');
      if(retry.blocked||retry.attempts>=5||clock()-j.createdAt>=86400000||j.history.length>17)stop('RECOVERY_REVIEW_REQUIRED');
      if(clock()<retry.nextAt)return null;
      const token=tokenFactory();if(!text(token,100))stop('INVALID_CLAIM_TOKEN');
      j.state='WORKING';j.claim={token,expiresAt:clock()+LEASE_MS};
      j.recovery={attempts:retry.attempts+1,nextAt:clock()+Math.min(300000,30000*2**retry.attempts)};
      return write(tx,j,'RECOVERY_CLAIMED');
    });
    if(!claimed)return null;
    const proofs={};let failure=null;
    // External reads are outside the transaction lock. Recheck EVERY step,
    // including old VERIFIED steps; stale success is not current proof.
    for(const step of STEPS){
      try{
        assertContext(expectedEvent);
        const proof=verifiers[step](copy(claimed.request),id+':'+step);
        if(!proof||proof.verified!==true||!same(proof.request,claimed.request)||proof.operationId!==id+':'+step||!text(proof.recordId,160))stop('PROOF_MISMATCH');
        proofs[step]={state:'VERIFIED',operationId:id+':'+step,recordId:proof.recordId};
      }catch(e){failure=e&&e.code==='TEMPORARY_READ_FAILURE'?'TEMPORARY_READ_FAILURE':'RECOVERY_UNCONFIRMED';break;}
    }
    return transaction((tx,rows)=>{
      assertContext(expectedEvent);
      const j=owned(rows,id,claimed.claim.token);
      if(!same(j.request,claimed.request)||!same(j.request.event,expectedEvent))stop('EVENT_CHANGED');
      j.claim=null;
      if(failure){j.state='ATTENTION';j.failure=failure;j.recovery.blocked=failure!=='TEMPORARY_READ_FAILURE';}
      else {j.outcomes=proofs;j.state='COMPLETE';j.failure=null;}
      return write(tx,j,failure?'RECOVERY_UNCONFIRMED':'RECOVERY_COMPLETE');
    });
  }
  return Object.freeze({enqueue,list,get,claim,operation,attention,complete,processNext,recover,leaseMs:LEASE_MS});
}

