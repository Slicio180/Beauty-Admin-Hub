const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const dir=__dirname,flush=()=>new Promise(r=>setImmediate(r));
function fixture(...scripts){
 const all=[],calls=[],pending=[],rpc=[],events={},timers=[];
 class El{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.dataset={};this.attrs={};this.style={};this.classList={add:()=>{}};this.hidden=false;this.open=false;this.disabled=false;this._text='';all.push(this);}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(t){this.replaceChildren();this._text=String(t);}
 get isConnected(){return this===doc.body||!!this.parent?.isConnected;}
 append(...nodes){for(const n of nodes)this.appendChild(n);}appendChild(n){n.remove();this.children.push(n);n.parent=this;return n;}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}}
 before(n){this.parent?.appendChild(n);}replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this._text='';this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}addEventListener(k,f){(this.events[k]??=[]).push(f);}dispatchEvent(e){for(const f of this.events[e.type]||[])f(e);}
 querySelectorAll(selector){const tags=selector.split(',');return this.children.flatMap(c=>[...(tags.includes(c.tag)||selector.startsWith('.')&&c.className?.split(' ').includes(selector.slice(1))?[c]:[]),...c.querySelectorAll(selector)]);}querySelector(s){return this.querySelectorAll(s)[0]||null;}
 showModal(){this.open=true;}close(){this.open=false;this.dispatchEvent({type:'close'});}focus(){}click(){if(!this.disabled)for(const f of this.events.click||[])f({target:this});}
 }
 const doc={hidden:false,createElement:t=>new El(t),addEventListener:(k,f)=>(events[k]??=[]).push(f),removeEventListener:(k,f)=>{events[k]=(events[k]||[]).filter(x=>x!==f);},dispatchEvent:e=>{for(const f of events[e.type]||[])f(e);},getElementById:id=>all.find(n=>n.id===id&&n.isConnected),querySelectorAll:s=>doc.body.querySelectorAll(s)};doc.body=new El('body');
 for(const id of ['beautyLiveRecoveryEventControls','beautyLiveRecoverySavedArea','beautyRecoveryNavButton','beautyRecoveryLivePanel','dashboardNavButton','nakkaStatusPanel','attentionTile','attentionCount','attentionCard','attentionStatus','nakkaNavButton']){const n=new El(id==='beautyRecoveryLivePanel'?'dialog':'button');n.id=id;doc.body.append(n);}doc.getElementById('beautyRecoveryNavButton').addEventListener('click',()=>doc.getElementById('beautyRecoveryLivePanel').showModal());
 const c={document:doc,console,URL,Date,Promise,Error,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},navigator:{clipboard:{writeText:async()=>{}}},setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length;},clearTimeout:()=>{},setInterval:()=>{},loadBeautyHubData:async()=>{},beautyHubData:{eventDate:'2026-11-16',eventContext:'ctx'},BeautyHubAuth:{token:()=>'fixture',generation:()=>1,isCurrent:()=>true,expired:()=>{}},updateHub:d=>c.updated=d};c.window=c;
 c.BeautyHubServices={endpoint:'https://example.invalid/exec',request:async url=>{calls.push(Object.fromEntries(new URL(url).searchParams));return {json:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))};}};
 c.google={script:{get run(){let ok,no;return {withSuccessHandler(f){ok=f;return this;},withFailureHandler(f){no=f;return this;},beautyHubTest(action,input){rpc.push({action,input,ok,no});},beautyLiveNakkaMonitor(input){rpc.push({action:'monitor',input,ok,no});}}}}};
 const serviceCalls=[],servicePending=[];for(const kind of ['recovery','queue'])c.BeautyHubServices[kind]=(action,input)=>{serviceCalls.push({kind,action,input});return new Promise((resolve,reject)=>servicePending.push({resolve,reject}));};
 for(const source of scripts)vm.runInNewContext(fs.readFileSync(dir+'/'+source,'utf8').replace(/^<script[^>]*>/,'').replace(/<\/script>\s*$/,''),c);
 const btn=text=>all.findLast(n=>n.tag==='button'&&n.isConnected&&n.textContent===text);return {c,doc,all,calls,pending,rpc,timers,btn,serviceCalls,servicePending,serviceReply:async r=>{servicePending.shift().resolve(r);await flush();},dialog:()=>all.findLast(n=>n.tag==='dialog'&&n.isConnected&&n.open),answer:async r=>{pending.shift().resolve(r);await flush();},reply:async r=>{rpc.shift().ok(r);await flush();}};
}
module.exports={fixture,flush};
