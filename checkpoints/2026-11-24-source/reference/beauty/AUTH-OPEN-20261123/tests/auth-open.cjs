const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), results=[];
const source=(kind,file)=>fs.readFileSync(path.join(root,kind,file),'utf8');
function server(kind='candidate') {
 let now=Date.parse('2026-11-23T09:00:00Z'), serial=0, busy=true, denyGuard=false, denyContext=false;
 const props={'BEAUTY_HUB_ADMIN_UIDS':'test_admin','event-record':'preserved'},cache={},calls=[];
 class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const c={Date:Clock,console:{log(){}},JSON,Object,Array,Number,String,Math,Error,
  beautyHubTestGuard_(){if(denyGuard)throw Error('TEST_BOUNDARY');},beautyContextAssert_(){if(denyContext)throw Error('CONTEXT_CHANGED');},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,getProperties:()=>({...props}),setProperty(k,v){props[k]=v;calls.push('property-write');},deleteProperty(k){delete props[k];calls.push('property-delete');}})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k]??null,put(k,v){cache[k]=v;calls.push('cache-write');},remove(k){delete cache[k];calls.push('cache-delete');}})},
  LockService:{getScriptLock:()=>({tryLock(){calls.push('lock');return !busy;},releaseLock(){calls.push('release');}})},
  Utilities:{getUuid:()=> (++serial).toString(16).padStart(32,'0'),base64DecodeWebSafe:s=>Buffer.from(s,'base64url'),newBlob:b=>({getDataAsString:()=>Buffer.from(b).toString('utf8')})},
  UrlFetchApp:{fetch(){calls.push('firebase-lookup');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({users:[{localId:'test_admin',email:'synthetic@example.invalid',validSince:0}]})};}}
 };
 vm.createContext(c);vm.runInContext(source(kind,'HubTestAuth.gs'),c);
 const jwt=()=>['synthetic',Buffer.from(JSON.stringify({aud:'beauty-admin-hub-test',iss:'https://securetoken.google.com/beauty-admin-hub-test',sub:'test_admin',exp:now/1000+3600,iat:now/1000,auth_time:now/1000})).toString('base64url'),'fake_signature'].join('.');
 return {c,props,cache,calls,Clock,jwt,now:()=>now,advance:ms=>now+=ms,setBusy:v=>busy=v,setGuard:v=>denyGuard=v,setContext:v=>denyContext=v,
  login:()=>c.beautyHubAuth('login',{idToken:jwt()}),check:t=>c.beautyHubAuth('check',{token:t}),revoke:()=>props.BEAUTY_HUB_AUTH_EPOCH_test_admin='revoked',
  editSession(t,changes){const key='beauty-hub-session:'+t;props[key]=JSON.stringify({...JSON.parse(props[key]),...changes});delete cache[key];}};
}
function client(s,kind='candidate',intercept=()=>{}) {
 const nodes=new Map(),docListeners={},rootListeners={},intervals=[],events=[],rpcCalls=[];
 const classes=new Set(['beauty-auth-locked']);
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',type:'password',textContent:'',hidden:false,disabled:false,handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(){},focus(){},replaceChildren(){}});return nodes.get(id);}
 const document={hidden:false,body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)}},
  getElementById:node,querySelectorAll:()=>[],addEventListener:(k,fn)=>(docListeners[k]??=[]).push(fn),dispatchEvent:e=>events.push(e.type)};
 let dataLoads=0;
 const c={document,Date:s.Clock,console:{log(){}},Object,Error,Promise,AbortController,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
  setTimeout,clearTimeout,setInterval:fn=>intervals.push(fn),loadBeautyHubData:async()=>{dataLoads++;},
  fetch:async()=>({ok:true,json:async()=>({idToken:s.jwt()})}),
  addEventListener:(k,fn)=>(rootListeners[k]??=[]).push(fn),dispatchEvent(e){for(const fn of rootListeners[e.type]||[])fn(e);},
  google:{script:{run:{withSuccessHandler(success){return {withFailureHandler(failure){return {beautyHubAuth(action,input){rpcCalls.push(action);try{const result=s.c.beautyHubAuth(action,input);intercept(action,result,c);success(result);}catch(e){failure(e);}}};}};}}}}
 };
 c.window=c;vm.createContext(c);
 const scripts=[...source(kind,'HubTest.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/g)].map(m=>m[1]);
 vm.runInContext(scripts.find(x=>x.includes('Managed Beauty password login')),c);
 vm.runInContext(scripts.find(x=>x.includes("$('loginForm').addEventListener")),c);
 for(const fn of docListeners.DOMContentLoaded||[])fn();
 return {c,nodes,node,intervals,rpcCalls,events,locked:()=>classes.has('beauty-auth-locked'),dataLoads:()=>dataLoads,
  async submit(){node('loginEmail').value='synthetic@example.invalid';node('loginPassword').value='synthetic-only';node('loginForm').handlers.submit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);},
  activity(){for(const fn of docListeners.pointerdown||[])fn();}};
}
async function test(name,fn){await fn();results.push(name);}
(async()=>{
 await test('Exact installed baseline reproduces busy message after successful login at openHub touch',async()=>{
  const s=server('baseline'),c=client(s,'baseline');await c.submit();assert.deepEqual(c.rpcCalls,['login','touch']);assert.equal(c.node('loginMessage').textContent,'The Hub is busy. Please try signing in again.');assert(c.locked());assert.equal(c.dataLoads(),0);assert.equal(c.node('loginPassword').value,'');
 });
 await test('Full candidate login form opens with the event lock busy using server validation',async()=>{
  const s=server(),c=client(s);await c.submit();assert.deepEqual(c.rpcCalls,['login','check']);assert.equal(c.node('loginMessage').textContent,'');assert(!c.locked());assert.equal(c.dataLoads(),1);assert.equal(c.node('loginPassword').value,'');assert(!s.calls.includes('lock'));assert.equal(s.props['event-record'],'preserved');
 });
 await test('A valid check makes no writes, no Firebase request, no lock request and no expiry extension',()=>{
  const s=server(),r=s.login(),before=JSON.stringify(s.props);s.calls.length=0;s.advance(1000);const check=s.check(r.token);assert.equal(check.success,true);assert.equal(check.expiresAt,r.expiresAt);assert.deepEqual(s.calls,[]);assert.equal(JSON.stringify(s.props),before);
 });
 await test('Check survives cache eviction using the existing durable session record',()=>{const s=server(),r=s.login();delete s.cache['beauty-hub-session:'+r.token];assert.equal(s.check(r.token).success,true);});
 for(const [name,change] of [
  ['revoked session',(s,r)=>s.revoke()],
  ['removed administrator',(s,r)=>s.props.BEAUTY_HUB_ADMIN_UIDS='other_admin'],
  ['absolute expiry',(s,r)=>s.advance(6*60*60*1000)],
  ['idle expiry',(s,r)=>s.editSession(r.token,{active:s.now()-6*60*60*1000})],
  ['invalid expiry',(s,r)=>s.editSession(r.token,{expires:null})],
  ['invalid activity',(s,r)=>s.editSession(r.token,{active:null})]
 ])await test('Check denies '+name+' without opening the Hub',async()=>{
  const s=server(),c=client(s,'candidate',(action,result)=>{if(action==='login')change(s,result);});await c.submit();assert(c.locked());assert.equal(c.dataLoads(),0);assert.notEqual(c.node('loginMessage').textContent,'');assert.equal(s.props['event-record'],'preserved');
 });
 await test('Malformed or unknown session tokens are rejected',()=>{const s=server();for(const token of ['invalid','bhs_'+'f'.repeat(64)]){const r=s.check(token);assert.equal(r.success,false);assert.equal(r.code,'AUTH_REQUIRED');}});
 await test('The exact TEST boundary remains mandatory for validation',()=>{const s=server(),r=s.login();s.setGuard(true);assert.throws(()=>s.check(r.token),/TEST_BOUNDARY/);});
 await test('Context validation failure cannot unlock the client',async()=>{const s=server(),c=client(s,'candidate',(action)=>{if(action==='login')s.setContext(true);});await c.submit();assert(c.locked());assert.equal(c.dataLoads(),0);assert.equal(c.node('loginMessage').textContent,'The account service is unavailable. Please try again.');});
 await test('Unknown actions, extra fields and invalid input shapes remain rejected',()=>{const s=server(),r=s.login();for(const [action,input] of [['check',{token:r.token,extra:true}],['check',null],['check',[]],['check',{token:42}],['unknown',{token:r.token}]]){const out=s.c.beautyHubAuth(action,input);assert.equal(out.success,false);assert.equal(out.code,'AUTH_INVALID');}});
 await test('A late validation result after client sign-out cannot unlock the screen',async()=>{const s=server(),c=client(s,'candidate',(action,result,window)=>{if(action==='check')window.BeautyHubAuth.expired();});await c.submit();assert(c.locked());assert.equal(c.dataLoads(),0);});
 await test('Existing periodic renewal stays locked and tolerates busy without revoking a valid session',async()=>{const s=server(),c=client(s);await c.submit();s.advance(31000);c.activity();await c.intervals[0]();assert.equal(c.rpcCalls.at(-1),'touch');assert(!c.locked());assert.equal(c.c.BeautyHubAuth.token().startsWith('bhs_'),true);});
 await test('Logout lock and revocation semantics are unchanged',()=>{const s=server(),a=s.login(),b=s.login();assert.equal(s.c.beautyHubAuth('logout',{token:a.token}).code,'AUTH_BUSY');s.setBusy(false);assert.equal(s.c.beautyHubAuth('logout',{token:a.token}).success,true);assert.equal(s.check(b.token).code,'AUTH_REQUIRED');});
 await test('Expired client session cannot call the new validation route or reopen the Hub',async()=>{const s=server(),c=client(s);await c.submit();s.advance(6*60*60*1000);const count=c.rpcCalls.length;await assert.rejects(c.c.BeautyAccountService.openHub(),/Sign in to continue/);assert(c.locked());assert.equal(c.rpcCalls.length,count);});
 await test('Server diff is confined to admitting check and calling the unchanged session validator',()=>{
  const old=source('baseline','HubTestAuth.gs'),now=source('candidate','HubTestAuth.gs');const start=now.indexOf('    // Opening the Hub validates');const end=now.indexOf('    return beautyHubAuthLocked_',start);assert(start>0&&end>start);assert.equal((now.slice(0,start)+now.slice(end)).replace("['check','touch','logout']","['touch','logout']"),old);
 });
 await test('Client diff changes only opening validation and its explanatory comment',()=>{
  const old=source('baseline','HubTest.html'),now=source('candidate','HubTest.html');assert.equal(now.replace("const value=token(),ticket=generation;await rpc('check',{token:value});","const value=token(),ticket=generation;await rpc('touch',{token:value});").replace('// Open through server-side session validation; never unlock locally.','// Open through the existing server-validated touch; never unlock locally.'),old);
 });
 const report={result:'PASS',checks:results.length,details:results,recordedUTC:new Date().toISOString(),scope:'Actual complete saved authentication server, account service and login form controller; simulated Apps Script, Firebase and DOM with synthetic credentials. No external calls or event writes. Native sign-in acceptance pending.'};
 fs.writeFileSync(path.join(root,'evidence/local-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
