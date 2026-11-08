const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=JSON.parse(fs.readFileSync('live-remove/prepared.json')).files.find(f=>f.name==='LiveHubView').source;
const start=html.indexOf('/* TEST-only staff removal:');
const uiSource=html.slice(start,html.indexOf('</script>',start));
function ui(send){
 const events={},calls=[],updated=[];let active=true,generation=1,focused=0;
 class El{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.isConnected=false;this.disabled=false;}
  setAttribute(){} appendChild(e){this.children.push(e);e.parent=this;e.isConnected=this.isConnected;return e;}
  addEventListener(k,f){this.events[k]=f;} showModal(){this.isConnected=true;for(const e of this.children)e.isConnected=true;}
  close(){this.closed=true;} remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  focus(){focused++;}
 }
 const body=new El('body');body.isConnected=true;
 const doc={body,createElement:t=>new El(t),createTextNode:t=>({textContent:t}),addEventListener:(k,f)=>events[k]=f,dispatchEvent:event=>events[event.type]?.(event)};
 const c=vm.createContext({CustomEvent:class{constructor(type){this.type=type;}},URL,document:doc,window:{beautyHubData:{eventDate:'2026-11-09'}},BeautyHubServices:{endpoint:'https://beauty.invalid/hub?page=hubdata',request:async raw=>{const u=new URL(raw);calls.push(u);return {json:async()=>send(u)};}},BeautyHubAuth:{generation:()=>generation,isCurrent:g=>active&&g===generation},updateHub:d=>updated.push(d)});
 vm.runInContext(uiSource,c);
 const preview={success:true,ticket:'a'.repeat(32),player:'Test Player',event:{title:'TEST',date:'2026-11-09'},identity:{lpid:'l001'},tpid:'t001',statusInHub:'IN'};
 return {c,body,calls,updated,preview,open:()=>c.window.BeautyPlayerRemoval.open({player:'Test Player'},new El('opener')),lock:()=>{active=false;generation++;events['beauty-hub-locked']();},get focused(){return focused;}};
}
test('removal dialog requires checkbox then sends one confirmed save and blocks close while saving',async()=>{
 let finish;const h=ui(u=>u.searchParams.get('page')==='removepreview'?h.preview:new Promise(resolve=>finish=resolve));
 await h.open();const panel=h.body.children[0],label=panel.children.find(e=>e.tag==='label'),check=label.children[0],save=panel.children.find(e=>e.textContent==='REMOVE FROM EVENT');
 assert.equal(save.disabled,true);check.checked=true;check.events.change();assert.equal(save.disabled,false);
 const pending=save.events.click();await save.events.click();assert.equal(h.calls.length,2);assert.equal(h.calls[1].searchParams.get('confirmed'),'true');assert.equal(h.calls[1].searchParams.get('eventDate'),'2026-11-09');
 panel.events.cancel({preventDefault(){}});assert.equal(panel.closed,undefined);assert.equal(save.disabled,true);
 finish({success:true,readbackVerified:true,data:{players:[]},journal:'reference',backup:'recovery'});await pending;assert.equal(h.updated.length,1);assert.equal(panel.children.some(e=>e.textContent==='REMOVE FROM EVENT'),false);assert.equal(panel.children[0].disabled,false);
});
test('late preview after sign-out cannot restore a confirmation or a player name',async()=>{
 let finish;const h=ui(()=>new Promise(resolve=>finish=resolve)),pending=h.open();for(let i=0;i<8&&!finish;i++)await Promise.resolve();h.lock();finish(h.preview);await pending;assert.equal(h.body.children.length,0);assert.equal(h.calls.length,1);assert.equal(h.updated.length,0);
});
test('uncertain removal discards confirm button and never resends a save',async()=>{
 const h=ui(u=>u.searchParams.get('page')==='removepreview'?h.preview:Promise.reject(Error('network')));await h.open();const panel=h.body.children[0],check=panel.children.find(e=>e.tag==='label').children[0],save=panel.children.find(e=>e.textContent==='REMOVE FROM EVENT');check.checked=true;check.events.change();await save.events.click();assert.equal(h.calls.length,2);assert.equal(h.updated.length,0);assert.equal(panel.children.some(e=>e.textContent==='REMOVE FROM EVENT'),false);assert.ok(panel.children.some(e=>e.textContent?.includes('Do not repeat')));
});

