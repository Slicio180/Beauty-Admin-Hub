const {test}=require('node:test'),assert=require('node:assert/strict');
const {collect}=require('../scripts/inspect-stage-readonly.cjs');
function fixture(){return {result:0,tournament:{tdid:'t_QHaG_7792',lgid:'lg_tM2v_3523',updateTime:1,status:30,admin_id:'SECRET_ADMIN',join_pass:'SECRET_PASS',entry_list:[{tpid:'abcd',name:'PRIVATE_NAME'}],badge:{'t-0-0':{str:'14',st:1}},t_table:[['abcd','empty']]}};}
test('stage diagnostic collects fixed public schemas without player values or private fields',async()=>{
 const calls=[];const report=await collect(async(url,options)=>{calls.push({url,options});return {status:200,ok:true,json:async()=>url.includes('standings')?{result:0,tdid:'t_QHaG_7792',groups:[{players:[{name:'PRIVATE_NAME',rank:1}]}]}:fixture()};},()=> '2026-10-29T12:00:00Z');
 assert.equal(report.consistent,true);assert.equal(calls.length,3);assert.ok(calls.every(c=>c.url.startsWith('https://api.n01darts.com/api/v1/')&&c.url.endsWith('?tdid=t_QHaG_7792')&&c.options.method==='GET'&&c.options.credentials==='omit'&&c.options.redirect==='error'));assert.doesNotMatch(JSON.stringify(report),/PRIVATE_NAME|SECRET_|join_pass|admin_id|abcd/);assert.equal(report.standingsShape.type,'object');assert.equal(report.tournamentShapes.badge.fields[0].key,'<map-key>');
});
test('stage diagnostic marks changing revisions and records unsupported standings shape honestly',async()=>{
 let calls=0;const report=await collect(async()=>{calls++;const data=calls===2?{result:-51,unrecognized:'UNTRUSTED_TEXT'}:fixture();if(calls===3)data.tournament.updateTime=2;return {status:200,ok:true,json:async()=>data};});assert.equal(report.consistent,false);assert.equal(report.standingsResult,-51);assert.doesNotMatch(JSON.stringify(report),/UNTRUSTED_TEXT/);
});
test('stage diagnostic stops on wrong event and HTTP failure without continuing reads',async()=>{
 let calls=0;await assert.rejects(collect(async()=>{calls++;const data=fixture();data.tournament.tdid='other';return {status:200,ok:true,json:async()=>data};}),/Unexpected TEST/);assert.equal(calls,1);
 await assert.rejects(collect(async()=>({status:503,ok:false})),/HTTP 503/);
});
test('stage diagnostic bounds nested and wide shapes instead of exporting arbitrary payload values',async()=>{
 const nested={};let cursor=nested;for(let i=0;i<50;i++){cursor.secret={};cursor=cursor.secret;}const report=await collect(async url=>({status:200,ok:true,json:async()=>url.includes('standings')?{result:0,groups:Array.from({length:100},()=>nested)}:fixture()}));assert.ok(JSON.stringify(report).length<8000);assert.doesNotMatch(JSON.stringify(report),/secret/);
});
