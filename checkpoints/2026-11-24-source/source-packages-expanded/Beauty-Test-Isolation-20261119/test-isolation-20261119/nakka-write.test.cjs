const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const approved={sheetId:'synthetic-test-sheet',leagueId:'lg_test',eventId:'t_test',date:'2026-11-16',version:1,mode:'league'};
function setup(context=approved,approvals=[approved]){
 const sent=[];const c={ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'},UrlFetchApp:{fetch:(url,options)=>{sent.push({url,options});return {};}}};vm.createContext(c);
 for(const f of ['BeautyTestIsolation.gs','HubTestNakkaTransfer.gs'])vm.runInContext(fs.readFileSync(path.join(__dirname,'candidate',f),'utf8'),c);
 Object.assign(c,{beautyContextRead_:()=>context,beautyContextAssert_:()=>{},beautyTestApprovedDestinations_:()=>approvals,beautyHubNakkaMeasure_:(_,fn)=>fn(),beautyHubTransferDecode_:x=>x});return {c,sent};
}
const cases=[];function check(name,fn){fn();cases.push({name,status:'PASS'});}
function block(name,path,payload,context=approved,approvals=[approved]){check(name,()=>{const e=setup(context,approvals);assert.throws(()=>e.c.beautyHubTransferFetch_(path,'synthetic-auth',payload),/TEST isolation/);assert.equal(e.sent.length,0);});}
for(const [endpoint,field,id] of [['league/entry/update','lgid','lg_test'],['tournament/entry/update','tdid','t_test'],['tournament/update','tdid','t_test'],['tournament/assign/update','tdid','t_test'],['league/schedule/generate','tdid','t_test']]){
 check(endpoint+' exact synthetic target reaches fetch once',()=>{const e=setup();e.c.beautyHubTransferFetch_(endpoint,'synthetic-auth',{[field]:id});assert.equal(e.sent.length,1);assert.equal(e.sent[0].options.method,'post');assert.equal(JSON.parse(e.sent[0].options.payload)[field],id);});
 block(endpoint+' mismatched destination blocked',endpoint,{[field]:'wrong'});
 block(endpoint+' missing destination blocked',endpoint,{});
}
block('Production event in payload blocked','tournament/entry/update',{tdid:'t_yIw0_7809'});
block('Conflicting league in payload blocked','tournament/update',{tdid:'t_test',lgid:'lg_tM2v_3523'});
block('Creation of unapproved new event blocked','tournament/create',{set:{lgid:'lg_test'}});
block('Unknown write operation blocked','tournament/delete',{tdid:'t_test'});
block('Mutation query-string target override blocked','tournament/entry/update?tdid=t_other',{tdid:'t_test'});
block('Missing payload on known write endpoint blocked','tournament/entry/update',undefined);
block('False payload on known write endpoint blocked','tournament/update',false);
block('Array payload blocked','tournament/update',[]);
block('Empty approvals block valid destination','tournament/update',{tdid:'t_test'},approved,[]);
for(const key of ['tdid','lgid','t_date'])block('Tournament identity change '+key+' blocked','tournament/update',{tdid:'t_test',set:{[key]:'other'}});
check('Approved target GET reaches fetch',()=>{const e=setup();e.c.beautyHubTransferFetch_('tournament/get?tdid=t_test','synthetic-auth');assert.equal(e.sent.length,1);assert.equal(e.sent[0].options.method,'get');});

for(const path of ['tournament/end_group?tdid=t_other','tournament/delete?tdid=t_test','tournament/get?tdid=t_other','tournament/get?tdid=t_test&tdid=t_other','tournament/get?tdid=t_test&lgid=lg_other','tournament/get?tdid=t_test#x','tournament/get?tdid=%ZZ','league/entry/list?lgid=lg_tM2v_3523','league/entry/list?lgid=lg_test&count=9999'])block('GET refused: '+path,path,undefined);
block('Empty approvals block GET','tournament/get?tdid=t_test',undefined,approved,[]);
for(const endpoint of ['tournament/end_group?tdid=t_test','tournament/entry/list?tdid=t_test','tournament/standings?tdid=t_test','league/get?lgid=lg_test','league/entry/list?lgid=lg_test&count=1000','league/tournament/list?lgid=lg_test&count=100'])check('Approved GET '+endpoint,()=>{const e=setup();e.c.beautyHubTransferFetch_(endpoint,'synthetic-auth');assert.equal(e.sent.length,1);});
for(const endpoint of ['league/stats?lgid=lg_test&kind=stats_list','league/stats?lgid=lg_test&kind=rank_list','league/schedule/get?tdid=t_test'])check('Planner GET allowed '+endpoint,()=>{const e=setup();e.c.beautyHubTransferFetch_(endpoint,'synthetic-auth');assert.equal(e.sent.length,1);assert.equal(e.sent[0].options.method,'get');});
for(const endpoint of ['league/stats?lgid=lg_other&kind=stats_list','league/stats?lgid=lg_test','league/stats?lgid=lg_test&kind=delete','league/stats?lgid=lg_test&kind=stats_list&kind=rank_list','league/schedule/get?tdid=t_other'])block('Planner GET blocked '+endpoint,endpoint,undefined);
for(const wrong of [false,true])check('Batch validates every destination '+(wrong?'before fetchAll':'then allows fixed reads'),()=>{const e=setup();let batches=0;Object.assign(e.c,{beautyHubTransferTarget_:()=> 't_test',beautyHubLeagueId_:()=>wrong?'lg_other':'lg_test'});e.c.UrlFetchApp.fetchAll=paths=>{batches++;return paths.map(()=>({}));};if(wrong){assert.throws(()=>e.c.beautyHubNakkaReads_('synthetic-auth',true),/TEST isolation/);assert.equal(batches,0);}else{e.c.beautyHubNakkaReads_('synthetic-auth',true);assert.equal(batches,1);}});
fs.writeFileSync(path.join(__dirname,'nakka-write-results.json'),JSON.stringify({status:'PASS',checks:cases.length,scope:'Local shared POST/GET and batch gateway checks with synthetic services; no provider calls. Unknown GET operations refused; direct adapters remain outside scope.',cases},null,2));console.log(cases.length+' PASS');
