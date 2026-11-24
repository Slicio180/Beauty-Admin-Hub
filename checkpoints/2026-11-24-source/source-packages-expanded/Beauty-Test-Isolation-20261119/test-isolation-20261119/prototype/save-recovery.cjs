// Offline persistence protocol prototype. No Google/Nakka adapter or background trigger.
'use strict';
const records=require('./event-records.cjs');
const fields=['registrationId','leagueId','eventId','eventDate','player','submittedAt','state','consent','source','message'];
const equal=(a,b)=>a&&b&&fields.every(k=>a[k]===b[k]);
function save(store,request,approved){
 // Validate before any service access. Reject extra fields rather than persist unreviewed data.
 if(!request||Object.keys(request).some(k=>!fields.includes(k)))throw Error('INVALID_REQUEST');
 records.append([],request);
 if(!approved||['leagueId','eventId','eventDate'].some(k=>request[k]!==approved[k]))throw Error('WRONG_EVENT');
 if(!store.tryLock())return {status:'BUSY'};
 try{
  store.assertDestination(approved);
  const old=store.readReceipt(request.registrationId);
  if(old&&(!equal(old.request,request)||!['INTENT','ATTEMPTED','COMPLETE'].includes(old.phase)))throw Error('RECEIPT_CONFLICT');
  const rows=store.readRows();
  // Readback is mandatory even after a COMPLETE receipt; changed/removed data must not be replayed.
  const plan=records.append(rows,request);
  if(!plan.changed){
   store.assertDestination(approved);
   store.writeReceipt(request.registrationId,{phase:'COMPLETE',request:{...request}});
   const receipt=store.readReceipt(request.registrationId);
   if(receipt?.phase!=='COMPLETE'||!equal(receipt.request,request))throw Error('RECEIPT_READBACK');
   return {status:'VERIFIED',appended:false};
  }
  // Absence after an uncertain attempted write is not proof that a delayed write cannot land.
  if(old&&old.phase!=='INTENT')return {status:'REVIEW_REQUIRED',code:'ATTEMPTED_ROW_ABSENT'};
  if(!old){
   store.writeReceipt(request.registrationId,{phase:'INTENT',request:{...request}});
   const receipt=store.readReceipt(request.registrationId);
   if(receipt?.phase!=='INTENT'||!equal(receipt.request,request))throw Error('RECEIPT_READBACK');
  }
  store.assertDestination(approved);
  store.writeReceipt(request.registrationId,{phase:'ATTEMPTED',request:{...request}});
  const attempted=store.readReceipt(request.registrationId);
  if(attempted?.phase!=='ATTEMPTED'||!equal(attempted.request,request))throw Error('RECEIPT_READBACK');
  store.appendRecord({...request});
  store.assertDestination(approved);
  if(records.append(store.readRows(),request).changed)throw Error('ROW_READBACK');
  store.writeReceipt(request.registrationId,{phase:'COMPLETE',request:{...request}});
  const completed=store.readReceipt(request.registrationId);
  if(completed?.phase!=='COMPLETE'||!equal(completed.request,request))throw Error('RECEIPT_READBACK');
  return {status:'VERIFIED',appended:true};
 }finally{store.releaseLock();}
}
module.exports={save};
