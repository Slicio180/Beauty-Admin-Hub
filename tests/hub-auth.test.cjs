const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const base='apps-script/registration-identity-test/remote-app/';
function server(options={}){
 let now=1761562800000,fetches=0,reads=0,mutations=0,locked=false;
 const records=new Map(),properties={BEAUTY_HUB_ADMIN_UIDS:'approved-uid'},events=[];
 const claims={aud:'beauty-admin-hub-test',iss:'https://securetoken.google.com/beauty-admin-hub-test',sub:'approved-uid',iat:now/1000,auth_time:now/1000,exp:now/1000+3600};
 const encode=c=>Buffer.from(JSON.stringify(c)).toString('base64url');
 const token=(changes={})=>encode({alg:'RS256',kid:'test'})+'.'+encode({...claims,...changes})+'.signature';
 const context={Date:class extends Date{static now(){return now;}},Number,JSON,
  ScriptApp:{AuthMode:{FULL:'FULL'},requireScopes:(mode,scopes)=>{assert.equal(mode,'FULL');assert.deepEqual(Array.from(scopes),['https://www.googleapis.com/auth/script.external_request']);},getScriptId:()=>options.wrongScript?'wrong':'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N'},
  PropertiesService:{getScriptProperties:()=>({getProperty:n=>properties[n]??null,setProperty:(n,v)=>properties[n]=v})},
  CacheService:{getScriptCache:()=>({get:k=>records.get(k)||null,put:(k,v,ttl)=>{events.push(['put',ttl]);records.set(k,v);},remove:k=>records.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock(){if(options.busy||locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),base64DecodeWebSafe:s=>{if(options.strictDecoder&&s.length%4!==0)throw Error('padding required');return Buffer.from(s,'base64url');},newBlob:b=>({getDataAsString:()=>Buffer.from(b).toString()})},
  UrlFetchApp:{fetch(url,input){fetches++;assert.match(url,/^https:\/\/identitytoolkit.googleapis.com\/v1\/accounts:lookup\?key=/);assert.equal(input.followRedirects,false);assert.deepEqual(Object.keys(JSON.parse(input.payload)),['idToken']);if(options.network)throw Error(options.networkMessage||'secret');return {getResponseCode:()=>options.invalidSignature?400:200,getContentText:()=>JSON.stringify({users:[{localId:'approved-uid',email:'staff@example.invalid',...options.account}]})};}},
  getBeautyHubData_:()=>{reads++;return {success:true,players:[]};},submitRegistrationLocked_:()=>{mutations++;return {success:true};},
  beautyHubTestStatus_:()=>{mutations++;return {success:true};},beautyHubTestEventPreview_:()=>{reads++;return {success:true};},beautyHubTestEventTransition_:()=>{mutations++;return {success:true};}
 };
 vm.createContext(context);vm.runInContext("const BEAUTY_IDENTITY_APPROVED_SCRIPT_='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N';const SHEET_ID='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';\n"+fs.readFileSync(base+'HubTestAuth.gs','utf8')+'\n'+fs.readFileSync(base+'HubTestBridge.gs','utf8'),context);
 return {context,properties,records,events,token,login:()=>context.beautyHubAuth('login',{idToken:token()}),advance:ms=>now+=ms,get fetches(){return fetches;},get reads(){return reads;},get mutations(){return mutations;}};
}
test('Hub auth: missing session blocks every Hub action before reads or writes',()=>{
 const h=server();for(const a of ['read','status','register','eventload','eventprepare','eventsave','nakkahealth','nakkaevent','nakkacompare','attentionrefresh'])assert.equal(h.context.beautyHubTest(a,{}).code,'AUTH_REQUIRED');assert.equal(h.reads+h.mutations+h.fetches,0);
});
test('Hub auth: exact TEST identity and missing account approval fail closed',()=>{
 const h=server({wrongScript:true});assert.throws(()=>h.login(),/identity mismatch/);assert.equal(h.fetches,0);
 const s=server();s.properties.BEAUTY_HUB_ADMIN_UIDS='';assert.equal(s.login().code,'AUTH_SETUP');assert.equal(s.fetches,0);
});
test('Hub auth: malformed tokens and wrong issuer audience times or tenant never contact Firebase',()=>{
 const h=server();for(const value of ['',null,'abc',h.token({aud:'jdc-academy-6f648'}),h.token({iss:'wrong'}),h.token({exp:1}),h.token({iat:Infinity}),h.token({auth_time:1}),h.token({firebase:{tenant:'other'}})])assert.equal(h.context.beautyHubAuth('login',{idToken:value}).success,false);assert.equal(h.fetches,0);assert.equal(h.records.size,0);
});
test('Hub auth: decoded approved UID is insufficient without Firebase acceptance',()=>{
 for(const o of [{invalidSignature:true},{network:true},{account:{localId:'different'}},{account:{disabled:true}},{account:{tenantId:'other'}},{account:{validSince:'9999999999'}}]){const h=server(o);assert.equal(h.login().success,false);assert.equal(h.records.size,0);}
});
test('Hub auth: valid Firebase login creates opaque expiring session without stored ID token',()=>{
 const h=server(),s=h.login();assert.equal(s.authorized,true);assert.match(s.token,/^bhs_[a-f0-9]{64}$/);assert.equal(h.fetches,1);assert.doesNotMatch([...h.records.values()].join(' '),/signature|idToken|password|refreshToken/);
 assert.equal(h.context.beautyHubTest('read',{},s.token).success,true);assert.equal(h.reads,1);
});
test('Hub auth: unapproved accounts and spoofed client roles never grant entry',()=>{
 const h=server();h.properties.BEAUTY_HUB_ADMIN_UIDS='another-uid';assert.equal(h.login().code,'AUTH_DENIED');assert.equal(h.context.beautyHubAuth('login',{idToken:h.token(),role:'ADMIN'}).code,'AUTH_INVALID');assert.equal(h.records.size,0);
});
test('Hub auth: logout revokes session idempotently and captured token cannot read again',()=>{
 const h=server(),s=h.login();assert.equal(h.context.beautyHubAuth('logout',{token:s.token}).success,true);assert.equal(h.context.beautyHubAuth('logout',{token:s.token}).success,true);assert.equal(h.context.beautyHubTest('read',{},s.token).code,'AUTH_REQUIRED');assert.equal(h.reads,0);
});
test('Hub auth: refresh polling does not extend inactivity and touch cannot revive expired sessions',()=>{
 const h=server(),s=h.login();h.advance(14*60000);assert.equal(h.context.beautyHubTest('read',{},s.token).success,true);h.advance(60000);assert.equal(h.context.beautyHubAuth('touch',{token:s.token}).code,'AUTH_REQUIRED');assert.equal(h.context.beautyHubTest('read',{},s.token).code,'AUTH_REQUIRED');
});
test('Hub auth: real activity renews idle limit but absolute token expiry still wins',()=>{
 const h=server(),s=h.login();for(let i=0;i<5;i++){h.advance(10*60000);assert.equal(h.context.beautyHubAuth('touch',{token:s.token}).success,true);}h.advance(10*60000);assert.equal(h.context.beautyHubAuth('touch',{token:s.token}).code,'AUTH_REQUIRED');
});
test('Hub auth: removing approval and cache eviction revoke existing sessions',()=>{
 for(const change of [h=>{h.properties.BEAUTY_HUB_ADMIN_UIDS='';},h=>h.records.clear()]){const h=server(),s=h.login();change(h);assert.equal(h.context.beautyHubTest('read',{},s.token).code,'AUTH_REQUIRED');assert.equal(h.reads,0);}
});
test('Hub auth: locked touch cannot resurrect a logged-out session',()=>{
 const h=server(),s=h.login();h.context.beautyHubAuth('logout',{token:s.token});assert.equal(h.context.beautyHubAuth('touch',{token:s.token}).code,'AUTH_REQUIRED');assert.equal(h.records.size,0);
});
test('Hub auth: signing out revokes other sessions for the same account',()=>{
 const h=server(),first=h.login(),second=h.login();assert.equal(h.context.beautyHubTest('read',{},second.token).success,true);
 assert.equal(h.context.beautyHubAuth('logout',{token:first.token}).success,true);assert.equal(h.context.beautyHubTest('read',{},second.token).code,'AUTH_REQUIRED');
 assert.equal(h.context.beautyHubAuth('touch',{token:second.token}).code,'AUTH_REQUIRED');
 const fresh=h.login();assert.equal(h.context.beautyHubTest('read',{},fresh.token).success,true);
});
test('Hub auth: old direct data RPC requires a session and admin maintenance RPCs are private',()=>{
 const source=fs.readFileSync(base+'Code.js','utf8'),wrapper=source.match(/function getBeautyHubData\(token\) \{[\s\S]*?\n\}/)[0];
 let reads=0;const c={beautyHubAuthRequire_:()=>{throw Error('denied');},getBeautyHubData_:()=>reads++};vm.createContext(c);vm.runInContext(wrapper,c);assert.throws(()=>c.getBeautyHubData(),/denied/);assert.equal(reads,0);
 for(const name of ['setupTrigger','setupMasterListEditTrigger','importPlayersToMasterList'])assert.doesNotMatch(source,new RegExp('function '+name+'\\('));
});
test('Hub auth: public registration cannot claim HUB source while Remote stays available',()=>{
 const source=fs.readFileSync(base+'Code.js','utf8'),wrapper=source.match(/function submitRegistration\(data\) \{[\s\S]*?\n\}/)[0];let calls=0;const c={beautyHubPlayerRegistration_:(source,data)=>{assert.equal(source,'MOBIL');assert.equal(data.source,undefined);calls++;return {success:true};}};vm.createContext(c);vm.runInContext(wrapper,c);
 for(const source of ['HUB',' hub ','Hub'])assert.equal(c.submitRegistration({source}).success,false);
 assert.equal(c.submitRegistration({eventDate:'2026-10-27',selectedName:'Anna'}).success,true);assert.equal(calls,1);
});
test('Hub auth: status and event handlers recheck session inside their write lock',()=>{
 for(const [file,call] of [['HubTestStatus.gs',c=>c.beautyHubTestStatus_({player:'Adam',status:'OUT',expectedStatus:'IN',eventDate:'2026-10-26'})],['HubTestEventSave.gs',c=>c.beautyHubTestEventTransition_('prepare',{date:'2026-10-27',expectedDate:'2026-10-26'})]]){
  let reads=0,released=0;const c={beautyHubTestGuard_:()=>{},beautyHubAuthRequire_:()=>{throw Error('revoked while waiting');},beautyHubRequestToken_:'old',BEAUTY_IDENTITY_WRITES_ENABLED_:true,SpreadsheetApp:{openById:()=>{reads++;}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})}};vm.createContext(c);vm.runInContext(fs.readFileSync(base+file,'utf8'),c);assert.equal(call(c).success,false);assert.equal(reads,0);assert.equal(released,1);
 }
});
test('Hub auth: TEST manifest adds only external HTTPS requests and retains owner-only access',()=>{
 const m=JSON.parse(fs.readFileSync(base+'appsscript.json'));assert.deepEqual(m.oauthScopes,['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.external_request']);assert.equal(m.webapp.access,'MYSELF');assert.equal(m.webapp.executeAs,'USER_ACCESSING');
});

test('Hub auth: unpadded Firebase JWT works with a strict native Base64 decoder',()=>{
 const h=server({strictDecoder:true});assert.equal(h.login().success,true);
});

test('Hub auth: permission connection and HTTP failures retain bounded diagnostic codes',()=>{
 for(const [options,code] of [[{network:true,networkMessage:'You do not have permission to call UrlFetchApp'},'AUTH_VERIFY_PERMISSION'],[{network:true},'AUTH_VERIFY_CONNECTION'],[{invalidSignature:true},'AUTH_VERIFY_HTTP_400']]){const h=server(options),r=h.login();assert.equal(r.code,code);assert.doesNotMatch(JSON.stringify(r),/secret|signature|idToken/);assert.equal(h.records.size,0);}
});
test('Hub auth: native environment probe exposes no account or token information',()=>{
 const h=server({strictDecoder:true}),r=h.context.beautyHubAuthProbe();assert.equal(r.unpadded,false);assert.equal(r.padded,true);assert.equal(h.fetches,1);assert.doesNotMatch(JSON.stringify(r),/approved-uid|staff@|signature|idToken/);
});
