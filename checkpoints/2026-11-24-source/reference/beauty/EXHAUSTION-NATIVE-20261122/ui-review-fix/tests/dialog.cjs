const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
const html=dir=>fs.readFileSync(path.join(root,dir,'HubTest.html'),'utf8');
function script(s){const start=s.indexOf("<script>(()=>{'use strict';\n const get=id=>document.getElementById(id),host=get('beautyRecoveryEventControls')");assert(start>=0);return s.slice(start+8,s.indexOf('</script>',start));}
function harness(dir='candidate',changes={}){
 const made=[],events={},calls=[],timers=new Map();let serial=0,auth=false,generation=1;
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.dataset={};this.attributes={};this.textContent='';this.hidden=false;this.open=false;made.push(this);}
  append(...els){for(const e of els){e.remove();e.parent=this;this.children.push(e);}}
  replaceChildren(...els){for(const e of this.children)e.parent=null;this.children=[];this.append(...els);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null;}
  before(){}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,v){(this.handlers[k]??=[]).push(v);}
  click(){if(!this.disabled)for(const f of this.handlers.click||[])f({});}
  showModal(){this.open=true;}
  close(){this.open=false;for(const f of this.handlers.close||[])f();}
  querySelectorAll(selector){const tags=selector.split(',');return this.children.flatMap(e=>[...(tags.includes(e.tag)?[e]:[]),...e.querySelectorAll(selector)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
 }
 const ids={};for(const id of ['beautyRecoveryEventControls','nakkaAttentionPanel','beautyRecoveryTestOpen','beautyRecoveryTestPanel','dashboardNavButton'])ids[id]=new Element('div');
 const document={hidden:false,body:new Element('body'),getElementById:id=>ids[id]||made.find(x=>x.id===id)||null,createElement:tag=>new Element(tag),querySelectorAll:()=>[],addEventListener:(k,v)=>(events[k]??=[]).push(v)};
 const run={withSuccessHandler(f){this.success=f;return this;},withFailureHandler(f){this.failure=f;return this;},beautyHubTest(action,input,token){calls.push({action,input:JSON.parse(JSON.stringify(input)),token,resolve:this.success,reject:this.failure});}};
 const window={BeautyHubAuth:{token:()=>{if(!auth)throw Error('locked');return 'local-test';},generation:()=>generation,isCurrent:n=>n===generation,expired(){auth=false;}},BeautyDashboard:{refresh(){}}};
 const c={window,document,google:{script:{run}},console,Date,JSON,Object,Array,Promise,Error,Number,String,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(c);vm.runInContext(script(html(dir)),c);
 const native=JSON.parse(fs.readFileSync(path.join(root,'../evidence/native-final.json'),'utf8')).report;
 const player={...native.proof.view,history:JSON.parse(native.recoveryRaw).history,...changes};
 const response={success:true,eventContext:native.context.revision,eventDate:native.context.date,eventId:native.context.eventId,title:native.context.title,players:[player],system:''};
 const fire=(name,e={})=>{for(const fn of events[name]||[])fn(e);};
 const flush=()=>new Promise(r=>setImmediate(r));
 async function ready(){auth=true;window.beautyHubData={eventContext:response.eventContext};fire('beauty-hub-opened');assert.equal(calls.length,1);assert.equal(calls[0].action,'playerRecovery:read');calls[0].resolve(response);await flush();calls.length=0;}
 return {c,made,calls,timers,player,response,fire,flush,ready,open:()=>window.BeautyPlayerRecovery.open(player.name),
  dialog:()=>document.getElementById('beautyPlayerRecoveryDialog'),buttons:()=>document.getElementById('beautyPlayerRecoveryDialog').querySelectorAll('button'),
  setAuth:v=>auth=v,rotate:()=>generation++};
}
async function test(name,fn){await fn();checks.push(name);}
async function main(){
 await test('Baseline reproduces an automatic review RPC merely by opening an exhausted red item',async()=>{const f=harness('baseline');await f.ready();f.open();assert.equal(f.calls.length,1);assert.equal(f.calls[0].action,'playerRecovery:review');});
 await test('Candidate opens exhausted report with no RPC and exposes the native explanation and explicit action',async()=>{const f=harness();await f.ready();f.open();assert.equal(f.calls.length,0);assert(f.dialog().open);assert.equal(f.dialog().dataset.tone,'red');const text=f.dialog().children.map(x=>x.textContent).join(' ');assert.match(text,/Automatic retries stopped/);assert(text.includes(f.player.problem));assert(text.includes(f.player.next));assert(f.buttons().some(x=>x.textContent==='Check after correction'));});
 await test('Closing and reopening the report does not retry or change the original server result',async()=>{const f=harness();await f.ready();const before=JSON.stringify(f.response);f.open();f.dialog().close();f.open();assert.equal(f.calls.length,0);assert.equal(JSON.stringify(f.response),before);});
 await test('Provider-paused read keeps exhausted guidance visible and disables its manual action while busy',async()=>{const f=harness();await f.ready();f.open();f.fire('beauty-nakka-diagnosed',{detail:{success:false}});assert.equal(f.calls[0].action,'playerRecovery:read');assert(f.dialog().children.some(x=>x.textContent==='Automatic retries stopped'));let b=f.buttons().find(x=>x.textContent==='Check after correction');assert.equal(b.disabled,true);b.click();assert.equal(f.calls.length,1);f.calls[0].resolve(f.response);await f.flush();b=f.buttons().find(x=>x.textContent==='Check after correction');assert.equal(b.disabled,false);assert(f.dialog().children.some(x=>x.textContent.includes(f.player.problem)));});
 await test('An explicit manual click sends one context-bound review and ignores a second click while busy',async()=>{const f=harness();await f.ready();f.open();const b=f.buttons().find(x=>x.textContent==='Check after correction');b.click();assert.equal(f.calls.length,1);assert.equal(f.calls[0].action,'playerRecovery:review');assert.equal(f.calls[0].input.player,f.player.name);assert.equal(f.calls[0].input._context,f.response.eventContext);b.click();assert.equal(f.calls.length,1);});
 await test('Ordinary red registration issues retain their existing opening-review behavior',async()=>{const f=harness('candidate',{code:'MISSING_EVENT_ENTRY',problem:'missing'});await f.ready();f.open();assert.equal(f.calls.length,1);assert.equal(f.calls[0].action,'playerRecovery:review');});
 await test('Removal review behavior and later-edit wording are unchanged',async()=>{const f=harness('candidate',{operation:'removal',code:'REMOVE_REVIEW_REQUIRED'});await f.ready();f.open();assert.equal(f.calls.length,1);f.calls[0].resolve(f.response);await f.flush();assert(f.dialog().children.some(x=>x.textContent.includes('later player changes will be preserved')));assert(f.buttons().some(x=>x.textContent==='Check after correction'));});
 await test('Orange in-progress items do not start another manual request',async()=>{const f=harness('candidate',{tone:'orange',code:'RECOVERY_STARTED'});await f.ready();f.open();assert.equal(f.calls.length,0);assert(f.dialog().children.some(x=>x.textContent==='Checking…'));});
 await test('Late response after sign-out cannot reopen or repopulate the report',async()=>{const f=harness();await f.ready();f.open();f.buttons().find(x=>x.textContent==='Check after correction').click();f.setAuth(false);f.rotate();f.fire('beauty-hub-locked');f.calls[0].resolve(f.response);await f.flush();assert.equal(f.dialog().open,false);assert.equal(f.dialog().querySelector('pre').textContent,'');});
 await test('Only the Recovery script changed; all other HTML, pool behavior and assets remain byte-identical',()=>{const a=html('baseline'),b=html('candidate');assert.equal(a.replace(script(a),'RECOVERY_SCRIPT'),b.replace(script(b),'RECOVERY_SCRIPT'));});
 const out={result:'PASS',checks:checks.length,details:checks,recordedUTC:new Date().toISOString(),scope:'Complete actual Recovery client script with simulated DOM and Apps Script RPC; current native synthetic12 server response. Baseline defect reproduced; no remote calls. Rendered native acceptance pending reload/sign-in.'};
 fs.writeFileSync(path.join(root,'evidence/local-dialog-checks.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
