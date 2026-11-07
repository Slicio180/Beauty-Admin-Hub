'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process');
const SCRIPT='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N';
const hash=s=>crypto.createHash('sha256').update(String(s).replace(/\r\n/g,'\n').replace(/\n+$/,'')).digest('hex');
const canonical=files=>JSON.stringify(files.map(({name,type,source})=>({name,type,source})).sort((a,b)=>(a.name+a.type).localeCompare(b.name+b.type)));
function safePath(root,p){if(typeof p!=='string'||p.split('/').some(x=>!x||x==='.'||x==='..')||path.isAbsolute(p)||p.includes('\\'))throw Error('Invalid package path.');return path.join(root,p);}
function checkLocal(root,manifest){return manifest.files.map(f=>{const p=safePath(root,f.path),before=fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;if(before!==null&&hash(before)!==f.sha256&&!f.allowedSha256.includes(hash(before)))throw Error('Local version is newer or unrecognised: '+f.path+'. Nothing uploaded.');if(before===null&&!f.isNew)throw Error('Missing project file: '+f.path+'. Run from the Beauty-Admin-Hub project terminal.');return {...f,before};});}
function planGoogle(before,manifest,read){
 if(!Array.isArray(before.files))throw Error('Google TEST source unavailable.');const files=before.files.map(f=>({name:f.name,type:f.type,source:f.source}));
 for(const f of manifest.files.filter(f=>f.google)){
  const found=files.filter(x=>f.google.names.includes(x.name)&&x.type===f.google.type);if(found.length>1)throw Error('Ambiguous Google file: '+f.path);
  const current=found[0];if(!current&&!f.isNew)throw Error('Missing Google file: '+f.path);if(current&&(current.type!==f.google.type||hash(current.source)!==f.sha256&&!f.allowedSha256.includes(hash(current.source))))throw Error('Google TEST version is newer or unrecognised: '+f.path+'. Nothing uploaded.');
  const source=read(f.path);if(hash(source)!==f.sha256)throw Error('Package checksum failed.');
  if(current)current.source=source;else files.push({name:f.google.names[0],type:f.google.type,source});
 }
 return files;
}
function verifyPackage(payload,manifest){
 for(const f of manifest.files){const source=fs.readFileSync(safePath(payload,f.path),'utf8');if(hash(source)!==f.sha256)throw Error('Package checksum failed: '+f.path);if(/\.(?:js|gs|cjs)$/.test(f.path))new vm.Script(source,{filename:f.path});if(f.path.endsWith('.html'))for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1],{filename:f.path});}
}
async function main(options={}){
 const payload=options.payloadRoot||path.resolve(__dirname,'..'),root=process.cwd(),manifest=JSON.parse(fs.readFileSync(path.join(payload,'update-manifest.json'),'utf8'));
 if(manifest.scriptId!==SCRIPT||manifest.baseCommit!=='0f9fcf0a2b03a392edc34106b389e99822157a8b')throw Error('Wrong TEST package.');verifyPackage(payload,manifest);
 console.log('Verifying the prepared source and regression inventory…');const checked=cp.spawnSync(process.execPath,['scripts/check-test-inventory.cjs'],{cwd:payload,encoding:'utf8',maxBuffer:20*1024*1024});if(checked.status!==0)throw Error('Prepared tests failed. No project or Google changes.\n'+checked.stdout+'\n'+checked.stderr);console.log(checked.stdout.trim());
 if(process.argv.includes('--verify-only')){console.log('PASS: package verified; nothing installed or uploaded.');return;}
 if(!fs.existsSync(path.join(root,'public/js/hub-evening-setup.js')))throw Error('Run this from the Beauty-Admin-Hub terminal in VS Code.');
 const local=checkLocal(root,manifest),read=p=>fs.readFileSync(safePath(payload,p),'utf8');
 const auth=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.clasprc.json'),'utf8')),t=auth.tokens?.default||auth.token||auth;let access=t.access_token;
 if(t.refresh_token&&t.client_id&&t.client_secret){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:t.refresh_token,client_id:t.client_id,client_secret:t.client_secret}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Google login refresh failed. Run clasp login, then rerun.');access=(await r.json()).access_token;}
 if(!access)throw Error('No existing clasp login. Run clasp login first.');
 async function api(method,body){const r=await fetch('https://script.googleapis.com/v1/projects/'+SCRIPT+'/content',{method,headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Google TEST '+method+' returned HTTP '+r.status);return r.json();}
 console.log('Checking the installed Google TEST version…');const before=await api('GET'),files=planGoogle(before,manifest,read);
 const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(root,'backups','league-tournament-'+stamp),evidence=path.join(root,'evidence','league-tournament-'+stamp);fs.mkdirSync(backup,{recursive:true,mode:0o700});fs.mkdirSync(evidence,{recursive:true});
 fs.writeFileSync(path.join(backup,'google-before.json'),JSON.stringify(before,null,2),{mode:0o600});for(const f of local)if(f.before!==null){const p=safePath(backup,f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.before,{mode:0o600});}
 fs.writeFileSync(path.join(backup,'added-local-files.json'),JSON.stringify(local.filter(f=>f.before===null).map(f=>f.path),null,2));
 // Verify both sources again immediately before upload. Preserve unknown Google files.
 if(canonical((await api('GET')).files)!==canonical(before.files))throw Error('Google TEST changed during preflight. Nothing uploaded.');
 for(const f of local){const p=safePath(root,f.path),now=fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;if(now!==f.before)throw Error('Local source changed during preflight. Nothing uploaded.');}
 const receipt={result:'IN_PROGRESS',startedUTC:new Date().toISOString(),scriptId:SCRIPT,backup,production:'UNCHANGED',deployments:'UNCHANGED',browserAndLiveNakka:'PENDING',baseCommit:manifest.baseCommit};const save=()=>fs.writeFileSync(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));save();
 if(canonical(before.files)!==canonical(files)){
  console.log('Uploading the league and tournament flow to Google TEST only…');try{await api('PUT',{files});}catch{console.log('Upload response uncertain; checking saved source before any further action…');}
  let after;try{after=await api('GET');}catch{receipt.result='UPLOAD_UNCERTAIN';save();throw Error('Could not read Google TEST back. Do not retry; inspect '+backup);}
  if(canonical(after.files)!==canonical(files)){receipt.result='READBACK_MISMATCH';save();throw Error('Google readback differs. Do not retry; inspect '+backup);}
 }
 receipt.googleSource='VERIFIED';save();
 for(const f of local){const p=safePath(root,f.path),now=fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;if(now!==f.before){receipt.result='LOCAL_SYNC_STOPPED';save();throw Error('Google TEST verified, but local file changed: '+f.path+'. Backup: '+backup);}}
 for(const f of local){const p=safePath(root,f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,read(f.path));if(hash(fs.readFileSync(p,'utf8'))!==f.sha256)throw Error('Local write verification failed: '+f.path);}
 receipt.result='PASS';receipt.finishedUTC=new Date().toISOString();receipt.files=manifest.files.length;save();
 console.log('PASS — Google TEST source and local changes verified. Reload the TEST Hub.');console.log('Browser and live event checks remain pending.');console.log('Evidence: '+evidence);
}
module.exports={hash,safePath,checkLocal,planGoogle,verifyPackage,main};if(require.main===module)main().catch(e=>{console.error('STOP: '+e.message);process.exitCode=1;});
