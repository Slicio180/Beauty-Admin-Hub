const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function ui(){
 const calls=[],pending=[],listeners={};let document;
 class El{
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.disabled=false;this.hidden=false;this.checked=false;this.attrs={};this.className='';this.text='';}
  set textContent(v){this.text=v;this.children=[];}get textContent(){return this.text;}
  appendChild(e){e.parent=this;this.children.push(e);return e;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){this.handlers[k]=f;}
  remove(){this.parent.children=this.parent.children.filter(x=>x!==this);}focus(){document.activeElement=this;}
  querySelectorAll(){return walk(this).filter(x=>['button','input'].includes(x.tag));}
 }
 const walk=e=>[e,...e.children.flatMap(walk)];
 document={activeElement:null,createElement:t=>new El(t),addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]};document.body=new El('body');
 const c=vm.createContext({document,URL,console,BeautyHubServices:{endpoint:'https://beauty.invalid/hub',request:url=>{calls.push(new URL(url));return new Promise((resolve,reject)=>pending.push({resolve,reject}));}}});vm.runInContext(fs.readFileSync('public/js/hub-tournament-control.js','utf8'),c);
 const view={title:'TEST event',ready:true,assigned:false,reason:'',groups:[{title:'Bana 5 + 6',complete:true}],stages:[{key:'t',title:'Slutspel 1',byes:0,players:[{id:'a',name:'A'},{id:'b',name:'B'}],table:[['a','b'],['']]},{key:'s2',title:'Slutspel 2',byes:1,players:[{id:'c',name:'C'},{id:'d',name:'D'},{id:'e',name:'E'}],table:[['c','','d','e'],['c',''],['']]}]};
 return {open:()=>c.BeautyTournamentControl.open(),calls,pending,listeners,document,view,find:t=>walk(document.body).find(x=>x.textContent===t),all:()=>walk(document.body),reply:r=>pending.shift().resolve({json:async()=>r})};
}
async function reviewed(){const h=ui();h.open();h.reply({success:true,control:h.view});await settle();h.find('REVIEW QUALIFIERS').handlers.click();h.reply({success:true,ticket:'ticket',control:h.view});await settle();return h;}
test('tournament dialog shows compact qualifiers and bye pairings with no write on open or review',async()=>{
 const h=await reviewed();assert.deepEqual(h.calls.map(c=>c.searchParams.get('page')),['poolcontrol','poolqualifyprepare']);assert.ok(h.find('Slutspel 1'));assert.ok(h.find('Slutspel 2'));assert.ok(h.find('C — Bye'));assert.equal(h.find('ASSIGN KNOCKOUTS — TEST').disabled,true);h.find('CANCEL REVIEW').handlers.click();assert.ok(h.find('REVIEW QUALIFIERS'));assert.equal(h.calls.length,2);
});
test('tournament checkbox enables exactly one assignment and prevents dismiss while saving',async()=>{
 const h=await reviewed(),check=h.all().find(x=>x.tag==='input'),button=h.find('ASSIGN KNOCKOUTS — TEST');check.checked=true;check.handlers.change();assert.equal(button.disabled,false);button.handlers.click();button.handlers.click();assert.equal(h.calls.length,3);assert.equal(h.calls[2].searchParams.get('confirmed'),'true');h.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(h.document.body.children.length,1);
 h.reply({success:true,readbackVerified:true,message:'Assigned and verified.',audit:'AUDIT'});await settle();assert.ok(h.all().some(x=>x.textContent.includes('Assigned and verified.')));assert.equal(h.find('REVIEW QUALIFIERS').hidden,true);assert.equal(h.calls.length,3);
});
test('tournament uncertain save blocks another assignment and never retries on refresh or reopen',async()=>{
 const h=await reviewed(),check=h.all().find(x=>x.tag==='input');check.checked=true;check.handlers.change();h.find('ASSIGN KNOCKOUTS — TEST').handlers.click();h.reply({success:false,uncertain:true,error:'Inspect audit',audit:'AUDIT'});await settle();assert.equal(h.find('REFRESH').disabled,true);assert.equal(h.find('REVIEW QUALIFIERS').disabled,true);h.find('REFRESH').handlers.click();h.find('CLOSE').handlers.click();h.open();assert.equal(h.calls.length,3);assert.ok(h.all().some(x=>x.textContent.includes('previous assignment is unverified')));
});
test('tournament ignores late review after close or session lock and clears approval',async()=>{
 for(const lock of [false,true]){const h=ui();h.open();if(lock)h.listeners['beauty-hub-locked']();else h.find('CLOSE').handlers.click();h.reply({success:true,control:h.view});await settle();assert.equal(h.document.body.children.length,0);assert.equal(h.calls.length,1);}
});
