const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function client(options={}){
 let now=1000000,readCount=0,fetchCalls=[],rpcCalls=[];const listeners={},intervals=[],nodes={};
 for(const id of ['playersTableBody','playerCount','currentEventDate','currentEventStatus','hubSessionEmail','hubSignOut','loginMessage','sessionView','signInView'])nodes[id]={textContent:'PRIVATE',hidden:false,disabled:false,events:{},replaceChildren(){this.textContent='';},addEventListener(n,fn){this.events[n]=fn;}};
 const classes=new Set(['beauty-auth-locked']);let closed=0,removed=0;
 const root={beautyHubData:{message:'PRIVATE'},BeautyPoolPlanner:{unavailable(){}},addEventListener:(e,fn)=>listeners[e]=fn,dispatchEvent:e=>listeners[e.type]?.(e)};
 const document={hidden:false,body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}},getElementById:id=>nodes[id],querySelectorAll:q=>q==='dialog[open]'?[{close(){closed++;}}]:[{remove(){removed++;}}],addEventListener:(e,fn)=>listeners['document:'+e]=fn,dispatchEvent:e=>listeners['document:'+e.type]?.(e)};
 const runner={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},beautyHubAuth(action,input){rpcCalls.push({action,input});if(options.rpc)return options.rpc(action,input,this.success,this.failure);this.success(action==='login'?{success:true,token:'session-token',email:'staff@example.invalid',expiresAt:now+21600000,idleMs:21600000}:{success:true});}};
 const context={window:root,document,Date:class extends Date{static now(){return now;}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},AbortController:class{signal={};abort(){}},setTimeout:()=>1,clearTimeout(){},setInterval:f=>intervals.push(f),loadBeautyHubData:async()=>readCount++,google:{script:{run:runner}},fetch:async(url,input)=>{fetchCalls.push({url,input});if(options.fetch)return options.fetch(url,input);return {ok:true,json:async()=>({idToken:'firebase-token',refreshToken:'NEVER-STORE'})};}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('public/js/hub-auth.js','utf8'),context);listeners['document:DOMContentLoaded']();
 return {root,nodes,classes,listeners,intervals,rpcCalls,fetchCalls,advance:ms=>now+=ms,get readCount(){return readCount;},get closed(){return closed;},get removed(){return removed;},service:root.BeautyAccountService};
}
test('Hub auth client: password goes only to Firebase and approved server session opens Hub',async()=>{
 const c=client(),s=await c.service.signIn({email:'staff@example.invalid',password:'TEST-ONLY'});assert.equal(s.authorized,true);assert.match(c.fetchCalls[0].url,/^https:\/\/identitytoolkit.googleapis.com/);assert.equal(JSON.parse(c.fetchCalls[0].input.body).password,'TEST-ONLY');assert.equal(c.fetchCalls[0].input.credentials,'omit');assert.deepEqual(Object.keys(c.rpcCalls[0].input),['idToken']);assert.doesNotMatch(JSON.stringify(c.rpcCalls),/TEST-ONLY|NEVER-STORE/);
 let opened=0;c.listeners['document:beauty-hub-opened']=()=>opened++;
 assert.equal(c.classes.has('beauty-auth-locked'),true);await c.service.openHub();assert.equal(opened,1);assert.equal(c.classes.has('beauty-auth-locked'),false);assert.equal(c.readCount,1);
});
test('Hub auth client: server denial or Firebase failure cannot unlock Hub',async()=>{
 for(const options of [{fetch:async()=>({ok:false})},{rpc:(a,i,ok)=>ok({success:false,code:'AUTH_DENIED'})}]){const c=client(options);await assert.rejects(c.service.signIn({email:'x',password:'TEST'}));assert.throws(()=>c.root.BeautyHubAuth.token());assert.equal(c.classes.has('beauty-auth-locked'),true);assert.equal(c.readCount,0);}
});
test('Hub auth client: logout hides Hub immediately, clears private UI and invalidates generations',async()=>{
 let complete;const c=client({rpc:(a,i,ok)=>a==='logout'?complete=ok:ok(a==='login'?{success:true,token:'session-token',email:'staff',expiresAt:4600000,idleMs:900000}:{success:true})});
 await c.service.signIn({email:'x',password:'TEST'});await c.service.openHub();const generation=c.root.BeautyHubAuth.generation(),p=c.service.signOut();
 assert.equal(c.classes.has('beauty-auth-locked'),true);assert.equal(c.nodes.playersTableBody.textContent,'');assert.equal(c.root.beautyHubData,null);assert.equal(c.root.BeautyHubAuth.isCurrent(generation),false);assert.ok(c.closed&&c.removed);complete({success:true});await p;
});
test('Hub auth client: failed server logout stays locked and offers bounded explicit retry',async()=>{
 let fail=true;const c=client({rpc:(a,i,ok,bad)=>{if(a==='logout'&&fail){bad();return;}ok(a==='login'?{success:true,token:'session-token',expiresAt:4600000,idleMs:900000}:{success:true});}});
 await c.service.signIn({email:'x',password:'TEST'});await assert.rejects(c.service.signOut(),/not confirmed/);assert.equal(c.root.BeautyHubAuth.hasPendingLogout(),true);assert.equal(c.classes.has('beauty-auth-locked'),true);
 await assert.rejects(c.service.signIn({email:'x',password:'TEST'}),/Finish signing out/);fail=false;await c.service.signOut();assert.equal(c.root.BeautyHubAuth.hasPendingLogout(),false);
});
test('Hub auth client: polling without user activity cannot keep session alive',async()=>{
 const c=client();await c.service.signIn({email:'x',password:'TEST'});c.advance(21600000);await c.intervals[0]();assert.throws(()=>c.root.BeautyHubAuth.token());assert.equal(c.rpcCalls.filter(r=>r.action==='touch').length,0);assert.equal(c.classes.has('beauty-auth-locked'),true);
});
test('Hub auth client: only visible user activity sends a throttled session touch',async()=>{
 const c=client();await c.service.signIn({email:'x',password:'TEST'});c.advance(35000);await c.intervals[0]();assert.equal(c.rpcCalls.length,1);c.listeners['document:keydown']();await c.intervals[0]();assert.equal(c.rpcCalls.at(-1).action,'touch');
});
test('Hub auth client: returning from browser history locks cached page and reset reports actual request',async()=>{
 const c=client();await c.service.signIn({email:'x',password:'TEST'});await c.service.openHub();c.listeners.pageshow({persisted:true});assert.equal(c.classes.has('beauty-auth-locked'),true);assert.throws(()=>c.root.BeautyHubAuth.token());
 await c.service.sendPasswordReset('staff@example.invalid');assert.equal(JSON.parse(c.fetchCalls.at(-1).input.body).requestType,'PASSWORD_RESET');
});
test('Hub auth client: transport ignores pre-logout responses and refuses unsigned RPCs',async()=>{
 let success,called=0,current=true;
 const auth={token:()=>{if(!current)throw Error('locked');return 'opaque';},generation:()=>1,isCurrent:()=>current,expired(){current=false;}};
 const runner={withSuccessHandler(f){success=f;return this;},withFailureHandler(){return this;},beautyHubTest(a,i,t){called++;assert.equal(t,'opaque');}};
 const c={URL,BeautyHubAuth:auth,google:{script:{run:runner}}};vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',c);
 const p=c.service.request(c.service.endpoint);await new Promise(setImmediate);current=false;success({success:true,players:[{message:'PRIVATE'}]});await assert.rejects(p,/Sign in/);await assert.rejects(c.service.request(c.service.endpoint),/locked/);assert.equal(called,1);
});
test('Hub auth client: generated entry is locked before scripts and contains no server UID allowlist',()=>{
 const html=fs.readFileSync(basePath(),'utf8');assert.match(html,/<body class="beauty-auth-locked">/);assert.match(html,/id="beautyAuthSurface"/);assert.match(html,/id="hubSignOut"/);assert.doesNotMatch(html,/z6BS1ErgwDW5J6zrH9lDCtxxAms2/);
 const source=fs.readFileSync('public/js/hub-auth.js','utf8');assert.doesNotMatch(source,/localStorage|sessionStorage|document\.cookie/);
});
test('Hub auth client: queued pre-logout writes cannot borrow a new login session',async()=>{
 let generation=1;const calls=[];
 const auth={token:()=> 'token-'+generation,generation:()=>generation,isCurrent:g=>g===generation,expired(){generation++;}};
 const runner={withSuccessHandler(f){this.success=f;return this;},withFailureHandler(){return this;},beautyHubTest(a,i,t){calls.push({a,t,success:this.success});}};
 const c={URL,BeautyHubAuth:auth,google:{script:{run:runner}}};vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',c);
 const read=c.service.request(c.service.endpoint),write=c.service.request('https://beauty.invalid/hub?page=hubstatus&player=Adam&status=OUT&expectedStatus=IN&eventDate=2026-10-26');
 const readFailure=assert.rejects(read,/Sign in/),writeFailure=assert.rejects(write,/Sign in/);await new Promise(setImmediate);assert.equal(calls.length,1);
 generation=2;calls[0].success({success:true});await readFailure;await writeFailure;assert.equal(calls.length,1);
});
function basePath(){return 'apps-script/registration-identity-test/remote-app/HubTest.html';}

