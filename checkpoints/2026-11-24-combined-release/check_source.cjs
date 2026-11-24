const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=__dirname,dir=path.join(root,'application'),functions=new Map(),errors=[];let parsed=0;
for(const name of fs.readdirSync(dir)){
 const s=fs.readFileSync(path.join(dir,name),'utf8');
 try{if(name.endsWith('.gs')){new vm.Script(s,{filename:name});parsed++;for(const m of s.matchAll(/^function\s+(\w+)\s*\(/gm)){assert(!functions.has(m[1]),'Duplicate server function '+m[1]);functions.set(m[1],name);}}else if(name.endsWith('.html'))for(const [i,m] of [...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].entries()){new vm.Script(m[1],{filename:name+'#'+i});parsed++;}else if(name.endsWith('.json'))JSON.parse(s);}catch(e){errors.push({file:name,error:e.message});}
}
const report={result:errors.length?'FAIL':'PASS',parsed,serverFunctions:functions.size,errors};fs.writeFileSync(path.join(root,'evidence/syntax.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
