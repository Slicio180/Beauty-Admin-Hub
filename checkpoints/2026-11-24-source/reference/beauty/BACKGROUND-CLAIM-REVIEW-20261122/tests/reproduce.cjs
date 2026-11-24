process.env.BEAUTY_CLAIM_SOURCE='baseline';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('./fixture.cjs');
const f=fixture();f.enable();const receipt=f.receipt();
const claimedAt=new Date(f.now()-660000).toISOString(),leaseUntil=f.now()-60000;
const record={version:1,eventId:f.context.eventId,name:receipt.name,date:f.context.date,state:'CHECKING',code:'RECOVERY_STARTED',owner:'expired-third-owner',autoAttempts:3,updatedAt:claimedAt,
 worker:{version:1,attempts:3,context:f.context,intentHash:hash(f.c.beautyBackgroundReceiptIntent_(receipt)),claimedAt,leaseUntil,nextAt:f.now()-420000},
 history:[{at:claimedAt,code:'RECOVERY_STARTED',state:'CHECKING',source:'background'}]};
f.props['recovery-'+receipt.name]=JSON.stringify(record);
f.props[f.config.runKey]=JSON.stringify({state:'RUNNING',owner:record.owner,triggerUid:JSON.parse(f.props[f.config.key]).triggerUid,context:f.context,operation:'registration',player:receipt.name,startedAt:claimedAt,leaseUntil});
const before=f.props['recovery-'+receipt.name];f.tick();
assert.equal(f.props['recovery-'+receipt.name],before);assert.equal(JSON.parse(before).state,'CHECKING');assert.equal(JSON.parse(f.props[f.config.runKey]).state,'IDLE');assert.equal(f.provider.length,0);
const r={result:'REPRODUCED_EXPIRED_THIRD_CLAIM_LEFT_CHECKING',baseline_sha256:'68da45c5b1609b35a05d76c008ed98a0c882b930ace1eb72cc91b1189643c34d',recordedUTC:new Date().toISOString(),stateBefore:'CHECKING',stateAfter:'CHECKING',attempts:3,globalAfter:'IDLE',remoteCalls:0,scope:'Actual baseline clock/selector with simulated services and an expired third background claim; no Google records changed.'};
fs.writeFileSync(path.join(__dirname,'../evidence/reproduction.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
