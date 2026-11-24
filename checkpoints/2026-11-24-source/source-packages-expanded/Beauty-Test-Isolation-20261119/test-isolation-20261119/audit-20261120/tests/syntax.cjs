const fs=require('fs'),vm=require('vm'),path=require('path');
const {source:readSource}=require('./helpers.cjs');
const candidate=process.env.BEAUTY_AUDIT_BASELINE!=='1';
const map=require('../baseline-paths.json'),results=[];
let server='';
for(const [name,file] of Object.entries(map)){
 const source=readSource(name,candidate);
 const scripts=name.endsWith('.html')?[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]):name.endsWith('.gs')?[source]:[];
 if(name.endsWith('.gs'))server+='\n'+source;
 scripts.forEach((s,i)=>{try{new vm.Script(s,{filename:name+':script'+i});results.push({file:name,script:i,ok:true});}catch(e){results.push({file:name,script:i,ok:false,error:e.message});}});
 if(name.endsWith('.json')){try{JSON.parse(source);results.push({file:name,ok:true});}catch(e){results.push({file:name,ok:false,error:e.message});}}
}
try{new vm.Script(server);results.push({file:'combined-server',ok:true});}catch(e){results.push({file:'combined-server',ok:false,error:e.message});}
const out={mode:candidate?'offline-candidate':'installed-baseline',checks:results.length,failures:results.filter(x=>!x.ok)};
fs.writeFileSync(path.join(__dirname,'../evidence/syntax-'+(candidate?'candidate':'baseline')+'.json'),JSON.stringify({...out,results},null,2));console.log(JSON.stringify(out,null,2));
process.exitCode=out.failures.length?1:0;
