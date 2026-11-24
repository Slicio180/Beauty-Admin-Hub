const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname, source=path.join(root,'baseline');
const project='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N';
const fixture={version:1,mode:'league',sheetId:'fixture_test_workbook_123456789',leagueId:'lg_fixture',eventId:'t_fixture',date:'2026-11-19',revision:'a'.repeat(32)};
let results=[];
function env(value=fixture,approved=[],id=project){
 let calls=[]; const props={BEAUTY_EVENT_CONTEXT_V1:value===null?null:JSON.stringify(value)};
 const blocked=new Proxy({},{get(_,key){return ()=>{calls.push(String(key));throw Error('Unexpected external service call');};}});
 const c={ScriptApp:{getScriptId:()=>id},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null})},SpreadsheetApp:blocked,FormApp:blocked,UrlFetchApp:blocked,BEAUTY_IDENTITY_APPROVED_SCRIPT_:project,SHEET_ID:value?.sheetId};
 vm.createContext(c);
 for(const f of ['BeautyTestIsolation.gs','HubEventContext.gs','HubTestBridge.gs'])vm.runInContext(fs.readFileSync(path.join(root,'candidate',f),'utf8'),c,{filename:f});
 // Tests alone inject synthetic approvals; shipped source remains empty.
 c.beautyTestApprovedDestinations_=()=>approved;
 return {c,calls,props};
}
function check(name,fn){fn();results.push({name,status:'PASS'});}
function denied(e,fn){assert.throws(fn,/TEST isolation/);assert.deepEqual(e.calls,[]);}
check('Unconfigured candidate blocks even syntactically valid TEST selection',()=>{const e=env();denied(e,()=>e.c.beautyHubWorkspaceId_());});
check('Missing context does not fall back to legacy workbook',()=>{const e=env(null);denied(e,()=>e.c.beautyHubWorkspaceId_());});
check('Wrong project blocked even with matching approval',()=>{const e=env(fixture,[fixture],'wrong');denied(e,()=>e.c.beautyHubTestGuard_());});
check('Synthetic exact approved tuple passes existing Hub guard',()=>{const e=env(fixture,[fixture]);assert.doesNotThrow(()=>e.c.beautyHubTestGuard_());assert.deepEqual(e.calls,[]);});
for(const key of ['sheetId','leagueId','eventId','date'])check('Changed '+key+' blocked',()=>{const e=env({...fixture,[key]:key==='date'?'2026-11-20':fixture[key]+'_changed'},[fixture]);denied(e,()=>e.c.beautyHubTestGuard_());});
for(const [key,value] of Object.entries({sheetId:'1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',leagueId:'lg_tM2v_3523',eventId:'t_yIw0_7809'}))check('Known LIVE '+key+' blocked even if accidentally approved',()=>{const f={...fixture,[key]:value},e=env(f,[f]);denied(e,()=>e.c.beautyHubTestGuard_());});
check('Standalone tournament not implicitly approved',()=>{const f={...fixture,mode:'tournament',leagueId:''},e=env(f,[f]);denied(e,()=>e.c.beautyHubWorkspaceId_());});
check('Draft without an event not approved',()=>{const f={...fixture,eventId:''},e=env(f,[f]);denied(e,()=>e.c.beautyHubWorkspaceId_());});
check('Malformed approval list fails closed',()=>{const e=env(fixture,{});denied(e,()=>e.c.beautyHubWorkspaceId_());});
check('Malformed context still rejected by existing validation',()=>{const e=env({...fixture,revision:'bad'},[fixture]);assert.throws(()=>e.c.beautyHubWorkspaceId_(),/Invalid saved event context/);assert.deepEqual(e.calls,[]);});
check('Changed revision retains stale event guard',()=>{const e=env(fixture,[fixture]);e.c.beautyHubWorkspaceId_();e.props.BEAUTY_EVENT_CONTEXT_V1=JSON.stringify({...fixture,revision:'b'.repeat(32)});assert.throws(()=>e.c.beautyHubTestGuard_(),/active event changed/);});
check('Direct workspace creation stopped before property or sheet access',()=>{const e=env(fixture,[fixture]);denied(e,()=>e.c.beautyContextCreateWorkspace_(fixture));});
check('Hub dispatch cannot reach auth or handler for unknown destination',()=>{const e=env();e.c.beautyHubAuthRequire_=()=>{throw Error('Auth should not be reached');};denied(e,()=>e.c.beautyHubTest('register',{},'token'));});
check('Captured Code.gs workspace initializer fails closed',()=>{const e=env();const code=fs.readFileSync(path.join(source,'Code-workspace-initializer.txt'),'utf8');const statement=code.match(/^const SHEET_ID =[^\n]+/m)[0];denied(e,()=>vm.runInContext(statement,e.c));});
check('Shipped approval function is empty',()=>{const e=env();vm.runInContext(fs.readFileSync(path.join(root,'candidate/BeautyTestIsolation.gs'),'utf8'),e.c);assert.equal(e.c.beautyTestApprovedDestinations_().length,0);});

check('Master helper rejects wrong event workbook before open',()=>{const e=env(fixture,[fixture]);denied(e,()=>e.c.beautyContextMasterWorkbook_({getId:()=> 'wrong'}));});
check('Master helper rejects changed base before open',()=>{const e=env(fixture,[fixture]);e.c.beautyHubBaseSheet_=()=> 'wrong';denied(e,()=>e.c.beautyContextMasterWorkbook_({getId:()=>fixture.sheetId}));});
check('Master helper refuses unapproved context',()=>{const e=env();denied(e,()=>e.c.beautyContextMasterWorkbook_({getId:()=>fixture.sheetId}));});
check('Master helper preserves approved event and master routing',()=>{const e=env(fixture,[fixture]),opened=[],baseId='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';e.c.SpreadsheetApp={openById:id=>{opened.push(id);return {getSheetByName:n=>'master:'+n};}};const book={getId:()=>fixture.sheetId,getSheetByName:n=>'event:'+n};const proxy=e.c.beautyContextMasterWorkbook_(book);assert.equal(proxy.getSheetByName("PLAYER'S MASTER LIST"),"master:PLAYER'S MASTER LIST");assert.equal(proxy.getSheetByName('Control'),'event:Control');assert.deepEqual(opened,[baseId]);});
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Local Node VM using captured TEST functions and synthetic approvals. No native Google or Nakka calls. Not a complete write-path isolation certification.',results},null,2));console.log(`${results.length} PASS`);
