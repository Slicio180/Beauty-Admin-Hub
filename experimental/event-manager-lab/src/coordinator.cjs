'use strict';
const crypto=require('node:crypto');
const stable=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(stable).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
const hash=x=>crypto.createHash('sha256').update(stable(x)).digest('hex');
function coordinator({read,plan,write,verify,store,authorize,clock=Date.now}){
 const tickets=new Map();let barrier=Promise.resolve();
 const serial=fn=>{const task=barrier.then(fn);barrier=task.catch(()=>{});return task;};
 async function review(actor,input){return serial(async()=>{await authorize(actor);const before=await read();await store.assertClear(before.event.tdid);const proposal=plan(before,input);if(proposal.requiresNativeQualification)throw Error('Native qualification is pending for this operation');const ticket=crypto.randomBytes(24).toString('hex');tickets.set(ticket,{who:hash(actor),before:hash(before),input:structuredClone(input),plan:hash(proposal),expires:clock()+300000});return {ticket,proposal};});}
 async function confirm(actor,ticket,confirmed){return serial(async()=>{
  await authorize(actor);const approval=tickets.get(ticket);tickets.delete(ticket);
  if(confirmed!==true||!approval||approval.who!==hash(actor)||clock()>=approval.expires)throw Error('Approval missing, expired or belongs to another session');
  const before=await read();await store.assertClear(before.event.tdid);if(hash(before)!==approval.before)throw Error('Event changed; review again');const proposal=plan(before,approval.input);if(proposal.requiresNativeQualification)throw Error('Native qualification is pending for this operation');if(hash(proposal)!==approval.plan)throw Error('Proposal changed');
  await authorize(actor);const claim=hash({event:proposal.tdid,proposal,before:approval.before});
  // Store must atomically claim this operation durably across processes/restarts.
  await store.claim(claim,{state:'ATTEMPTED',actor:{uid:typeof actor==='object'?actor.uid:undefined,sessionHash:hash(actor)},proposal,before,at:clock()});
  try{await write(proposal.request,{actorHash:hash(actor),receipt:claim});const after=await read();if(!verify(before,proposal,after))throw Error('Readback differs');await store.verified(claim,{after,at:clock()});return {success:true,verified:true,receipt:claim};}
  catch{ return {success:false,uncertain:true,receipt:claim,message:'Operation unverified. Do not retry. Inspect the event and audit.'};}
 });}
 return {review,confirm};
}
function verifyTables(before,proposal,after){const expected=structuredClone(before.event);Object.assign(expected,proposal.request.body.set);delete expected.updateTime;const actual=structuredClone(after.event);delete actual.updateTime;return stable(expected)===stable(actual);}
module.exports={coordinator,hash,stable,verifyTables};
