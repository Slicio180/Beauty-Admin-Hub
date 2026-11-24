const {fixture}=require('./repair.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'candidate/HubTestAttention.gs'),'utf8');
const start=src.indexOf('function beautyRegistrationRecoveryResume_('),end=src.indexOf('\n// Read-only assessment',start),fn=src.slice(start,end);
const checks=[];
for(const state of ['REVIEW','COMPLETE'])for(const answer of ['JA','NEJ']){
 const f=fixture(answer),c=f.c;f.remove([3,4]);
 const receipt={state,name:'Synthetic Player',consent:answer==='JA'?'JA, JAG GODKÄNNER':'NEJ, JAG GODKÄNNER INTE',message:'Keep message',source:'MOBIL',existingPlayer:true};
 const ss={getId:()=> 'fixture',getSheetByName:n=>n==='PLAYER STATUS DATA'?f.s.store:n==="TONIGHT'S PLAYERS"?f.s.tonight:{getLastRow:()=>2,getRange:()=>({getDisplayValues:()=>[['Synthetic Player','','','','','']]})}};
 Object.assign(c,{beautyHubTestGuard_:()=>{},beautyBackgroundRegistrationAuthorize_:()=>{},beautyBackgroundInvocation_:{},PropertiesService:{getScriptProperties:()=>({getProperty:()=>JSON.stringify(receipt)})},beautyRegistrationRecoveryKey_:()=> 'fixture',beautyRegistrationRecoverySource_:()=>ss,BeautyNameResolution:{key:v=>String(v||'').trim().toLowerCase()},beautyContextRead_:()=>({sheetId:'fixture'}),beautyTestDestinationGuard_:()=>{},MASTER_SHEET:"PLAYER'S MASTER LIST",updatePlayerStatusData_:()=>{},syncTonightStatusDisplay_:()=>{},beautyRegistrationRecoveryWrite_:r=>{receipt.state=r.state;},beautyHubAttentionRemember_:()=>{}});
 vm.runInContext(fn,c);const before=JSON.stringify(f.status),r=c.beautyRegistrationRecoveryResume_('Synthetic Player');assert.equal(r.success,true);assert.equal(receipt.state,'COMPLETE');assert.equal(JSON.stringify(f.status),before);assert.equal(f.writes.length,1);assert.equal(f.s.tonight.getRange(2,4).getDisplayValues()[0][0],answer);checks.push(state+' receipt restores '+answer+' and verifies saved projection');
}
for(const later of ['NEJ','N/A']){
 const f=fixture(later),c=f.c;f.remove();const receipt={state:'REVIEW',name:'Synthetic Player',consent:'JA, JAG GODKÄNNER',message:'Keep message',source:'MOBIL'};
 const ss={getId:()=> 'fixture',getSheetByName:n=>n==='PLAYER STATUS DATA'?f.s.store:f.s.tonight};let updates=0;
 Object.assign(c,{beautyHubTestGuard_:()=>{},beautyBackgroundRegistrationAuthorize_:()=>{},beautyBackgroundInvocation_:{},PropertiesService:{getScriptProperties:()=>({getProperty:()=>JSON.stringify(receipt)})},beautyRegistrationRecoveryKey_:()=> 'fixture',beautyRegistrationRecoverySource_:()=>ss,BeautyNameResolution:{key:v=>String(v||'').trim().toLowerCase()},beautyContextRead_:()=>({sheetId:'fixture'}),beautyTestDestinationGuard_:()=>{},updatePlayerStatusData_:()=>{updates++;}});
 vm.runInContext(fn,c);const r=c.beautyRegistrationRecoveryResume_('Synthetic Player');assert.equal(r.success,false);assert.equal(r.code,'REGISTRATION_STATUS_CHANGED');assert.equal(updates,0);assert.equal(f.status.values[1][3],later);assert.equal(f.s.tonight.getRange(2,4).getDisplayValues()[0][0],later);checks.push('Later '+later+' preserved and conflicting original answer not replayed');
}
const result={result:'PASS',checks:checks.length,details:checks,scope:'Exact TEST recovery function and shared formula helper composed with simulated services; not rendered Hub acceptance.'};fs.writeFileSync(path.join(root,'evidence/test-recovery-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
