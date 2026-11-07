const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const base='apps-script/registration-identity-test/remote-app/';
function harness(o={}){
 const props=new Map([['N01_API_USER','SECRET-USER'],['N01_API_PASSWORD','SECRET-PASS']]),cache=new Map(),calls=[];let releases=0,seq=0,authCalls=0;
 const state={uid:'owner',token:'session',date:'2026-10-27',hub:[{name:'Anna',status:'IN'}],league:[{name:'Anna',lpid:'a123'}],entries:[],event:{tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',title:'Beauty Registration TEST event DO NOT USE LIVE',status:10,t_date:Date.parse('2026-10-27T18:00Z')/1000,updateTime:1000},...o.state};
 const target={id:'t_QHaG_7792',title:'Beauty Registration TEST event DO NOT USE LIVE'};
 const clone=v=>JSON.parse(JSON.stringify(v));
 const context={beautyHubActiveTestTarget_:()=>target,Date,console,Map,Set,JSON,Number,Object,Array,encodeURIComponent,BEAUTY_IDENTITY_WRITES_ENABLED_:o.writes!==false,
  beautyHubRequestToken_:state.token,beautyHubTestGuard_:()=>{if(o.wrongProject)throw Error('identity');},
  beautyHubAuthRequire_:()=>{authCalls++;if(o.noAuth||o.expireAt===authCalls){const e=Error('AUTH_REQUIRED');e.name='HubAuthError';throw e;}return {uid:state.uid};},
  beautyHubNakkaDate_:()=>({date:state.date}),beautyHubNakkaHubRows_:()=>clone(state.hub),
  beautyHubNakkaEvent_:()=>({status:o.unmatched?'AMBIGUOUS':'MATCHED',eventDate:state.date,event:{id:o.otherTarget?'t_OTHER_0001':state.event.tdid}}),
  LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock:()=>releases++})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>{if(o.journalFailure)throw Error('SECRET');props.set(k,v);}})},
  Utilities:{getUuid:()=>String(++seq).padStart(32,'0'),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(alg,s)=>crypto.createHash(alg).update(s).digest(),base64Encode:s=>Buffer.from(s).toString('base64'),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),formatDate:d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)},
  UrlFetchApp:{fetch:(url,options)=>{
   calls.push({url,options});let data;
   if(o.failGet&&options.method==='get')throw Error('SECRET-PASS');
   if(url.includes('tournament/get?'))data={result:0,tournament:clone(state.event)};
   else if(url.includes('league/entry/list?'))data={result:0,list:clone(state.league)};
   else if(url.includes('tournament/entry/list?'))data={result:0,list:clone(state.entries)};
   else if(url.endsWith('league/entry/update')&&options.method==='post'&&o.newLeague){
    assert.ok([...props.values()].some(v=>{try{return JSON.parse(v).state==='ATTEMPTED'&&JSON.parse(v).league==='lg_M2wQ_4189';}catch{return false;}}),'league marker before POST');
    const p=JSON.parse(options.payload);assert.deepEqual(Object.keys(p).sort(),['add','lgid']);assert.equal(p.lgid,'lg_M2wQ_4189');assert.equal(p.add.length,1);assert.deepEqual(Object.keys(p.add[0]),['name']);
    const added={name:p.add[0].name,lpid:'n123'};if(!o.creationMissing)state.league.push(added);
    if(o.creationTimeout)throw Error('SECRET timeout after league save');
    data={result:0,added:o.creationBadReceipt?[]:[clone(added)]};if(o.creationAlterOld)state.league[0].name='Altered';
   }
   else if(url.endsWith('tournament/entry/update')&&options.method==='post'){
    assert.ok([...props.values()].some(v=>{try{return JSON.parse(v).state==='ATTEMPTED';}catch{return false;}}),'durable marker before POST');
    const p=JSON.parse(options.payload),identity=o.newLeague?state.league.find(x=>x.name===p.add[0].name):{name:'Anna',lpid:'a123'};assert.ok(identity);assert.deepEqual(p,{tdid:state.event.tdid,add:[{name:identity.name,lpid:identity.lpid}]});
    state.entries.push({tpid:'b123',name:identity.name,...(o.omitLink?{}:{lpid:o.wrongLink?'z123':identity.lpid})});state.event.updateTime++;
    if(o.postTimeout)throw Error('SECRET timeout after save');
    data=o.badReceipt?{result:0,added:[]}:{result:0,added:[{tpid:'b123',name:identity.name}]};
    if(o.alterOld)state.entries[0].name='Altered';
   }else throw Error('Unexpected URL');
   if(o.onFetch)o.onFetch({url,state,calls});
   return {getResponseCode:()=>o.http||200,getContentText:()=>o.badJson?'SECRET':JSON.stringify(o.data||data)};
  }}
 };
 vm.createContext(context);let code=fs.readFileSync(base+'HubTestNakkaTransfer.gs','utf8');if(o.gate===false)code=code.replace('TRANSFER_ENABLED_ = true','TRANSFER_ENABLED_ = false');vm.runInContext(code,context);
 const call=(action,input)=>context.beautyHubNakkaTransfer_(action,input);
 return {call,preview:()=>call('preview',{player:'Anna'}),save:p=>call('save',{player:'Anna',ticket:p.ticket,confirmed:'true'}),context,state,target,props,cache,calls,posts:()=>calls.filter(c=>c.options.method==='post'),releases:()=>releases};
}

module.exports={harness};
