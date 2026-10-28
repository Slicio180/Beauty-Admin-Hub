const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function page(service){
 const nodes={};for(const id of [...fs.readFileSync('public/login.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]))nodes[id]={value:'',type:id==='loginPassword'?'password':'',hidden:['resetView','sessionView'].includes(id),textContent:'',handlers:{},attrs:{},addEventListener(n,f){this.handlers[n]=f;},setAttribute(n,v){this.attrs[n]=v;},focus(){}};
 const window={BeautyAccountService:service,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('public/js/login.js','utf8'),{window,document:{getElementById:id=>nodes[id],querySelectorAll:()=>Object.values(nodes)}});
 return {nodes,click:id=>nodes[id].handlers.click(),submit:async id=>{nodes[id].handlers.submit({preventDefault(){}});await new Promise(setImmediate);}};
}
test('login page: disconnected default rejects entry and clears password',async()=>{
 const p=page();p.nodes.loginEmail.value='test@example.invalid';p.nodes.loginPassword.value='test-only';await p.submit('loginForm');
 assert.equal(p.nodes.loginPassword.value,'');assert.equal(p.nodes.sessionView.hidden,true);assert.match(p.nodes.loginMessage.textContent,/not connected/);
});
test('login page: show password, reset navigation and provider reset outcome',async()=>{
 const calls=[],p=page({sendPasswordReset:async email=>calls.push(email)});p.nodes.loginEmail.value='test@example.invalid';p.nodes.loginPassword.value='test-only';
 p.click('showPassword');assert.equal(p.nodes.loginPassword.type,'text');p.click('showPassword');assert.equal(p.nodes.loginPassword.type,'password');
 p.click('forgotPassword');assert.equal(p.nodes.loginPassword.value,'');assert.equal(p.nodes.resetView.hidden,false);assert.equal(p.nodes.resetEmail.value,'test@example.invalid');
 await p.submit('resetForm');assert.deepEqual(calls,['test@example.invalid']);assert.match(p.nodes.loginMessage.textContent,/If this address has an account/);
 p.click('backToSignIn');assert.equal(p.nodes.signInView.hidden,false);
});
test('login page: authorization required; successful session and logout use service',async()=>{
 let authorized=false,opened=0,signedOut=0;
 const p=page({signIn:async()=>({authorized,email:'test@example.invalid'}),signOut:async()=>{signedOut++;},openHub:async()=>{opened++;}});
 await p.submit('loginForm');assert.equal(p.nodes.sessionView.hidden,true);
 authorized=true;await p.submit('loginForm');assert.equal(p.nodes.sessionView.hidden,false);
 p.click('openHub');await new Promise(setImmediate);assert.equal(opened,1);
 p.click('signOut');await new Promise(setImmediate);assert.equal(signedOut,1);assert.equal(p.nodes.sessionView.hidden,true);assert.equal(p.nodes.loginEmail.value,'');
});
test('login page: prevents duplicate sign-in and reports reset/signout failures truthfully',async()=>{
 let finish,calls=0;
 const p=page({signIn:()=>{calls++;return new Promise(r=>finish=r);},sendPasswordReset:async()=>{throw Error('Network unavailable');},signOut:async()=>{throw Error('Session could not be revoked');}});
 await p.submit('loginForm');await p.submit('loginForm');assert.equal(calls,1);assert.equal(p.nodes.signInButton.disabled,true);
 finish({authorized:true});await new Promise(setImmediate);assert.equal(p.nodes.signInButton.disabled,false);
 p.click('signOut');await new Promise(setImmediate);assert.equal(p.nodes.sessionView.hidden,false);assert.match(p.nodes.loginMessage.textContent,/could not be revoked/);
 await p.submit('resetForm');assert.match(p.nodes.loginMessage.textContent,/Network unavailable/);
});
