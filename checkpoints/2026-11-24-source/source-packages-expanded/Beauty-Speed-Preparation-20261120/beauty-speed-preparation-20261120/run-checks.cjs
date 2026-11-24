const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=__dirname;fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
function run(file,output){const r=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:120000});if(r.status!==0)throw Error(r.stderr||r.error||r.stdout);fs.writeFileSync(path.join(root,'evidence',output),r.stdout);return JSON.parse(r.stdout);}
const stats=run('stats/tests/run.cjs','stats-results.json');
const historical=run('reference/registration-removal-20261116/tests/run-offline.cjs','historical-results.json');
const result={result:'PASS',finishedUTC:new Date().toISOString(),newStatsScenarios:stats.passed,historicalCandidateScenarios:historical.candidateScenarios,historicalBaselineScenarios:historical.baselineReferenceScenarios,remoteCalls:0,nativeSpeedMeasured:false,installed:false,liveChanged:false};
fs.writeFileSync(path.join(root,'evidence/summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
