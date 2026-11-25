const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const base=path.resolve(__dirname,'..'),source=path.resolve(base,'../../checkpoints/2026-11-24-source/source-packages-expanded/AIK-Internal-Development-20261115/AIK-Internal');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'beauty-internal-'));
try{
 for(const name of ['BeautyAikInternal.js','PreviewClient.js','preview.cjs','planner.test.cjs','ratings.test.cjs','assets'])fs.cpSync(path.join(source,name),path.join(temp,name),{recursive:true});
 for(const name of ['PoolPlanner.js','AIKInternal.html'])fs.copyFileSync(path.join(base,'aik-internal',name),path.join(temp,name));
 // Public source omits Branding.json; empty branding fixture only for nonvisual model tests.
 fs.writeFileSync(path.join(temp,'assets/Branding.json'),'{}');
 for(const name of ['planner.test.cjs','ratings.test.cjs'])execFileSync(process.execPath,[path.join(temp,name)],{stdio:'inherit'});
}finally{fs.rmSync(temp,{recursive:true,force:true});}
