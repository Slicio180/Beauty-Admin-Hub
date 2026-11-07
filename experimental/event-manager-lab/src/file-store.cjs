'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function fileStore(directory){fs.mkdirSync(directory,{recursive:true,mode:0o700});
 function file(id){if(!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid audit ID');return path.join(directory,id+'.json');}
 function syncDir(){const fd=fs.openSync(directory,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
 const lease=tdid=>path.join(directory,'event-'+crypto.createHash('sha256').update(tdid).digest('hex')+'.lock');
 return {async assertClear(tdid){if(fs.existsSync(lease(tdid)))throw Error('Event has an unverified operation; inspect audit');},async claim(id,record){const gate=fs.openSync(lease(record.proposal.tdid),'wx',0o600);try{fs.writeFileSync(gate,id);fs.fsyncSync(gate);}finally{fs.closeSync(gate);}syncDir();const destination=file(id),temp=destination+'.'+process.pid+'.'+require('node:crypto').randomBytes(8).toString('hex');let fd;try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(record));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.linkSync(temp,destination);syncDir();}finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp);}},async verified(id,receipt){const destination=file(id),current=JSON.parse(fs.readFileSync(destination));if(current.state!=='ATTEMPTED')throw Error('Unexpected journal state');const temp=destination+'.verified';const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify({...current,state:'VERIFIED',receipt}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,destination);syncDir();fs.unlinkSync(lease(current.proposal.tdid));syncDir();}};
}
module.exports={fileStore};
