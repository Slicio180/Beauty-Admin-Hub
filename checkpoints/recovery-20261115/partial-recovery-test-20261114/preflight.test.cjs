const assert=require('assert/strict');const {CONFIG,capture,makeClient}=require('../../deliverables/Beauty-TEST-Recovery-Preflight-20261114.cjs');
(async()=>{
 const files=[{name:'appsscript',type:'JSON',source:'{}'},{name:'Code',type:'SERVER_JS',source:'function doGet(){}'}];const seen=[];
 const r=await capture(async(m,p)=>{seen.push([m,p]);if(!p)return {scriptId:CONFIG.scriptId};if(p==='/content')return {scriptId:CONFIG.scriptId,files};return {deployments:[]};});assert.equal(r.result,'READ_ONLY_TEST_PREFLIGHT_VERIFIED');assert(seen.every(([m])=>m==='GET'));assert.equal(r.functionsRun,false);assert.equal(r.runtimeContextCaptured,false);
 let n=0;await assert.rejects(capture(async(m,p)=>!p?{scriptId:CONFIG.scriptId}:p==='/content'?{scriptId:CONFIG.scriptId,files:files.map(f=>({...f,source:f.source+String(n++)}))}:{deployments:[]}));
 await assert.rejects(capture(async()=>({scriptId:'live'})));
 let calls=0;const client=makeClient({access_token:'test'},async()=>{calls++;return {ok:true,status:200,json:async()=>({})};},[]);
 for(const [m,p]of [['PUT','/content'],['POST','/versions'],['POST','/deployments'],['POST',':run'],['GET','/properties'],['GET','/../../other']])await assert.rejects(client(m,p,{files}));assert.equal(calls,0);await client('GET','/content');assert.equal(calls,1);
 console.log('PASS fixed TEST project, read-only network allowlist, no script/property access, wrong target and source drift rejected.');
})().catch(e=>{console.error(e);process.exitCode=1;});
