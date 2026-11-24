// Use the exact captured TEST source, not production. Pass its folder as argv[2].
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../reconciliation-20261119/checkpoint/test-head'));
const current=JSON.parse(fs.readFileSync(path.join(__dirname,'verified-bindings.json'),'utf8')).activeContext;
const c={},calls=[];const trap=new Proxy({},{get(_,key){return ()=>{calls.push(String(key));throw Error('Unexpected external operation');};}});
Object.assign(c,{ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'},Session:{getActiveUser:()=>({getEmail:()=> 'alessiotampella@gmail.com'})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='BEAUTY_EVENT_CONTEXT_V1'?JSON.stringify(current):null,setProperty:trap.setProperty})},SpreadsheetApp:trap,FormApp:trap,UrlFetchApp:trap,Sheets:trap,beautyContextRead_:()=>current,beautyHubTestGuard_:()=>{}});
vm.createContext(c);
const files=fs.readdirSync(source).filter(f=>f.startsWith('Beauty')&&f.endsWith('.gs'));
for(const file of files)vm.runInContext(fs.readFileSync(path.join(source,file),'utf8'),c,{filename:file});
const results=[];
for(const [label,call,error] of [
 ['Partial recovery',()=>c.beautyPartialNativeGuard_(),/PARTIAL_TEST_CONTEXT/],
 ['Standalone transfer/import',()=>c.beautyStandaloneGuard_(),/PARTIAL_TEST_CONTEXT/],
 ['Formula fixture recovery',()=>c.beautyFormulaGuard_(),/PARTIAL_TEST_CONTEXT/],
 ['Queue UI fixture',()=>c.beautyQueueUiGuard_(),/QUEUE_UI_CONTEXT/],
 ['Recovery workspace provisioning',()=>c.beautyRecoveryWorkspaceIO_().guard(),/TEST_CONTEXT_CHANGED/],
 ['Recovery workspace adapter',()=>c.beautyWorkspaceRecoveryEnv_(null,true).guard(),/TEST_CONTEXT_CHANGED/]
]){assert.throws(call,error);assert.deepEqual(calls,[]);results.push({name:label,status:'PASS',meaning:'Historical fixed-context guard refuses currently observed Nov16 context before external service calls.'});}
for(const name of ['beautyLiveRegistrationForm_','beautyLiveRegistrationApi_']){assert.equal(Object.prototype.hasOwnProperty.call(c,name),false);results.push({name:name+' is not exported by diagnostic files',status:'PASS',meaning:'Copied registration implementation is scoped inside factories, not a global entry point.'});}
fs.writeFileSync(path.join(__dirname,'diagnostic-results.json'),JSON.stringify({status:'PASS',checks:results.length,sourceDirectory:source,scope:'Existing historical guards with actual observed context and mocked owner/services. Main Hub guard deliberately no-op to test independent historical guards. Does not certify valid historical-context writes or native execution.',results},null,2));console.log(results.length+' PASS');
