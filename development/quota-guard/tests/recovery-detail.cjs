const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const dir=process.argv[2],target={mode:'league',sheetId:'test-sheet',eventId:'test-event',date:'2026-11-25',revision:'test-context'};
const env={Date,PropertiesService:{getScriptProperties:()=>({getProperties:()=>({})})},beautyLiveTarget_:()=>target,beautyLiveRegistrationKey_:s=>s.toLowerCase(),beautyQueueHash_:s=>JSON.stringify(s)};
const c=vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(dir,'LivePlayerRecovery.gs'),'utf8'),c);c.beautyLivePlayerRecoveryLoad_=()=>null;
const job={id:'synthetic-job',player:'Test Player',state:'REVIEW',readbackFailure:'displayConsent'};
const snap={data:{players:[{player:'Test Player',status:'IN'}]},jobs:[job],items:[],league:[{name:'Test Player',lpid:'abcd'}],entries:[{name:'Test Player',lpid:'abcd',tpid:'entry'}],provider:{title:'Synthetic event',status:10},checkedAt:'2026-11-25T14:00:00Z'};
const view=()=>c.beautyLivePlayerRecoveryView_(snap).players[0];
assert.equal(view().code,'REGISTRATION_REVIEW');assert.equal(view().failedCheck,'displayConsent');assert.match(view().problem,/photo\/video consent/);assert.notEqual(view().tone,'green');assert.equal(view().operation.kind,'queue');
for(const code of ['displayRead','response','master','statusRecord','displayIdentity','displayStatus','displayConsent','displayMessage','displaySource']){job.readbackFailure=code;assert.equal(view().failedCheck,code);assert.match(view().problem,/Last registration check/);assert.notEqual(view().tone,'green');}
job.readbackFailure='untrusted';assert.equal(view().failedCheck,null);assert.equal(view().problem,'The saved registration needs checking.');
job.readbackFailure='displayConsent';job.background={attempts:3};assert.equal(view().code,'AUTO_RETRY_LIMIT');assert.equal(view().tone,'red');assert.equal(view().autoEligible,false);assert.match(view().next,/Automatic|Review the original/);
snap.provider.status=30;assert.equal(view().code,'EVENT_REGISTRATION_CLOSED');assert.equal(view().failedCheck,null);
snap.provider.status=10;job.state='COMPLETE';assert.equal(view().code,'ENTRY_CONFIRMED');assert.equal(view().tone,'green');assert.equal(view().failedCheck,null);
job.state='REVIEW';snap.entries.push({...snap.entries[0]});assert.equal(view().code,'IDENTITY_CONFLICT');assert.equal(view().failedCheck,null);
console.log('PASS nine failure explanations, generic fallback, unresolved queue precedence, retry limit, closed event, completed queue and identity-conflict precedence');
