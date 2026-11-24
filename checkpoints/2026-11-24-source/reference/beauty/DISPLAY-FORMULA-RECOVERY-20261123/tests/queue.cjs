const {fixture}=require('./repair.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function fn(src,name){const start=src.indexOf('function '+name+'(');assert(start>=0);const rest=src.slice(start+1),next=/^function /m.exec(rest);return src.slice(start,next?start+1+next.index:undefined);}
function run(candidate){
 const f=fixture(),c=f.c,j={player:'Synthetic Player',isNew:false,event:{mode:'league',leagueId:'test-league',eventId:'test-event'},steps:{response:'VERIFIED',status:'VERIFIED'},responseSerial:123,alias:'',status:'IN',source:'MOBIL',input:{consent:'JA, JAG GODKÄNNER',message:'Keep message'}};
 f.remove();const before=JSON.stringify(f.status),providerWrites=[],sourceWrites=[];
 Object.assign(c,{beautyQueueAssertWorker_:()=>{},beautyQueueSave_:()=>{},beautyContextAssert_:()=>{},beautyLiveTarget_:()=>({sheetId:'fixture'}),beautyLiveRegistrationKey_:v=>String(v||'').trim().toLowerCase(),beautyQueueHash_:JSON.stringify,
  beautyLiveRegistrationSheets_:()=>({...f.s,master:'master'}),beautyLiveRegistrationRows_:(sh,w)=>sh==='master'?[['Synthetic Player']]:sh.getRange(2,1,sh.getLastRow()-1,w).getDisplayValues(),
  beautyLiveRegistrationEvent_:()=>{},beautyLiveRegistrationList_:kind=>kind==='league'?[{name:j.player,lpid:'LP01'}]:[{name:j.player,lpid:'LP01',tpid:'TP01'}],
  beautyLiveRegistrationApi_:(...args)=>{providerWrites.push(args);throw Error('unexpected provider write');},beautyLiveRegistrationAppend_:(...args)=>{sourceWrites.push(args);throw Error('unexpected source write');},
  beautyLiveSheetsRead_:()=>({values:[[123,j.player,'',j.input.consent,j.input.message,j.source]]}),beautyLiveDashboardRead_:()=>({players:[{player:j.player,status:'IN',consent:f.s.tonight.getRange(2,4).getDisplayValues()[0][0],message:'Keep message',whereFrom:'MOBIL'}]})});
 const q=fs.readFileSync(path.join(root,candidate?'live-candidate':'baseline','LiveRegistrationQueue.gs'),'utf8');
 const r=fs.readFileSync(path.join(root,candidate?'live-candidate':'baseline','LiveRegister.gs'),'utf8');
 vm.runInContext(['beautyQueueStep_','beautyQueueStepEffect_','beautyQueueRun_'].map(n=>fn(q,n)).join('\n')+'\n'+fn(r,'beautyLiveRegistrationSync_'),c);
 let error;try{c.beautyQueueRun_(j);}catch(e){error=e.message;}
 assert.equal(JSON.stringify(f.status),before);assert.equal(providerWrites.length,0);assert.equal(sourceWrites.length,0);
 return {j,error};
}
const baseline=run(false),candidate=run(true);assert.equal(baseline.j.readbackFailure,'displayConsent');assert(baseline.error);assert.equal(candidate.error,undefined);assert.equal(candidate.j.steps.readback,'VERIFIED');assert.equal(candidate.j.tpid,'TP01');
const result={result:'PASS',checks:2,baselineFailedCheck:baseline.j.readbackFailure,candidateReadback:candidate.j.steps.readback,sourceWrites:0,providerWrites:0,scope:'Exact queue run/step and registration sync functions with simulated services'};fs.writeFileSync(path.join(root,'evidence/queue-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
