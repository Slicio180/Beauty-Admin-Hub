const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const binding=require('../../deliverables/Beauty-TEST-Recovery-Binding-Check-20261114.cjs');
const source=binding.LAB_SOURCE+'\n'+fs.readFileSync(__dirname+'/ProviderCheck.js','utf8');
const expected={version:1,mode:'league',sheetId:'17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',leagueId:'lg_M2wQ_4189',eventId:'t_gINp_8026',date:'2026-11-07',revision:'7badf194ceda4cff92e5a7205045b638',title:'AIK Hub TEST'};
function run(o={}){
 let calls=0,released=0;const c={...expected,...o.context};
 const raw=JSON.stringify(c), league={lgid:c.leagueId,title:'Beauty TEST',admin_id:'owner',...o.league};
 const event={tdid:c.eventId,lgid:c.leagueId,title:c.title,t_date:1794052800,status:20,admin_id:'owner',...o.event};
 const env={Date,console:{log:()=>{}},ScriptApp:{getScriptId:()=>o.script||binding.CONFIG.scriptId},Session:{getActiveUser:()=>({getEmail:()=>o.owner||'alessiotampella@gmail.com'})},
 LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock:()=>released++})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='BEAUTY_EVENT_CONTEXT_V1'?(o.race&&calls?'{}':raw):(o.credentials===false?'':'SECRET')})},
 SpreadsheetApp:{openById:id=>{assert.equal(id,expected.sheetId);return {getId:()=>id,getSheetByName:()=>({getRange:()=>({getValue:()=>new Date('2026-11-07T12:00:00Z')})})}}},
 Utilities:{formatDate:()=>o.date||expected.date,base64Encode:s=>Buffer.from(s).toString('base64')},
 UrlFetchApp:{fetch:(url,opts)=>{assert.equal(opts.method,'get');assert.equal(opts.followRedirects,false);assert.ok(['https://push.n01darts.com/api/v1/league/get?lgid=lg_M2wQ_4189','https://push.n01darts.com/api/v1/tournament/get?tdid=t_gINp_8026&entry=0'].includes(url));calls++;if(o.network)throw Error('SECRET');return {getResponseCode:()=>o.http||200,getContentText:()=>o.badJson?'?':JSON.stringify({result:o.result||0,...(calls===1?{league}:{tournament:event})})}}}};
 vm.createContext(env);vm.runInContext(source,env);
 try {const r=env.beautyTestNakkaRecoveryCheck20261114();assert.equal(calls,2);assert.equal(r.providerWrites,0);assert.equal(r.recoveryWritesEnabled,false);assert.ok(!JSON.stringify(r).includes('SECRET'));return r;}
 catch(e){assert.ok(!e.message.includes('SECRET'));if(o.context||o.owner||o.script||o.credentials===false||o.busy)assert.equal(calls,0);throw e;}
 finally {assert.equal(released,o.busy?0:1);}
}
let n=0;function test(name,f){f();console.log('PASS '+name);n++}
test('exact event GET-only verified',()=>assert.equal(run().result,'TEST_NAKKA_EVENT_READ_ONLY_VERIFIED'));
for(const [name,o,error] of [
 ['wrong project',{script:'LIVE'},/TEST_PROJECT/],['wrong owner',{owner:'other'},/TEST_OWNER/],
 ['wrong event',{context:{eventId:'LIVE'}},/TEST_BINDING/],['wrong revision',{context:{revision:'a'.repeat(32)}},/TEST_CONTEXT/],
 ['busy',{busy:true},/BUSY/],['no credentials',{credentials:false},/CREDENTIALS/],
 ['changed binding during GET',{race:true},/CONTEXT/],['authentication rejected',{http:401},/HTTP_401/],
 ['network error redacted',{network:true},/UNAVAILABLE/],['bad JSON',{badJson:true},/INVALID_JSON/],
 ['provider result error',{result:1},/INVALID_RESULT/],['wrong league',{league:{lgid:'LIVE'}},/LEAGUE_IDENTITY/],
 ['unmarked league',{league:{title:'Production'}},/LEAGUE_IDENTITY/],['wrong provider event',{event:{tdid:'LIVE'}},/EVENT_IDENTITY/],
 ['wrong provider league',{event:{lgid:'LIVE'}},/EVENT_IDENTITY/],['changed title',{event:{title:'Other'}},/EVENT_IDENTITY/],
 ['no event admin access',{event:{admin_id:null}},/EVENT_IDENTITY/],['invalid timestamp',{event:{t_date:'bad'}},/EVENT_IDENTITY/]
 ])test(name,()=>assert.throws(()=>run(o),error));
console.log('TOTAL '+n+' PASS');
