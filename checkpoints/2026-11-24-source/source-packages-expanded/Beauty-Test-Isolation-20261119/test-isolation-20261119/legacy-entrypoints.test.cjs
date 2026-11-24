const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'candidate/Code.gs'),'utf8');
const calls=[];
const trap=new Proxy({},{get(_,key){return ()=>{calls.push(String(key));throw Error('External service unexpectedly reached');};}});
const c={beautyHubWorkspaceId_:()=> 'synthetic-workbook',SpreadsheetApp:trap,FormApp:trap,UrlFetchApp:trap,PropertiesService:trap,ScriptApp:trap,LockService:trap};
vm.createContext(c);vm.runInContext(code,c);
const results=[];
for(const name of ['originalSyncMasterListToGoogleForm_','importPlayersToMasterList_','originalRegisterPlayerWithN01_']){
 assert.throws(()=>c[name]('Synthetic Test Player'),/TEST isolation: legacy external-data operation is disabled/);
 assert.deepEqual(calls,[]);results.push({name,status:'PASS'});
}
for(const name of ['syncMasterListToGoogleForm','registerPlayerWithN01_']){
 assert.equal(c[name]().skipped,true);assert.deepEqual(calls,[]);results.push({name,status:'PASS'});
}
fs.writeFileSync(path.join(__dirname,'legacy-results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Full captured Code.gs plus three entry refusals evaluated in Node VM; all external services trapped; no native execution.',results},null,2));console.log(results.length+' PASS');
