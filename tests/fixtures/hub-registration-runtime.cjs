const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {harness}=require('./nakka-transfer-runtime.cjs');
const base='apps-script/registration-identity-test/remote-app/';
const input={eventDate:'2026-10-27',selectedName:'Anna',consent:'JA, JAG GODKÄNNER',message:'TEST'};
function registration(o={}){
 const h=harness({...o,state:{hub:[],...o.state}}),c=h.context,rows=[],master=['Anna','Other'];let held=false,acquires=0;
 const originalLock=c.LockService.getScriptLock;
 c.LockService.getScriptLock=()=>{const lock=originalLock();return {tryLock:()=>{assert.equal(held,false,'no nested registration/transfer lock');const ok=lock.tryLock();if(ok){held=true;acquires++;}return ok;},releaseLock:()=>{held=false;lock.releaseLock();}};};
 c.Date=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-27T17:00:00Z']));}static now(){return Date.parse('2026-10-27T17:00:00Z');}};
 c.ScriptApp={getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'};
 c.SpreadsheetApp={flush(){},openById:id=>{assert.equal(id,'1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU');return {getSheetByName:name=>{
  if(name==='Form responses 2')return {appendRow:r=>{assert.equal(held,true,'Sheet write under lock');rows.push(r);}};
  const names=()=>name==="PLAYER'S MASTER LIST"?master:h.state.hub.map(r=>r.name);
  return {getLastRow:()=>names().length+1,getRange:()=>({getDisplayValues:()=>names().map(n=>name==="TONIGHT'S PLAYERS"?[n,'']:[n]),getValues:()=>names().map(n=>[n])})};
 }};}};
 vm.runInContext(fs.readFileSync(base+'Code.js','utf8').replace('BEAUTY_IDENTITY_WRITES_ENABLED_ = true','BEAUTY_IDENTITY_WRITES_ENABLED_ = '+(o.disableActualWrites?'false':'true'))+'\n'+fs.readFileSync(base+'HubTestBridge.gs','utf8')+'\n'+fs.readFileSync(base+'HubTestAutoRegister.gs','utf8').replace('AUTO_ENABLED_ = true','AUTO_ENABLED_ = '+(o.autoDisabled?'false':'true')),c);
 c.addPlayerToMasterList_=n=>master.push(n);
 c.updatePlayerStatusData_=n=>h.state.hub.push({name:n,status:'IN'});c.syncTonightStatusDisplay_=()=>{};
 return {...h,rows,master,register:(data=input)=>c.beautyHubTest('register',data,'session'),get held(){return held;},get acquires(){return acquires;}};
}

module.exports={registration,input};
