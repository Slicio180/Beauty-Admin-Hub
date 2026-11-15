const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const {installers}=require('../../deliverables/Beauty-Recovery-Centre-20261114.cjs');
const report=JSON.parse(fs.readFileSync(__dirname+'/baseline.json'));
const clone=x=>JSON.parse(JSON.stringify(x));
(async()=>{for(const tool of installers){const p=report.projects.find(p=>p.key===tool.CONFIG.key);
for(const mode of ['normal','lost-reply','source-change','wrong-project','deployment-change']){
let files=clone(p.head.files),deps=clone(p.deployments),puts=0,reads=0,dr=0;
const req=async(m,r,b)=>{if(m==='PUT'){assert.equal(r,'/content');puts++;files=clone(b.files);if(mode==='lost-reply')throw Error('lost');return {};}
assert.equal(m,'GET');if(r==='')return {scriptId:mode==='wrong-project'?'wrong':p.scriptId};if(r==='/content'){reads++;if(mode==='source-change'&&reads===2)files[0].source+='\n// external change';return {scriptId:p.scriptId,files:clone(files)};}assert.equal(r,'/deployments');dr++;if(mode==='deployment-change'&&dr===2)deps[0].deploymentConfig.versionNumber=999;return {deployments:clone(deps)};};
if(['source-change','wrong-project','deployment-change'].includes(mode)){await assert.rejects(tool.install(req,()=>{}));assert.equal(puts,0);continue;}
const out=await tool.install(req,()=>{});assert.equal(out.changedFiles,tool.CONFIG.changes.length);assert.equal(puts,1);for(const f of p.head.files)if(!tool.CONFIG.changes.includes(f.name))assert.deepEqual(files.find(x=>x.name===f.name),{name:f.name,type:f.type,source:f.source});if(mode==='lost-reply')assert.equal(out.verifiedByFreshRead,true);
assert.equal((await tool.install(req,()=>{})).result,'ALREADY_INSTALLED');assert.equal(puts,1);
}
for(const f of tool.UPDATE_FILES)for(const script of f.source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1].replace(/<\?!=[\s\S]*?\?>/g,'null'));
const client=tool.makeClient({access_token:'mock'},()=>{throw Error('network should not run')},[]);
await assert.rejects(client('POST','/deployments',{}));await assert.rejects(client('PUT','/content',{files:[]}));
console.log('PASS '+p.key+': exact backend/manifest preservation; syntax; single write; idempotence; lost reply reconciliation; concurrent source/deployment guards; wrong project and forbidden routes blocked.');
}})().catch(e=>{console.error(e.message);process.exitCode=1;});
