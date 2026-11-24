const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../candidate/BeautyAlternateNakkaRead20261122.gs'),'utf8');
const ctx=vm.createContext({Date,Set});vm.runInContext(source,ctx);
let count=0;
function fixture(){const calls=[];const foundation={result:'ALTERNATE_FORMAT_FOUNDATION_VERIFIED',scriptId:'1NpfK9Lbk834hqN0rD66b3XFtoASM3wAS-NPd9Sy1SaUAB400Pc256evO',workbook:{id:'1YN1VoPCAMA0swtnHaGYjqkHpGjlcYCApu-DVL5hRtZo'},ownerVerified:true,readOnly:true,triggerCount:0,writesPerformed:false};const league={lgid:'lg_M2wQ_4189',title:'Beauty TEST — DO NOT USE LIVE',admin_id:'fixture-admin'};const data={list:[]};const io={foundation:()=>foundation,credentialsPresent:()=>true,get:p=>{calls.push(p);if(p==='league/get?lgid=lg_M2wQ_4189')return{league};if(p==='league/tournament/list?lgid=lg_M2wQ_4189&count=1000')return data;assert.fail('unexpected path');},formatDate:s=>new Date(s*1000).toISOString().slice(0,10)};return{io,calls,foundation,league,data};}
function test(name,fn){fn();count++;console.log('PASS '+name);}
function bad(name,mutate,error){test(name,()=>{const f=fixture();mutate(f);assert.throws(()=>ctx.beautyAlternateNakkaReadCore20261122_(f.io),new RegExp(error));});}
test('exact TEST league and empty date use two GET reads',()=>{const f=fixture(),r=ctx.beautyAlternateNakkaReadCore20261122_(f.io);assert.equal(r.result,'ALTERNATE_NAKKA_CONNECTION_VERIFIED');assert.equal(r.eventCreationReady,true);assert.equal(r.eventCreated,false);assert.equal(r.writesPerformed,false);assert.equal(f.calls.length,2);});
bad('wrong project blocks before provider reads',f=>{f.foundation.scriptId='original-project';f.io.get=()=>assert.fail('must not call provider');},'FOUNDATION_REQUIRED');
bad('wrong workbook blocks',f=>f.foundation.workbook.id='old-workbook','FOUNDATION_REQUIRED');
bad('nonempty trigger set blocks',f=>f.foundation.triggerCount=1,'FOUNDATION_REQUIRED');
bad('missing credentials blocks before provider reads',f=>{f.io.credentialsPresent=()=>false;f.io.get=()=>assert.fail('must not call provider');},'CREDENTIALS_MISSING');
bad('wrong league id blocks',f=>f.league.lgid='lg_tM2v_3523','EXACT_TEST_LEAGUE_REQUIRED');
bad('missing admin access blocks',f=>f.league.admin_id=null,'EXACT_TEST_LEAGUE_REQUIRED');
bad('unexpected league title blocks',f=>f.league.title='Monday LIVE','EXACT_TEST_LEAGUE_REQUIRED');
bad('incomplete event list blocks',f=>f.data.list=Array(1000).fill({}),'EVENT_LIST_INCOMPLETE');
bad('wrong event league blocks',f=>f.data.list=[{lgid:'lg_tM2v_3523'}],'EVENT_LIST_LAYOUT');
bad('invalid event date blocks',f=>f.data.list=[{lgid:'lg_M2wQ_4189',tdid:'t_test_01',title:'Test',t_date:'not-a-number'}],'EVENT_LIST_LAYOUT');
test('existing same-date event reported without creating another',()=>{const f=fixture();f.data.list=[{lgid:'lg_M2wQ_4189',tdid:'t_test_01',title:'Existing test',t_date:Date.parse('2026-11-22T12:00:00Z')/1000,status:20,join_pass:'never-print-test-secret'}];const r=ctx.beautyAlternateNakkaReadCore20261122_(f.io);assert.equal(r.eventCreationReady,false);assert.equal(r.eventsOnDate.length,1);assert.equal(r.eventsOnDate[0].id,'t_test_01');assert(!JSON.stringify(r).includes('never-print-test-secret'));});
test('other dates excluded from output',()=>{const f=fixture();f.data.list=[{lgid:'lg_M2wQ_4189',tdid:'t_test_02',title:'Other date',t_date:Date.parse('2026-11-21T12:00:00Z')/1000,status:20}];assert.equal(ctx.beautyAlternateNakkaReadCore20261122_(f.io).eventsOnDate.length,0);});
bad('duplicate event ids block',f=>{const e={lgid:'lg_M2wQ_4189',tdid:'t_test_01',title:'Test',t_date:Date.parse('2026-11-22T12:00:00Z')/1000};f.data.list=[e,e];},'EVENT_LIST_LAYOUT');
test('no write methods or POST gateway in connection reader',()=>assert(!/setPropert|newTrigger\(|deleteTrigger\(|setValues?\(|clearContent\(|method\s*:\s*['"]post|tournament\/create|payload\s*:/.test(source)));
console.log(JSON.stringify({result:'PASS',tests:count,nativeRun:false}));
