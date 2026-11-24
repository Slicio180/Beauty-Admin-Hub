'use strict';
// Prepared contract only. io must perform fresh bounded reads, never writes.
const equal=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const key=x=>String(x).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
function fail(code){const e=Error(code);e.code=code;throw e;}
function makeVerifiers(io){
 function read(kind,request,op){
  if(op!==request.requestId+':'+kind)fail('OPERATION_MISMATCH');
  io.assertContext(request.event);
  const s=io.readFresh(kind,request.event);
  io.assertContext(request.event);
  if(!s||!equal(s.event,request.event)||s.complete!==true||!Array.isArray(s.rows))fail('SNAPSHOT_UNCONFIRMED');
  return s.rows;
 }
 function unique(rows,predicate){const hits=rows.filter(predicate);if(hits.length!==1)fail('IDENTITY_UNCONFIRMED');return hits[0];}
 function proof(r,op,id){if(typeof id!=='string'||!id||id.length>160)fail('RECORD_ID_MISSING');return {verified:true,request:JSON.parse(JSON.stringify(r)),operationId:op,recordId:id};}
 return {
  save(r,op){const rows=read('save',r,op);const row=unique(rows,x=>x.requestId===r.requestId);if(!equal(row.request,r)||row.state!=='ACTIVE')fail('SAVED_RECORD_CONFLICT');return proof(r,op,row.recordId);},
  provider(r,op){
   // Mapping is trusted only if it was durably bound to the exact request/event.
   const mapping=io.readBinding(r.requestId);if(!mapping||!equal(mapping.request,r)||typeof mapping.tpid!=='string'||!mapping.tpid)fail('PROVIDER_BINDING_MISSING');
   const rows=read('provider',r,op);
   const row=unique(rows,x=>x.tpid===mapping.tpid||key(x.name)===key(r.player)||(mapping.lpid&&x.lpid===mapping.lpid));
   if(row.tpid!==mapping.tpid||key(row.name)!==key(r.player)||(r.event.mode==='league'&&(!mapping.lpid||row.lpid!==mapping.lpid)))fail('PROVIDER_IDENTITY_CONFLICT');
   return proof(r,op,row.tpid);
  },
  display(r,op){const rows=read('display',r,op);const row=unique(rows,x=>x.requestId===r.requestId||key(x.player)===key(r.player));if(row.requestId!==r.requestId||row.playerId!==r.playerId||key(row.player)!==key(r.player)||row.status!=='IN'||row.consent!==r.consent||row.message!==r.message||row.source!==r.source)fail('DISPLAY_CONFLICT');return proof(r,op,row.recordId);}
 };
}
module.exports={makeVerifiers};
