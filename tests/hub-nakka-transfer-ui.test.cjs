const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ui(){
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.disabled=false;this.value='';this.style={};this._text='';}
  set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text;}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}replaceChildren(){this.children=[];this._text='';}
  addEventListener(k,fn){this.events[k]=fn;}setAttribute(){}focus(){}showModal(){this.open=true;}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
  click(){return this.fire();}
  fire(k='click'){if(this.disabled)return;return this.events[k]?.({preventDefault(){}});}
 }
 const events={},observers=[],calls=[],pending=[];const host=new Node('section'),parent=new Node('section'),body=new Node('body'),table=new Node('tbody');parent.append(host);
 const state={eventDate:'2026-10-27',players:[{player:'Anna',status:'IN'},{player:'Out',status:'OUT'},{player:'Standby',status:'STANDBY'}]};
 const c={CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},window:{beautyHubData:state},Date,JSON,Set,URL,document:{body,getElementById:id=>id==='nakkaEventResult'?host:id==='playersTableBody'?table:null,createElement:tag=>new Node(tag),addEventListener:(k,fn)=>events[k]=fn,dispatchEvent:event=>events[event.type]?.(event)},MutationObserver:class{constructor(fn){this.fn=fn;this.active=true;observers.push(this);}observe(){}disconnect(){this.active=false;}},BeautyHubServices:{request:url=>{calls.push(new URL(url));return new Promise((resolve,reject)=>pending.push({resolve:d=>resolve({json:async()=>d}),reject}));}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-nakka-transfer.js','utf8'),c);
 const nodes=(n=body)=>[n,...n.children.flatMap(child=>nodes(child))];
 return {c,state,events,calls,pending,observers,body,nodes,open:()=>parent.children[1].fire(),find:(tag,text)=>nodes().find(n=>n.tag===tag&&(text===undefined||n.textContent===text)),change:()=>observers.filter(o=>o.active).forEach(o=>o.fn())};
}
const preview={success:true,status:'PREVIEW',message:'Check identity',player:'Anna',ticket:'1'.repeat(32),expires:Date.now()+300000,event:{id:'t_RqC2_2034',title:'Beauty Hub TEST — DO NOT USE LIVE',date:'2026-10-27'},identity:{name:'Anna',lpid:'a123'}};
async function reviewed(u){u.open();const select=u.find('select');select.value='Anna';select.fire('change');const p=u.find('button','CHECK PLAYER').fire();u.pending.shift().resolve(preview);await p;return {select,ack:u.find('input'),confirm:u.find('button','ADD THIS PLAYER TO TEST EVENT')};}
test('Nakka transfer UI offers only IN players and needs preview plus explicit identity acknowledgement',async()=>{const u=ui(),r=await reviewed(u);assert.deepEqual(r.select.children.map(n=>n.value),['','Anna']);assert.equal(u.calls[0].searchParams.get('page'),'nakkatransferpreview');assert.equal(r.confirm.disabled,true);assert.ok(u.nodes().some(n=>n.textContent==='Existing league player: Anna · LPID: a123'));r.ack.checked=true;r.ack.fire('change');assert.equal(r.confirm.disabled,false);const p=r.confirm.fire();assert.equal(u.calls.length,2);assert.equal(u.find('button','×').disabled,true);assert.equal(u.calls[1].searchParams.get('confirmed'),'true');assert.equal(u.calls[1].searchParams.get('ticket'),preview.ticket);u.pending.shift().resolve({success:true,status:'TRANSFERRED',readbackVerified:true,identityVerified:true,message:'Verified'});await p;assert.equal(u.find('button','CLOSE').disabled,false);assert.equal(u.find('button','×').disabled,false);assert.ok(u.nodes().some(n=>n.textContent==='Verified'));});
test('Nakka transfer UI status changes invalidate reviewed identity and prevent save',async()=>{const u=ui(),r=await reviewed(u);r.ack.checked=true;r.ack.fire('change');u.state.players[0].status='OUT';u.change();assert.equal(r.confirm.disabled,true);assert.equal(r.select.disabled,true);r.confirm.fire();assert.equal(u.calls.length,1);assert.ok(u.nodes().some(n=>n.textContent.includes('Close this window and review again')));});
test('Nakka transfer UI logout removes dialog and discards an in-flight preview',async()=>{const u=ui();u.open();const select=u.find('select');select.value='Anna';select.fire('change');const p=u.find('button','CHECK PLAYER').fire();u.events['beauty-hub-locked']();u.pending.shift().resolve(preview);await p;assert.equal(u.body.children.length,0);assert.equal(u.observers.filter(o=>o.active).length,0);});
test('Nakka transfer UI only sends once and uncertain failures never retry',async()=>{const u=ui(),r=await reviewed(u);r.ack.checked=true;r.ack.fire('change');const p=r.confirm.fire();r.confirm.fire();assert.equal(u.calls.length,2);u.pending.shift().reject(Error('failure'));await p;assert.equal(u.calls.length,2);assert.ok(u.nodes().some(n=>n.textContent.includes('Do not retry')));assert.equal(u.find('button','CLOSE').disabled,false);});
test('Nakka transfer UI existing entry produces no confirmation or save request',async()=>{const u=ui();u.open();const s=u.find('select');s.value='Anna';s.fire('change');const p=u.find('button','CHECK PLAYER').fire();u.pending.shift().resolve({success:true,status:'ALREADY_PRESENT',message:'Nothing added'});await p;assert.equal(u.find('button','ADD THIS PLAYER TO TEST EVENT'),undefined);assert.equal(u.calls.length,1);});
test('existing-entry review UI shows exact tpid and explicit review-only confirmation without an add button',async()=>{
 const u=ui();u.open();const s=u.find('select');s.value='Anna';s.fire('change');const pending=u.find('button','CHECK PLAYER').fire();u.pending.shift().resolve({...preview,status:'REVIEW_EXISTING',tpid:'b123'});await pending;
 assert.equal(u.find('button','ADD THIS PLAYER TO TEST EVENT'),undefined);assert.ok(u.nodes().some(n=>n.textContent==='Current Nakka event entry ID: b123'));
 const button=u.find('button','CONFIRM EXISTING ENTRY'),ack=u.find('input');assert.equal(button.disabled,true);ack.checked=true;ack.fire('change');assert.equal(button.disabled,false);
 const save=button.fire();button.fire();assert.equal(u.calls.length,2);u.pending.shift().resolve({success:true,status:'CURRENT_ENTRY_REVIEWED',readbackVerified:true,operationVerified:false,message:'Current entry reviewed; original journal retained.',review:'review-reference'});await save;
 assert.ok(u.nodes().some(n=>n.textContent==='Review reference: review-reference'));assert.equal(u.find('button','CLOSE').disabled,false);
});
test('Nakka transfer transport uses authenticated allowlisted routes and rejects target injection',async()=>{const calls=[];let done;const runner={withSuccessHandler:fn=>{done=fn;return runner;},withFailureHandler:()=>runner,beautyHubTest:(action,input,token)=>{calls.push({action,input,token});done({success:false,code:'TRANSFER_UNCERTAIN',error:'Do not retry',journal:'safe'});}};
 const c=vm.createContext({URL,BeautyHubAuth:{token:()=> 'session',generation:()=>0,isCurrent:()=>true},google:{script:{run:runner}}});vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',c);
 const r=await(await c.service.request('https://beauty.invalid/hub?page=nakkatransfersave&player=Anna&ticket=abc&confirmed=true')).json();assert.equal(r.error,'Do not retry');assert.equal(calls[0].token,'session');assert.equal(calls[0].action,'nakkatransfersave');assert.equal(calls[0].input.ticket,'abc');
 await assert.rejects(c.service.request('https://beauty.invalid/hub?page=nakkatransfersave&player=Anna&tdid=other'),/Blocked/);assert.equal(calls.length,1);
});

