const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/BeautyDisplayRepairTest.gs','utf8');
function rig(){
 const ctx={version:1,mode:'league',sheetId:'synthetic',leagueId:'lg_test',eventId:'t_test',date:'2026-11-16',revision:'a'.repeat(32)},state={rows:[['SYNTHETIC PLAYER','']],date:'2026-11-16',opens:0,reads:0,approved:true};
 const book={getSpreadsheetTimeZone:()=> 'Europe/Stockholm',getSheetByName:name=>name==='Control'?{getRange:()=>({getValue:()=>new Date('2026-11-16T12:00:00Z')})}:{getLastRow:()=>state.rows.length+1,getRange:()=>({getDisplayValues:()=>{state.reads++;if(state.switch)ctx.eventId='t_other';return state.rows;}})}};
 const c={Date,beautyHubTestGuard_:()=>{},beautyContextRead_:()=>ctx,ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'},SpreadsheetApp:{openById:()=>{state.opens++;return book;}},Utilities:{formatDate:()=>state.date}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../candidate/BeautyTestIsolation.gs','utf8'),c);vm.runInContext(source,c);
 c.beautyTestApprovedDestinations_=()=>state.approved?[{sheetId:'synthetic',leagueId:'lg_test',eventId:'t_test',date:'2026-11-16'}]:[];
 return {c,ctx,state,run:()=>c.beautyDisplayRepairTestData()};
}
let checks=[];function test(name,f){f();checks.push(name);}
test('Approved TEST returns only roster and event identity',()=>{const r=rig(),v=r.run();assert.equal(v.success,true);assert.equal(v.eventId,'t_test');assert.equal(v.players.length,1);assert.equal(v.statsAvailable,false);assert.deepEqual(Object.keys(v.players[0]).sort(),['average','name','points','rank','registeredAt']);});
test('Empty approvals stop before reading Sheets',()=>{const r=rig();r.state.approved=false;assert.throws(r.run,/TEST isolation/);assert.equal(r.state.opens,0);});
test('Known LIVE workbook rejected before reading Sheets',()=>{const r=rig();r.ctx.sheetId='1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM';assert.throws(r.run,/TEST isolation/);assert.equal(r.state.opens,0);});
test('Wrong project rejected before reading Sheets',()=>{const r=rig();r.c.ScriptApp.getScriptId=()=> 'other';assert.throws(r.run,/TEST isolation/);assert.equal(r.state.opens,0);});
test('Control date mismatch rejected',()=>{const r=rig();r.state.date='2026-11-23';assert.throws(r.run,/date mismatch/);});
test('Event switch during read rejected',()=>{const r=rig();r.state.switch=true;assert.throws(r.run,/TEST isolation|context changed/);});
test('Duplicate normalized name rejected',()=>{const r=rig();r.state.rows.push(['synthetic player','']);assert.throws(r.run,/ambiguous/);});
test('Oversized roster blocked before range read',()=>{const r=rig();r.state.rows=Array(10001);assert.throws(r.run,/read limit/);assert.equal(r.state.reads,0);});
test('Empty roster remains a successful empty list',()=>{const r=rig();r.state.rows=[];assert.equal(r.run().players.length,0);});
test('Plan adapter exposes no unqualified board plan',()=>{const r=rig();assert.equal(r.c.beautyDisplayRepairTestPlan(),null);assert.equal(r.state.opens,0);});
test('TEST page differs only in two endpoint names',()=>{const original=fs.readFileSync(__dirname+'/../display-review/candidate/LiveCastView.html','utf8'),html=fs.readFileSync(__dirname+'/BeautyDisplayRepairView.html','utf8');assert.equal(html,original.replace('.beautyLiveCastData()','.beautyDisplayRepairTestData()').replace('.beautyStagePlanLive()','.beautyDisplayRepairTestPlan()'));new vm.Script(fs.readFileSync(__dirname+'/Code.gs','utf8'));});

function snapshot(r){r.c.beautyLiveStatsSnapshot_=()=>({leagueId:'lg_test',fetchedAt:new Date().toISOString(),fresh:true,profiles:[{name:'SYNTHETIC PLAYER',average:55,points:10}]});}
test('Unique matching cached statistics appear',()=>{const r=rig();snapshot(r);const v=r.run();assert.equal(v.statsAvailable,true);assert.equal(v.players[0].average,55);assert.equal(v.rankingAvailable,false);});
test('Statistics read failure cannot hide roster',()=>{const r=rig();r.c.beautyLiveStatsSnapshot_=()=>{throw Error('offline')};const v=r.run();assert.equal(v.players.length,1);assert.equal(v.statsAvailable,false);});
test('Other league statistics rejected',()=>{const r=rig();r.c.beautyLiveStatsSnapshot_=()=>({leagueId:'lg_other',fetchedAt:new Date().toISOString(),profiles:[]});assert.equal(r.run().statsAvailable,false);});
test('Expired statistics rejected',()=>{const r=rig();r.c.beautyLiveStatsSnapshot_=()=>({leagueId:'lg_test',fetchedAt:'2000-01-01',profiles:[]});assert.equal(r.run().statsAvailable,false);});
test('Duplicate profile names do not guess average',()=>{const r=rig();snapshot(r);const s=r.c.beautyLiveStatsSnapshot_();s.profiles.push({...s.profiles[0]});r.c.beautyLiveStatsSnapshot_=()=>s;assert.equal(r.run().players[0].average,null);});
test('Older retained statistics explicitly marked stale',()=>{const r=rig();snapshot(r);const s=r.c.beautyLiveStatsSnapshot_();s.fetchedAt=new Date(Date.now()-600000).toISOString();r.c.beautyLiveStatsSnapshot_=()=>s;assert.equal(r.run().statsStale,true);});
function plan(r){const p={eventId:'t_test',eventDate:'2026-11-16',secret:'PRIVATE',pools:[{id:'rr_0',ids:['ABCD'],boards:[1],board:1,group:1,startAverage:55,coverage:1,message:'PRIVATE'}]};r.c.beautyStagePlanTest=()=>p;return p;}
test('Verified plan wrapper preserves public fields only',()=>{const r=rig();plan(r);const p=r.c.beautyDisplayRepairTestPlan();assert.equal(p.pools[0].board,1);assert.equal(JSON.stringify(p).includes('PRIVATE'),false);});
test('Old event date cannot supply board metadata',()=>{const r=rig();plan(r).eventDate='2026-11-09';assert.equal(r.c.beautyDisplayRepairTestPlan(),null);});
test('Wrong event cannot supply board metadata',()=>{const r=rig();plan(r).eventId='t_other';assert.equal(r.c.beautyDisplayRepairTestPlan(),null);});
test('Duplicate pool IDs rejected',()=>{const r=rig();const p=plan(r);p.pools.push(p.pools[0]);assert.equal(r.c.beautyDisplayRepairTestPlan(),null);});
test('Plan read failure degrades to no metadata',()=>{const r=rig();r.c.beautyStagePlanTest=()=>{throw Error('offline')};assert.equal(r.c.beautyDisplayRepairTestPlan(),null);});
test('Concurrent context change during plan read rejected',()=>{const r=rig();const p=plan(r);r.c.beautyStagePlanTest=()=>{r.ctx.revision='b'.repeat(32);return p};assert.throws(()=>r.c.beautyDisplayRepairTestPlan(),/context changed/);});
console.log(JSON.stringify({result:'PASS',checks,scope:'mocked services; no native calls'},null,2));
