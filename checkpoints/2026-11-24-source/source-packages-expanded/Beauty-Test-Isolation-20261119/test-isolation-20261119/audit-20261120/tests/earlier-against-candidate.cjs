// Stage earlier tests against the actual effective candidate, not their old sibling copies.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const {source,fn,root}=require('./helpers.cjs'),pkg=path.resolve(root,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'beauty-audit-'));
const suites=['normal-recovery/recovery.test.cjs','normal-recovery/legacy.test.cjs','remaining-repairs/checks.cjs','display-adapter/adapter.test.cjs','display-review/candidate/test.cjs','display-review/candidate/recovery.test.cjs','display-review/candidate/shell.test.cjs','display-review/candidate/layout.test.cjs'];
function put(p,text){p=path.join(tmp,p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
function copy(p){fs.cpSync(path.join(pkg,p),path.join(tmp,p),{recursive:true});}
const results=[];
try{
 for(const p of ['normal-recovery','remaining-repairs','display-adapter','display-review','candidate'])copy(p);
 for(const p of ['normal-recovery/HubTestAttention.gs','remaining-repairs/HubTestPools.gs','remaining-repairs/HubTest.html','remaining-repairs/KioskTest.html','display-adapter/BeautyDisplayRepairTest.gs','display-adapter/BeautyDisplayRepairView.html','display-adapter/Code.gs','candidate/BeautyTestIsolation.gs'])put(p,source(path.basename(p)));
 // TEST and display-review variants intentionally differ only in their two RPC names.
 put('display-review/candidate/LiveCastView.html',source('BeautyDisplayRepairView.html').replace('.beautyDisplayRepairTestData()','.beautyLiveCastData()').replace('.beautyDisplayRepairTestPlan()','.beautyStagePlanLive()'));
 // Earlier snippet test must supply the new real freshness helper, not a stub.
 let checks=fs.readFileSync(path.join(tmp,'remaining-repairs/checks.cjs'),'utf8');
 checks=checks.replace('vm.runInNewContext(expiry,','vm.runInNewContext('+JSON.stringify(fn('beautyPoolStatsTimeFresh_','HubTestPools.gs'))+'+expiry,');
 put('remaining-repairs/checks.cjs',checks);
 // The projection stays frozen. Feed changes now have actual failure/recovery tests.
 let display=fs.readFileSync(path.join(tmp,'display-review/candidate/test.cjs'),'utf8');
 display=display.replace("['function project(tournament,standings,schedule',\"const base='https://api.n01darts.com/api/v1/'\"]","['function project(tournament,standings,schedule']");
 display=display.replace('Approved layout retains exact repaired projection and feed modules','Audit candidate retains exact repaired projection; revised feed is covered separately');
 put('display-review/candidate/test.cjs',display);
 for(const suite of suites){const r=cp.spawnSync(process.execPath,[path.join(tmp,suite)],{encoding:'utf8',timeout:30000});results.push({suite,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});}
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
const report={scope:'Earlier suites rerun against effective offline candidate; mocked services only',adaptations:['Inject actual new freshness helper into the earlier isolated snippet test','Replace feed byte-equality freeze with unchanged projection equality; feed behavior tested by regressions/integration'],passedSuites:results.filter(r=>r.exitCode===0).length,failedSuites:results.filter(r=>r.exitCode!==0).length,results};
fs.writeFileSync(path.join(root,'evidence/earlier-against-candidate.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.failedSuites?1:0;
