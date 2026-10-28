const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ui(initial){
 class Node{
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.dataset={};this.attrs={};this.hidden=false;this._text='';}
  set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}replaceChildren(){this.children=[];this._text='';}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}setAttribute(k,v){this.attrs[k]=v;}focus(){this.focused=true;}showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}
  querySelector(sel){const all=n=>[n,...n.children.flatMap(all)];return all(this).find(n=>sel[0]==='.'?n.className===sel.slice(1):sel==='[data-attention-status]'?'attentionStatus'in n.dataset:sel==='[data-attention-refresh]'?'attentionRefresh'in n.dataset:false);}
  fire(name='click'){if(this.disabled&&name==='click')return;return Promise.all((this.listeners[name]||[]).map(fn=>fn({target:this,preventDefault(){}})));}
 }
 const ids=Object.fromEntries(['attentionCount','attentionTile','attentionBanner','attentionBannerText','attentionStatus','inPlayerCount','attentionReview','dashboardNavButton','nakkaNavButton'].map(id=>[id,new Node()]));
 const body=new Node('body'),events={},requests=[],pending=[];const c={window:{beautyHubData:initial},Date,JSON,Object,document:{body,hidden:false,getElementById:id=>ids[id],createElement:tag=>new Node(tag),querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(k,fn)=>(events[k]??=[]).push(fn)},setInterval:fn=>{c.tick=fn;},BeautyHubServices:{request:url=>{requests.push(url);return new Promise((resolve,reject)=>pending.push({resolve:r=>resolve({json:async()=>r}),reject}));}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-dashboard.js','utf8'),c);
 return {ids,body,c,events,requests,pending,dash:c.window.BeautyDashboard,emit:name=>Promise.all((events[name]||[]).map(fn=>fn()))};
}
const attention=(items=[])=>({available:true,eventDate:'2026-10-27',items,complete:true,checkedAt:'2026-10-27T18:00:00Z'});
const data=(items=[])=>({eventDate:'2026-10-27',players:[{player:'Anna',status:'IN'},{player:'Other',status:'OUT'}],attention:attention(items)});
test('Dashboard shows white zero without banner and active player count with review banner',()=>{
 const u=ui();u.dash.update(data());assert.equal(u.ids.attentionCount.textContent,'0');assert.equal(u.ids.attentionTile.dataset.active,'false');assert.equal(u.ids.attentionBanner.hidden,true);assert.equal(u.ids.inPlayerCount.textContent,'1');
 u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionTile.dataset.active,'true');assert.equal(u.ids.attentionBanner.hidden,false);assert.equal(u.ids.attentionBannerText.textContent,'1 player needs review');
});
test('Dashboard review displays literal player names and sends no transfer or retry',()=>{
 const u=ui();u.dash.update(data([{name:'<img onerror=evil()>',code:'TRANSFER_UNCERTAIN'}]));u.dash.review();assert.equal(u.body.children.length,1);assert.match(u.body.children[0].textContent,/<img onerror=evil\(\)>/);assert.match(u.body.children[0].textContent,/do not retry/);assert.equal(u.requests.length,0);
});
test('Dashboard failed refresh retains alert and explicit verified refresh clears it',async()=>{
 const u=ui();u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));const p=u.dash.refresh();u.pending.shift().reject(Error('secret'));await p;
 assert.equal(u.ids.attentionCount.textContent,'1');assert.match(u.ids.attentionStatus.textContent,/retained/);assert.doesNotMatch(u.ids.attentionStatus.textContent,/secret/);
 const next=u.dash.refresh();u.pending.shift().resolve({success:true,attention:attention()});await next;assert.equal(u.ids.attentionCount.textContent,'0');assert.equal(u.ids.attentionBanner.hidden,true);assert(u.requests.every(url=>url.endsWith('page=attentionrefresh')));
});
test('Dashboard refresh is single flight and logout discards late private responses',async()=>{
 const u=ui();u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));const p=u.dash.refresh();await u.dash.refresh();assert.equal(u.requests.length,1);u.dash.review();await u.emit('beauty-hub-locked');assert.equal(u.body.children.length,0);
 u.pending.shift().resolve({success:true,attention:attention([{name:'Private',code:'ENTRY_UNCONFIRMED'}])});await p;assert.equal(u.ids.attentionBanner.hidden,true);assert.equal(u.ids.attentionCount.textContent,'—');assert.doesNotMatch(u.ids.attentionStatus.textContent,/Private/);
});
test('Dashboard ignores a stale refresh after event or same-date player list changes',async()=>{
 for(const eventChange of [false,true]){
  const u=ui();u.dash.update(data());const p=u.dash.refresh();const next=data([{name:'New player',code:'ENTRY_UNCONFIRMED'}]);next.players.push({player:'New player',status:'IN'});if(eventChange){next.eventDate='2026-10-28';next.attention.eventDate=next.eventDate;}
  u.dash.update(next);u.pending.shift().resolve({success:true,attention:attention()});await p;assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionBanner.hidden,false);
 }
});
test('Dashboard unavailable storage is shown honestly rather than as an all-clear zero',()=>{
 const u=ui();u.dash.update({...data(),attention:{available:false,eventDate:'2026-10-27',items:[]}});assert.equal(u.ids.attentionCount.textContent,'—');assert.match(u.ids.attentionStatus.textContent,/unavailable/);
});

test('Dashboard initializes from data that loaded before its external script',()=>{const u=ui(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));assert.equal(u.ids.inPlayerCount.textContent,'1');assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionBanner.hidden,false);});
