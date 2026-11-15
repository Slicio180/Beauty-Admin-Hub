const fs=require('fs');let template=fs.readFileSync('capture-work/registration-repro/test-lab-installer-template.cjs','utf8');
let shared=template.slice(template.indexOf('const now='),template.indexOf('async function install('));
const start=shared.indexOf("    const write=method==='PUT'"),end=shared.indexOf('    if(!token)await refresh();',start);
shared=shared.slice(0,start)+"    const write=false;\n    if(!read)stop('ROUTE_BLOCKED','Preflight permits fixed TEST GET requests only.');\n"+shared.slice(end);
const header=`#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const CONFIG=Object.freeze({scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'});
`;
const main=`
async function capture(request){
 const project=await request('GET','');if(project?.scriptId!==CONFIG.scriptId)stop('WRONG_PROJECT','The project is not the fixed Beauty TEST project.');
 const first=normalize(await request('GET','/content')),deployments=await request('GET','/deployments');
 const second=normalize(await request('GET','/content')),after=await request('GET','/deployments');
 if(first.sourceHash!==second.sourceHash)stop('SOURCE_CHANGED','TEST source changed during capture. Nothing uploaded or executed.');
 if(JSON.stringify(deploymentFingerprint(deployments))!==JSON.stringify(deploymentFingerprint(after)))stop('DEPLOYMENT_CHANGED','TEST deployment changed during capture. Nothing uploaded or executed.');
 return {result:'READ_ONLY_TEST_PREFLIGHT_VERIFIED',at:now(),project,content:second,deployments,files:second.files.map(f=>({name:f.name,type:f.type,sha256:sha(f.source)})),runtimeContextCaptured:false,propertiesRead:false,functionsRun:false,sourceWrites:0,deploymentWrites:0,sheetWrites:0,nakkaCalls:0,liveAccess:false};
}
async function main(){
 if(process.argv.length!==2)stop('ARGUMENTS','No target overrides are accepted.');
 if(Number(process.versions.node.split('.')[0])<18||typeof fetch!=='function')stop('NODE_VERSION','Node 18 or newer is required.');
 let login;try{login=credentialsFrom(JSON.parse(fs.readFileSync(path.join(os.homedir(),'.clasprc.json'),'utf8')));}catch{stop('LOGIN_FILE','Cannot read existing clasp login. Do not paste credential files.');}
 const downloads=path.join(os.homedir(),'Downloads');if(!fs.existsSync(downloads))stop('DOWNLOADS','Downloads folder was not found.');
 const folder=fs.mkdtempSync(path.join(downloads,'Beauty-TEST-Recovery-Preflight-'));fs.chmodSync(folder,0o700);const requests=[];
 console.log('Reading the fixed Beauty TEST project; no upload or function execution...');
 let report;try{report=await capture(makeClient(login,fetch,requests));}catch(e){report={result:'STOPPED',error:safeError(e),at:now()};process.exitCode=1;}
 report.requests=requests;const output=path.join(folder,'Beauty-TEST-Recovery-Preflight-Report.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\\n',{mode:0o600,flag:'wx'});
 console.log('RESULT: '+report.result);if(report.error)console.log('ERROR: '+report.error.code+' — '+report.error.message);if(report.files)console.log('TEST_SOURCE_FILES_READ: '+report.files.length);
 console.log('REPORT_FILE: '+output);console.log('NO SOURCE UPLOAD, DEPLOYMENT, FUNCTION RUN, SHEET, NAKKA, LIVE, GIT OR CREDENTIAL-FILE CHANGE.');
 console.log('Return this output and attach the report JSON. It contains TEST source, but no login tokens.');
}
module.exports={CONFIG,credentialsFrom,makeClient,capture};if(require.main===module)main().catch(e=>{console.error(safeError(e).message);process.exitCode=1;});
`;
fs.writeFileSync('deliverables/Beauty-TEST-Recovery-Preflight-20261114.cjs',header+shared+main);
