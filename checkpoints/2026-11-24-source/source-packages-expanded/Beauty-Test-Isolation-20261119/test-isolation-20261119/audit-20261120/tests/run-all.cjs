const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),results=[];
for(const [name,baseline,expectedFailure]of [['verify-package.cjs',false,false],['syntax.cjs',true,false],['syntax.cjs',false,false],['inspect.cjs',false,false],['regressions.cjs',true,true],['regressions.cjs',false,false],['integration.cjs',true,true],['integration.cjs',false,false],['plan-deadline.cjs',true,true],['plan-deadline.cjs',false,false],['earlier-against-candidate.cjs',false,false]]){
 const r=cp.spawnSync(process.execPath,[path.join(__dirname,name)],{encoding:'utf8',timeout:30000,env:{...process.env,BEAUTY_AUDIT_BASELINE:baseline?'1':'0'}});
 const ok=expectedFailure?r.status===1:r.status===0;
 results.push({name,mode:baseline?'installed-baseline':'offline-candidate',expectedFailure,exitCode:r.status,ok});
 if(!ok)console.error(r.stdout,r.stderr);
}
const report={scope:'Deterministic offline checks; known baseline regressions must fail and candidate must pass. No external writes.',ok:results.every(r=>r.ok),results};fs.writeFileSync(path.join(root,'evidence/run-all.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
