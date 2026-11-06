/* Local durable rehearsal journal. Atomic revision claim prevents restart retries.
 * Deployment needs an equivalent staff-authorized persistent-store adapter.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function create(directory){
 fs.mkdirSync(directory,{recursive:true,mode:0o700});
 return async function audit(record){
  if(!record||record.eventId!=='t_QHaG_7792'||!/^[a-f0-9]{64}$/.test(record.digest)||!Number.isSafeInteger(record.revision)||record.revision<0||!['ATTEMPTED','READBACK_VERIFIED','UNKNOWN_INSPECT_NAKKA'].includes(record.state))throw Error('Invalid journal record.');
  const file=path.join(directory,'test-revision-'+record.revision+'.jsonl'),line=JSON.stringify({...record,recordedAt:new Date().toISOString()})+'\n';
  let fd;
  try{
   if(record.state==='ATTEMPTED'){
    try{fd=fs.openSync(file,'wx',0o600);}catch(e){if(e.code==='EEXIST')return {claimed:false};throw e;}
   }else{
    const initial=JSON.parse(fs.readFileSync(file,'utf8').split('\n')[0]);if(initial.digest!==record.digest)throw Error('Journal claim differs.');fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_APPEND|fs.constants.O_NOFOLLOW);
   }
   fs.writeSync(fd,line);fs.fsyncSync(fd);
  }finally{if(fd!==undefined)fs.closeSync(fd);}
  return {claimed:record.state==='ATTEMPTED'};
 };
}
module.exports={create};
