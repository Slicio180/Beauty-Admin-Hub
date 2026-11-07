'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const {validateGuide}=require('./qualification.cjs'),{stable}=require('./coordinator.cjs');
function guideStore(directory,eventId){
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const prefix=crypto.createHash('sha256').update(eventId).digest('hex'),head=path.join(directory,prefix+'-head.json'),lock=head+'.lock';
 const flush=()=>{const fd=fs.openSync(directory,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
 const read=()=>{if(!fs.existsSync(head))return null;const r=JSON.parse(fs.readFileSync(head));if(r.eventId!==eventId||!Number.isInteger(r.revision)||r.revision<1||r.guide.eventId!==eventId)throw Error('Stored guide identity mismatch');validateGuide(r.guide);return r;};
 function save(expectedRevision,guide,actorHash){
  validateGuide(guide);if(guide.eventId!==eventId)throw Error('Guide belongs to another event');if(!/^[a-f0-9]{64}$/.test(actorHash))throw Error('Invalid guide actor identity');
  const fd=fs.openSync(lock,'wx',0o600);try{
   fs.writeFileSync(fd,actorHash);fs.fsyncSync(fd);flush();const prior=read();if((prior?.revision||0)!==expectedRevision)throw Error('Guide revision conflict');
   const record={eventId,revision:expectedRevision+1,guide:structuredClone(guide),actorHash,savedUTC:new Date().toISOString()},history=path.join(directory,prefix+'-revision-'+record.revision+'.json');
   const data=stable(record),h=fs.openSync(history,'wx',0o600);try{fs.writeFileSync(h,data);fs.fsyncSync(h);}finally{fs.closeSync(h);}flush();
   const temp=head+'.'+crypto.randomBytes(12).toString('hex'),t=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(t,data);fs.fsyncSync(t);}finally{fs.closeSync(t);}fs.renameSync(temp,head);flush();return record;
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);flush();}
 }
 return {read,save};
}
module.exports={guideStore};