test('Hub auth client: busy renewal during a save retries without signing out or extending expiry',async()=>{
 let busy=true;const c=client({rpc:(a,i,ok)=>ok(a==='login'?{success:true,token:'session-token',email:'staff',expiresAt:4600000,idleMs:900000}:busy?{success:false,code:'AUTH_BUSY'}:{success:true})});
 await c.service.signIn({email:'x',password:'TEST'});busy=false;await c.service.openHub();busy=true;
 c.advance(35000);c.listeners['document:keydown']();await c.intervals[0]();assert.equal(c.classes.has('beauty-auth-locked'),false);assert.equal(c.root.BeautyHubAuth.token(),'session-token');
 busy=false;await c.intervals[0]();assert.equal(c.rpcCalls.filter(r=>r.action==='touch').length,3);assert.equal(c.classes.has('beauty-auth-locked'),false);
 busy=true;c.advance(900000);await c.intervals[0]();assert.equal(c.classes.has('beauty-auth-locked'),true);assert.throws(()=>c.root.BeautyHubAuth.token());
});

test('Hub auth client: denied renewal still locks immediately',async()=>{
 let deny=false;const c=client({rpc:(a,i,ok)=>ok(a==='login'?{success:true,token:'session-token',email:'staff',expiresAt:4600000,idleMs:900000}:deny?{success:false,code:'AUTH_REQUIRED'}:{success:true})});
 await c.service.signIn({email:'x',password:'TEST'});await c.service.openHub();deny=true;c.advance(35000);c.listeners['document:keydown']();await c.intervals[0]();assert.equal(c.classes.has('beauty-auth-locked'),true);assert.throws(()=>c.root.BeautyHubAuth.token());
});

test('Hub auth client: only approved verification codes reach the sign-in error',async()=>{
 for(const code of ['AUTH_TOKEN_DECODE','AUTH_VERIFY_HTTP_400','secret unknown detail']){const c=client({rpc:(a,i,ok)=>ok({success:false,code})});await assert.rejects(c.service.signIn({email:'x',password:'TEST'}),error=>code==='secret unknown detail'?!error.message.includes('secret'):error.message.includes(code));}
});

test('Hub auth client: six-hour open page stays signed in without activity and page close or reload loses credentials',async()=>{
 const c=client();await c.service.signIn({email:'x',password:'TEST'});await c.service.openHub();c.advance(21600000-1);await c.intervals[0]();assert.equal(c.root.BeautyHubAuth.token(),'session-token');c.advance(1);await c.intervals[0]();assert.throws(()=>c.root.BeautyHubAuth.token());
 const open=client();await open.service.signIn({email:'x',password:'TEST'});open.listeners.pagehide();assert.throws(()=>open.root.BeautyHubAuth.token());assert.equal(open.classes.has('beauty-auth-locked'),true);const reloaded=client();assert.throws(()=>reloaded.root.BeautyHubAuth.token());assert.equal(reloaded.fetchCalls.length,0);
});
