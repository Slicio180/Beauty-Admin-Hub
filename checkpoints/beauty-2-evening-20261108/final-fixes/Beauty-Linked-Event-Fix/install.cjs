'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const {fix}=require('./fix.cjs');
async function apply({R,original,state,api,save,backup,log=()=>{}}){
 if(original.result!=='PUBLIC_REGISTRATION_ROLLOUT_PASS'||!original.hub?.version||!original.hubUrl)throw Error('Completed public rollout receipt required');
 const p=R.PROJECTS.find(p=>p.key==='hub'),id=p.target.deploymentId;
 if(original.hub.deploymentId!==id)throw Error('Hub deployment receipt mismatch');
 const before=R.prepared(p,original.hubUrl),after=fix(before),description=state.tag;
 for(const f of after.filter(f=>f.type==='SERVER_JS'))new vm.Script(f.source);
 const head=await api(p,'GET','/content'),deployment=await api(p,'GET','/deployments/'+id);
 R.assertSource(head.files,[before,after],'Hub linked-event validation');
 const validOld=deployment.deploymentConfig?.versionNumber===original.hub.version&&deployment.deploymentConfig.description===original.tag;
 const validNew=state.version&&deployment.deploymentConfig?.versionNumber===state.version&&deployment.deploymentConfig.description===description;
 if(!validOld&&!validNew)throw Error('Hub deployment changed outside this fix');
 const web=deployment.entryPoints?.find(e=>e.entryPointType==='WEB_APP')?.webApp;
 if(web?.url!==original.hubUrl||web.entryPointConfig?.access!=='ANYONE_ANONYMOUS'||web.entryPointConfig?.executeAs!=='USER_DEPLOYING')throw Error('Hub URL or permissions changed');
 if(!state.backupSaved){await backup({head,deployment});state.backupSaved=true;save();}
 if(R.norm(head.files)!==R.norm(after)){
  if(R.norm((await api(p,'GET','/content')).files)!==R.norm(head.files))throw Error('Concurrent source edit');
  state.phase='upload Hub linked-event validation';save();
  try{await api(p,'PUT','/content',{files:after});}catch(e){log('Upload response uncertain; checking source.');}
 }
 if(R.norm((await api(p,'GET','/content')).files)!==R.norm(after))throw Error('Hub source readback mismatch');
 if(!state.version){
  let versions=[],page;do{const r=await api(p,'GET','/versions?pageSize=50'+(page?'&pageToken='+encodeURIComponent(page):''));versions.push(...(r.versions||[]));page=r.nextPageToken;if(versions.length>1000)throw Error('Version inventory too large');}while(page);
  const matches=versions.filter(v=>v.description===description);if(matches.length>1)throw Error('Duplicate fix version');
  if(matches.length)state.version=matches[0].versionNumber;
  else{if(state.versionAttempted)throw Error('Previous version creation uncertain. Preserve receipt and report.');state.versionAttempted=true;save();const v=await api(p,'POST','/versions',{description});state.version=v.versionNumber;}
  save();
 }
 if(!Number.isInteger(state.version)||R.norm((await api(p,'GET','/content?versionNumber='+state.version)).files)!==R.norm(after))throw Error('Immutable hub source differs');
 let current=await api(p,'GET','/deployments/'+id);
 if(current.deploymentConfig.versionNumber!==state.version){
  if(JSON.stringify(current.deploymentConfig)!==JSON.stringify(deployment.deploymentConfig))throw Error('Concurrent deployment change');
  state.phase='publish Hub linked-event validation';save();
  try{await api(p,'PUT','/deployments/'+id,{deploymentConfig:{scriptId:p.scriptId,versionNumber:state.version,manifestFileName:'appsscript',description}});}catch(e){log('Publish response uncertain; checking deployment.');}
  current=await api(p,'GET','/deployments/'+id);
 }
 for(let n=0;n<5&&current.deploymentConfig?.versionNumber!==state.version;n++){log('Waiting for deployment readback…');await new Promise(resolve=>setTimeout(resolve,1500));current=await api(p,'GET','/deployments/'+id);}
 const finalWeb=current.entryPoints?.find(e=>e.entryPointType==='WEB_APP')?.webApp;
 if(current.deploymentConfig?.versionNumber!==state.version||finalWeb?.url!==original.hubUrl||finalWeb.entryPointConfig?.access!=='ANYONE_ANONYMOUS'||finalWeb.entryPointConfig?.executeAs!=='USER_DEPLOYING')throw Error('Hub deployment readback differs');
 if(R.norm((await api(p,'GET','/content')).files)!==R.norm(after))throw Error('Final hub source mismatch');
 state.phase='complete';state.result='LINKED_EVENT_SOURCE_DEPLOYMENT_PASS';state.finishedUTC=new Date().toISOString();state.url=original.hubUrl;state.deviceVerified=false;save();return state;
}
async function main(){
 if(process.argv.length!==2)throw Error('Run without arguments');
 const root=path.join(os.homedir(),'Downloads','Beauty-Public-Rollout');
 const rollout=JSON.parse(fs.readFileSync(path.join(root,'rollout-state.json'),'utf8'));
 const matchingPath=path.join(root,'matching-event-panels-state.json');
 const matching=fs.existsSync(matchingPath)?JSON.parse(fs.readFileSync(matchingPath,'utf8')):null;
 if(matching&&matching.result!=='MATCHING_EVENT_PANELS_SOURCE_DEPLOYMENT_PASS')throw Error('Finish or review the previous matching-panels installation first');
 const prior=matching||JSON.parse(fs.readFileSync(path.join(root,'compact-settings-state.json'),'utf8')); 
 if(!['COMPACT_SETTINGS_SOURCE_DEPLOYMENT_PASS','MATCHING_EVENT_PANELS_SOURCE_DEPLOYMENT_PASS'].includes(prior.result))throw Error('Completed compact-settings receipt required');
 const patch=require(path.join(os.homedir(),'Downloads','Beauty-Nakka-Live-Panel','install-panel.cjs')),raw=require(path.join(root,'rollout.cjs'));
 const compact=require(path.join(os.homedir(),'Downloads','Beauty-Compact-Date','compact.cjs'));
 const release=require(path.join(os.homedir(),'Downloads','Beauty-2.0-Release','cleanup.cjs'));
 const loginPatch=fs.existsSync(path.join(root,'login-text-fix-state.json'))?require(path.join(os.homedir(),'Downloads','Beauty-Login-Text-Fix','cleanup.cjs')):{fix:f=>f};
 const brackets=require(path.join(os.homedir(),'Downloads','Beauty-Automatic-Brackets','fix.cjs'));
 const layout=require(path.join(os.homedir(),'Downloads','Beauty-Compact-Settings','fix.cjs'));
 const panels=matching?require(path.join(os.homedir(),'Downloads','Beauty-Matching-Event-Panels','fix.cjs')):{fix:f=>f};
 const original={...rollout,tag:prior.tag,hub:{...rollout.hub,version:prior.version}},R={...raw,prepared:(p,url)=>panels.fix(layout.fix(brackets.fix(loginPatch.fix(release.fix(compact.fix(patch.fix(raw.prepared(p,url)))))))),PROJECTS:raw.PROJECTS.map(p=>p.key==='hub'?{...p,target:{deploymentId:rollout.hub.deploymentId}}:p)};
 const statePath=path.join(root,'linked-event-fix-state.json');
 const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{tag:'Beauty linked event fix '+crypto.randomBytes(6).toString('hex'),startedUTC:new Date().toISOString(),backup:fs.mkdtempSync(path.join(os.homedir(),'Downloads','Beauty-Linked-Event-Backup-'))};
 fs.chmodSync(state.backup,0o700);
 const save=()=>{for(const p of [statePath,path.join(state.backup,'receipt.json')]){fs.writeFileSync(p+'.tmp',JSON.stringify(state,null,2),{mode:0o600});fs.renameSync(p+'.tmp',p);}};
 save();console.log('Fixing recognition of league-linked events. Kiosk and mobile deployments are not changed.');console.log('Backup: '+state.backup);
 const login=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.clasprc.json'),'utf8')),token=login.tokens?.default||login.token||login;let access=token.access_token;
 if(token.refresh_token&&token.client_id&&token.client_secret){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refresh_token,client_id:token.client_id,client_secret:token.client_secret}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Login refresh failed');access=(await r.json()).access_token;}
 if(!access)throw Error('Existing clasp login not found');
 const api=async(p,method,suffix,body)=>{if(p.key!=='hub')throw Error('Only hub allowed');const r=await fetch('https://script.googleapis.com/v1/projects/'+p.scriptId+suffix,{method,headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(method+' '+suffix.split('?')[0]+' HTTP '+r.status);return r.json();};
 try{await apply({R,original,state,api,save,backup:async data=>fs.writeFileSync(path.join(state.backup,'before.json'),JSON.stringify(data,null,2),{mode:0o600}),log:console.log});}catch(e){state.lastError=e.message;save();throw e;}
 console.log('LINKED_EVENT_SOURCE_DEPLOYMENT_PASS — original hub URL retained; League-linked event validation fixed.');console.log('PERMANENT HUB: '+original.hubUrl);console.log('Refresh Hub, open LEAGUE / TOURNAMENT > existing league > 2026-11-09 > CHECK FOR EVENT > START EVENT. Confirm kiosk/mobile labels after activation.');console.log('Do not rerun the older public rollout installer after this patch.');
}
module.exports={fix,apply};if(require.main===module)main().catch(e=>{console.error('STOP: '+e.message);process.exitCode=1;});
