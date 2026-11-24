const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=__dirname,results=[];
const check=(name,fn)=>{fn();results.push({name,status:'PASS'});};
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context={version:1,mode:'league',sheetId:'synthetic_event',leagueId:'lg_fixture',eventId:'t_fixture',date:'2026-11-16'};
function env(source){
 const calls=[];const trap=new Proxy({},{get:(_,k)=>()=>{calls.push(k);throw Error('Unexpected service');}});
 const c={Date,beautyHubTestGuard_:()=>{},beautyContextRead_:()=>context,LockService:trap,SpreadsheetApp:trap,PropertiesService:trap,UrlFetchApp:trap,Utilities:{formatDate:d=>d.toISOString().slice(0,10)}};
 vm.createContext(c);vm.runInContext(read(source),c);return {c,calls};
}
const snap={'PLAYER STATUS DATA':{display:[[],[],[],[]],values:[[],[],[],[]]},'Form responses 2':{values:[[],[new Date('2026-11-16T12:00:00Z'),'Synthetic Monday','','JA','','KIOSK'],[new Date('2026-11-23T12:00:00Z'),'Synthetic Next Monday','','NEJ','','MOBIL']]}};
for(const day of ['2026-11-16','2026-11-23'])check('Actual event plan selects only '+day,()=>{const {c}=env('candidate/HubTestEventSave.gs');const r=c.beautyHubEventPlan_(snap,day,'Europe/Berlin');assert.equal(r.targets.length,1);assert.equal(r.targets[0][0],day==='2026-11-16'?'Synthetic Monday':'Synthetic Next Monday');});
check('Baseline date-only prepare accepts new date despite active old context',()=>{
 const {c}=env('baseline/HubTestEventSave.gs');c.BEAUTY_IDENTITY_WRITES_ENABLED_=true;c.SHEET_ID=context.sheetId;c.beautyHubRequestToken_='fixture';c.beautyHubAuthRequire_=()=>{};
 c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})};c.SpreadsheetApp={openById:()=>({getSpreadsheetTimeZone:()=> 'Europe/Berlin'})};
 c.beautyHubEventSnapshot_=()=>({...snap,Control:{values:[[],[new Date('2026-11-16T12:00:00Z')]]}});c.beautyHubEventVersion_=()=> 'v';
 const r=c.beautyHubTestEventTransition_('prepare',{date:'2026-11-23',expectedDate:'2026-11-16'});assert.equal(r.success,true);assert.equal(r.newDate,'2026-11-23');assert.equal(c.beautyContextRead_().date,'2026-11-16');
});
for(const action of ['prepare','save'])check('Candidate refuses date-only '+action+' before services',()=>{const {c,calls}=env('candidate/HubTestEventSave.gs');const r=c.beautyHubTestEventTransition_(action,{date:'2026-11-23',expectedDate:'2026-11-16'});assert.equal(r.code,'EVENT_SELECTION_REQUIRED');assert.deepEqual(calls,[]);});
function masterEnv(){
 const c={beautyHubWorkspaceId_:()=>context.sheetId,beautyContextRead_:()=>context,ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'}};
 vm.createContext(c);vm.runInContext(read('candidate/BeautyTestIsolation.gs'),c);c.beautyTestApprovedDestinations_=()=>[context];vm.runInContext(read('candidate/Code.gs'),c);return c;
}
for(const id of ['synthetic_event','unrelated_workbook','1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM'])check('Master rewrite rejects '+id+' before cell access',()=>{const c=masterEnv();let accessed=false;const sheet={getName:()=>"PLAYER'S MASTER LIST",getParent:()=>({getId:()=>id}),getLastRow:()=>{accessed=true;throw Error('read');}};assert.throws(()=>c.writeMasterList_(sheet,[]),/TEST isolation/);assert.equal(accessed,false);});
check('Master guard accepts exact TEST base tab',()=>{const c=masterEnv();assert.doesNotThrow(()=>c.beautyTestMasterSheetGuard_({getName:()=>"PLAYER'S MASTER LIST",getParent:()=>({getId:()=> '1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU'})}));});
fs.writeFileSync(path.join(root,'date-routing-results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Actual captured plan and transition functions in a Node VM; synthetic rows and stubbed Google services. Not native Sheets recalculation or a complete date-switch test.',results},null,2));console.log(results.length+' PASS');