test('Named troubleshooting opens one preselected guarded preview without an automatic save',async()=>{const u=ui();u.c.window.BeautyNakkaTransfer.open('Anna');assert.equal(u.calls.length,1);assert.equal(u.calls[0].searchParams.get('player'),'Anna');u.pending.shift().resolve(preview);await new Promise(setImmediate);assert.equal(u.find('button','ADD THIS PLAYER TO TEST EVENT').disabled,true);assert.equal(u.calls.length,1);});

const recovery={success:false,code:'TRANSFER_REVIEW_REQUIRED',error:'Previously added, now missing',recovery:{kind:'CONFIRMED_ENTRY_MISSING',player:'Anna',event:{id:'t_QHaG_7792',title:'Beauty Registration TEST event DO NOT USE LIVE',date:'2026-10-27'},identity:{name:'Anna',lpid:'a123'}}};
async function recover(u,result=recovery){
 u.open();const s=u.find('select');s.value='Anna';s.fire('change');const p=u.find('button','CHECK PLAYER').fire();u.pending.shift().resolve(result);await p;
}
test('Missing confirmed player gets named manual restoration steps and a fresh check without automatic Nakka save',async()=>{
 const u=ui();await recover(u);const link=u.find('a','1. RESTORE ENTRY IN NAKKA');assert.equal(link.href,'https://n01darts.com/n01/league/season.php?id=t_QHaG_7792');assert.equal(link.rel,'noopener noreferrer');
 assert(u.nodes().some(n=>n.tag==='li'&&n.textContent.includes('Add from league')));
 assert.equal(u.find('button','ADD THIS PLAYER TO TEST EVENT'),undefined);assert.equal(u.find('input'),undefined);assert.equal(u.calls.length,1);
 const p=u.find('button','CHECK RESTORED ENTRY').fire();assert.equal(u.calls[1].searchParams.get('page'),'nakkatransferpreview');assert.equal(u.calls[1].searchParams.get('player'),'Anna');
 u.pending.shift().resolve({...preview,status:'REVIEW_EXISTING',tpid:'r123'});await p;await new Promise(setImmediate);
 assert.equal(u.find('button','CONFIRM EXISTING ENTRY').disabled,true);assert.equal(u.calls.length,2);
});
test('Recovery remove choice opens the named guarded removal dialog and sends no transfer save',async()=>{
 const u=ui(),removed=[];u.c.window.BeautyPlayerRemoval={open:(row,button)=>removed.push({row,button})};await recover(u);
 u.find('button','2. REMOVE HUB REGISTRATION').fire();assert.equal(removed.length,1);assert.equal(removed[0].row.player,'Anna');assert.equal(u.body.children.length,0);assert.equal(u.calls.length,1);
});
test('Recovery navigation rejects mismatched player date and event and keeps uncertain attempts read only',async()=>{
 for(const change of [r=>r.player='Other',r=>r.event.id='t_LIVE',r=>r.event.date='2026-10-28']){
  const u=ui(),r=JSON.parse(JSON.stringify(recovery));change(r.recovery);await recover(u,r);assert.equal(u.find('a','1. RESTORE ENTRY IN NAKKA'),undefined);assert.equal(u.find('button','2. REMOVE HUB REGISTRATION'),undefined);assert.equal(u.calls.length,1);
 }
 const u=ui(),r=JSON.parse(JSON.stringify(recovery));r.recovery.kind='UNCONFIRMED_ENTRY_MISSING';await recover(u,r);
 assert(u.find('a','OPEN TEST ENTRY LIST'));assert.equal(u.find('button','2. REMOVE HUB REGISTRATION'),undefined);assert.equal(u.find('button','ADD THIS PLAYER TO TEST EVENT'),undefined);assert.equal(u.calls.length,1);
});
