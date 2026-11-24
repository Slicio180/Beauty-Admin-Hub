const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {fixture,clone,hash}=require('./regression/fixture.cjs');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,process.env.BEAUTY_CLAIM_SOURCE||'candidate',n),'utf8');
const code=fs.readFileSync(path.join(root,'../CURRENT-VERIFIED-TEST-SOURCE-20261121/Code.gs'),'utf8');
const start=code.indexOf('  const clean =',code.indexOf('var BeautyNameResolution ='));
const normalizer='var BeautyNameResolution=(()=>{'+code.slice(start,code.indexOf('  const error =',start))+'return {key};})();';
function setup(){
 const f=fixture();f.enable();const receipt=f.receipt('Synthetic 06'),name=receipt.name;
 const registration=Object.fromEntries(['beautyRegistrationRecoveryPrefix_','beautyRegistrationRecoveryKey_','beautyRegistrationRecoveryResume_'].map(k=>[k,f.c[k]]));
 vm.runInContext(normalizer+read('HubTestAttention.gs')+read('HubTestNakkaTransfer.gs')+read('BeautyTestIsolation.gs'),f.c);
 Object.assign(f.c,registration);f.c.beautyHubTransferHash_=hash;
 Object.assign(f.c,{SHEET_ID:f.context.sheetId,RESPONSE_SHEET:'Responses',MASTER_SHEET:'Master',NEW_PLAYER_OPTION:'NEW',
  beautyPlayerRecoveryKey_:name=>'recovery-'+name,beautyHubTransferTarget_:()=>f.context.eventId,beautyHubEventScopeId_:()=>f.context.eventId,
  beautyHubNakkaDate_:()=>({date:f.context.date}),beautyContextToken_:()=>f.context.revision,
  beautyHubActiveTestTarget_:()=>({id:f.context.eventId,title:f.context.title})});
 const oldAt=new f.c.Date(f.now()-360000).toISOString();
 const record={version:1,eventId:f.context.eventId,name,date:f.context.date,state:'VERIFIED',code:'ENTRY_CONFIRMED',owner:'previous-owner',autoAttempts:2,updatedAt:oldAt,
  worker:{version:1,attempts:2,context:clone(f.context),intentHash:hash(f.c.beautyBackgroundReceiptIntent_(receipt)),claimedAt:oldAt,leaseUntil:f.now()-1000,nextAt:f.now()-1},
  history:[{at:oldAt,state:'VERIFIED',code:'ENTRY_CONFIRMED',source:'background'}]};
 const keys={receipt:'registration-'+name,recovery:'recovery-'+name,
  journal:'BEAUTY_NAKKA_TRANSFER_'+f.context.eventId+'_L001',
  creation:'BEAUTY_NAKKA_LEAGUE_CREATE_'+f.context.leagueId+'_'+hash(f.c.BeautyNameResolution.key(name)),
  review:'BEAUTY_NAKKA_REVIEW_'+f.context.eventId+'_L001',attention:f.c.beautyHubAttentionKey_(f.context.date,name)};
 f.props[keys.recovery]=JSON.stringify(record);
 const journal={state:'VERIFIED',event:{id:f.context.eventId,date:f.context.date,title:f.context.title},identity:{name,lpid:'L001'},tpid:'T001'};
 f.props[keys.journal]=JSON.stringify(journal);
 f.props[keys.attention]=JSON.stringify({name,date:f.context.date,state:'CLEAR',code:'ENTRY_CONFIRMED',checkedAt:oldAt});
 const sheets={Responses:[[new f.c.Date(receipt.recordedAt),name,'',receipt.consent,receipt.message,receipt.source]],
  Master:[[name,'','','','','']], 'PLAYER STATUS DATA':[[name,'','IN','NEJ',receipt.message,receipt.source]],
  "TONIGHT'S PLAYERS":[[name,'','IN','NEJ',receipt.message,receipt.source]]};
 const reads=[];
 const ss={getSheetByName:title=>Object.hasOwn(sheets,title)?{getLastRow:()=>sheets[title].length+1,getRange:(row,col,count,width)=>{
  reads.push({title,locked:f.lock.hasLock()});
  return {getValues:()=>sheets[title].map(r=>[...r]),getDisplayValues:()=>sheets[title].map(r=>[...r])};}}:null};
 f.c.beautyHubSpreadsheet_=()=>ss;
 const data=[{result:0,tournament:{tdid:f.context.eventId,lgid:f.context.leagueId,title:f.context.title,status:20,t_date:1795244400,updateTime:123}},
  {result:0,list:[{name,tpid:'T001',lpid:'L001'}]},{result:0,list:[{name,lpid:'L001'}]}];
 f.c.Utilities.formatDate=d=>new Date(d.getTime()+3600000).toISOString().slice(0,10);
 const providerRequests=[];let onRead=()=>{},readError=null,http=200;
 f.c.UrlFetchApp={fetch:()=>{throw Error('Unexpected single or mutation fetch');},fetchAll:requests=>{
  assert.equal(f.lock.hasLock(),false,'provider GET must release script lock');
  for(const request of requests){assert.equal(request.method,'get');assert.equal(request.followRedirects,false);assert.equal(request.payload,undefined);}
  providerRequests.push(clone(requests));onRead();f.advance(7000);
  if(readError)throw readError;
  return data.map(d=>({getResponseCode:()=>http,getContentText:()=>JSON.stringify(d)}));
 }};
 const previousSave=f.c.PropertiesService.getScriptProperties;
 f.c.PropertiesService.getScriptProperties=()=>{const p=previousSave();return {...p,setProperty:(k,v)=>{assert(f.lock.hasLock(),'durable writes require lock');return p.setProperty(k,v);}};};
 const get=()=>JSON.parse(f.props[keys.recovery]);
 const getRun=()=>JSON.parse(f.props[f.config.runKey]);
 const edit=(key,fn)=>{const value=JSON.parse(f.props[key]);fn(value);f.props[key]=JSON.stringify(value);};
 return {...f,receipt,name,record,keys,journal,sheets,reads,data,providerRequests,get,getRun,edit,
  onRead:fn=>onRead=fn,readError:e=>readError=e,http:n=>http=n,root};
}
module.exports={setup,clone,hash,root};
